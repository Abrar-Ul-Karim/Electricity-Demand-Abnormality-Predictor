export type AbnormalityStatus = 'NORMAL' | 'ABNORMAL HIGH' | 'ABNORMAL LOW';
export type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type ReliabilityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface FeatureDetail {
  feature_name: string;
  display_name: string;
  group: string;
  unit: string;
  current_value: number;
  reference_value: number;
  difference: number;
  contribution_mwh: number;
  absolute_contribution_mwh: number;
  direction: 'increase' | 'decrease';
  rank: number;
}

export interface DriverGroup {
  group: string;
  contribution_mwh: number;
  absolute_contribution_mwh: number;
  share_percent: number;
  rank: number;
  direction: 'up' | 'down';
}

export interface ValidationRecord {
  explanation_valid: boolean;
  seasonal_reference_valid: boolean;
  input_data_valid: boolean;
  seasonal_direction_matches_detector: boolean;
  application_display_ready: boolean;
  seasonal_additivity_error_mwh: number;
  forecast_reproduction_error_mwh: number;
  reference_count: number;
  reference_season_window_days: number;
}

export interface ReasoningPoint {
  label: string;
  value: string;
}

export interface ReasoningEvidenceSection {
  title: string;
  points: ReasoningPoint[];
  note: string;
}

export interface DeterministicReasoning {
  template_version: string;
  evidence_sections: ReasoningEvidenceSection[];
  summary: string;
  development_comparison: {
    source: string;
    event_count: number;
    groups: Array<{
      group: string;
      contribution_mwh: number;
      percentile: number | null;
    }>;
  };
}

export interface AbnormalEvent {
  event_id: string;
  forecast_id: string;
  timestamp_utc: string;
  timestamp_local: string;
  episode_id: string;
  current_demand_mwh: number;
  forecast_mwh: number;
  seasonal_normal_mwh: number;
  lower_threshold_mwh: number;
  upper_threshold_mwh: number;
  deviation_mw: number;
  deviation_pct: number;
  abnormality_score: number;
  status: AbnormalityStatus;
  severity: SeverityLevel;
  reliability: ReliabilityLevel;
  validation: ValidationRecord;
  plain_language_explanation: string;
  deterministic_reasoning: DeterministicReasoning;
  forecast_change: {
    available: boolean;
    change_mw: number | null;
    change_percent: number | null;
  };
  top_driver: FeatureDetail | null;
  top_3_drivers: FeatureDetail[];
  driver_groups: DriverGroup[];
  features: FeatureDetail[];
  context: {
    extreme_heat: boolean;
    extreme_cold: boolean;
    holiday: boolean;
    dst_transition: boolean;
  };
}

export interface TimelinePoint {
  timestamp_utc: string;
  timestamp_local: string;
  actual_demand_mwh: number;
  forecast_mwh: number;
  seasonal_normal_mwh: number;
  lower_threshold_mwh: number;
  upper_threshold_mwh: number;
  status: AbnormalityStatus;
  is_abnormal: boolean;
  abnormality_score: number;
  event_id?: string;
}

export interface AbnormalHistoryItem {
  event_id: string;
  timestamp_utc: string;
  timestamp_local: string;
  episode_id: string;
  forecast_mwh: number;
  deviation_mw: number;
  deviation_pct: number;
  severity: SeverityLevel;
  score: number;
  status: AbnormalityStatus;
  main_driver: string;
  main_driver_group: string;
  reliability: ReliabilityLevel;
  display_ready: boolean;
}

export interface EpisodeSummary {
  episode_id: string;
  start_utc: string;
  end_utc: string;
  hour_count: number;
  peak_score: number;
  mean_residual_mwh: number;
}

export interface GlobalImportanceItem {
  rank: number;
  feature_name: string;
  display_name: string;
  group: string;
  mean_absolute_contribution_mwh: number;
  mean_signed_contribution_mwh: number;
}

export interface ForecastMetricRow {
  model: string;
  evaluation_scope: string;
  rows_scored: string;
  mae_mwh: string;
  rmse_mwh: string;
  mape_percent: string;
  r2: string;
  cvrmse_percent: string;
  wape_percent: string;
}

export interface AppDataset {
  summary: {
    test_rows: number;
    test_start_utc: string;
    test_end_utc: string;
    forecast_metrics: Record<string, number>;
    seasonal_naive_metrics: Record<string, number>;
    valid_classified_hours: number;
    unscored_detector_hours: number;
    normal_hours: number;
    abnormal_hours: number;
    abnormal_above_hours: number;
    abnormal_below_hours: number;
    abnormal_episodes: number;
    application_display_ready_events: number;
    direction_inconsistent_explanations: number;
    reference_rule_version: string;
    reference_rule_sha256: string;
  };
  configuration: {
    pipeline: string;
    model_trees: number;
    model_sha256: string;
    detector_configuration: Record<string, any>;
    reference_rule_version: string;
    reference_rule_status: string;
    palette: string[];
  };
  metrics: ForecastMetricRow[];
  abnormality_stats: Array<{ statistic: string; value: string; unit: string }>;
  episodes: EpisodeSummary[];
  events: Record<string, AbnormalEvent>;
  timestamp_to_event: Record<string, string>;
  abnormal_history: AbnormalHistoryItem[];
  global_importance: GlobalImportanceItem[];
  timeline: TimelinePoint[];
}
