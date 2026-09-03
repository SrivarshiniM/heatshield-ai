import { Zone, RISK_LEVELS, ForecastDay } from '../types';
import { Thermometer, Droplets, Wind, Sun, Clock, AlertTriangle, Users, Building2, Loader2, WifiOff } from 'lucide-react';
import RiskBadge from '../components/common/RiskBadge';
import DataSourceBanner from '../components/common/DataSourceBanner';
import EarlyWarning from '../components/common/EarlyWarning';
import HeatTimeline from '../components/charts/HeatTimeline';
import RiskGauge from '../components/charts/RiskGauge';

interface DashboardProps {
  zone: Zone | null;
  forecast: ForecastDay | null;
  allZones: Zone[];
  dataMode: 'live' | 'cached' | 'demo' | 'unavailable';
  lastRefresh: Date | null;
}

export default function Dashboard({ zone, forecast, allZones, dataMode, lastRefresh }: DashboardProps) {
  // Loading state — no zone data yet
  if (!zone) {
    return (
      <div className="space-y-6">
        <DataSourceBanner mode={dataMode} lastRefresh={lastRefresh} />
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm font-medium">Fetching live weather data from Open-Meteo…</p>
          <p className="text-xs text-slate-300 mt-1">This may take a few seconds on first load.</p>
        </div>
      </div>
    );
  }

  const riskInfo = RISK_LEVELS[zone.risk.level];

  return (
    <div className="space-y-6">
      <DataSourceBanner mode={dataMode} lastRefresh={lastRefresh} />

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Human-Centric Heat Intelligence — {zone.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            {lastRefresh ? `Updated: ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Fetching…'}
          </div>
        </div>
      </div>

      {/* Top Row: Risk Card + Gauge + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Risk Card */}
        <div className={`lg:col-span-2 rounded-xl border-2 p-6 ${riskInfo.bgColor} ${riskInfo.borderColor}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">Human Heat Risk</div>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl font-bold text-slate-900">{zone.risk.overall}</span>
                <span className="text-xl text-slate-500">/100</span>
              </div>
              <RiskBadge level={zone.risk.level} size="lg" />
            </div>
            <div className="relative">
              <RiskGauge score={zone.risk.overall} level={zone.risk.level} size={140} />
            </div>
          </div>

          {/* Weather metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-white/70 rounded-lg p-3 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-red-500" />
              <div>
                <div className="text-xs text-slate-500">Temperature</div>
                <div className="text-sm font-bold">{zone.weather.temperature}°C</div>
              </div>
            </div>
            <div className="bg-white/70 rounded-lg p-3 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-xs text-slate-500">Humidity</div>
                <div className="text-sm font-bold">{zone.weather.humidity}%</div>
              </div>
            </div>
            <div className="bg-white/70 rounded-lg p-3 flex items-center gap-2">
              <Wind className="w-4 h-4 text-slate-500" />
              <div>
                <div className="text-xs text-slate-500">Wind</div>
                <div className="text-sm font-bold">{zone.weather.windSpeed} m/s</div>
              </div>
            </div>
            <div className="bg-white/70 rounded-lg p-3 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <div>
                <div className="text-xs text-slate-500">Solar Load</div>
                <div className="text-sm font-bold">
                  {zone.weather.solarRadiation >= 600 ? 'Very High' : zone.weather.solarRadiation >= 400 ? 'High' : 'Moderate'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          {forecast && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium text-slate-500">Peak Risk Window</span>
              </div>
              <div className="text-sm font-bold text-slate-900">{forecast.peakRiskWindow}</div>
              <div className="text-[10px] text-slate-400 mt-1">
                {forecast.peakRiskLevel === 'extreme' ? '4+ hour extreme danger period' : 'Elevated risk period'}
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-slate-500">Vulnerable Population</span>
            </div>
            <div className="text-sm font-bold text-slate-900">{zone.vulnerability.populationDensity.toLocaleString()} people/km²</div>
            <div className="text-[10px] text-slate-400 mt-1">{zone.vulnerability.elderlyPercentage}% elderly · {zone.vulnerability.outdoorWorkerExposure}% outdoor workers</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-sky-500" />
              <span className="text-xs font-medium text-slate-500">Population at Risk</span>
            </div>
            <div className="text-sm font-bold text-slate-900">{zone.population.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 mt-1">in {zone.name}</div>
          </div>
        </div>
      </div>

      {/* Why This Risk? — Weighted Contribution Breakdown */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <h3 className="section-title text-sm">Why this risk?</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          How the HeatShield Prototype Risk Score is calculated. Each factor's weighted contribution is shown below — they sum exactly to the final score.
        </p>

        <div className="space-y-3">
          {/* Thermal Conditions — largest contributor */}
          <div className="flex items-center gap-3">
            <div className="w-32">
              <span className="text-xs font-semibold text-slate-700">Thermal</span>
              <span className="text-[10px] text-slate-400 block">×0.40 weight</span>
            </div>
            <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
              <div className="bg-red-500 h-full rounded-full transition-all duration-700" style={{ width: `${zone.risk.thermalContribution * 100 / 40}%` }} />
            </div>
            <span className="text-sm font-bold text-slate-900 w-10 text-right">{zone.risk.thermalContribution}</span>
          </div>

          {/* Humidity Impact */}
          <div className="flex items-center gap-3">
            <div className="w-32">
              <span className="text-xs font-semibold text-slate-700">Humidity</span>
              <span className="text-[10px] text-slate-400 block">×0.20 weight</span>
            </div>
            <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full transition-all duration-700" style={{ width: `${zone.risk.humidityContribution * 100 / 20}%` }} />
            </div>
            <span className="text-sm font-bold text-slate-900 w-10 text-right">{zone.risk.humidityContribution}</span>
          </div>

          {/* Wind Factor */}
          <div className="flex items-center gap-3">
            <div className="w-32">
              <span className="text-xs font-semibold text-slate-700">Wind</span>
              <span className="text-[10px] text-slate-400 block">×0.10 weight</span>
            </div>
            <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
              <div className="bg-slate-500 h-full rounded-full transition-all duration-700" style={{ width: `${zone.risk.windContribution * 100 / 10}%` }} />
            </div>
            <span className="text-sm font-bold text-slate-900 w-10 text-right">{zone.risk.windContribution}</span>
          </div>

          {/* Solar Exposure */}
          <div className="flex items-center gap-3">
            <div className="w-32">
              <span className="text-xs font-semibold text-slate-700">Solar</span>
              <span className="text-[10px] text-slate-400 block">×0.15 weight</span>
            </div>
            <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-700" style={{ width: `${zone.risk.solarContribution * 100 / 15}%` }} />
            </div>
            <span className="text-sm font-bold text-slate-900 w-10 text-right">{zone.risk.solarContribution}</span>
          </div>

          {/* Vulnerability */}
          <div className="flex items-center gap-3">
            <div className="w-32">
              <span className="text-xs font-semibold text-slate-700">Vulnerability</span>
              <span className="text-[10px] text-slate-400 block">×0.15 weight</span>
            </div>
            <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full transition-all duration-700" style={{ width: `${zone.risk.vulnContribution * 100 / 15}%` }} />
            </div>
            <span className="text-sm font-bold text-slate-900 w-10 text-right">{zone.risk.vulnContribution}</span>
          </div>
        </div>

        {/* Total line — sum of all contributions */}
        <div className="mt-4 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">HeatShield Prototype Risk Score</span>
              <RiskBadge level={zone.risk.level} size="sm" />
            </div>
            <span className="text-lg font-bold text-slate-900">{zone.risk.overall}<span className="text-sm text-slate-400 font-normal">/100</span></span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {zone.risk.thermalContribution} + {zone.risk.humidityContribution} + {zone.risk.windContribution} + {zone.risk.solarContribution} + {zone.risk.vulnContribution} = {zone.risk.overall}
          </div>
        </div>

        <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
          HeatShield Prototype Risk Score is an application-level decision-support model combining thermal hazard, exposure and vulnerability. It is not an internationally standardized clinical or meteorological index.
        </p>
      </div>

      {/* Contributing Factors */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <h3 className="section-title text-sm">Contributing Factors</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {zone.risk.factors.map((factor, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>{factor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zone Overview */}
      {allZones.length > 0 && (
        <div className="card">
          <h3 className="section-title text-sm mb-3">Zone Risk Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {allZones.map(z => (
              <div
                key={z.id}
                className={`rounded-lg p-3 border cursor-pointer transition-all ${
                  z.id === zone.id
                    ? 'border-sky-400 bg-sky-50 ring-1 ring-sky-300'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-medium text-slate-700 truncate">{z.name}</div>
                <div className="text-lg font-bold mt-1" style={{ color: RISK_LEVELS[z.risk.level].color }}>
                  {z.risk.overall}
                </div>
                <RiskBadge level={z.risk.level} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Early Warning Summary */}
      {forecast && (
        <EarlyWarning forecast={forecast} zoneName={zone.name} dataMode={dataMode} />
      )}

      {/* 24-Hour Timeline */}
      {forecast && <HeatTimeline hours={forecast.hours} peakWindow={forecast.peakRiskWindow} />}
    </div>
  );
}
