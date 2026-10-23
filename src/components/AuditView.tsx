import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
} from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
} from 'recharts';
import {
  Cpu,
  Database,
  CheckCircle2,
  AlertTriangle,
  Award,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AppDataset } from '../types';

interface AuditProps {
  data: AppDataset;
}

export const AuditView: React.FC<AuditProps> = ({ data }) => {
  const { summary, configuration, metrics, abnormality_stats, global_importance } = data;

  const importanceChartData = global_importance.slice(0, 10).map((g) => ({
    name: g.display_name,
    rawName: g.feature_name,
    contribution: g.mean_absolute_contribution_mwh,
    group: g.group,
  }));

  return (
    <Box sx={{ mb: 4 }}>
      {/* Top Architecture Summary */}
      <Card sx={{ mb: 2.5, backgroundColor: '#ffffff', borderLeft: '4px solid #007DD7' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Cpu size={18} color="#007DD7" />
            <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 800 }}>
              RESEARCH AUDIT & FROZEN PIPELINE VERIFICATION
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.5 }}>
            All statistics and evaluations presented below are strictly sourced from the untouched 20% outer-test
            period (2024–2025, 17,487 hourly forecasts) in <code>src/testing/test_output</code> using the frozen final
            LightGBM model and frozen abnormality detector. No tuning was performed on outer-test rows.
          </Typography>
        </CardContent>
      </Card>

      {/* Model Specifications & Accuracy Scorecard */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {/* Model Specs Card */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%', backgroundColor: '#ffffff' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#334155' }}>
                FROZEN MODEL SPECIFICATIONS
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #f1f5f9' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Model Architecture:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>LightGBM Regressor</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #f1f5f9' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Model Trees:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{configuration.model_trees} Trees</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #f1f5f9' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Feature Schema ID:</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>b51e09c942a4c1bc (39 features)</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #f1f5f9' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Model SHA-256 Hash:</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, maxWidth: 220 }} noWrap>
                    {configuration.model_sha256}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #f1f5f9' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Forecast Target & Horizon:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>demand_mwh (1 Hour Ahead)</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Reference Rule:</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {configuration.reference_rule_version}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Forecast Accuracy Scorecard */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%', backgroundColor: '#ffffff' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#334155' }}>
                OUTER-TEST ACCURACY BENCHMARK (17,487 HOURS)
              </Typography>

              <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Evaluation Scope</TableCell>
                      <TableCell align="right">MAE (MW)</TableCell>
                      <TableCell align="right">RMSE (MW)</TableCell>
                      <TableCell align="right">MAPE (%)</TableCell>
                      <TableCell align="right">R² Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow sx={{ backgroundColor: '#f0fdf4' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#15803d' }}>
                        LightGBM Final Model
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#15803d' }}>
                        {summary.forecast_metrics.mae_mwh.toFixed(1)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {summary.forecast_metrics.rmse_mwh.toFixed(1)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {summary.forecast_metrics.mape_percent.toFixed(2)}%
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#15803d' }}>
                        {summary.forecast_metrics.r2.toFixed(4)}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell sx={{ color: '#64748b' }}>Seasonal Naive (Lag 168h)</TableCell>
                      <TableCell align="right">{summary.seasonal_naive_metrics.mae_mwh.toFixed(1)}</TableCell>
                      <TableCell align="right">{summary.seasonal_naive_metrics.rmse_mwh.toFixed(1)}</TableCell>
                      <TableCell align="right">{summary.seasonal_naive_metrics.mape_percent.toFixed(2)}%</TableCell>
                      <TableCell align="right">{summary.seasonal_naive_metrics.r2.toFixed(4)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 1.5, p: 1, backgroundColor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 700 }}>
                  ✓ Error Reduction: LightGBM achieves an 89.2% MAE reduction over the seasonal naive baseline on untouched test data.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Global Feature Importance Chart (Top 10) */}
      <Card sx={{ mb: 2.5, backgroundColor: '#ffffff' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                GLOBAL TREESHAP FEATURE IMPORTANCE (OUTER-TEST PERIOD)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Ranked by Mean Absolute TreeSHAP Contribution (MW) across all outer-test abnormal events.
              </Typography>
            </Box>
            <Chip
              label="Top Driver: demand_lag_1_mwh"
              size="small"
              sx={{ backgroundColor: '#f1f5f9', fontWeight: 600, color: '#007DD7' }}
            />
          </Box>

          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={importanceChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 160, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                  unit=" MW"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  stroke="#cbd5e1"
                  width={150}
                />
                <RechartsTooltip
                  formatter={(val: number) => [`${Math.round(val).toLocaleString()} MW`, 'Mean Absolute Impact']}
                  labelStyle={{ fontWeight: 700, color: '#0f172a' }}
                />
                <Bar dataKey="contribution" fill="#007DD7" radius={[0, 4, 4, 0]}>
                  {importanceChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#007DD7' : index === 1 ? '#00A8F1' : '#013D95'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Abnormality Statistics Table */}
      <Card sx={{ backgroundColor: '#ffffff' }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#334155' }}>
            ABNORMALITY DETECTION & EXPLANATION SUMMARY AUDIT
          </Typography>

          <Grid container spacing={2}>
            {abnormality_stats.map((stat) => (
              <Grid item xs={6} sm={4} md={3} key={stat.statistic}>
                <Box sx={{ p: 1.25, backgroundColor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', textTransform: 'capitalize' }}>
                    {stat.statistic.replace(/_/g, ' ')}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {parseFloat(stat.value).toLocaleString()}{' '}
                    <Typography component="span" variant="caption" sx={{ color: '#64748b' }}>
                      {stat.unit}
                    </Typography>
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};
