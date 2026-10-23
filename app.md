# Energy Demand Forecast and Explanation Application

## 1. Core purpose

This application is the final user-facing layer of the research pipeline. It turns forecasting, abnormality detection and TreeSHAP results into simple information for day-to-day power-grid workers.

The application should answer five questions:

1. How much electricity does the model expect for the next hour?
2. Is this forecast within the usual range?
3. If it is unusual, how much higher or lower is it than comparable normal hours?
4. Which groups of model inputs raised or lowered the forecast?
5. Is the data and explanation reliable enough to display?

The application is a decision-support tool. It is not an automatic grid-control system. It must not automatically start generation, shed load, change market bids or declare an emergency.

## 2. Intended users

### Primary user: grid worker

The main screen should use short sentences and familiar labels. It should not require knowledge of LightGBM, SHAP values or machine-learning terminology.

### Secondary user: supervisor or researcher

An optional detail screen may show model IDs, exact feature contributions, reference members, numerical validation and data-quality information.

The technical view should not be the default screen for operational users.

## 3. The final application flow

```text
EIA/ERCOT demand + NOAA weather
                 |
                 v
       causal preprocessing
                 |
                 v
     frozen LightGBM forecast
                 |
                 v
 frozen abnormality detector
        |                  |
      normal            abnormal
        |                  |
 show forecast       select earlier seasonal-normal references
                           |
                           v
                    TreeSHAP explanation
                           |
                           v
              simple operator-facing message
```

The stages must remain in this order. TreeSHAP does not detect abnormalities. It explains the saved LightGBM forecast after the detector has identified an abnormal forecast and the seasonal reference has been validated.

## 4. Which TreeSHAP output should the app use?

### Final research demonstration: use the outer-test TreeSHAP output

For the final research demonstration and screenshots, use the files in:

`src/testing/test_output`

These files were produced from the untouched 20% outer-test period using the frozen final LightGBM model, frozen detector and frozen seasonal-reference rule. No model or detector tuning was performed on these results.

The outer-test TreeSHAP stage contains 363 valid explanations. Of these, 359 pass the direction-consistency gate and are ready for the simple application view. Four explanations are valid numerically but must be withheld from the simple view because their seasonal-reference direction conflicts with the detector.

### Do not use training TreeSHAP as final evidence

The files in:

`src/xai/xai_training_output`

were created from the internal validation stage and validation model. They were used to design, check and freeze the explanation method before the outer test. They are useful for:

- learning the file structure;
- reusing the fixed message format;
- developing the interface;
- explaining the methodology;
- checking that the application adapter behaves correctly.

They must not be presented as final outer-test results. Their model ID begins with the validation-model identity, while the final application must use the frozen final model.

### Live deployment: use neither saved TreeSHAP dataset as live input

A live application should calculate new TreeSHAP explanations for new forecasts. The saved training and testing outputs are historical research artifacts. They are suitable for development, replay and demonstration, but they are not a live data feed.

The live service must load the frozen final model, process newly available demand and weather data, make the next-hour forecast, apply the frozen detector, select past seasonal-normal references and then calculate a new TreeSHAP explanation.

## 5. Recommended application modes

### Mode A: outer-test replay mode

Build this mode first. It is the safest way to demonstrate the completed research because all outputs already exist and have been validated.

The user selects a date or event from the 2024-2025 outer-test period. The application replays the saved forecast, normal range, abnormality status and TreeSHAP explanation.

This mode must be labelled `Historical outer-test replay`. It must not look like a current live forecast.

### Mode B: live one-hour-ahead mode

Build this mode after replay mode works. It receives newly available source data and executes the full frozen pipeline.

The forecast horizon is one hour. The app must say `next-hour forecast`, not `day-ahead forecast`.

### Mode C: researcher audit mode

This optional mode shows complete feature contributions, reference members, validation errors, model hashes and research charts. It should require a deliberate switch from the simple worker view.

## 6. Exact input files for outer-test replay mode

### 6.1 Main hourly application table

Use:

`src/testing/test_output/classified_test_forecasts.csv`

This is the main timeline. It contains one row per test hour and combines the saved LightGBM forecast with the frozen abnormality detector output.

Important fields include:

