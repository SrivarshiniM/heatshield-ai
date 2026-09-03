import { useState } from 'react';
import DataSourceBanner from '../components/common/DataSourceBanner';
import { Settings as SettingsIcon, Weight, Globe, Info, Save, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { RiskWeights, DEFAULT_RISK_WEIGHTS, ZoneWeatherStatus } from '../types';

interface SettingsProps {
  weights: RiskWeights;
  onWeightsChange: (w: RiskWeights) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastRefresh: Date | null;
  weatherStatus: Record<string, ZoneWeatherStatus>;
}

export default function Settings({
  weights, onWeightsChange,
  onRefresh, isRefreshing, lastRefresh, weatherStatus,
}: SettingsProps) {
  const [localWeights, setLocalWeights] = useState({ ...weights });
  const [saved, setSaved] = useState(false);

  const handleWeightChange = (key: keyof RiskWeights, value: number) => {
    setLocalWeights(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const saveWeights = () => {
    onWeightsChange(localWeights);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetWeights = () => {
    setLocalWeights({ ...DEFAULT_RISK_WEIGHTS });
    onWeightsChange({ ...DEFAULT_RISK_WEIGHTS });
    setSaved(false);
  };

  const weightLabels: Record<keyof RiskWeights, { label: string; description: string }> = {
    thermalConditions: { label: 'Thermal Conditions', description: 'Heat Index, WBGT, UTCI metrics' },
    humidity: { label: 'Humidity Impact', description: 'Relative humidity effect on evaporative cooling' },
    wind: { label: 'Wind Factor', description: 'Wind speed contribution to convective cooling' },
    solarExposure: { label: 'Solar Exposure', description: 'Solar radiation and UV index impact' },
    populationVulnerability: { label: 'Population Vulnerability', description: 'Demographics, healthcare access, acclimatization' },
  };

  // Compute API status
  const zoneStatuses = Object.values(weatherStatus);
  const liveZones = zoneStatuses.filter(s => s.status === 'live').length;
  const cachedZones = zoneStatuses.filter(s => s.status === 'cached').length;
  const demoZones = zoneStatuses.filter(s => s.status === 'demo').length;
  const unavailableZones = zoneStatuses.filter(s => s.status === 'unavailable').length;
  const loadingZones = zoneStatuses.filter(s => s.status === 'loading').length;
  const anyLive = liveZones > 0;
  const anyCached = cachedZones > 0;
  const anyDemo = demoZones > 0;

  // Overall banner mode: prefer live > cached > demo > loading > unavailable
  const settingsBannerMode = anyLive ? 'live' : anyCached ? 'cached' : anyDemo ? 'demo' : loadingZones > 0 ? 'loading' : 'unavailable';

  return (
    <div className="space-y-6">
      <DataSourceBanner mode={settingsBannerMode as 'live' | 'cached' | 'demo' | 'unavailable' | 'loading'} lastRefresh={lastRefresh} />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings & Configuration</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure risk model weights, data source, and application settings</p>
      </div>

      {/* Data Source Configuration */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-sky-600" />
          <h2 className="section-title">Weather Data Source</h2>
        </div>

        {/* API Status */}
        <div className={`rounded-lg p-4 mb-4 flex items-center gap-3 ${
          anyLive ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
        }`}>
          {anyLive
            ? <Wifi className="w-5 h-5 text-green-600" />
            : <WifiOff className="w-5 h-5 text-amber-600" />
          }
          <div className="flex-1">
            <div className={`text-sm font-semibold ${anyLive ? 'text-green-800' : anyCached ? 'text-blue-800' : anyDemo ? 'text-amber-800' : 'text-amber-800'}`}>
              Open-Meteo Forecast API: {anyLive ? 'Connected' : anyCached ? 'Cached' : anyDemo ? 'Demo Mode' : loadingZones > 0 ? 'Connecting…' : 'Unavailable'}
            </div>
            <div className="text-xs text-slate-500">
              {anyLive && `Live data for ${liveZones} zone(s). No API key required. Free & open-source.`}
              {anyCached && !anyLive && `Cached data for ${cachedZones} zone(s). API unavailable — using cached responses.`}
              {anyDemo && !anyLive && !anyCached && `Demo data for ${demoZones} zone(s). API unavailable and no cache — showing simulated data.`}
              {!anyLive && !anyCached && !anyDemo && 'Unable to reach Open-Meteo. Check your internet connection.'}
            </div>
          </div>
        </div>

        {/* Zone-level status */}
        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <div className="text-xs font-medium text-slate-500 mb-2">Zone Connection Status</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(weatherStatus).map(([zoneId, status]) => (
              <div key={zoneId} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${
                status.status === 'live' ? 'bg-green-50 text-green-700' :
                status.status === 'cached' ? 'bg-blue-50 text-blue-700' :
                status.status === 'demo' ? 'bg-amber-50 text-amber-700' :
                status.status === 'loading' ? 'bg-slate-100 text-slate-500' :
                'bg-red-50 text-red-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  status.status === 'live' ? 'bg-green-500' :
                  status.status === 'cached' ? 'bg-blue-500' :
                  status.status === 'demo' ? 'bg-amber-500' :
                  status.status === 'loading' ? 'bg-slate-400 animate-pulse' :
                  'bg-red-400'
                }`} />
                <span className="truncate">{zoneId}</span>
                {status.status === 'unavailable' && status.error && (
                  <span className="text-[10px] opacity-70 truncate">— {status.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Refresh Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing…' : 'Refresh Live Weather'}
          </button>
          {lastRefresh && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              Last refresh: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>

        <div className="mt-3 bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1">
          <p>• Data source: Open-Meteo Forecast API (free, no key required)</p>
          <p>• Each zone fails independently — one zone's error doesn't affect others</p>
          <p>• Successful responses are cached for 15 minutes to reduce API load</p>
          <p>• On network failure, stale cache is used if available</p>
          <p>• Demo data serves as a reliable fallback — always available for presentations</p>
        </div>
      </div>

      {/* Risk Model Weights */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Weight className="w-4 h-4 text-sky-600" />
          <h2 className="section-title">Risk Model Weights</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Adjust how each factor contributes to the overall HeatShield Risk Score.
          Higher values = more influence on the final score.
        </p>

        <div className="space-y-4">
          {(Object.entries(weightLabels) as [keyof RiskWeights, typeof weightLabels[keyof RiskWeights]][]).map(([key, info]) => (
            <div key={key} className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-slate-900">{info.label}</span>
                  <span className="text-xs text-slate-500 ml-2">— {info.description}</span>
                </div>
                <span className="text-sm font-bold text-sky-700">
                  {Math.round(localWeights[key] * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(localWeights[key] * 100)}
                onChange={(e) => handleWeightChange(key, parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={saveWeights} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> {saved ? '✓ Saved!' : 'Save Weights'}
          </button>
          <button onClick={resetWeights} className="btn-secondary">Reset to Defaults</button>
        </div>
      </div>

      {/* AI Configuration */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-sky-600" />
          <h2 className="section-title">AI Provider</h2>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="builtin">Built-in Rule Engine (No API Key)</option>
            <option value="openai">OpenAI (API Key Required)</option>
            <option value="anthropic">Anthropic (API Key Required)</option>
            <option value="ollama">Ollama (Local LLM)</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">
            The built-in rule engine provides recommendations without external API calls.
          </p>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-sky-600" />
          <h2 className="section-title">About HeatShield AI</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-700">
          <p><strong>Product:</strong> HeatShield AI — Extreme Heatwave Early Warning & Human Thermal Stress Intelligence Platform</p>
          <p><strong>Tagline:</strong> "From Heat Forecasts to Human Safety."</p>
          <p><strong>Problem Statement:</strong> Smart India Hackathon 2026</p>
          <p><strong>Core Innovation:</strong> Converting weather intelligence into human-impact intelligence.</p>
          <p><strong>Weather Data:</strong> Open-Meteo Forecast API (free, open-source, no API key required)</p>
          <p><strong>Pipeline:</strong> Forecast → Thermal Stress → Vulnerability → Hyperlocal Risk → Impact → Action</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
            <p className="text-xs text-amber-700">
              <strong>Disclaimer:</strong> This is a prototype for Smart India Hackathon 2026 demonstration purposes.
              It does not replace official IMD warnings, medical advice, or government directives.
              Weather data is sourced from Open-Meteo — not official meteorological observations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
