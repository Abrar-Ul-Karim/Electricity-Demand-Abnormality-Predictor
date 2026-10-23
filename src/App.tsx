import React, { useState, useMemo } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  Typography,
} from '@mui/material';
import { theme } from './theme';
import datasetRaw from './data/app_dataset.json';
import { AppDataset, AbnormalEvent, TimelinePoint } from './types';
import { Header } from './components/Header';
import { DemandOverviewCard } from './components/DemandOverviewCard';
import { DemandForecastChart } from './components/DemandForecastChart';
import { ExplanationSection } from './components/ExplanationSection';
import { FeatureDetailsTable } from './components/FeatureDetailsTable';
import { AbnormalHistoryTable } from './components/AbnormalHistoryTable';
import { EventDrawer } from './components/EventDrawer';

const dataset = datasetRaw as unknown as AppDataset;

export const App: React.FC = () => {
  // Default to the first major severe abnormal event: 2024-01-14T17:00:00Z
  const initialTimestamp = '2024-01-14T17:00:00Z';

  const [currentTab, setCurrentTab] = useState(0);
  const [selectedTimestamp, setSelectedTimestamp] = useState<string>(initialTimestamp);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>('ERCOT_TEST_EP_0001');
  const [chartWindow, setChartWindow] = useState<'episode' | 'all'>('episode');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerEventId, setDrawerEventId] = useState<string | null>(null);

  // Selected event lookup
  const currentEvent: AbnormalEvent | null = useMemo(() => {
    // Check if selected timestamp maps to an abnormal event
    const eventId = dataset.timestamp_to_event[selectedTimestamp];
    if (eventId && dataset.events[eventId]) {
      return dataset.events[eventId];
    }
    // Or if timestamp itself is an eventId
    if (dataset.events[selectedTimestamp]) {
      return dataset.events[selectedTimestamp];
    }
    return null;
  }, [selectedTimestamp]);

  // Selected timeline point lookup
  const currentTimelinePoint: TimelinePoint | null = useMemo(() => {
    return dataset.timeline.find((p) => p.timestamp_utc === selectedTimestamp) || null;
  }, [selectedTimestamp]);

  // Event for drawer
  const drawerEvent: AbnormalEvent | null = useMemo(() => {
    if (!drawerEventId) return null;
    return dataset.events[drawerEventId] || null;
  }, [drawerEventId]);

  // Handler for jumping to episode
  const handleEpisodeSelect = (episodeId: string) => {
    setSelectedEpisodeId(episodeId);
    const episode = dataset.episodes.find((e) => e.episode_id === episodeId);
    if (episode) {
      setSelectedTimestamp(episode.start_utc);
    }
  };

  // Handler for clicking any chart point or history item
  const handleTimestampSelect = (timestamp: string) => {
    setSelectedTimestamp(timestamp);
  };

  // Handler for inspecting event in drawer
  const handleInspectEvent = (eventId: string) => {
    setDrawerEventId(eventId);
    setDrawerOpen(true);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', pb: 2.5, overflowX: 'hidden' }}>
        {/* Navigation & Status Header */}
        <Header
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          selectedTimestamp={selectedTimestamp}
          episodes={dataset.episodes}
          selectedEpisodeId={selectedEpisodeId}
          onEpisodeSelect={handleEpisodeSelect}
        />

        {/* Main Body Container */}
        <Container maxWidth="xl" sx={{ pt: 1.5, px: { xs: 1.25, sm: 2, md: 2.5 } }}>
          {/* TAB 0: DEMAND OVERVIEW & FORECAST DASHBOARD */}
          {currentTab === 0 && (
            <Box>
              {/* SECTION 1: DEMAND OVERVIEW */}
              <DemandOverviewCard
                event={currentEvent}
                timelinePoint={currentTimelinePoint}
              />

              {/* SECTION 2: DEMAND CHART */}
              <DemandForecastChart
                timeline={dataset.timeline}
                selectedTimestamp={selectedTimestamp}
                onPointClick={handleTimestampSelect}
                selectedWindow={chartWindow}
                onWindowChange={setChartWindow}
              />

              {/* SECTION 3 & 4: WHY IS DEMAND ABNORMAL? & OPERATOR EXPLANATION */}
              <ExplanationSection event={currentEvent} />

              {/* SECTION 5: DETAILED EXPLANATION & FEATURE TABLE */}
              <FeatureDetailsTable event={currentEvent} />
            </Box>
          )}

          {/* TAB 1: ABNORMAL EVENTS & HISTORY (363 EVENTS) */}
          {currentTab === 1 && (
            <AbnormalHistoryTable
              history={dataset.abnormal_history}
              episodes={dataset.episodes}
              onInspectEvent={handleInspectEvent}
              onSelectEvent={(ts) => {
                handleTimestampSelect(ts);
                setCurrentTab(0);
              }}
            />
          )}
        </Container>

        {/* Interactive MUI Drawer for Deep-Dive Inspection */}
        <EventDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          event={drawerEvent}
          onSelectForConsole={(ts) => {
            handleTimestampSelect(ts);
            setCurrentTab(0);
          }}
        />

        {/* Minimal Footer */}
        <Box
          sx={{
            textAlign: 'center',
            py: 2,
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            mt: 4,
          }}
        >
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
            Grid Demand Guide • Shows saved ERCOT test-period forecasts from 2024–2025
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            For operator support only • Always follow approved control-room rules
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;