| Field | Application use |
|---|---|
| `forecast_id` | Unique forecast identifier. |
| `timestamp_utc` | Canonical join and audit time. |
| `timestamp_local_central` | Human-readable ERCOT local time. |
| `forecast_horizon_hours` | Must equal one. |
| `forecast_mwh` | Predicted next-hour electricity demand. |
| `previous_forecast_mwh` | Previous forecast for short-term comparison. |
| `forecast_change_1h_mwh` | Expected one-hour increase or decrease. |
| `seasonal_expected_mwh` | Detector's expected seasonal level. |
| `lower_threshold_mwh` | Lower limit of the normal range. |
| `upper_threshold_mwh` | Upper limit of the normal range. |
| `abnormality_score` | Strength of departure from the normal range. It is not a probability. |
| `abnormal_status` | `normal`, `abnormal_above`, `abnormal_below`, or an unscored status. |
| `deviation_direction` | Above, below or within the normal range. |
| `classification_valid` | Whether the abnormality decision is valid. |
| weather fields | Current context based on weather available one hour earlier. |
| missing/backfilled flags | Data-quality warnings. |
| `model_id` | Confirms the correct frozen model. |
| `feature_schema_id` | Confirms the correct feature layout. |

Use this table for the predicted-demand card, normal-range card, main timeline chart, current status and data-quality strip.

### 6.2 Abnormal events

Use:

`src/testing/test_output/abnormal_events.csv`

This is a filtered event table. It contains the abnormal forecast rows plus `event_id`, `episode_id`, seasonal-reference metadata and known context flags.

Use `event_id` as the main join key for the TreeSHAP tables.

### 6.3 Abnormal episodes

Use:

`src/testing/test_output/abnormal_episodes.csv`

Several consecutive abnormal hours may belong to one episode. Use this file for the event-history list and episode summary. Do not send repeated high-priority notifications for every hour in the same episode unless the severity or direction changes materially.

### 6.4 Event-level TreeSHAP explanation

Use:

`src/testing/test_output/treeshap_event_explanations.csv`

Important fields include:

| Field | Application use |
|---|---|
| `event_id` | Join key. |
| `current_prediction_mwh` | Forecast for the abnormal hour. |
| `seasonal_reference_prediction_mwh` | Forecast level for comparable earlier normal hours. |
| `seasonal_difference_mwh` | Amount above or below the seasonal reference. |
| `reference_count` | Number of past normal reference hours. |
| `seasonal_direction_matches_detector` | Required direction-safety check. |
| `explanation_valid` | Numerical TreeSHAP validation. |
| `application_display_ready` | Final gate for the simple application view. |
| `seasonal_additivity_error_mwh` | Audit check that grouped contributions reproduce the difference. |
| `forecast_reproduction_error_mwh` | Audit check against the stored LightGBM forecast. |

For the worker view, display a TreeSHAP explanation only when:

```text
explanation_valid == 1
and application_display_ready == 1
and seasonal_direction_matches_detector == 1
```

If any condition fails, keep the forecast and abnormality alert but show `Explanation unavailable for this hour.`

### 6.5 Human-readable TreeSHAP driver groups

Use:

`src/testing/test_output/treeshap_group_contributions.csv`

This file contains five driver groups for every event and reference method. The application must first filter:

```text
reference_method == "seasonal_normal"
```

Do not use `previous_observation` for the main worker explanation. The frozen seasonal-normal reference produced substantially better direction consistency in the outer test.

After filtering, join by `event_id`. Sort by `importance_rank_within_event`. Show the first two or three groups by default.

The five application groups are:

- Recent electricity demand;
- Weather;
- Time and season;
- Calendar;
- Data quality.

`contribution_mwh` is signed:

- positive means the group raised the LightGBM forecast relative to comparable normal hours;
- negative means the group lowered the forecast;
- zero means no difference was assigned to that group.

Do not say that a feature caused physical demand. Say that it raised or lowered the model forecast.

### 6.6 Final explanation gate and top driver

Use:

`src/testing/test_output/event_validation.csv`

This table repeats the main validity fields and provides `top_driver_group` and `top_driver_contribution_mwh`. It is useful for efficient event-list cards.

The simple view must require `application_display_ready = 1`. The outer test has 359 application-ready events and four withheld explanations.

### 6.7 Reference evidence

Use these files only when the user opens `Why is this considered unusual?`:

- `src/testing/test_output/seasonal_references.csv`
- `src/testing/test_output/reference_membership.csv`

They show which earlier normal hours formed the seasonal comparison. The application should say:

