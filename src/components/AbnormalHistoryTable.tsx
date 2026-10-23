import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Grid,
} from '@mui/material';
import {
  Eye,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { AbnormalHistoryItem, EpisodeSummary, SeverityLevel } from '../types';

interface HistoryProps {
  history: AbnormalHistoryItem[];
  episodes: EpisodeSummary[];
  onInspectEvent: (eventId: string) => void;
  onSelectEvent: (timestamp: string) => void;
}

export const AbnormalHistoryTable: React.FC<HistoryProps> = ({
  history,
  episodes,
  onInspectEvent,
  onSelectEvent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedEpisode, setSelectedEpisode] = useState<string>('ALL');
  const [displayReadyOnly, setDisplayReadyOnly] = useState<string>('ALL');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Severity color mapping
  const severityColors: Record<SeverityLevel, { bg: string; text: string }> = {
    LOW: { bg: '#f0fdf4', text: '#15803d' },
    MODERATE: { bg: '#fefce8', text: '#a16207' },
    HIGH: { bg: '#fff7ed', text: '#c2410c' },
    CRITICAL: { bg: '#fef2f2', text: '#b91c1c' },
  };

  // Filter history
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.timestamp_local.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.timestamp_utc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.main_driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.episode_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = selectedSeverity === 'ALL' || item.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
    const matchesEpisode = selectedEpisode === 'ALL' || item.episode_id === selectedEpisode;
    const matchesReady =
      displayReadyOnly === 'ALL' ||
      (displayReadyOnly === 'READY' && item.display_ready) ||
      (displayReadyOnly === 'WITHHELD' && !item.display_ready);

    return matchesSearch && matchesSeverity && matchesStatus && matchesEpisode && matchesReady;
  });

  const displayedRows = filteredHistory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const totalEvents = history.length;
  const criticalCount = history.filter((h) => h.severity === 'CRITICAL').length;
  const highCount = history.filter((h) => h.severity === 'HIGH').length;
  const withheldCount = history.filter((h) => !h.display_ready).length;

  return (
    <Box sx={{ mb: 1.5 }}>
      {/* Top summary row of badges (NanoReview style) */}
      <Grid container spacing={1.25} sx={{ mb: 1.25 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ backgroundColor: '#ffffff' }}>
            <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                UNUSUAL HOURS
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {totalEvents}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Found in the saved test period
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ backgroundColor: '#ffffff' }}>
            <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                URGENT-LEVEL HOURS
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#b91c1c' }}>
                {criticalCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Largest changes from usual
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ backgroundColor: '#ffffff' }}>
            <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                REASONS AVAILABLE
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#15803d' }}>
                {totalEvents - withheldCount}{' '}
                <Typography component="span" variant="caption" sx={{ color: '#64748b' }}>
                  ({(((totalEvents - withheldCount) / totalEvents) * 100).toFixed(1)}%)
                </Typography>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Passed all system checks
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ backgroundColor: '#ffffff' }}>
            <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                REASONS HIDDEN
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#ea580c' }}>
                {withheldCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                A system check did not pass
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table Card */}
      <Card sx={{ backgroundColor: '#ffffff' }}>
        <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
              gap: 1.5,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 700 }}>
                UNUSUAL DEMAND HISTORY
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Review past hours when expected demand was outside the usual range.
              </Typography>
            </Box>

            {/* Filter controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Find time or reason"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                sx={{ width: 200, '& input': { fontSize: '0.8rem', py: 0.6 } }}
              />

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="severity-label" sx={{ fontSize: '0.8rem' }}>
                  Attention level
                </InputLabel>
                <Select
                  labelId="severity-label"
                  value={selectedSeverity}
                  label="Attention level"
                  onChange={(e) => {
                    setSelectedSeverity(e.target.value);
                    setPage(0);
                  }}
                  sx={{ height: 32, fontSize: '0.8rem' }}
                >
                  <MenuItem value="ALL" sx={{ fontSize: '0.8rem' }}>All levels</MenuItem>
                  <MenuItem value="CRITICAL" sx={{ fontSize: '0.8rem' }}>Critical</MenuItem>
                  <MenuItem value="HIGH" sx={{ fontSize: '0.8rem' }}>High</MenuItem>
                  <MenuItem value="MODERATE" sx={{ fontSize: '0.8rem' }}>Moderate</MenuItem>
                  <MenuItem value="LOW" sx={{ fontSize: '0.8rem' }}>Low</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="status-filter-label" sx={{ fontSize: '0.8rem' }}>
                  Direction
                </InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={selectedStatus}
                  label="Direction"
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(0);
                  }}
                  sx={{ height: 32, fontSize: '0.8rem' }}
                >
                  <MenuItem value="ALL" sx={{ fontSize: '0.8rem' }}>All directions</MenuItem>
                  <MenuItem value="ABNORMAL HIGH" sx={{ fontSize: '0.8rem' }}>Higher than usual (356)</MenuItem>
                  <MenuItem value="ABNORMAL LOW" sx={{ fontSize: '0.8rem' }}>Lower than usual (7)</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="gate-filter-label" sx={{ fontSize: '0.8rem' }}>
                  Reason status
                </InputLabel>
                <Select
                  labelId="gate-filter-label"
                  value={displayReadyOnly}
                  label="Reason status"
                  onChange={(e) => {
                    setDisplayReadyOnly(e.target.value);
                    setPage(0);
                  }}
                  sx={{ height: 32, fontSize: '0.8rem' }}
                >
                  <MenuItem value="ALL" sx={{ fontSize: '0.8rem' }}>All reasons</MenuItem>
                  <MenuItem value="READY" sx={{ fontSize: '0.8rem' }}>Available (359)</MenuItem>
                  <MenuItem value="WITHHELD" sx={{ fontSize: '0.8rem' }}>Hidden (4)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Table */}
          <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time (Local / UTC)</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Forecast (MW)</TableCell>
                  <TableCell align="right">Difference (MW)</TableCell>
                  <TableCell align="right">Change score</TableCell>
                  <TableCell>Attention</TableCell>
                  <TableCell>Main clue</TableCell>
                  <TableCell align="center">Reason</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedRows.map((row) => {
                  const isUp = row.status === 'ABNORMAL HIGH';
                  return (
                    <TableRow
                      key={row.event_id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:nth-of-type(even)': { backgroundColor: '#fcfdfe' },
                      }}
                      onClick={() => onInspectEvent(row.event_id)}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                          {row.timestamp_local}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          {row.timestamp_utc}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#475569' }}>
                        {row.episode_id}
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            color: isUp ? '#c2410c' : '#0369a1',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {isUp ? 'HIGHER' : 'LOWER'}
                        </Typography>
                      </TableCell>

                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {row.forecast_mwh.toLocaleString()}
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          color: isUp ? '#c2410c' : '#0369a1',
                        }}
                      >
                        {row.deviation_mw >= 0 ? '+' : ''}{row.deviation_mw.toLocaleString()}{' '}
                        <Typography component="span" variant="caption" sx={{ color: '#64748b' }}>
                          ({row.deviation_pct >= 0 ? '+' : ''}{row.deviation_pct}%)
                        </Typography>
                      </TableCell>

                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {row.score.toFixed(2)}
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            color: severityColors[row.severity].text,
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {row.severity}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ fontWeight: 600, color: '#334155', maxWidth: 180 }}>
                        <Typography noWrap variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {row.main_driver}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          {row.main_driver_group}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        {row.display_ready ? (
                          <Chip
                            label="Available"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              backgroundColor: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #bbf7d0',
                            }}
                          />
                        ) : (
                          <Chip
                            label="Hidden"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                            }}
                          />
                        )}
                      </TableCell>

                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Eye size={13} />}
                          onClick={() => onInspectEvent(row.event_id)}
                          sx={{
                            fontSize: '0.7rem',
                            py: 0.2,
                            px: 1,
                            borderColor: '#cbd5e1',
                            color: '#007DD7',
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 15, 25, 50]}
            component="div"
            count={filteredHistory.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{ borderTop: 'none', '& .MuiTablePagination-toolbar': { minHeight: 40 } }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};
