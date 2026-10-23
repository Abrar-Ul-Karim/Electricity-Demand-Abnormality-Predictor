import React from 'react';
import { Box, Card, CardContent, Typography, Chip, Grid } from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  CircleHelp,
  ClipboardCheck,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { AbnormalEvent } from '../types';

interface ExplanationSectionProps {
  event: AbnormalEvent | null;
}

const simpleGroupName = (name: string) => {
  const names: Record<string, string> = {
    'Recent electricity demand': 'Recent electricity use',
    Weather: 'Weather',
    'Time and season': 'Time of day and season',
    Calendar: 'Day, weekend, or holiday pattern',
    'Data quality': 'Available data',
  };
  return names[name] || name;
};

const formatSignedMw = (value: number) =>
  `${value >= 0 ? '+' : '−'}${Math.round(Math.abs(value)).toLocaleString()} MW`;

export const ExplanationSection: React.FC<ExplanationSectionProps> = ({ event }) => {
  if (!event) {
    return (
      <Card sx={{ mb: 2.5, backgroundColor: '#ffffff', borderLeft: '4px solid #16a34a' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <ShieldCheck size={24} color="#16a34a" />
            <Box>
              <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 800, mb: 0.5 }}>
                Demand looks normal
              </Typography>
              <Typography variant="body1" sx={{ color: '#475569', maxWidth: 760 }}>
                The forecast is inside the usual range for this time. No unusual change was found, so there is no
                special reason to review. Keep watching the normal grid displays.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const isHigh = event.status === 'ABNORMAL HIGH';
  const directionWord = isHigh ? 'higher' : 'lower';
  const displayReady = event.validation.application_display_ready;
  const strongestGroups = event.driver_groups
    .filter((group) => group.absolute_contribution_mwh > 0)
    .slice(0, 3);
  const reasoning = event.deterministic_reasoning;

  const recommendedSteps = isHigh
    ? [
        'Check the newest demand reading and weather update to make sure data is current.',
        'Review available supply and reserve levels in your normal control-room tools.',
        'If demand keeps rising or reaches an operating limit, follow the high-demand procedure and tell the shift lead.',
      ]
    : [
        'Check the newest demand reading and make sure data is current.',
        'Review weather, generation schedules, and known load changes in normal tools.',
        'If demand keeps falling or reaches an operating limit, follow the low-demand procedure and tell the shift lead.',
      ];

  const groupChartData = event.driver_groups.map((group) => ({
    name: simpleGroupName(group.group),
    contribution: group.contribution_mwh,
  }));

  return (
    <Box sx={{ mb: 1.25 }}>
      {/* Simplified NanoReview Card */}
      <Card sx={{ mb: 1.25, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderRadius: 2 }}>
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fafbfc' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircleHelp size={17} color="#007DD7" />
            <Box>
              <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                Unusual demand explanation
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                A simple guide to what changed, why the model changed its forecast, and what to check next.
              </Typography>
            </Box>
          </Box>
        </Box>

        <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
          {!displayReady && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                p: 1.25,
                mb: 1.25,
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: 1.5,
              }}
            >
              <TriangleAlert size={17} color="#c2410c" />
              <Typography variant="body2" sx={{ color: '#7c2d12', fontWeight: 600 }}>
                The system found an unusual forecast, but the reason check did not pass. Do not use the model reasons
                for this hour. Check the normal control-room displays and ask the shift lead if needed.
              </Typography>
            </Box>
          )}

          <Grid container spacing={1.25}>
            {/* Card 1: Predicted Power Forecast */}
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  height: '100%',
                  p: 1.25,
                  borderRadius: 1.5,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'border-color 0.15s ease',
                  '&:hover': { borderColor: '#cbd5e1' },
                }}
              >
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                    Predicted Power Forecast
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.65 }}>
                  The model expects <strong>{Math.round(event.forecast_mwh).toLocaleString()} MW</strong> in the next
                  hour. This is <strong>{Math.round(Math.abs(event.deviation_mw)).toLocaleString()} MW</strong> (
                  <strong>{Math.abs(event.deviation_pct).toFixed(1)}%</strong>) {directionWord} than similar normal
                  hours.
                </Typography>
              </Box>
            </Grid>

            {/* Card 2: Reasoning */}
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  height: '100%',
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'border-color 0.15s ease',
                  '&:hover': { borderColor: '#cbd5e1' },
                }}
              >
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                    Reasoning
                  </Typography>
                </Box>
                {displayReady ? (
                  <Box>
                    {reasoning.evidence_sections.map((section) => (
                      <Box key={section.title} sx={{ mb: 1, '&:last-of-type': { mb: 0 } }}>
                        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 800, display: 'block', mb: 0.25 }}>
                          {section.title}
                        </Typography>
                        <Box component="ul" sx={{ m: 0, pl: 2, '& li': { mb: 0.2 } }}>
                          {section.points.map((point) => (
                            <Typography key={`${section.title}-${point.label}`} component="li" variant="body2" sx={{ color: '#334155', lineHeight: 1.45, fontSize: '0.78rem' }}>
                              {point.label}: <strong>{point.value}</strong>
                            </Typography>
                          ))}
                        </Box>
                        {section.note && (
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.35, lineHeight: 1.4 }}>
                            {section.note}
                          </Typography>
                        )}
                      </Box>
                    ))}
                    <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.5, mt: 1 }}>
                      {reasoning.summary}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.65 }}>
                    The reason is hidden because it did not pass the system checks. This prevents a weak or conflicting
                    explanation from guiding an operator.
                  </Typography>
                )}
              </Box>
            </Grid>

            {/* Card 3: Recommended steps */}
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  height: '100%',
                  p: 1.25,
                  borderRadius: 1.5,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'border-color 0.15s ease',
                  '&:hover': { borderColor: '#cbd5e1' },
                }}
              >
                <Box sx={{ mb: 1.25 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                    Recommended steps
                  </Typography>
                </Box>
                <Box component="ul" sx={{ m: 0, pl: 2, '& li': { mb: 0.5, '&:last-child': { mb: 0 } } }}>
                  {recommendedSteps.map((step, idx) => (
                    <Typography
                      key={idx}
                      component="li"
                      variant="body2"
                      sx={{ color: '#334155', lineHeight: 1.45, fontSize: '0.78rem' }}
                    >
                      {step}
                    </Typography>
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {displayReady && (
        <Grid container spacing={1.25}>
          <Grid item xs={12} md={5}>
            <Card sx={{ height: '100%', backgroundColor: '#ffffff' }}>
              <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Activity size={17} color="#007DD7" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Main clues used by the model
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {strongestGroups.map((group) => (
                    <Box key={group.group} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, p: 1, borderRadius: 1.25, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                          {simpleGroupName(group.group)}
                        </Typography>
                        <Typography variant="caption">
                          {group.contribution_mwh >= 0 ? 'Pushed the forecast up' : 'Pushed the forecast down'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: group.contribution_mwh >= 0 ? '#007DD7' : '#013D95' }}>
                        {formatSignedMw(group.contribution_mwh)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card sx={{ height: '100%', backgroundColor: '#ffffff' }}>
              <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  How each clue moved the forecast
                </Typography>
                <Typography variant="caption">
                  A bar to the right raised the forecast. A bar to the left lowered it.
                </Typography>
                <Box sx={{ width: '100%', height: 195, mt: 0.75 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupChartData} layout="vertical" margin={{ top: 5, right: 25, left: 90, bottom: 5 }}>
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" unit=" MW" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} stroke="#cbd5e1" width={140} />
                      <RechartsTooltip formatter={(value: number) => [formatSignedMw(value), 'Change to forecast']} labelStyle={{ fontWeight: 700, color: '#0f172a' }} />
                      <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1.5} />
                      <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                        {groupChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.contribution >= 0 ? '#00A8F1' : '#013D95'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mt: 1, px: 0.5, color: '#64748b' }}>
        <ClipboardCheck size={14} />
        <Typography variant="caption">
          This screen explains a model forecast. It does not confirm a grid fault, prove the physical cause, or replace
          the control room's approved operating rules.
        </Typography>
      </Box>
    </Box>
  );
};