`This comparison uses earlier normal hours with a similar season, local hour and weekday/weekend type.`

It should not display all reference rows on the main screen.

### 6.8 Researcher-only detail

Use these only in an advanced audit view:

- `src/testing/test_output/treeshap_feature_contributions.csv`
- `src/testing/test_output/treeshap_global_feature_importance.csv`
- `src/testing/test_output/shap_additivity_validation.csv`
- `src/testing/test_output/test_configuration.json`
- `src/testing/test_output/test_output_manifest.json`

The 39 feature contributions are too technical for the default worker view.

### 6.9 Optional historical evaluation chart

Use:

`src/testing/test_output/forecast_predictions.csv`

This file includes actual test demand and forecast errors. Use it only in historical replay or researcher evaluation. In a live next-hour view, actual demand for the future hour is not yet available.

## 7. Files that should not feed the operational dashboard

| Location | Reason |
|---|---|
| `src/xai/xai_training_output` | Internal-validation TreeSHAP. Use for development and templates, not final evidence. |
| `src/forecasting/training_output` | Training and validation charts are research-development artifacts. |
| `src/abnormality_detection/abnormality_detection_output` | Internal-validation detector results. Use to document and freeze the method, not as final app events. |
| `src/testing/extras` | Optional Conservation Appeal classification study. It is separate from the main app and uses only seven positive hours. |
| `dataset/final_v2/training_data.csv` | Model-development data. The dashboard should not present it as a live forecast. |
| `dataset/final_v2/testing_data.csv` | Outer-test input. Use for research replay, not as a continuing live feed. |

## 8. Input required for live one-hour-ahead operation

The live app should receive newly available EIA/ERCOT demand and NOAA weather data. It should not ask a grid worker to manually enter all 39 model features.

The backend data service should provide:

| Input | Requirement |
|---|---|
| UTC timestamp | One unique hourly timestamp with no duplicates. |
| Demand | Observed ERCOT demand through the current completed hour. |
| Temperature | Latest available NOAA temperature. |
| Dew point | Latest available NOAA dew point. |
| Relative humidity | Latest available NOAA relative humidity. |
| Wind speed | Latest available NOAA wind speed. |
| Source and recovery metadata | Source file/API, retrieval time, missing flag and backfill source. |

All timestamps must first be stored in UTC. Convert to ERCOT local time only for calendar features and display. This avoids daylight-saving-time duplication and omission errors.

### Required history

The LightGBM input requires demand lags of 1, 24, 48 and 168 hours and rolling demand summaries over 24 and 168 hours. Keep at least the previous 168 complete grid positions before creating a new forecast row.

The abnormality detector needs much more history. Its full causal seasonal calculation requires at least 52 weeks of earlier forecasts and may use up to 60 weeks. If that history is unavailable, the app may still show the LightGBM forecast, but it must show `Abnormality status unavailable: insufficient history.` It must not invent a normal range.

### Missing values

- Never interpolate or synthesize missing demand targets.
- Preserve every hourly grid position.
- Allow missing predictors to remain `NaN` for LightGBM.
- Add the existing missing and backfilled indicator features.
- Weather recovery or filling must be causal and must not use a future observation.
- Recalculate lag and rolling features on the complete hourly grid before selecting the forecast row.

Reuse the logic in:

- `src/preprocess/pipeline.py`
- `src/preprocess/recovery.py`
- `src/preprocess/validate.py`
- `src/preprocess/config.py`

The preprocessing code may need a small production adapter because the current scripts process research files in batches.

## 9. Frozen model and schema for live use

Load this final LightGBM model:

`src/forecasting/training_model_brain/lightgbm_training_output_model_brain.txt`

Do not load the validation model for the final application.

Load the exact feature order from:

`src/forecasting/training_model_brain/lightgbm_training_output_feature_schema.json`

The final model expects 39 fields in the recorded order. The service must reject a row if the schema names, order, model hash or feature-schema ID do not match.

Important final-model facts:

- forecast target: `demand_mwh`;
- forecast horizon: one hour;
- tree count: 1,489;
- model hash begins with `e4c6e2e1`;
- the final model was trained on all development and validation rows before outer testing.

Do not retrain the model inside the application. Retraining must be a separate, reviewed model-release process.

## 10. Frozen abnormality and seasonal-reference rules

The live service must reproduce the detector configuration stored in:

