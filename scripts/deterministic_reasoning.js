const SIMPLE_GROUP_NAMES = {
  'Recent electricity demand': 'Recent demand',
  Weather: 'Weather',
  'Time and season': 'Time and season',
  Calendar: 'Calendar',
  'Data quality': 'Data quality',
};

const GROUP_SECTION_TITLES = {
  'Recent electricity demand': 'Demand evidence',
  Weather: 'Weather evidence',
  'Time and season': 'Time and season evidence',
  Calendar: 'Calendar evidence',
  'Data quality': 'Data-quality evidence',
};

const FEATURE_LABELS = {
  demand_lag_1_mwh: 'Demand one hour earlier',
  demand_lag_24_mwh: 'Demand at the same hour yesterday',
  demand_lag_48_mwh: 'Demand two days earlier',
  demand_lag_168_mwh: 'Demand at the same hour last week',
  demand_rolling_mean_24_mwh: 'Average demand over the past day',
  demand_rolling_std_24_mwh: 'Demand variation over the past day',
  demand_rolling_mean_168_mwh: 'Average demand over the past week',
  demand_rolling_std_168_mwh: 'Demand variation over the past week',
  temperature_c_lag_1: 'Temperature one hour earlier',
  dew_point_c_lag_1: 'Dew point one hour earlier',
  relative_humidity_pct_lag_1: 'Humidity one hour earlier',
  wind_speed_ms_lag_1: 'Wind speed one hour earlier',
  is_weekend: 'Weekend setting',
  is_holiday: 'Holiday setting',
};

const TECHNICAL_FEATURE_PATTERN = /(_sin|_cos|utc_offset|is_dst|missing_flag|backfilled_flag)$/;

const finiteNumber = value => Number.isFinite(Number(value)) ? Number(value) : null;

