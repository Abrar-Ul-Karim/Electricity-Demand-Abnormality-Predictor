import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Activity,
  Gauge,
  Calendar,
  Layers,
} from 'lucide-react';
import { AbnormalEvent, TimelinePoint, SeverityLevel, ReliabilityLevel } from '../types';

interface DemandOverviewProps {
  event: AbnormalEvent | null;
  timelinePoint: TimelinePoint | null;
}

export const DemandOverviewCard: React.FC<DemandOverviewProps> = ({ event, timelinePoint }) => {
  // If we have an abnormal event, use its full enriched fields; otherwise use timeline point (normal)
  const isAbnormal = event !== null;

  const forecastMWh = event ? event.forecast_mwh : timelinePoint ? timelinePoint.forecast_mwh : 0;
  const currentDemandMWh = event ? event.current_demand_mwh : timelinePoint ? timelinePoint.actual_demand_mwh : 0;
  const seasonalNormalMWh = event ? event.seasonal_normal_mwh : timelinePoint ? timelinePoint.seasonal_normal_mwh : 0;
  const lowerThresholdMWh = event ? event.lower_threshold_mwh : timelinePoint ? timelinePoint.lower_threshold_mwh : 0;
  const upperThresholdMWh = event ? event.upper_threshold_mwh : timelinePoint ? timelinePoint.upper_threshold_mwh : 0;

  const deviationMW = event ? event.deviation_mw : forecastMWh - seasonalNormalMWh;
  const deviationPct = event
    ? event.deviation_pct
    : seasonalNormalMWh !== 0
    ? ((deviationMW / seasonalNormalMWh) * 100)
    : 0;

  const status = event ? event.status : timelinePoint ? timelinePoint.status : 'NORMAL';
  const severity: SeverityLevel = event ? event.severity : 'LOW';
  const reliability: ReliabilityLevel = event ? event.reliability : 'HIGH';

  const timestampLocal = event ? event.timestamp_local : timelinePoint ? timelinePoint.timestamp_local : 'N/A';
  const timestampUtc = event ? event.timestamp_utc : timelinePoint ? timelinePoint.timestamp_utc : 'N/A';

  // Severity color mapping
  const severityColorMap: Record<SeverityLevel, { bg: string; text: string; border: string }> = {
    LOW: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    MODERATE: { bg: '#fefce8', text: '#a16207', border: '#fef08a' },
    HIGH: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
    CRITICAL: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  };

  // Status color mapping
  const statusColorMap = {
    NORMAL: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    'ABNORMAL HIGH': { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
    'ABNORMAL LOW': { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' },
  };

  // Reliability color mapping
  const reliabilityColorMap: Record<ReliabilityLevel, { bg: string; text: string; border: string }> = {
    HIGH: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    MEDIUM: { bg: '#fefce8', text: '#a16207', border: '#fef08a' },
    LOW: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  };

  return (
    <Box sx={{ mb: 1.25 }}>
      {/* Top Banner: Status + Severity + Reliability Pills (NanoReview style) */}
      <Card sx={{ mb: 1, backgroundColor: '#ffffff' }}>
        <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
            }}
          >
            {/* Status Section */}
            <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 1.5 }, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                  DEMAND STATUS:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    color: statusColorMap[status].text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  }}
                >
                  {status === 'ABNORMAL HIGH' ? 'HIGHER THAN USUAL' : status === 'ABNORMAL LOW' ? 'LOWER THAN USUAL' : 'WITHIN USUAL RANGE'}
                </Typography>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ height: 20, my: 'auto', display: { xs: 'none', sm: 'block' } }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                  ATTENTION LEVEL:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    color: severityColorMap[severity].text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  }}
                >
                  {severity}
                </Typography>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ height: 20, my: 'auto', display: { xs: 'none', sm: 'block' } }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Tooltip title="Shows whether the explanation passed the system's data and consistency checks.">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, cursor: 'help' }}>
                    <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                      REASON CHECK:
                    </Typography>
                    <HelpCircle size={13} color="#94a3b8" />
                  </Box>
                </Tooltip>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    color: reliabilityColorMap[reliability].text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  }}
                >
                  {isAbnormal ? reliability : 'PASSED'}
                </Typography>
              </Box>
            </Box>

            {/* Timestamps & Horizon */}
            <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1, flexWrap: 'wrap', maxWidth: '100%', minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#007DD7',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                }}
              >
                FOR THE NEXT HOUR
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500, overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 }}>
                {timestampLocal} ({timestampUtc})
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Grid of 4 Key Demand Metrics Cards */}
      <Grid container spacing={1.25}>
        {/* Card 1: Next-Hour Forecasted Demand */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', backgroundColor: '#ffffff', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#007DD7' }} />
            <CardContent sx={{ p: 1.25 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
                <Typography variant="subtitle2">EXPECTED NEXT HOUR</Typography>
                <Gauge size={15} color="#007DD7" />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                {Math.round(forecastMWh).toLocaleString()}{' '}
                <Typography component="span" variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                  MW
                </Typography>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.25 }}>
                Expected electricity use
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 2: Current / Observed Demand */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', backgroundColor: '#ffffff' }}>
            <CardContent sx={{ p: 1.25 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
                <Typography variant="subtitle2">CURRENT DEMAND</Typography>
                <Activity size={15} color="#059669" />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                {Math.round(currentDemandMWh).toLocaleString()}{' '}
                <Typography component="span" variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                  MW
                </Typography>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.25 }}>
                Latest recorded electricity use
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 3: Seasonal Normal Reference & Boundaries */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', backgroundColor: '#ffffff' }}>
            <CardContent sx={{ p: 1.25 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
                <Typography variant="subtitle2">USUAL DEMAND</Typography>
                <Layers size={15} color="#475569" />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                {Math.round(seasonalNormalMWh).toLocaleString()}{' '}
                <Typography component="span" variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                  MW
                </Typography>
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.25 }}>
                Usual range: {Math.round(lowerThresholdMWh).toLocaleString()} – {Math.round(upperThresholdMWh).toLocaleString()} MW
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 4: Demand Deviation (MW and %) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              backgroundColor: deviationMW > 0 ? '#fff7ed' : deviationMW < 0 ? '#f0f9ff' : '#f0fdf4',
              borderColor: deviationMW > 0 ? '#fed7aa' : deviationMW < 0 ? '#bae6fd' : '#bbf7d0',
            }}
          >
            <CardContent sx={{ p: 1.25 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
                <Typography variant="subtitle2">DIFFERENCE FROM USUAL</Typography>
                {deviationMW >= 0 ? (
                  <TrendingUp size={15} color={deviationMW > 0 ? '#ea580c' : '#15803d'} />
                ) : (
                  <TrendingDown size={15} color="#0284c7" />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: deviationMW > 0 ? '#c2410c' : deviationMW < 0 ? '#0369a1' : '#15803d',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {deviationMW > 0 ? '+' : ''}
                  {Math.round(deviationMW).toLocaleString()}{' '}
                  <Typography component="span" variant="body2" sx={{ fontWeight: 700 }}>
                    MW
                  </Typography>
                </Typography>
                <Chip
                  label={`${deviationMW >= 0 ? '+' : ''}${deviationPct.toFixed(1)}%`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    height: 20,
                    backgroundColor: deviationMW > 0 ? '#ffedd5' : '#e0f2fe',
                    color: deviationMW > 0 ? '#9a3412' : '#075985',
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.5 }}>
                {status === 'ABNORMAL HIGH'
                  ? 'Higher than the usual range'
                  : status === 'ABNORMAL LOW'
                  ? 'Lower than the usual range'
                  : 'Inside the usual range'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Validation Status Strip (Feature 11) */}
      {event && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 1.5,
            px: 2,
            py: 1,
            mt: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
              SYSTEM CHECKS:
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {event.validation.explanation_valid ? (
                <CheckCircle2 size={14} color="#16a34a" />
              ) : (
                <XCircle size={14} color="#dc2626" />
              )}
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }}>
                Explanation math: {event.validation.explanation_valid ? 'Passed' : 'Failed'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {event.validation.seasonal_direction_matches_detector ? (
                <CheckCircle2 size={14} color="#16a34a" />
              ) : (
                <AlertTriangle size={14} color="#ea580c" />
              )}
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }}>
                Direction check:{' '}
                {event.validation.seasonal_direction_matches_detector ? 'Passed' : 'Did not pass'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {event.validation.seasonal_reference_valid ? (
                <CheckCircle2 size={14} color="#16a34a" />
              ) : (
                <XCircle size={14} color="#dc2626" />
              )}
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }}>
                Usual-hour comparison: {event.validation.reference_count} past normal hours
              </Typography>
            </Box>
          </Box>

          {!event.validation.application_display_ready && (
            <Chip
              icon={<AlertTriangle size={13} color="#b91c1c" />}
              label="Reason hidden because a check did not pass"
              size="small"
              sx={{
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                fontWeight: 700,
                border: '1px solid #fca5a5',
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );
};