`src/testing/test_output/test_configuration.json`

The frozen seasonal-reference rule is stored in:

`src/abnormality_detection/abnormality_detection_output/abnormality_detection_output_reference_rule_freeze.json`

The frozen rule ID is:

`seasonal_reference_v2_frozen_before_outer_test`

The rule uses only earlier data. It selects 6 to 12 past classified-normal hours with a similar local hour, season and weekday/weekend type. It excludes holidays and rows with missing predictors. Selection must never use the current event's forecast direction to choose a convenient reference.

Do not change the detector threshold or reference rule inside the interface.

## 11. Input required by the live TreeSHAP stage

For an abnormal event, TreeSHAP requires:

1. the frozen final LightGBM model;
2. the abnormal event's exact 39-feature model row;
3. the 6 to 12 feature rows selected by the frozen seasonal-reference rule;
4. the saved forecast and reference predictions;
5. the detector direction and event ID;
6. model ID, model hash and feature-schema ID.

TreeSHAP should calculate the difference between the event forecast and the average prediction for the seasonal-normal reference rows. Then group the 39 feature contributions into the five human-readable groups.

The application may display the explanation only after checking:

- current forecast reproduction;
- reference prediction reproduction;
- TreeSHAP additivity;
- valid reference count;
- all references are earlier than the event;
- all references were classified normal;
- TreeSHAP direction matches the detector direction.

## 12. Backend record recommended for the application

The backend should convert the joined files or live outputs into one JSON record per abnormal event.

```json
{
  "event_id": "ERCOT_TEST_ABN_...",
  "timestamp_utc": "...",
  "timestamp_local_central": "...",
  "forecast_horizon_hours": 1,
  "forecast_mwh": 0.0,
  "normal_reference_mwh": 0.0,
  "normal_lower_mwh": 0.0,
  "normal_upper_mwh": 0.0,
  "difference_from_reference_mwh": 0.0,
  "difference_from_reference_percent": 0.0,
  "abnormal_status": "abnormal_above",
  "abnormality_score": 0.0,
  "episode_id": "ERCOT_TEST_EP_...",
  "drivers": [
    {
      "group": "Recent electricity demand",
      "contribution_mwh": 0.0,
      "direction": "raise",
      "rank": 1
    }
  ],
  "data_quality": {
    "predictor_missing_count": 0,
    "weather_backfilled": false
  },
  "validation": {
    "explanation_valid": true,
    "direction_matches_detector": true,
    "application_display_ready": true
  },
  "model_id": "lightgbm_final_...",
  "feature_schema_id": "b51e09c942a4c1bc",
  "reference_rule_version": "seasonal_reference_v2_frozen_before_outer_test"
}
```

The zeros and ellipses are schema examples, not research results.

## 13. Main dashboard functions

### 13.1 Next-hour forecast card

Show:

- forecast time;
- predicted electricity demand;
- forecast horizon;
- change from the previous forecast;
- last successful data update.

Example wording:

`Expected electricity use next hour: 65,900 MWh.`

### 13.2 Normal or unusual status

For a normal forecast:

`Expected electricity use is within the usual range.`

For an above-normal forecast:

`Expected electricity use is higher than usual.`

For a below-normal forecast:

`Expected electricity use is lower than usual.`

For an invalid classification:

`The forecast is available, but the normal-range check is not available.`

### 13.3 Forecast-versus-normal chart

Show the forecast line, seasonal expected line and frozen normal range. Mark abnormal events clearly. Use text labels or symbols as well as color.

Recommended colors:

- `#00A8F1`
- `#007DD7`
- `#035AC4`
- `#013D95`

### 13.4 More or less than usual

Show both the amount and percentage:

`The forecast is about 8,200 MWh, or 14.5%, higher than comparable past normal hours.`

The normal comparison must come from `seasonal_reference_prediction_mwh`, not from the immediately previous forecast.

### 13.5 Simple `Why?` panel

Show the top two or three driver groups.

Example:

`Recent electricity demand raised the model forecast the most.`

`Weather also raised the model forecast.`

Do not use the words `caused`, `will cause` or `because the weather caused demand`.

### 13.6 Episode history

Group consecutive abnormal hours into one episode. Show start time, latest time, direction, duration and peak score. Allow the operator to acknowledge an episode and add a note. Acknowledgement is a workflow action, not a change to the research label.

### 13.7 Data-quality panel

