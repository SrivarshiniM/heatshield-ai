// ============================================================
// HeatShield AI — Interactive Decision Map
// Answers: "WHICH LOCALITIES ARE AT RISK, WHY, AND WHAT ACTION?"
// ============================================================

import { useState, useMemo } from 'react';
import HeatMap from '../components/map/HeatMap';
import { Zone, CoolingCenter, Hospital, ForecastDay, RISK_LEVELS, ZoneWeatherStatus, RiskLevel } from '../types';
import RiskBadge from '../components/common/RiskBadge';
import { analyzeRiskDrivers } from '../engine/ai';
import {
  Eye, EyeOff, Layers, Loader2, MapPin, AlertTriangle, Clock,
  ChevronRight, Info, Zap, ArrowUp, Target, Shield, Users, HardHat,
  Building2, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';

interface HeatMapPageProps {
  zones: Zone[];
  forecasts: Record<string, ForecastDay>;
  coolingCenters: CoolingCenter[];
  hospitals: Hospital[];
  schools: { id: string; name: string; lat: number; lng: number }[];
  selectedZoneId: string;
  onZoneSelect: (zoneId: string) => void;
  weatherStatus: Record<string, ZoneWeatherStatus>;
  dataMode: 'live' | 'cached' | 'demo' | 'unavailable' | 'loading';
}

function formatTime12(time24: string): string {
  const [h] = time24.split(':').map(Number);
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function getPeakFromForecast(hours: ForecastDay['hours']): { start: string; end: string; maxScore: number; maxLevel: RiskLevel } | null {
  if (!hours || hours.length === 0) return null;
  let bestStart = 0, bestLen = 0, curStart = -1, curLen = 0;
  for (let i = 0; i < hours.length; i++) {
    if (hours[i].risk.level === 'high' || hours[i].risk.level === 'extreme') {
      if (curStart < 0) curStart = i;
      curLen++;
      if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
    } else { curStart = -1; curLen = 0; }
  }
  if (bestLen === 0) return null;
  const peakHours = hours.slice(bestStart, bestStart + bestLen);
  const maxHour = peakHours.reduce((w, h) => h.risk.overall > w.risk.overall ? h : w, peakHours[0]);
  return {
    start: peakHours[0].time,
    end: peakHours[peakHours.length - 1].time,
    maxScore: maxHour.risk.overall,
    maxLevel: maxHour.risk.level,
  };
}

function getTopRecommendation(level: RiskLevel): string {
  switch (level) {
    case 'extreme': return 'Declare heat emergency. Activate all cooling centers. Suspend outdoor work during peak hours.';
    case 'high': return 'Activate cooling centers. Issue mandatory heat advisory. Reduce outdoor work.';
    case 'moderate': return 'Issue public heat advisory. Prepare cooling centers. Monitor vulnerable groups.';
    default: return 'Continue routine monitoring. Ensure cooling spaces remain operational.';
  }
}

function getRiskViewLabel(view: 'current' | 'peak'): string {
  return view === 'current' ? 'Current Risk' : 'Next 24-Hour Peak Risk';
}

export default function HeatMapPage({
  zones, forecasts, coolingCenters, hospitals, schools,
  selectedZoneId, onZoneSelect, weatherStatus, dataMode,
}: HeatMapPageProps) {
  const [layers, setLayers] = useState({
    riskZones: true,
    hospitals: true,
    coolingCenters: true,
    schools: true,
    outdoorWorkers: false,
  });
  const [riskView, setRiskView] = useState<'current' | 'peak'>('current');

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedZone = zones.find(z => z.id === selectedZoneId);

  // Get forecast for selected zone
  const selectedForecast = selectedZone ? forecasts[selectedZoneId] : null;

  // Analyze drivers for selected zone
  const analysis = useMemo(() => {
    if (!selectedZone) return null;
    const forecastHours = selectedForecast?.hours || [];
    return analyzeRiskDrivers(selectedZone, forecastHours);
  }, [selectedZone, selectedForecast]);

  // Peak info for selected zone
  const peak = useMemo(() => {
    if (!selectedForecast) return null;
    return getPeakFromForecast(selectedForecast.hours);
  }, [selectedForecast]);

  // Sorted zones for ranking
  const rankedZones = useMemo(() => {
    return [...zones].sort((a, b) => b.risk.overall - a.risk.overall);
  }, [zones]);

  const layerToggles = [
    { key: 'riskZones' as const, label: 'Risk Zones', color: '#ef4444' },
    { key: 'hospitals' as const, label: 'Hospitals', color: '#dc2626' },
    { key: 'coolingCenters' as const, label: 'Cooling Centers', color: '#0ea5e9' },
    { key: 'schools' as const, label: 'Schools', color: '#7c3aed' },
  ];

  // Data source label
  const dataLabel = dataMode === 'demo' ? 'Demo / Simulated Data' :
    dataMode === 'cached' ? 'Cached Weather Data' :
    dataMode === 'live' ? 'Live Forecast Data' : 'Loading…';

  // Loading state
  if (zones.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Heat Risk Decision Map</h1>
          <p className="text-sm text-slate-500 mt-0.5">Interactive risk visualization — Vellore District</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm font-medium">Fetching live weather for map zones…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Heat Risk Decision Map</h1>
          <p className="text-sm text-slate-500 mt-0.5">Which localities are at risk, why, and what action is required</p>
        </div>
        <div className="text-xs text-slate-400">{dataLabel}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="space-y-4">
          {/* Layer Controls */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-semibold">Map Layers</h3>
            </div>
            <div className="space-y-2">
              {layerToggles.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => toggleLayer(key)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </span>
                  {layers[key]
                    ? <Eye className="w-3.5 h-3.5 text-sky-600" />
                    : <EyeOff className="w-3.5 h-3.5 text-slate-300" />
                  }
                </button>
              ))}
            </div>
          </div>

          {/* Risk View Toggle */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Risk View</h3>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {(['current', 'peak'] as const).map(view => (
                <button
                  key={view}
                  onClick={() => setRiskView(view)}
                  className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
                    riskView === view
                      ? 'bg-white text-sky-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {view === 'current' ? 'Current' : '24h Peak'}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-slate-400 mt-2">
              {riskView === 'current' ? 'Showing current calculated risk scores' : 'Showing peak risk from forecast timeline'}
            </div>
          </div>

          {/* Legend */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Risk Legend</h3>
            <div className="space-y-2">
              {Object.values(RISK_LEVELS).map(info => (
                <div key={info.level} className="flex items-center gap-2 text-sm">
                  <span className="text-base">{info.emoji}</span>
                  <span className="font-medium" style={{ color: info.color }}>{info.label}</span>
                  <span className="text-[10px] text-slate-400 ml-auto">{info.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Locality Ranking */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Locality Ranking</h3>
            <div className="text-[10px] text-slate-400 mb-2">{getRiskViewLabel(riskView)}</div>
            <div className="space-y-1.5">
              {rankedZones.map((z, i) => (
                <button
                  key={z.id}
                  onClick={() => onZoneSelect(z.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                    z.id === selectedZoneId
                      ? 'bg-sky-50 border border-sky-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-400 w-4">#{i + 1}</span>
                  <span className="text-xs font-medium text-slate-700 flex-1 truncate">{z.name}</span>
                  <span className="text-xs font-bold" style={{ color: RISK_LEVELS[z.risk.level].color }}>
                    {z.risk.overall}
                  </span>
                  <RiskBadge level={z.risk.level} size="sm" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Map + Detail Panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Map */}
          <HeatMap
            zones={zones}
            coolingCenters={coolingCenters}
            hospitals={hospitals}
            schools={schools}
            selectedZoneId={selectedZoneId}
            onZoneSelect={onZoneSelect}
            layers={layers}
          />

          {/* Selected Zone Detail Panel */}
          {selectedZone && analysis && (
            <div className="card">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-sky-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{selectedZone.name}</h3>
                    <div className="text-xs text-slate-500">{selectedZone.type} zone · ~{selectedZone.population.toLocaleString()} people</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: RISK_LEVELS[selectedZone.risk.level].color }}>
                      {selectedZone.risk.overall}<span className="text-sm text-slate-400 font-normal">/100</span>
                    </div>
                    <RiskBadge level={selectedZone.risk.level} size="md" />
                  </div>
                </div>
              </div>

              {/* Data Source */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  dataMode === 'live' ? 'bg-green-100 text-green-700' :
                  dataMode === 'cached' ? 'bg-blue-100 text-blue-700' :
                  dataMode === 'demo' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {dataLabel}
                </span>
              </div>

              {/* Risk Explanation */}
              <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-200">
                <p className="text-sm text-slate-700 leading-relaxed">{analysis.riskExplanation}</p>
              </div>

              {/* Top 3 Drivers */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-sky-600" />
                  <h4 className="text-sm font-semibold text-slate-800">Main Risk Drivers</h4>
                </div>
                <div className="space-y-2">
                  {analysis.top3.map((driver, idx) => (
                    <div key={driver.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span>{driver.emoji}</span>
                          <span className="text-xs font-semibold text-slate-700">{driver.name}</span>
                          <span className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded ${
                            driver.contributionLevel === 'VERY HIGH' ? 'bg-red-100 text-red-700' :
                            driver.contributionLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                            driver.contributionLevel === 'MODERATEATE' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {driver.contributionLevel}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{driver.value} — {driver.contribution} pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peak Danger Window */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <h4 className="text-sm font-semibold text-slate-800">Peak Danger Time</h4>
                </div>
                {peak ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-orange-800">
                        {formatTime12(peak.start)} – {formatTime12(peak.end)}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: RISK_LEVELS[peak.maxLevel].color + '20', color: RISK_LEVELS[peak.maxLevel].color }}>
                        Max: {peak.maxScore}/100 ({RISK_LEVELS[peak.maxLevel].label})
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">No elevated risk period in forecast</div>
                )}
              </div>

              {/* Recommended Action */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-sky-600" />
                  <h4 className="text-sm font-semibold text-slate-800">Recommended Action</h4>
                </div>
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                  <p className="text-sm text-sky-800">{getTopRecommendation(selectedZone.risk.level)}</p>
                </div>
              </div>

              {/* Weather Conditions */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: '🌡', label: 'Temp', value: `${selectedZone.weather.temperature}°C` },
                  { icon: '💧', label: 'Humidity', value: `${selectedZone.weather.humidity}%` },
                  { icon: '💨', label: 'Wind', value: `${selectedZone.weather.windSpeed} m/s` },
                  { icon: '☀️', label: 'Solar', value: `${selectedZone.weather.solarRadiation} W/m²` },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 rounded-lg p-2 text-center border border-slate-200">
                    <div className="text-sm">{item.icon}</div>
                    <div className="text-[10px] text-slate-400">{item.label}</div>
                    <div className="text-xs font-bold text-slate-700">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Vulnerability Summary */}
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedZone.vulnerability.outdoorWorkerExposure >= 40 && (
                  <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    👷 {selectedZone.vulnerability.outdoorWorkerExposure}% outdoor workers
                  </span>
                )}
                {selectedZone.vulnerability.elderlyPercentage >= 10 && (
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    👥 {selectedZone.vulnerability.elderlyPercentage}% elderly
                  </span>
                )}
                {selectedZone.vulnerability.healthcareAccessibility === 'low' && (
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    🏥 Limited healthcare
                  </span>
                )}
                {selectedZone.vulnerability.coolingCenterAccess === 'low' && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    ❄️ Limited cooling access
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Zone Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {zones.map(z => (
              <button
                key={z.id}
                onClick={() => onZoneSelect(z.id)}
                className={`text-left rounded-lg p-3 border transition-all ${
                  z.id === selectedZoneId
                    ? 'border-sky-400 bg-sky-50 ring-1 ring-sky-300'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-medium text-slate-700 truncate">{z.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-lg font-bold" style={{ color: RISK_LEVELS[z.risk.level].color }}>
                    {z.risk.overall}
                  </span>
                  <RiskBadge level={z.risk.level} size="sm" />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  🌡 {z.weather.temperature}°C · 💧 {z.weather.humidity}%
                </div>
                {weatherStatus[z.id]?.status === 'demo' && (
                  <div className="text-[9px] text-amber-500 mt-0.5">⚠ Demo Data</div>
                )}
                {weatherStatus[z.id]?.status === 'cached' && (
                  <div className="text-[9px] text-blue-500 mt-0.5">↻ Cached</div>
                )}
              </button>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-slate-500 leading-relaxed">
              HeatShield Decision-Support Map — risk scores are prototype calculations for decision support.
              Not official IMD warnings or medical forecasts. Always follow official guidance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