const formatNumber = (value, decimals = 0) => {
  const number = finiteNumber(value);
  if (number === null) return 'Unavailable';
  return number.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const displayUnit = unit => unit === 'MWh' ? 'MW' : unit;

const decimalsForUnit = unit => {
  if (unit === '°C' || unit === 'm/s') return 1;
  if (unit === '%' || unit === 'norm') return 1;
  return 0;
};

const formatFeatureValue = (feature, value) => {
  const unit = displayUnit(feature.unit);
  if (unit === 'bool') return Number(value) === 1 ? 'Yes' : 'No';
  return `${formatNumber(value, decimalsForUnit(unit))}${unit ? ` ${unit}` : ''}`;
};

const formatSignedMw = value => {
  const number = finiteNumber(value) || 0;
  return `${number >= 0 ? '+' : '−'}${formatNumber(Math.abs(number), 0)} MW`;
};

const directionText = value => Number(value) >= 0 ? 'higher' : 'lower';
const movementText = value => Number(value) >= 0 ? 'raised' : 'lowered';

const featureLabel = feature => FEATURE_LABELS[feature.feature_name] || feature.display_name;

const isOperatorReadableFeature = feature => {
  if (!feature || TECHNICAL_FEATURE_PATTERN.test(feature.feature_name)) return false;
  if (['hour', 'day_of_week', 'month'].includes(feature.feature_name)) return false;
  return true;
};

const representativeFeature = (features, groupName) => features
  .filter(feature => feature.group === groupName && isOperatorReadableFeature(feature))
  .sort((left, right) => right.absolute_contribution_mwh - left.absolute_contribution_mwh)[0] || null;

const computePercentile = (value, distribution) => {
  if (!distribution || distribution.length === 0) return null;
  const absoluteValue = Math.abs(Number(value));
  const countAtOrBelow = distribution.filter(item => item <= absoluteValue).length;
  return Math.round((countAtOrBelow / distribution.length) * 1000) / 10;
};

const percentilePhrase = percentile => {
  if (percentile === null) return '';
  if (percentile >= 95) return 'more than 9 out of 10';
  if (percentile >= 85) return 'about 9 out of 10';
  if (percentile >= 75) return 'about 8 out of 10';
  if (percentile >= 65) return 'about 7 out of 10';
  return '';
};

const contextPhrase = context => {
  const labels = [];
  if (context.extreme_heat) labels.push('extreme-heat');
  if (context.extreme_cold) labels.push('extreme-cold');
  if (context.holiday) labels.push('holiday-adjacent');
  if (context.dst_transition) labels.push('daylight-saving transition');
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
};

const buildFeatureSection = (group, feature, referenceCount) => {
  const label = featureLabel(feature);
  const differenceDirection = directionText(feature.difference);
  const section = {
    title: GROUP_SECTION_TITLES[group.group] || `${group.group} evidence`,
    points: [
      { label, value: formatFeatureValue(feature, feature.current_value) },
      {
        label: `Average for ${referenceCount} comparison hours`,
        value: formatFeatureValue(feature, feature.reference_value),
      },
      {
        label: 'Difference',
        value: `${formatFeatureValue(feature, Math.abs(feature.difference))} ${differenceDirection}`,
      },
      { label: 'Contribution to the forecast', value: formatSignedMw(feature.contribution_mwh) },
    ],
    note: '',
  };

  const featureMagnitude = Math.abs(feature.contribution_mwh);
  const groupDifference = Math.abs(group.contribution_mwh - feature.contribution_mwh);
  const materiallyDifferent = featureMagnitude > 0 && groupDifference >= 50 && groupDifference / featureMagnitude >= 0.05;

  if (materiallyDifferent) {
    const offset = Math.abs(group.contribution_mwh) < featureMagnitude ||
      Math.sign(group.contribution_mwh) !== Math.sign(feature.contribution_mwh);
    section.note = `The total ${SIMPLE_GROUP_NAMES[group.group] || group.group.toLowerCase()} effect was ${formatSignedMw(group.contribution_mwh)}. Other values in this group ${offset ? 'partly offset' : 'added to'} this input.`;
  }

  return section;
};

const buildGroupOnlySection = group => ({
  title: GROUP_SECTION_TITLES[group.group] || `${group.group} evidence`,
  points: [
    { label: 'Total contribution to the forecast', value: formatSignedMw(group.contribution_mwh) },
    { label: 'Share of explanation strength', value: `${formatNumber(group.share_percent, 1)}%` },
  ],
  note: 'This group uses model values that are not useful to show separately to an operator.',
});

const buildFeatureSentence = (feature, referenceCount) => {
  const label = featureLabel(feature);
  return `${label} was ${formatFeatureValue(feature, feature.current_value)}, ${formatFeatureValue(feature, Math.abs(feature.difference))} ${directionText(feature.difference)} than ${referenceCount} similar normal hours, and ${movementText(feature.contribution_mwh)} the forecast by about ${formatFeatureValue({ ...feature, unit: 'MWh' }, Math.abs(feature.contribution_mwh))}.`;
};

export function buildDevelopmentGroupDistributions(rows) {
  const distributions = {};
  rows.forEach(row => {
    const groupName = row.feature_group;
    const contribution = finiteNumber(row.seasonal_contribution_mwh);
    if (!groupName || contribution === null) return;
    if (!distributions[groupName]) distributions[groupName] = [];
    distributions[groupName].push(Math.abs(contribution));
  });
  Object.values(distributions).forEach(values => values.sort((a, b) => a - b));
  return distributions;
}

export function buildDeterministicReasoning({
  groups,
  features,
  referenceCount,
  forecastChangeAvailable,
  forecastChangeMwh,
  forecastChangePercent,
  context,
  developmentGroupDistributions,
}) {
  const selectedGroups = groups
    .filter(group => group.absolute_contribution_mwh >= 10 && group.group !== 'Data quality')
    .slice(0, 2);

  const evidenceSections = selectedGroups.map(group => {
    const feature = representativeFeature(features, group.group);
    return feature
      ? buildFeatureSection(group, feature, referenceCount)
      : buildGroupOnlySection(group);
  });

  const selectedEvidence = selectedGroups.map(group => ({
    group: group.group,
    contribution_mwh: group.contribution_mwh,
    development_percentile: computePercentile(
      group.contribution_mwh,
      developmentGroupDistributions[group.group],
    ),
    representative_feature: representativeFeature(features, group.group),
  }));

  const sentences = [];
  const readableEvidence = selectedEvidence.filter(item => item.representative_feature);
  if (readableEvidence[0]) {
    sentences.push(buildFeatureSentence(readableEvidence[0].representative_feature, referenceCount));
  }

  if (readableEvidence[1]) {
    const feature = readableEvidence[1].representative_feature;
    sentences.push(
      `${featureLabel(feature)} was ${formatFeatureValue(feature, feature.current_value)} instead of ${formatFeatureValue(feature, feature.reference_value)} and ${movementText(feature.contribution_mwh)} the forecast by about ${formatFeatureValue({ ...feature, unit: 'MWh' }, Math.abs(feature.contribution_mwh))}.`,
    );
  }

  if (forecastChangeAvailable && Number.isFinite(forecastChangeMwh) && Number.isFinite(forecastChangePercent)) {
    sentences.push(
      `The next-hour forecast also ${forecastChangeMwh >= 0 ? 'increased' : 'decreased'} by ${formatNumber(Math.abs(forecastChangeMwh), 0)} MW, or ${formatNumber(Math.abs(forecastChangePercent), 1)}%, from the previous forecast.`,
    );
  }

  const comparablePercentiles = selectedEvidence
    .map(item => item.development_percentile)
    .filter(percentile => percentile !== null);
  if (comparablePercentiles.length > 0) {
    const conservativePercentile = Math.min(...comparablePercentiles);
    const plainStrength = percentilePhrase(conservativePercentile);
    if (plainStrength) {
      const groupNames = selectedEvidence.map(item => SIMPLE_GROUP_NAMES[item.group] || item.group.toLowerCase());
      const joinedNames = groupNames.length === 1
        ? groupNames[0]
        : `${groupNames.slice(0, -1).join(', ')} and ${groupNames[groupNames.length - 1]}`;
      sentences.push(`The ${joinedNames.toLowerCase()} effects are stronger than those seen in ${plainStrength} development-period abnormal events.`);
    }
  }

  const eventContext = contextPhrase(context);
  if (eventContext) {
    sentences.push(`The event also overlaps ${eventContext} conditions.`);
  }

  return {
    template_version: 'operator_reasoning_v1',
    evidence_sections: evidenceSections,
    summary: sentences.join(' '),
    development_comparison: {
      source: 'frozen_internal_validation_abnormal_events',
      event_count: Object.values(developmentGroupDistributions)[0]?.length || 0,
      groups: selectedEvidence.map(item => ({
        group: item.group,
        contribution_mwh: item.contribution_mwh,
        percentile: item.development_percentile,
      })),
    },
  };
}
