import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import {
  buildDevelopmentGroupDistributions,
  buildDeterministicReasoning,
} from './deterministic_reasoning.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testOutputDir = path.resolve(__dirname, '../../testing/test_output');
const developmentXaiOutputDir = path.resolve(__dirname, '../../xai/xai_training_output');
const targetDataDir = path.resolve(__dirname, '../src/data');

if (!fs.existsSync(targetDataDir)) {
  fs.mkdirSync(targetDataDir, { recursive: true });
}

console.log('Reading test data from:', testOutputDir);

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseCSVFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = vals[j];
    }
    rows.push(obj);
  }
  return rows;
}

const featureMetadata = {
  demand_lag_1_mwh: { name: 'Electricity demand 1 hour earlier', unit: 'MWh' },
  demand_lag_24_mwh: { name: 'Demand at same hour yesterday', unit: 'MWh' },
  demand_lag_48_mwh: { name: 'Demand 48 hours earlier', unit: 'MWh' },
  demand_lag_168_mwh: { name: 'Demand at same hour last week', unit: 'MWh' },
  demand_rolling_mean_24_mwh: { name: 'Recent 24-hour average demand', unit: 'MWh' },
  demand_rolling_std_24_mwh: { name: 'Demand variation over past 24h', unit: 'MWh' },
  demand_rolling_mean_168_mwh: { name: 'Weekly average demand', unit: 'MWh' },
  demand_rolling_std_168_mwh: { name: 'Demand variation over past week', unit: 'MWh' },
  temperature_c_lag_1: { name: 'Ambient temperature (1h earlier)', unit: '°C' },
  dew_point_c_lag_1: { name: 'Dew point (1h earlier)', unit: '°C' },
  relative_humidity_pct_lag_1: { name: 'Relative humidity (1h earlier)', unit: '%' },
  wind_speed_ms_lag_1: { name: 'Wind speed (1h earlier)', unit: 'm/s' },
  hour: { name: 'Hour of day (0-23)', unit: 'h' },
  hour_cos: { name: 'Daily cycle phase (cosine)', unit: 'norm' },
  hour_sin: { name: 'Daily cycle phase (sine)', unit: 'norm' },
  day_of_week: { name: 'Day of week (0=Mon, 6=Sun)', unit: 'day' },
  day_of_year_cos: { name: 'Annual seasonal phase (cosine)', unit: 'norm' },
  day_of_year_sin: { name: 'Annual seasonal phase (sine)', unit: 'norm' },
  month: { name: 'Month of year', unit: 'mo' },
  is_weekend: { name: 'Weekend indicator', unit: 'bool' },
  is_holiday: { name: 'Official holiday indicator', unit: 'bool' },
  utc_offset_hours: { name: 'UTC time offset', unit: 'h' },
  is_dst: { name: 'Daylight saving active', unit: 'bool' },
};

function getFeatureInfo(rawName) {
  if (featureMetadata[rawName]) return featureMetadata[rawName];
  let formatted = rawName.replace(/_/g, ' ');
  let unit = 'norm';
  if (rawName.includes('mwh')) unit = 'MWh';
  else if (rawName.includes('temperature') || rawName.includes('dew_point')) unit = '°C';
  else if (rawName.includes('pct') || rawName.includes('humidity')) unit = '%';
  else if (rawName.includes('wind_speed')) unit = 'm/s';
  else if (rawName.includes('flag')) unit = 'bool';
  return { name: formatted, unit };
}

function computeSeverity(deviationMW, score) {
  const absDev = Math.abs(deviationMW);
  if (absDev >= 16000 || score >= 6.5) return 'CRITICAL';
  if (absDev >= 10000 || score >= 5.0) return 'HIGH';
  if (absDev >= 5000 || score >= 4.0) return 'MODERATE';
  return 'LOW';
}

function computeReliability(validation, predictorMissingCount) {
  if (!validation.explanation_valid || !validation.seasonal_direction_matches_detector) {
    return 'LOW';
  }
  if (predictorMissingCount > 0 || validation.reference_count < 8) {
    return 'MEDIUM';
  }
  return 'HIGH';
}

