import React from 'react';
import { Drawer, Box, Typography, IconButton, Chip, Grid, Alert, Button } from '@mui/material';
import { X, ArrowUpRight, ArrowDownRight, ClipboardCheck } from 'lucide-react';
import { AbnormalEvent } from '../types';

interface EventDrawerProps {
  open: boolean;
  onClose: () => void;
  event: AbnormalEvent | null;
  onSelectForConsole: (timestamp: string) => void;
}

export const EventDrawer: React.FC<EventDrawerProps> = ({ open, onClose, event, onSelectForConsole }) => {
  if (!event) return null;

  const isUp = event.status === 'ABNORMAL HIGH';
  const displayReady = event.validation.application_display_ready;
  const mainGroups = event.driver_groups.filter((group) => group.absolute_contribution_mwh > 0).slice(0, 3);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 520 }, p: 0, backgroundColor: '#ffffff' } }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 800 }}>Unusual demand details</Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                fontSize: '0.75rem',
                color: isUp ? '#c2410c' : '#0369a1',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}
            >
              {isUp ? 'HIGHER THAN USUAL' : 'LOWER THAN USUAL'}
            </Typography>
          </Box>
          <Typography variant="caption">{event.timestamp_local} (UTC: {event.timestamp_utc})</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Close details"><X size={20} /></IconButton>
      </Box>

      <Box sx={{ p: 2.5, overflowY: 'auto' }}>
        {!displayReady && (
          <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8125rem' }}>
            The model reason is hidden because a system check did not pass. Use the normal control-room displays for this hour.
          </Alert>
        )}

        <Grid container spacing={1.25} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ p: 1.5, backgroundColor: '#f1f5f9', borderRadius: 1.5, border: 'none' }}>
              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 600 }}>EXPECTED NEXT HOUR</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>{Math.round(event.forecast_mwh).toLocaleString()} MW</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ p: 1.5, backgroundColor: '#f1f5f9', borderRadius: 1.5, border: 'none' }}>
              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 600 }}>USUAL DEMAND</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>{Math.round(event.seasonal_normal_mwh).toLocaleString()} MW</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ p: 1.5, backgroundColor: '#f1f5f9', borderRadius: 1.5, border: 'none' }}>
              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 600 }}>DIFFERENCE FROM USUAL</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {event.deviation_mw >= 0 ? '+' : '−'}{Math.round(Math.abs(event.deviation_mw)).toLocaleString()} MW
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>{Math.abs(event.deviation_pct).toFixed(1)}% {isUp ? 'higher' : 'lower'}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ p: 1.5, backgroundColor: '#f1f5f9', borderRadius: 1.5, border: 'none' }}>
              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 600 }}>ATTENTION LEVEL</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>{event.severity}</Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Reason check: {displayReady ? 'passed' : 'did not pass'}</Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5, color: '#0f172a' }}>Predicted Power Forecast</Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.65, color: '#334155' }}>
            Expected demand is <strong>{Math.round(Math.abs(event.deviation_mw)).toLocaleString()} MW</strong> {isUp ? 'higher' : 'lower'} than similar normal hours. The expected level for the next hour is <strong>{Math.round(event.forecast_mwh).toLocaleString()} MW</strong>.
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.75, color: '#0f172a' }}>Reasoning</Typography>
          {displayReady ? mainGroups.map((group) => {
            const groupUp = group.contribution_mwh >= 0;
            return (
              <Box key={group.group} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.2, mb: 0.75, backgroundColor: '#f1f5f9', border: 'none', borderRadius: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{group.group}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                  {groupUp ? <ArrowUpRight size={15} color="#475569" /> : <ArrowDownRight size={15} color="#475569" />}
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {groupUp ? '+' : '−'}{Math.round(Math.abs(group.contribution_mwh)).toLocaleString()} MW
                  </Typography>
                </Box>
              </Box>
            );
          }) : <Typography variant="body2" sx={{ color: '#64748b' }}>No model reason is shown for this hour.</Typography>}
        </Box>

        <Box sx={{ p: 1.5, mb: 2, backgroundColor: '#f1f5f9', border: 'none', borderRadius: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.75 }}>
            <ClipboardCheck size={16} color="#475569" />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>Recommended steps</Typography>
          </Box>
          <Box component="ul" sx={{ m: 0, pl: 2, '& li': { mb: 0.5, '&:last-child': { mb: 0 } } }}>
            <Typography component="li" variant="body2" sx={{ color: '#334155', lineHeight: 1.5 }}>
              Check the newest demand reading and weather update (ensure data is current).
            </Typography>
            <Typography component="li" variant="body2" sx={{ color: '#334155', lineHeight: 1.5 }}>
              Review available supply and reserve levels in normal control-room tools.
            </Typography>
            <Typography component="li" variant="body2" sx={{ color: '#334155', lineHeight: 1.5 }}>
              If demand keeps rising or reaches an operating limit, follow approved procedure and notify the shift lead.
            </Typography>
          </Box>
        </Box>

        <Button fullWidth variant="contained" onClick={() => { onSelectForConsole(event.timestamp_utc); onClose(); }} sx={{ backgroundColor: '#007DD7', fontWeight: 700 }}>
          Open this time in the main view
        </Button>
      </Box>
    </Drawer>
  );
};
