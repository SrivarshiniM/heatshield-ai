// ============================================================
// HeatShield AI — Explainable Heat Risk Advisor
// Answers: "WHY IS THIS LOCALITY AT THIS RISK LEVEL?"
// and "WHAT FACTORS ARE DRIVING THE RISK?"
// ============================================================

import { useMemo } from 'react';
import { Zone, ForecastDay, RISK_LEVELS } from '../types';
import RiskBadge from '../components/common/RiskBadge';
import { analyzeRiskDrivers, RiskDriver } from '../engine/ai';
import {
  Brain, Users, HardHat, Building2, Loader2, ArrowUp, ArrowDown,
  Minus, Info, ChevronRight, AlertTriangle, TrendingUp, TrendingDown,
  Activity, Target, Shield,
} from 'lucide-react';

interface AIAdvisorProps {
  zone: Zone | null;
  allZones: Zone[];
  forecast: ForecastDay | null;
}

function ContributionBar({ level }: { level: string }) {
  const width = level === 'VERY HIGH' ? '100%' : level === 'HIGH' ? '65%' : level === 'MODERATEATE' ? '35%' : '15%';
  const color = level === 'VERY HIGH' ? 'bg-red-500' : level === 'HIGH' ? 'bg-orange-500' : level === 'MODERATEATE' ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width }} />
    </div>
  );
}

export default function AIAdvisor({ zone, allZones, forecast }: AIAdvisorProps) {
  // Analyze drivers when zone changes
  const analysis = useMemo(() => {
    if (!zone) return null;
    const forecastHours = forecast?.hours || [];
    return analyzeRiskDrivers(zone, forecastHours);
  }, [zone, forecast]);

  // Loading state
  if (!zone || !analysis) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Heat Risk Advisor</h1>
          <p className="text-sm text-slate-500 mt-0.5">Understanding why this locality is at risk</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm font-medium">Waiting for weather data…</p>
        </div>
      </div>
    );
  }

  const r = zone.risk;
  const w = zone.weather;
  const t = zone.thermalMetrics;
  const v = zone.vulnerability;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Heat Risk Advisor</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Why is {zone.name} at {r.level.toUpperCase()} risk? — {zone.name}
        </p>
      </div>

      {/* Risk Summary Card */}
      <div className={`rounded-xl border-2 p-5 ${
        r.level === 'extreme' ? 'bg-red-50 border-red-200' :
        r.level === 'high' ? 'bg-orange-50 border-orange-200' :
        r.level === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
        'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Brain className={`w-5 h-5 ${r.level === 'extreme' ? 'text-red-600' : r.level === 'high' ? 'text-orange-600' : r.level === 'moderate' ? 'text-yellow-600' : 'text-green-600'}`} />
            <h3 className={`text-sm font-bold ${r.level === 'extreme' ? 'text-red-800' : r.level === 'high' ? 'text-orange-800' : r.level === 'moderate' ? 'text-yellow-800' : 'text-green-800'}`}>
              WHY IS THIS LOCALITY AT RISK?
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ color: RISK_LEVELS[r.level].color }}>{r.overall}</span>
            <span className="text-sm text-slate-500">/100</span>
            <RiskBadge level={r.level} size="md" />
          </div>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{analysis.riskExplanation}</p>
      </div>

      {/* Top 3 Drivers */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-sky-600" />
          <h3 className="section-title text-sm">Top 3 Risk Drivers</h3>
        </div>
        <div className="space-y-3">
          {analysis.top3.map((driver, idx) => (
            <div key={driver.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{driver.emoji}</span>
                  <span className="text-sm font-semibold text-slate-800">{driver.name}</span>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    driver.contributionLevel === 'VERY HIGH' ? 'bg-red-100 text-red-700' :
                    driver.contributionLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    driver.contributionLevel === 'MODERATEATE' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {driver.contributionLevel}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-1">{driver.value}</div>
                <ContributionBar level={driver.contributionLevel} />
                <div className="text-[11px] text-slate-600 mt-2 leading-relaxed">{driver.explanation}</div>
                <div className="mt-2 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-sky-500 mt-0.5 flex-shrink-0" />
                  <span className="text-[11px] text-sky-700 font-medium">{driver.actionImplication}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-slate-700">{driver.contribution}</div>
                <div className="text-[10px] text-slate-400">pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All 5 Drivers Detail */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-sky-600" />
          <h3 className="section-title text-sm">All Risk Drivers</h3>
        </div>
        <div className="space-y-4">
          {analysis.drivers.map(driver => (
            <div key={driver.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{driver.emoji}</span>
                  <span className="text-sm font-semibold text-slate-800">{driver.name}</span>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    driver.contributionLevel === 'VERY HIGH' ? 'bg-red-100 text-red-700' :
                    driver.contributionLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    driver.contributionLevel === 'MODERATEATE' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {driver.contributionLevel}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-700">{driver.contribution} pts</span>
              </div>
              <div className="text-xs text-slate-500 mb-1">{driver.value}</div>
              <ContributionBar level={driver.contributionLevel} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-700">Why it matters: </span>{driver.explanation}
                </div>
                <div className="text-[11px] text-sky-700 leading-relaxed">
                  <span className="font-semibold text-sky-800">Action: </span>{driver.actionImplication}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast Risk Change */}
      {analysis.forecastChange.exists && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            {analysis.forecastChange.direction === 'rising' ? (
              <TrendingUp className="w-4 h-4 text-red-600" />
            ) : analysis.forecastChange.direction === 'falling' ? (
              <TrendingDown className="w-4 h-4 text-green-600" />
            ) : (
              <Minus className="w-4 h-4 text-slate-500" />
            )}
            <h3 className="section-title text-sm">
              {analysis.forecastChange.direction === 'rising' ? 'Why Is Risk Expected to Rise?' :
               analysis.forecastChange.direction === 'falling' ? 'Why Is Risk Expected to Fall?' :
               'Forecast Risk Stability'}
            </h3>
          </div>

          <p className="text-sm text-slate-700 mb-3">{analysis.forecastChange.explanation}</p>

          {analysis.forecastChange.changes.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {analysis.forecastChange.changes.map(change => (
                <div key={change.name} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">{change.name}</span>
                  <span className="text-xs text-slate-500">{change.from}</span>
                  {change.direction === 'up' ? (
                    <ArrowUp className="w-3 h-3 text-red-500" />
                  ) : change.direction === 'down' ? (
                    <ArrowDown className="w-3 h-3 text-green-500" />
                  ) : (
                    <Minus className="w-3 h-3 text-slate-400" />
                  )}
                  <span className="text-xs font-bold text-slate-800">{change.to}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Data Summary */}
      <div className="card">
        <h3 className="section-title text-sm mb-3">Current Conditions Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Temperature', value: `${w.temperature}°C`, sub: `Heat Index: ${t.heatIndex}°C` },
            { label: 'Humidity', value: `${w.humidity}%`, sub: `WBGT: ${t.wbgt}°C` },
            { label: 'Wind', value: `${w.windSpeed} m/s`, sub: `UTCI: ${t.utcI}°C` },
            { label: 'Solar', value: `${w.solarRadiation} W/m²`, sub: `UV: ${w.uvIndex}` },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{item.label}</div>
              <div className="text-lg font-bold text-slate-900">{item.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-slate-500 leading-relaxed">
          HeatShield explanations are derived from the prototype's risk and thermal model and are intended for decision support.
          Not a certified medical AI or official meteorological warning system. Always follow official IMD and local authority guidance.
        </p>
      </div>
    </div>
  );
}
