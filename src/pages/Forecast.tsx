// ============================================================
// HeatShield AI — Forecast & Early Warning Page
// Uses actual hourly forecast data with computed risk scores.
// ============================================================

import { useMemo } from 'react';
import { Zone, ForecastDay, ForecastHour, RISK_LEVELS, RiskLevel } from '../types';
import RiskBadge from '../components/common/RiskBadge';
import HeatTimeline from '../components/charts/HeatTimeline';
import EarlyWarning from '../components/common/EarlyWarning';
import DataSourceBanner from '../components/common/DataSourceBanner';
import { Clock, AlertTriangle, Thermometer, Droplets, Wind, Sun, Loader2, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface ForecastProps {
  zone: Zone | null;
  forecast: ForecastDay | null;
  dataMode: 'live' | 'cached' | 'demo' | 'unavailable';
}

function formatTime12(time24: string): string {
  const [h] = time24.split(':').map(Number);
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function getRiskTimelineSteps(hours: ForecastHour[]): { level: RiskLevel; label: string; time: string; score: number }[] {
  const steps: { level: RiskLevel; label: string; time: string; score: number }[] = [];
  let prevLevel: RiskLevel | null = null;

  for (const h of hours) {
    if (h.risk.level !== prevLevel) {
      const labelMap: Record<RiskLevel, string> = {
        low: 'Normal',
        moderate: 'Watch',
        high: 'Alert',
        extreme: 'Extreme Warning',
      };
      steps.push({ level: h.risk.level, label: labelMap[h.risk.level], time: formatTime12(h.time), score: h.risk.overall });
      prevLevel = h.risk.level;
    }
  }
  return steps;
}

function getRiskTrend(hours: ForecastHour[], idx: number): 'up' | 'down' | 'stable' {
  if (idx === 0) return 'stable';
  const diff = hours[idx].risk.overall - hours[idx - 1].risk.overall;
  if (diff > 2) return 'up';
  if (diff < -2) return 'down';
  return 'stable';
}

export default function Forecast({ zone, forecast, dataMode }: ForecastProps) {
  // Loading state
  if (!zone || !forecast) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Forecast & Early Warning</h1>
          <p className="text-sm text-slate-500 mt-0.5">24-hour heat risk prediction</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm font-medium">Waiting for live weather data…</p>
          <p className="text-xs text-slate-300 mt-1">This may take a few seconds on first load.</p>
        </div>
      </div>
    );
  }

  // Compute warning progression from actual hourly data
  const warningSteps = useMemo(() => getRiskTimelineSteps(forecast.hours), [forecast.hours]);

  // Find peak hour for detail display
  const peakHour = useMemo(() => {
    if (forecast.hours.length === 0) return null;
    return forecast.hours.reduce((worst, h) => h.risk.overall > worst.risk.overall ? h : worst, forecast.hours[0]);
  }, [forecast.hours]);

  // Count hours by risk level
  const riskCounts = useMemo(() => {
    const counts = { extreme: 0, high: 0, moderate: 0, low: 0 };
    for (const h of forecast.hours) {
      counts[h.risk.level]++;
    }
    return counts;
  }, [forecast.hours]);

  // Current hour index
  const now = new Date();
  const currentHourIdx = forecast.hours.findIndex(h => h.hour === now.getHours());

  return (
    <div className="space-y-6">
      {/* Data Mode Banner */}
      <DataSourceBanner mode={dataMode} />

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Forecast & Early Warning</h1>
        <p className="text-sm text-slate-500 mt-0.5">Next 24 hours — {zone.name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{forecast.date}</p>
      </div>

      {/* Early Warning Component */}
      <EarlyWarning forecast={forecast} zoneName={zone.name} dataMode={dataMode} />

      {/* Risk Hour Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['extreme', 'high', 'moderate', 'low'] as RiskLevel[]).map(level => (
          <div key={level} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <div className="text-2xl font-bold" style={{ color: RISK_LEVELS[level].color }}>
              {riskCounts[level]}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: RISK_LEVELS[level].color }}>
              {RISK_LEVELS[level].label} Hours
            </div>
          </div>
        ))}
      </div>

      {/* Warning Progression — from actual data */}
      <div className="card">
        <h3 className="section-title text-sm mb-4">Warning Progression</h3>
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {warningSteps.map((step, i) => {
            const Icon = step.level === 'extreme' || step.level === 'high' ? AlertTriangle : Clock;
            return (
              <div key={`${step.time}-${step.level}`} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center text-center px-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: RISK_LEVELS[step.level].color + '20' }}
                  >
                    {RISK_LEVELS[step.level].emoji}
                  </div>
                  <span className="text-[10px] font-semibold mt-1" style={{ color: RISK_LEVELS[step.level].color }}>
                    {step.label}
                  </span>
                  <span className="text-[10px] text-slate-500">{step.time}</span>
                  <span className="text-[10px] font-bold text-slate-700">{step.score}/100</span>
                </div>
                {i < warningSteps.length - 1 && (
                  <div className="w-8 h-px bg-slate-200 mx-1 mt-[-12px]" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Peak Danger Window — dynamic from data */}
      {peakHour && (
        <div className={`rounded-xl border-2 p-5 ${
          peakHour.risk.level === 'extreme' ? 'bg-red-50 border-red-200' :
          peakHour.risk.level === 'high' ? 'bg-orange-50 border-orange-200' :
          'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className={`w-5 h-5 ${
              peakHour.risk.level === 'extreme' ? 'text-red-600' :
              peakHour.risk.level === 'high' ? 'text-orange-600' : 'text-yellow-600'
            }`} />
            <h3 className={`text-sm font-bold ${
              peakHour.risk.level === 'extreme' ? 'text-red-800' :
              peakHour.risk.level === 'high' ? 'text-orange-800' : 'text-yellow-800'
            }`}>
              PEAK DANGER WINDOW
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
            <div>
              <span className="text-xs text-slate-500 font-medium">Location</span>
              <div className="font-bold text-slate-900">{zone.name}</div>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Peak Window</span>
              <div className="font-bold text-slate-900">{forecast.peakRiskWindow}</div>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Maximum Risk</span>
              <div className="font-bold" style={{ color: RISK_LEVELS[peakHour.risk.level].color }}>
                {peakHour.risk.overall}/100 — {RISK_LEVELS[peakHour.risk.level].label}
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Peak Hour Conditions</span>
              <div className="text-xs text-slate-700">
                {peakHour.weather.temperature}°C · {peakHour.weather.humidity}% RH · {peakHour.weather.windSpeed} m/s wind
              </div>
            </div>
          </div>
          {peakHour.risk.factors.length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Primary Risk Drivers at Peak</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {peakHour.risk.factors.slice(0, 3).map((f, i) => (
                  <span key={i} className="text-[10px] bg-white/80 border border-slate-200 rounded-full px-2 py-0.5 text-slate-600">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 24-Hour Heat Risk Timeline Chart */}
      <HeatTimeline hours={forecast.hours} peakWindow={forecast.peakRiskWindow} />

      {/* Hourly Risk Detail Table */}
      <div className="card">
        <h3 className="section-title text-sm mb-3">Hourly Risk Detail</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-xs font-semibold text-slate-500">Time</th>
                <th className="text-left py-2 text-xs font-semibold text-slate-500">Temp</th>
                <th className="text-left py-2 text-xs font-semibold text-slate-500">Humidity</th>
                <th className="text-left py-2 text-xs font-semibold text-slate-500">Wind</th>
                <th className="text-left py-2 text-xs font-semibold text-slate-500">Solar</th>
                <th className="text-left py-2 text-xs font-semibold text-slate-500">Heat Index</th>
                <th className="text-left py-2 text-xs font-semibold text-slate-500">WBGT</th>
                <th className="text-left py-2 text-xs font-semibold text-slate-500">Risk</th>
                <th className="text-left py-2 text-xs font-semibold text-slate-500">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {forecast.hours.map((h, idx) => {
                const trend = getRiskTrend(forecast.hours, idx);
                const isCurrent = h.hour === now.getHours();
                const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
                const trendColor = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-slate-400';

                return (
                  <tr key={h.hour} className={`${
                    h.risk.level === 'extreme' ? 'bg-red-50' :
                    h.risk.level === 'high' ? 'bg-orange-50/50' : ''
                  } ${isCurrent ? 'ring-2 ring-sky-300 ring-inset' : ''}`}>
                    <td className="py-2 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatTime12(h.time)}
                      {isCurrent && <span className="text-[9px] bg-sky-100 text-sky-700 px-1 rounded">NOW</span>}
                    </td>
                    <td className="py-2">
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-red-400" />
                        {h.weather.temperature}°C
                      </span>
                    </td>
                    <td className="py-2">
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-blue-400" />
                        {h.weather.humidity}%
                      </span>
                    </td>
                    <td className="py-2">
                      <span className="flex items-center gap-1">
                        <Wind className="w-3 h-3 text-slate-400" />
                        {h.weather.windSpeed} m/s
                      </span>
                    </td>
                    <td className="py-2">
                      <span className="flex items-center gap-1">
                        <Sun className="w-3 h-3 text-amber-400" />
                        {h.weather.solarRadiation} W/m²
                      </span>
                    </td>
                    <td className="py-2 font-medium">{h.thermalMetrics.heatIndex}°C</td>
                    <td className="py-2">{h.thermalMetrics.wbgt}°C</td>
                    <td className="py-2">
                      <div className="flex items-center gap-1.5">
                        <RiskBadge level={h.risk.level} size="sm" />
                        <span className="text-xs font-bold">{h.risk.overall}</span>
                      </div>
                    </td>
                    <td className="py-2">
                      <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-slate-500 leading-relaxed">
          {dataMode === 'demo'
            ? 'Demonstration Scenario — Simulated Forecast Data. Not real weather predictions.'
            : 'Forecast data from Open-Meteo API. Risk scores are HeatShield Prototype calculations — not official IMD warnings or medical forecasts.'}
        </p>
      </div>
    </div>
  );
}
