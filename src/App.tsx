// ============================================================
// HeatShield AI — App Root
// Fetches live weather from Open-Meteo, merges into zones,
// computes thermal metrics + risk scores. No demo/synthetic fallback.
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useMemo, useEffect, useCallback } from 'react';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import HeatMapPage from './pages/HeatMapPage';
import ThermalStress from './pages/ThermalStress';
import Forecast from './pages/Forecast';
import Vulnerability from './pages/Vulnerability';
import Government from './pages/Government';
import AIAdvisor from './pages/AIAdvisor';
import CitizenMode from './pages/CitizenMode';
import WorkerMode from './pages/WorkerMode';
import Alerts from './pages/Alerts';
import Transparency from './pages/Transparency';
import SettingsPage from './pages/Settings';
import Simulator from './pages/Simulator';
import { zoneMetadata, coolingCenters, hospitals, schools } from './data/demoData';
import { Zone, ZoneMetadata, ZoneWeatherStatus, RiskWeights, DEFAULT_RISK_WEIGHTS, hydrateZone } from './types';
import { calculateThermalMetrics } from './engine/thermal';
import { calculateRisk } from './engine/risk';
import { fetchAllZoneWeather, clearWeatherCache, ZoneWeatherResult } from './services/weatherClient';
import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  const [selectedZoneId, setSelectedZoneId] = useState(zoneMetadata[0].id);
  const [zones, setZones] = useState<Zone[]>([]);
  const [forecasts, setForecasts] = useState<Record<string, Zone['forecast']>>({});
  const [riskWeights, setRiskWeights] = useState<RiskWeights>({ ...DEFAULT_RISK_WEIGHTS });
  const [weatherStatus, setWeatherStatus] = useState<Record<string, ZoneWeatherStatus>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Hydrate a ZoneMetadata into a full Zone using live weather
  const hydrate = useCallback((meta: ZoneMetadata, result: ZoneWeatherResult): Zone => {
    const thermalMetrics = calculateThermalMetrics(result.weather);
    const risk = calculateRisk(result.weather, thermalMetrics, meta.vulnerability, riskWeights);
    return hydrateZone(meta, result.weather, thermalMetrics, risk);
  }, [riskWeights]);

  // Fetch live weather for all zones
  const fetchWeather = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);

    setWeatherStatus(prev => {
      const next = { ...prev };
      for (const meta of zoneMetadata) {
        if (!next[meta.id] || next[meta.id].status !== 'live') {
          next[meta.id] = { zoneId: meta.id, status: 'loading' };
        }
      }
      return next;
    });

    try {
      const results = await fetchAllZoneWeather(zoneMetadata);

      const newZones: Zone[] = [];
      const newForecasts: Record<string, Zone['forecast']> = {};
      const newStatus: Record<string, ZoneWeatherStatus> = {};

      for (const meta of zoneMetadata) {
        const result = results.get(meta.id);

        // All results are now ZoneWeatherResult (never throws, never errors)
        const zone = hydrate(meta, result);
        newZones.push(zone);
        newForecasts[meta.id] = result.forecast;
        newStatus[meta.id] = {
          zoneId: meta.id,
          status: result.dataMode,
          fetchedAt: result.fetchedAt,
          source: result.source,
        };
      }

      setZones(newZones);
      setForecasts(newForecasts);
      setWeatherStatus(newStatus);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('[App] Unexpected error fetching weather:', err);
      setWeatherStatus(prev => {
        const next = { ...prev };
        for (const meta of zoneMetadata) {
          next[meta.id] = { zoneId: meta.id, status: 'unavailable', error: 'Unexpected fetch error' };
        }
        return next;
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [hydrate]);

  // Initial fetch
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchWeather(), 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Re-hydrate zones when risk weights change
  useEffect(() => {
    if (zones.length === 0) return;
    // Re-fetch to recompute with new weights
    fetchWeather();
  }, [riskWeights]); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual refresh
  const handleRefresh = useCallback(() => {
    clearWeatherCache();
    fetchWeather(true);
  }, [fetchWeather]);

  // Determine overall data status
  const overallStatus = useMemo(() => {
    const statuses = Object.values(weatherStatus);
    if (statuses.length === 0) return 'loading' as const;
    if (statuses.every(s => s.status === 'loading')) return 'loading' as const;
    if (statuses.some(s => s.status === 'live')) return 'live' as const;
    if (statuses.some(s => s.status === 'cached')) return 'cached' as const;
    if (statuses.some(s => s.status === 'demo')) return 'demo' as const;
    return 'loading' as const;
  }, [weatherStatus]);

  // Determine banner mode for DataSourceBanner — pass through all states
  const bannerMode = overallStatus;

  const selectedZone = useMemo(
    () => zones.find(z => z.id === selectedZoneId) || null,
    [zones, selectedZoneId],
  );

  const selectedForecast = forecasts[selectedZoneId] || null;

  return (
    <BrowserRouter>
      <ErrorBoundary fallbackTitle="Application Error">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          element={
            <Layout
              selectedZone={selectedZoneId}
              onZoneChange={setSelectedZoneId}
              zones={zoneMetadata.map(z => ({ id: z.id, name: z.name }))}
              dataMode={bannerMode}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              lastRefresh={lastRefresh}
              weatherStatus={weatherStatus}
            />
          }
        >
          <Route path="/dashboard" element={
            <Dashboard
              zone={selectedZone}
              forecast={selectedForecast}
              allZones={zones}
              dataMode={bannerMode}
              lastRefresh={lastRefresh}
            />
          } />
          <Route
            path="/map"
            element={
              <HeatMapPage
                zones={zones}
                forecasts={forecasts}
                coolingCenters={coolingCenters}
                hospitals={hospitals}
                schools={schools}
                selectedZoneId={selectedZoneId}
                onZoneSelect={setSelectedZoneId}
                weatherStatus={weatherStatus}
                dataMode={bannerMode}
              />
            }
          />
          <Route path="/thermal" element={<ThermalStress zone={selectedZone} />} />
          <Route path="/forecast" element={<Forecast zone={selectedZone} forecast={selectedForecast} dataMode={bannerMode} />} />
          <Route path="/vulnerability" element={<Vulnerability zone={selectedZone} allZones={zones} />} />
          <Route path="/government" element={<Government zones={zones} selectedZone={selectedZone} selectedForecast={selectedForecast} coolingCenters={coolingCenters} dataMode={bannerMode} />} />
          <Route path="/ai-advisor" element={<AIAdvisor zone={selectedZone} allZones={zones} forecast={selectedForecast} />} />
          <Route path="/citizen" element={<CitizenMode zone={selectedZone} />} />
          <Route path="/worker" element={<WorkerMode zone={selectedZone} />} />
          <Route path="/alerts" element={<Alerts zones={zones} selectedZone={selectedZone} />} />
          <Route path="/simulator" element={<Simulator zone={selectedZone} riskWeights={riskWeights} />} />
          <Route path="/transparency" element={<Transparency />} />
          <Route path="/settings" element={
            <SettingsPage
              weights={riskWeights}
              onWeightsChange={setRiskWeights}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              lastRefresh={lastRefresh}
              weatherStatus={weatherStatus}
            />
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