Show:

- source update time;
- missing predictor count;
- weather backfill status;
- model and schema match;
- forecast freshness;
- explanation availability.

Stale, missing or backfilled data must be visible. The app must not silently hide it.

### 13.8 Research detail panel

This expandable panel may show:

- all 39 TreeSHAP contributions;
- five grouped contributions;
- selected reference timestamps;
- additivity and reproduction errors;
- model and reference-rule versions;
- known holiday, extreme-weather or DST contexts.

Known contexts are descriptive. They are not proof that the context caused the event.

## 14. Message construction rules

Use deterministic templates. Do not ask a generative language model to invent an operational explanation.

Recommended message structure:

1. `Forecast electricity use is [higher/lower] than usual.`
2. `The next-hour forecast is [forecast] MWh.`
3. `This is [difference] MWh ([percentage]%) [higher/lower] than comparable past normal hours.`
4. `[Top group] [raised/lowered] the model forecast the most.`
5. `[Second group] also [raised/lowered] the model forecast.`
6. `[Data-quality message]`
7. `This explains the model forecast. It does not confirm a physical cause or a grid emergency.`

Avoid technical words such as `SHAP value`, `baseline distribution`, `gradient-boosted ensemble` and `robust residual threshold` on the main screen.

## 15. Safety and failure behavior

The application must fail safely.

| Problem | Required behavior |
|---|---|
| Forecast model or schema mismatch | Do not forecast. Show a technical configuration error. |
| Duplicate or invalid timestamp | Reject the new row and keep the last valid forecast clearly marked as stale. |
| Missing demand lag | Do not synthesize it. Show forecast unavailable if required history is insufficient. |
| Missing weather predictor | Allow LightGBM `NaN` handling and show the missing-data warning flags. |
| Insufficient detector history | Show forecast only; do not classify normal or abnormal. |
| Invalid seasonal reference | Show abnormality status without a `Why?` explanation. |
| TreeSHAP additivity failure | Hide driver contributions and log the failure. |
| Direction disagreement | Hide the simple explanation and show `Explanation unavailable.` |
| Stale data | Show how old the data is and stop presenting the result as current. |

## 16. Time, units and accessibility

- Store and join data using UTC.
- Show ERCOT local time with `CST` or `CDT` and optionally show UTC underneath.
- Do not infer daylight-saving time from a fixed UTC offset.
- Keep the research dataset's `*_mwh` field names consistently. Confirm the intended operational unit with the source data dictionary before deployment and do not silently convert it.
- Do not use color as the only indicator. Add words, icons and shapes.
- Use large readable text and short sentences.
- Give charts descriptive titles and units.
- Support keyboard navigation and screen-reader labels.

## 17. Audit and reproducibility

Every displayed forecast or explanation should log:

- event or forecast ID;
- input timestamp and source retrieval time;
- model ID and SHA-256 hash;
- feature-schema ID;
- detector configuration version;
- reference-rule version and hash;
- selected reference IDs;
- explanation validation result;
- message-template version;
- application version;
- operator acknowledgement, if any.

Do not let the interface overwrite research outputs. Store operational records in a new application database or application-output directory.

## 18. Recommended implementation order

1. Build the outer-test replay data adapter.
2. Join `classified_test_forecasts.csv`, `abnormal_events.csv`, `treeshap_event_explanations.csv`, filtered seasonal-normal group contributions and `event_validation.csv`.
3. Validate the expected row counts: 17,487 test hours, 363 explained abnormal events and 359 app-display-ready events.
4. Build the simple forecast, status, chart and `Why?` panels.
5. Add failure states for the four withheld explanations and four unscored detector hours.
6. Add the researcher audit view.
7. Test the wording with grid workers or other intended users.
8. Only then build the live hourly ingestion and inference service.
9. Validate the live service against a historical replay before connecting it to operational feeds.
10. Keep all automatic control actions outside the scope of this research application.

## 19. Final answer to the training-versus-test question

Use **outer-test TreeSHAP** for the final research application demonstration.

Use **training/validation TreeSHAP** only to develop the interface, reuse the fixed message format and document the methodology.

For a real live application, calculate **new TreeSHAP explanations** from the frozen final LightGBM model and frozen seasonal-reference rule whenever a new abnormal forecast is detected.

This separation protects the validity of the paper and prevents internal-validation examples from being mistaken for final test performance.
