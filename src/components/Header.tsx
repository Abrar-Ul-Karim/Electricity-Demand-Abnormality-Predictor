import React from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Clock, BarChart3, ListFilter } from 'lucide-react';
import { EpisodeSummary } from '../types';

interface HeaderProps {
  currentTab: number;
  onTabChange: (newTab: number) => void;
  selectedTimestamp: string;
  episodes: EpisodeSummary[];
  selectedEpisodeId: string;
  onEpisodeSelect: (episodeId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  selectedTimestamp,
  episodes,
  selectedEpisodeId,
  onEpisodeSelect,
}) => (
  <Box
    sx={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      px: { xs: 2, md: 3 },
      pt: 1,
      position: 'sticky',
      top: 0,
      zIndex: 1100,
    }}
  >
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1.5,
        pb: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component="img"
          src="/app_icon.png"
          alt="App Icon"
          sx={{
            width: 34,
            height: 34,
            objectFit: 'contain',
            display: 'block',
          }}
        />
        <Box>
          <Typography variant="h6" sx={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            Electricity Demand Abnormality Predictor
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontWeight: 500, mt: 0.2 }}>
            Power Utility Decision Support
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
        <FormControl size="small" sx={{ minWidth: 235, width: { xs: '100%', sm: 'auto' } }}>
          <InputLabel id="episode-select-label" sx={{ fontSize: '0.8rem' }}>
            Go to an unusual period
          </InputLabel>
          <Select
            labelId="episode-select-label"
            value={selectedEpisodeId}
            label="Go to an unusual period"
            onChange={(event) => onEpisodeSelect(event.target.value)}
            sx={{ fontSize: '0.8rem', height: 34, backgroundColor: '#f8fafc' }}
          >
            {episodes.map((episode, index) => (
              <MenuItem key={episode.episode_id} value={episode.episode_id} sx={{ fontSize: '0.8rem' }}>
                Period {index + 1}: {new Date(episode.start_utc).toLocaleDateString()} ({episode.hour_count} hours)
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, backgroundColor: '#f1f5f9', px: 1.5, py: 0.65, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
          <Clock size={14} color="#007DD7" />
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }}>
            Viewing: {selectedTimestamp ? selectedTimestamp.replace('T', ' ').replace('Z', ' UTC') : 'No time selected'}
          </Typography>
        </Box>
      </Box>
    </Box>

    <Tabs
      value={currentTab}
      onChange={(_, value) => onTabChange(value)}
      variant="scrollable"
      scrollButtons={false}
      textColor="primary"
      indicatorColor="primary"
      sx={{
        minHeight: 36,
        '& .MuiTab-root': {
          minHeight: 36,
          py: 0.25,
          px: 1.75,
          fontSize: '0.8rem',
          fontWeight: 700,
          textTransform: 'none',
          color: '#64748b',
          '&.Mui-selected': {
            color: '#007DD7',
          },
        },
      }}
    >
      <Tab icon={<BarChart3 size={15} style={{ marginRight: 6 }} />} iconPosition="start" label="Current demand view" />
      <Tab icon={<ListFilter size={15} style={{ marginRight: 6 }} />} iconPosition="start" label="Unusual demand history" />
    </Tabs>
  </Box>
);