const round2 = num => Math.round((num + Number.EPSILON) * 100) / 100;

async function processData() {
  console.log('1. Loading metadata & summary files...');
  const testSummary = JSON.parse(fs.readFileSync(path.join(testOutputDir, 'test_summary.json'), 'utf-8'));
  const testConfig = JSON.parse(fs.readFileSync(path.join(testOutputDir, 'test_configuration.json'), 'utf-8'));
  const forecastMetrics = parseCSVFile(path.join(testOutputDir, 'forecast_metrics.csv'));
  const abnormalityStats = parseCSVFile(path.join(testOutputDir, 'abnormality_statistics.csv'));
  const globalImportance = parseCSVFile(path.join(testOutputDir, 'treeshap_global_feature_importance.csv'));
  const developmentGroupRows = parseCSVFile(
    path.join(developmentXaiOutputDir, 'treeshap_xai_training_output_grouped_contributions.csv'),
  );
  const developmentGroupDistributions = buildDevelopmentGroupDistributions(developmentGroupRows);

  console.log('2. Loading abnormal episodes...');
  const episodesRaw = parseCSVFile(path.join(testOutputDir, 'abnormal_episodes.csv'));
  const episodes = episodesRaw.map(ep => ({
    episode_id: ep.episode_id,
    start_utc: ep.episode_start_utc,
    end_utc: ep.episode_end_utc,
    hour_count: parseInt(ep.abnormal_hour_count, 10),
    peak_score: round2(parseFloat(ep.peak_abnormality_score)),
    mean_residual_mwh: round2(parseFloat(ep.mean_detector_residual_mwh)),
  }));

  console.log('3. Loading actual demand lookup from forecast_predictions.csv...');
  const actualDemandMap = new Map();
  const predStream = fs.createReadStream(path.join(testOutputDir, 'forecast_predictions.csv'));
  const predRl = readline.createInterface({ input: predStream, crlfDelay: Infinity });
  let predFirst = true;
  let predHeaders = [];
  for await (const line of predRl) {
    if (predFirst) {
      predHeaders = parseCSVLine(line);
      predFirst = false;
      continue;
    }
    const vals = parseCSVLine(line);
    if (vals.length >= 2) {
      actualDemandMap.set(vals[0], parseFloat(vals[1]));
    }
  }

  console.log('4. Loading TreeSHAP explanations & validation...');
  const explanationsRaw = parseCSVFile(path.join(testOutputDir, 'treeshap_event_explanations.csv'));
  const eventValidationRaw = parseCSVFile(path.join(testOutputDir, 'event_validation.csv'));

  const explanationsMap = new Map();
  explanationsRaw.forEach(exp => {
    explanationsMap.set(exp.event_id, exp);
  });

  const validationMap = new Map();
  eventValidationRaw.forEach(val => {
    validationMap.set(val.event_id, val);
  });

  console.log('5. Loading TreeSHAP driver groups (seasonal_normal only)...');
  const groupsRaw = parseCSVFile(path.join(testOutputDir, 'treeshap_group_contributions.csv'));
  const eventGroupsMap = new Map();
  groupsRaw.filter(g => g.reference_method === 'seasonal_normal').forEach(g => {
    const list = eventGroupsMap.get(g.event_id) || [];
    list.push({
      group: g.feature_group,
      contribution_mwh: round2(parseFloat(g.contribution_mwh)),
      absolute_contribution_mwh: round2(parseFloat(g.absolute_contribution_mwh)),
      share_percent: round2(parseFloat(g.share_of_absolute_contribution_percent)),
      rank: parseInt(g.importance_rank_within_event, 10),
      direction: parseFloat(g.contribution_mwh) >= 0 ? 'up' : 'down',
    });
    eventGroupsMap.set(g.event_id, list);
  });

  console.log('6. Loading feature-level contributions...');
  const featureContributionsMap = new Map();
  const featStream = fs.createReadStream(path.join(testOutputDir, 'treeshap_feature_contributions.csv'));
  const rl = readline.createInterface({ input: featStream, crlfDelay: Infinity });

  let isFirstLine = true;
  let featHeaders = [];
  for await (const line of rl) {
    if (isFirstLine) {
      featHeaders = parseCSVLine(line);
      isFirstLine = false;
      continue;
    }
    const vals = parseCSVLine(line);
    const row = {};
    for (let i = 0; i < featHeaders.length; i++) {
      row[featHeaders[i]] = vals[i];
    }
    if (row.reference_method !== 'seasonal_normal') continue;

    const eventId = row.event_id;
    const rawFeat = row.feature_name;
    const meta = getFeatureInfo(rawFeat);
    const contrib = parseFloat(row.contribution_mwh);
    const curVal = parseFloat(row.current_feature_value);
    const refVal = parseFloat(row.reference_feature_value);
    const diffVal = parseFloat(row.feature_value_difference);

    const featureObj = {
      feature_name: rawFeat,
      display_name: row.feature_display_name || meta.name,
      group: row.feature_group,
      unit: meta.unit,
      current_value: round2(curVal),
      reference_value: round2(refVal),
      difference: round2(diffVal),
      contribution_mwh: round2(contrib),
      absolute_contribution_mwh: round2(Math.abs(contrib)),
      direction: contrib >= 0 ? 'increase' : 'decrease',
      rank: 0,
    };

    const list = featureContributionsMap.get(eventId) || [];
    list.push(featureObj);
    featureContributionsMap.set(eventId, list);
  }

  for (const [eventId, features] of featureContributionsMap.entries()) {
    features.sort((a, b) => b.absolute_contribution_mwh - a.absolute_contribution_mwh);
    features.forEach((f, idx) => {
      f.rank = idx + 1;
    });
  }

  console.log('7. Building joined abnormal events dictionary...');
  const eventsDict = {};
  const abnormalHistory = [];
  const eventsRaw = parseCSVFile(path.join(testOutputDir, 'abnormal_events.csv'));
  const timestampToEventMap = {};

  eventsRaw.forEach(ev => {
    const eventId = ev.event_id;
    const exp = explanationsMap.get(eventId) || {};
    const val = validationMap.get(eventId) || {};
    const groups = (eventGroupsMap.get(eventId) || []).sort((a, b) => a.rank - b.rank);
    const features = featureContributionsMap.get(eventId) || [];

    const forecastMWh = round2(parseFloat(ev.forecast_mwh));
    const seasonalRefMWh = exp.seasonal_reference_prediction_mwh
      ? round2(parseFloat(exp.seasonal_reference_prediction_mwh))
      : round2(parseFloat(ev.seasonal_expected_mwh));
    const deviationMW = round2(forecastMWh - seasonalRefMWh);
    const deviationPct = seasonalRefMWh !== 0 ? round2((deviationMW / seasonalRefMWh) * 100) : 0;
    const score = round2(parseFloat(ev.abnormality_score));

    const status = ev.abnormal_status === 'abnormal_above'
      ? 'ABNORMAL HIGH'
      : ev.abnormal_status === 'abnormal_below'
      ? 'ABNORMAL LOW'
      : 'NORMAL';

    const severity = computeSeverity(deviationMW, score);

    const validation = {
      explanation_valid: exp.explanation_valid === '1',
      seasonal_reference_valid: val.reference_valid === '1',
      input_data_valid: parseInt(ev.predictor_missing_count || '0', 10) === 0,
      seasonal_direction_matches_detector: exp.seasonal_direction_matches_detector === '1',
      application_display_ready: exp.application_display_ready === '1',
      seasonal_additivity_error_mwh: parseFloat(exp.seasonal_additivity_error_mwh || '0'),
      forecast_reproduction_error_mwh: parseFloat(exp.forecast_reproduction_error_mwh || '0'),
      reference_count: parseInt(exp.reference_count || '0', 10),
      reference_season_window_days: parseInt(exp.reference_season_window_days || '35', 10),
    };

    const reliability = computeReliability(validation, parseInt(ev.predictor_missing_count || '0', 10));
    const topDriver = features.length > 0 ? features[0] : null;
    const top3Drivers = features.slice(0, 3);
    const forecastChangeAvailable = ev.change_available === '1';
    const forecastChangeMwh = forecastChangeAvailable ? round2(parseFloat(ev.forecast_change_1h_mwh)) : null;
    const forecastChangePercent = forecastChangeAvailable ? round2(parseFloat(ev.forecast_change_1h_percent)) : null;
    const context = {
      extreme_heat: ev.extreme_heat_context === '1',
      extreme_cold: ev.extreme_cold_context === '1',
      holiday: ev.holiday_or_adjacent_context === '1',
      dst_transition: ev.dst_transition_24h_context === '1',
    };

    const deterministicReasoning = buildDeterministicReasoning({
      groups,
      features,
      referenceCount: validation.reference_count,
      forecastChangeAvailable,
      forecastChangeMwh,
      forecastChangePercent,
      context,
      developmentGroupDistributions,
    });

    let plainExplanation = '';
    if (!validation.application_display_ready || !validation.seasonal_direction_matches_detector) {
      plainExplanation = 'Explanation withheld from operator view: Seasonal reference comparison direction conflicts with the abnormality detector.';
    } else {
      const dirWord = status === 'ABNORMAL HIGH' ? 'higher' : 'lower';
      const devText = `${Math.abs(Math.round(deviationMW)).toLocaleString()} MW (${Math.abs(deviationPct).toFixed(1)}%) ${dirWord} than comparable past normal hours.`;
      const primaryGroup = groups.length > 0 ? groups[0] : null;
      const secondGroup = groups.length > 1 ? groups[1] : null;

      let groupText = '';
      if (primaryGroup) {
        groupText += `${primaryGroup.group} ${primaryGroup.direction === 'up' ? 'raised' : 'lowered'} the model forecast the most (${primaryGroup.contribution_mwh >= 0 ? '+' : ''}${Math.round(primaryGroup.contribution_mwh).toLocaleString()} MW). `;
      }
      if (secondGroup && Math.abs(secondGroup.contribution_mwh) > 10) {
        groupText += `${secondGroup.group} also ${secondGroup.direction === 'up' ? 'raised' : 'lowered'} the forecast (${secondGroup.contribution_mwh >= 0 ? '+' : ''}${Math.round(secondGroup.contribution_mwh).toLocaleString()} MW).`;
      }

      plainExplanation = `Expected electricity use is ${dirWord} than usual at ${Math.round(forecastMWh).toLocaleString()} MW. This is ${devText} ${groupText} This explains the model forecast; it does not confirm a physical cause or a grid emergency.`;
    }

    const currentDemand = actualDemandMap.get(ev.timestamp_utc) || forecastMWh;

    const eventRecord = {
      event_id: eventId,
      forecast_id: ev.forecast_id,
      timestamp_utc: ev.timestamp_utc,
      timestamp_local: ev.timestamp_local_central,
      episode_id: ev.episode_id,
      current_demand_mwh: round2(currentDemand),
      forecast_mwh: forecastMWh,
      seasonal_normal_mwh: seasonalRefMWh,
      lower_threshold_mwh: round2(parseFloat(ev.lower_threshold_mwh)),
      upper_threshold_mwh: round2(parseFloat(ev.upper_threshold_mwh)),
      deviation_mw: deviationMW,
      deviation_pct: deviationPct,
      abnormality_score: score,
      status: status,
      severity: severity,
      reliability: reliability,
      validation: validation,
      plain_language_explanation: plainExplanation,
      deterministic_reasoning: deterministicReasoning,
      forecast_change: {
        available: forecastChangeAvailable,
        change_mw: forecastChangeMwh,
        change_percent: forecastChangePercent,
      },
      top_driver: topDriver,
      top_3_drivers: top3Drivers,
      driver_groups: groups,
      features: features,
      context: context,
    };

    eventsDict[eventId] = eventRecord;
    timestampToEventMap[ev.timestamp_utc] = eventId;

    abnormalHistory.push({
      event_id: eventId,
      timestamp_utc: ev.timestamp_utc,
      timestamp_local: ev.timestamp_local_central,
      episode_id: ev.episode_id,
      forecast_mwh: Math.round(forecastMWh),
      deviation_mw: Math.round(deviationMW),
      deviation_pct: deviationPct,
      severity: severity,
      score: score,
      status: status,
      main_driver: topDriver ? topDriver.display_name : 'N/A',
      main_driver_group: groups.length > 0 ? groups[0].group : 'N/A',
      reliability: reliability,
      display_ready: validation.application_display_ready,
    });
  });

  console.log('8. Building continuous timeline for chart...');
  const timelinePoints = [];
  const timelineStream = fs.createReadStream(path.join(testOutputDir, 'classified_test_forecasts.csv'));
  const tlRl = readline.createInterface({ input: timelineStream, crlfDelay: Infinity });

  let tlFirst = true;
  let tlHeaders = [];
  for await (const line of tlRl) {
    if (tlFirst) {
      tlHeaders = parseCSVLine(line);
      tlFirst = false;
      continue;
    }
    const vals = parseCSVLine(line);
    const row = {};
    for (let i = 0; i < tlHeaders.length; i++) {
      row[tlHeaders[i]] = vals[i];
    }

    const isAbnormal = row.abnormal_status === 'abnormal_above' || row.abnormal_status === 'abnormal_below';
    const ts = row.timestamp_utc;

    // Timeline windows: Jan 13 - Jan 22, 2024 (Winter peak Episode 1) + all abnormal hours + surrounding buffers
    const inJanWindow = ts >= '2024-01-13T00:00:00Z' && ts <= '2024-01-22T23:00:00Z';
    const inAugWindow = ts >= '2024-08-18T00:00:00Z' && ts <= '2024-08-23T23:00:00Z';

    if (inJanWindow || inAugWindow || isAbnormal) {
      const forecastMWh = round2(parseFloat(row.forecast_mwh));
      const seasonalMWh = round2(parseFloat(row.seasonal_expected_mwh));
      const lowerMWh = round2(parseFloat(row.lower_threshold_mwh));
      const upperMWh = round2(parseFloat(row.upper_threshold_mwh));
      const actualDemand = actualDemandMap.has(ts) ? round2(actualDemandMap.get(ts)) : forecastMWh;

      const status = row.abnormal_status === 'abnormal_above'
        ? 'ABNORMAL HIGH'
        : row.abnormal_status === 'abnormal_below'
        ? 'ABNORMAL LOW'
        : 'NORMAL';

      timelinePoints.push({
        timestamp_utc: row.timestamp_utc,
        timestamp_local: row.timestamp_local_central,
        actual_demand_mwh: actualDemand,
        forecast_mwh: forecastMWh,
        seasonal_normal_mwh: seasonalMWh,
        lower_threshold_mwh: lowerMWh,
        upper_threshold_mwh: upperMWh,
        status: status,
        is_abnormal: isAbnormal,
        abnormality_score: round2(parseFloat(row.abnormality_score || '0')),
        event_id: timestampToEventMap[ts] || undefined,
      });
    }
  }

  timelinePoints.sort((a, b) => a.timestamp_utc.localeCompare(b.timestamp_utc));

  const globalImportanceFormatted = globalImportance.slice(0, 20).map((g, idx) => ({
    rank: idx + 1,
    feature_name: g.feature_name,
    display_name: g.feature_display_name,
    group: g.feature_group,
    mean_absolute_contribution_mwh: round2(parseFloat(g.mean_absolute_contribution_mwh)),
    mean_signed_contribution_mwh: round2(parseFloat(g.mean_signed_contribution_mwh)),
  }));

  const finalDataset = {
    summary: testSummary,
    configuration: testConfig,
    metrics: forecastMetrics,
    abnormality_stats: abnormalityStats,
    episodes: episodes,
    events: eventsDict,
    timestamp_to_event: timestampToEventMap,
    abnormal_history: abnormalHistory,
    global_importance: globalImportanceFormatted,
    timeline: timelinePoints,
  };

  const outputPath = path.join(targetDataDir, 'app_dataset.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalDataset), 'utf-8');
  console.log(`Successfully generated optimized unified dataset at ${outputPath}`);
  console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
}

processData().catch(err => {
  console.error('Error processing test data:', err);
  process.exit(1);
});
