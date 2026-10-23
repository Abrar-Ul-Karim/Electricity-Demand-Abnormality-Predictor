import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  ButtonGroup,
  Button,
  Divider,
} from '@mui/material';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceDot,
} from 'recharts';
import { TimelinePoint } from '../types';

interface ChartProps {
  timeline: TimelinePoint[];
  selectedTimestamp: string;
  onPointClick: (timestamp: string) => void;
  selectedWindow: 'episode' | 'all';
  onWindowChange: (window: 'episode' | 'all') => void;
}

export const DemandForecastChart: React.FC<ChartProps> = ({
  timeline,
  selectedTimestamp,
  onPointClick,
  selectedWindow,
  onWindowChange,
}) => {
  // Filter timeline based on window around selected timestamp
  const chartData = useMemo(() => {
    if (timeline.length === 0) return [];
    if (selectedWindow === 'all') {
      // Return downsampled or full
      return timeline.slice(0, 300);
    }

    // Find index of selected timestamp
    const selectedIdx = timeline.findIndex((p) => p.timestamp_utc === selectedTimestamp);
    if (selectedIdx === -1) {
      return timeline.slice(0, 100);
    }

    // Return a 72-hour window around the selected timestamp
    const start = Math.max(0, selectedIdx - 36);
    const end = Math.min(timeline.length, selectedIdx + 36);
    return timeline.slice(start, end);
  }, [timeline, selectedTimestamp, selectedWindow]);

  const selectedPoint = timeline.find((p) => p.timestamp_utc === selectedTimestamp);

  return (
    <Card sx={{ mb: 1.25, backgroundColor: '#ffffff' }}>
      <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
            gap: 1,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontSize: '0.925rem', fontWeight: 700 }}>
                DEMAND OVER TIME
              </Typography>
              <Chip
                label="Select a point to view it"
                size="small"
                sx={{
                  backgroundColor: '#f1f5f9',
                  color: '#007DD7',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 20,
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Compare the actual demand, the next-hour forecast, and the usual range.
            </Typography>
          </Box>

          <ButtonGroup size="small" variant="outlined">
            <Button
              variant={selectedWindow === 'episode' ? 'contained' : 'outlined'}
              onClick={() => onWindowChange('episode')}
              sx={{ fontSize: '0.75rem', py: 0.3 }}
            >
              Around selected time
            </Button>
            <Button
              variant={selectedWindow === 'all' ? 'contained' : 'outlined'}
              onClick={() => onWindowChange('all')}
              sx={{ fontSize: '0.75rem', py: 0.3 }}
            >
              Longer view
            </Button>
          </ButtonGroup>
        </Box>

        {/* Recharts ComposedChart */}
        <Box sx={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              onClick={(e) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  const clickedTs = e.activePayload[0].payload.timestamp_utc;
                  onPointClick(clickedTs);
                }
              }}
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            >
              <XAxis
                dataKey="timestamp_local"
                tickFormatter={(val) => {
                  if (!val) return '';
                  // e.g. "2024-01-14 11:00:00-06:00" -> "Jan 14 11:00"
                  const parts = val.split(' ');
                  if (parts.length >= 2) {
                    const dateParts = parts[0].split('-');
                    const timeParts = parts[1].split(':');
                    return `${dateParts[1]}/${dateParts[2]} ${timeParts[0]}:00`;
                  }
                  return val;
                }}
                tick={{ fontSize: 11, fill: '#64748b' }}
                stroke="#cbd5e1"
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                tick={{ fontSize: 11, fill: '#64748b' }}
                stroke="#cbd5e1"
                unit=" MW"
                width={65}
              />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const data: TimelinePoint = payload[0].payload;
                  return (
                    <Box
                      sx={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 1.5,
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        p: 1.5,
                        minWidth: 200,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: '#0f172a', mb: 0.5, fontSize: '0.75rem' }}>
                        {data.timestamp_local}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                        UTC: {data.timestamp_utc}
                      </Typography>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: '#007DD7', fontWeight: 600 }}>
                            Forecast:
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {data.forecast_mwh.toLocaleString()} MW
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 600 }}>
                            Actual demand:
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {data.actual_demand_mwh.toLocaleString()} MW
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                            Usual demand:
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {data.seasonal_normal_mwh.toLocaleString()} MW
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            Usual range:
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {data.lower_threshold_mwh.toLocaleString()} – {data.upper_threshold_mwh.toLocaleString()}
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 0.5 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Status:
                          </Typography>
                          <Chip
                            label={data.status === 'ABNORMAL HIGH' ? 'HIGHER THAN USUAL' : data.status === 'ABNORMAL LOW' ? 'LOWER THAN USUAL' : 'WITHIN USUAL RANGE'}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              backgroundColor:
                                data.status === 'ABNORMAL HIGH'
                                  ? '#fff7ed'
                                  : data.status === 'ABNORMAL LOW'
                                  ? '#f0f9ff'
                                  : '#f0fdf4',
                              color:
                                data.status === 'ABNORMAL HIGH'
                                  ? '#c2410c'
                                  : data.status === 'ABNORMAL LOW'
                                  ? '#0369a1'
                                  : '#15803d',
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8, fontSize: '0.75rem' }}
                iconType="circle"
              />

              {/* Upper & Lower Threshold Band */}
              <Area
                type="monotone"
                dataKey="upper_threshold_mwh"
                stroke="transparent"
                fill="#f1f5f9"
                fillOpacity={0.7}
                name="Top of usual range"
              />
              <Area
                type="monotone"
                dataKey="lower_threshold_mwh"
                stroke="transparent"
                fill="#ffffff"
                fillOpacity={1}
                name="Bottom of usual range"
              />

              {/* Seasonal Normal Line */}
              <Line
                type="monotone"
                dataKey="seasonal_normal_mwh"
                stroke="#64748b"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                name="Usual demand"
              />

              {/* Actual Demand Line */}
              <Line
                type="monotone"
                dataKey="actual_demand_mwh"
                stroke="#0f172a"
                strokeWidth={1.5}
                dot={false}
                name="Actual demand"
              />

              {/* Forecast Demand Line */}
              <Line
                type="monotone"
                dataKey="forecast_mwh"
                stroke="#007DD7"
                strokeWidth={2.2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload && payload.is_abnormal) {
                    return (
                      <circle
                        key={`abn-${payload.timestamp_utc}`}
                        cx={cx}
                        cy={cy}
                        r={4.5}
                        fill="#ea580c"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        style={{ cursor: 'pointer' }}
                        onClick={() => onPointClick(payload.timestamp_utc)}
                      />
                    );
                  }
                  return <g key={payload ? payload.timestamp_utc : Math.random()} />;
                }}
                name="Expected next hour"
              />

              {/* Indicator Dot on currently selected point */}
              {selectedPoint && (
                <ReferenceDot
                  x={selectedPoint.timestamp_local}
                  y={selectedPoint.forecast_mwh}
                  r={7}
                  fill="#007DD7"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </Box>

        {/* Interactive Indicator & Normal State Banner (Feature 14) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 1,
            px: 2,
            py: 0.75,
            mt: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: selectedPoint?.is_abnormal ? '#ea580c' : '#16a34a',
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }}>
              Selected time: {selectedPoint ? selectedPoint.timestamp_local : 'None'}
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {selectedPoint?.is_abnormal
              ? `This point is ${selectedPoint.status === 'ABNORMAL HIGH' ? 'higher' : 'lower'} than usual. See the simple reason below.`
              : 'This point is inside the usual range.'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
