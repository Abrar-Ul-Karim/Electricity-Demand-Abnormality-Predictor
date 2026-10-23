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
  Chip,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Switch,
  FormControlLabel,
  TablePagination,
} from '@mui/material';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AbnormalEvent } from '../types';

interface FeatureTableProps {
  event: AbnormalEvent | null;
}

export const FeatureDetailsTable: React.FC<FeatureTableProps> = ({ event }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [showDetails, setShowDetails] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (!event) return null;

  const filteredFeatures = event.features.filter((feature) => {
    const matchesSearch =
      feature.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.feature_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'ALL' || feature.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });
  const displayedFeatures = filteredFeatures.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const groups = Array.from(new Set(event.features.map((feature) => feature.group)));

  return (
    <Card sx={{ mb: 1.5, backgroundColor: '#ffffff' }}>
      <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '0.925rem', fontWeight: 800 }}>
              More model details
            </Typography>
            <Typography variant="caption">
              Optional: view every value the model used to explain this forecast.
            </Typography>
          </Box>
          <FormControlLabel
            control={<Switch checked={showDetails} onChange={(e) => setShowDetails(e.target.checked)} size="small" />}
            label={<Typography variant="body2" sx={{ fontWeight: 700 }}>{showDetails ? 'Hide details' : 'Show details'}</Typography>}
          />
        </Box>

        {showDetails && (
          <Box sx={{ mt: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mb: 1 }}>
              <TextField
                size="small"
                placeholder="Find a value"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                sx={{ width: 180, '& input': { fontSize: '0.8rem', py: 0.6 } }}
              />
              <FormControl size="small" sx={{ minWidth: 170 }}>
                <InputLabel id="group-filter-label" sx={{ fontSize: '0.8rem' }}>Type of clue</InputLabel>
                <Select
                  labelId="group-filter-label"
                  value={selectedGroup}
                  label="Type of clue"
                  onChange={(e) => { setSelectedGroup(e.target.value); setPage(0); }}
                  sx={{ height: 32, fontSize: '0.8rem' }}
                >
                  <MenuItem value="ALL" sx={{ fontSize: '0.8rem' }}>All clues ({event.features.length})</MenuItem>
                  {groups.map((group) => <MenuItem key={group} value={group} sx={{ fontSize: '0.8rem' }}>{group}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Clue</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Current value</TableCell>
                    <TableCell align="right">Usual value</TableCell>
                    <TableCell align="right">Change to forecast</TableCell>
                    <TableCell align="center">Moved forecast</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedFeatures.map((feature) => {
                    const isUp = feature.direction === 'increase';
                    return (
                      <TableRow key={feature.feature_name} hover>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>#{feature.rank}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{feature.display_name}</TableCell>
                        <TableCell><Chip label={feature.group} size="small" sx={{ height: 20, backgroundColor: '#f1f5f9' }} /></TableCell>
                        <TableCell align="right">{feature.current_value.toLocaleString()} {feature.unit}</TableCell>
                        <TableCell align="right">{feature.reference_value.toLocaleString()} {feature.unit}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: isUp ? '#007DD7' : '#013D95' }}>
                          {feature.contribution_mwh >= 0 ? '+' : '−'}{Math.round(Math.abs(feature.contribution_mwh)).toLocaleString()} MW
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                            {isUp ? <ArrowUpRight size={15} color="#007DD7" /> : <ArrowDownRight size={15} color="#013D95" />}
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>{isUp ? 'Up' : 'Down'}</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 20, 39]}
              component="div"
              count={filteredFeatures.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
