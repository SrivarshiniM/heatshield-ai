import { Zone, RISK_LEVELS } from '../types';
import { Thermometer, Droplets, Wind, Sun, Info } from 'lucide-react';
import RiskBadge from '../components/common/RiskBadge';
import { getWBGTClassification, getUTCIClassification } from '../engine/thermal';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ThermalStressProps {
  zone: Zone | null;
}

const metricInfo: Record<string, { title: string; description: string; formula: string }> = {
  heatIndex: {
    title: 'Heat Index (HI)',
    description: 'The Heat Index combines air temperature and relative humidity to determine the human-perceived equivalent temperature — how hot it actually feels. Based on the Rothfusz regression equation used by the US National Weather Service.',
    formula: 'HI = f(Temperature, Relative Humidity)',
  },
  wetBulb: {
    title: 'Wet-Bulb Temperature (Tw)',
    description: 'Wet-bulb temperature reflects the lowest temperature achievable through evaporative cooling. It indicates the body\'s ability to cool itself through sweating. Higher values mean reduced cooling capacity.',
    formula: 'Tw ≈ T × atan(0.151977√(RH+8.313659)) + atan(T+RH) - atan(RH-1.676331) + ...',
  },
  wbgt: {
    title: 'Wet Bulb Globe Temperature (WBGT)',
    description: 'WBGT is the gold standard for occupational heat stress assessment. It combines wet-bulb temperature, globe temperature (radiant heat), and air temperature. Used by OSHA, military, and sports organizations worldwide.',
    formula: 'WBGT ≈ 0.7×Tw + 0.2×Tg + 0.1×Ta',
  },
  utcI: {
    title: 'Universal Thermal Climate Index (UTCI)',
    description: 'UTCI is a comprehensive human thermal comfort/stress index developed by the EU COST Action 730. It accounts for temperature, humidity, wind, and radiation using a multi-node thermoregulation model.',
    formula: 'UTCI = f(Ta, RH, Wind, MRT) — Simplified approximation',
  },
};

export default function ThermalStress({ zone }: ThermalStressProps) {
  if (!zone) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thermal Stress Intelligence</h1>
          <p className="text-sm text-slate-500 mt-0.5">Multi-parameter thermal stress analysis</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm font-medium">Waiting for live weather data…</p>
        </div>
      </div>
    );
  }

  const [showInfo, setShowInfo] = useState<string | null>(null);
  const t = zone.thermalMetrics;
  const riskInfo = RISK_LEVELS[zone.risk.level];

  const metrics = [
    {
      key: 'heatIndex', icon: Thermometer, color: 'text-red-500', bgColor: 'bg-red-50',
      label: 'Heat Index', value: t.heatIndex, unit: '°C',
      subtitle: `${t.heatIndex >= 54 ? 'Extreme Danger' : t.heatIndex >= 41 ? 'Danger' : t.heatIndex >= 33 ? 'Extreme Caution' : 'Caution'}`,
    },
    {
      key: 'wetBulb', icon: Droplets, color: 'text-blue-500', bgColor: 'bg-blue-50',
      label: 'Wet-Bulb Temperature', value: t.wetBulbTemp, unit: '°C',
      subtitle: t.wetBulbTemp >= 35 ? 'Dangerous — limits evaporative cooling' : t.wetBulbTemp >= 28 ? 'High — sweating less effective' : 'Moderate',
    },
    {
      key: 'wbgt', icon: Wind, color: 'text-orange-500', bgColor: 'bg-orange-50',
      label: 'WBGT', value: t.wbgt, unit: '°C',
      subtitle: getWBGTClassification(t.wbgt),
    },
    {
      key: 'utcI', icon: Sun, color: 'text-purple-500', bgColor: 'bg-purple-50',
      label: 'UTCI', value: t.utcI, unit: '°C',
      subtitle: getUTCIClassification(t.utcI),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Thermal Stress Intelligence</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Multi-parameter thermal stress analysis for {zone.name}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map(m => {
          const Icon = m.icon;
          const info = metricInfo[m.key];
          return (
            <div key={m.key} className="card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${m.bgColor}`}>
                    <Icon className={`w-5 h-5 ${m.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{m.label}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{m.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfo(showInfo === m.key ? null : m.key)}
                  className="p-1 rounded hover:bg-slate-100 transition-colors"
                  aria-label={`Info about ${m.label}`}
                >
                  <Info className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="text-center py-6">
                <span className="text-5xl font-bold text-slate-900">{m.value}</span>
                <span className="text-xl text-slate-400 ml-1">{m.unit}</span>
              </div>

              {/* Info Panel */}
              {showInfo === m.key && info && (
                <div className="mt-4 bg-slate-50 rounded-lg p-4 text-sm text-slate-700 space-y-2 border border-slate-200">
                  <p>{info.description}</p>
                  <div className="font-mono text-xs bg-white rounded p-2 border border-slate-200">{info.formula}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Risk Score Breakdown — How Is It Calculated? */}
      <div className="card">
        <h3 className="section-title text-sm mb-2">HeatShield Prototype Risk Score — How is it calculated?</h3>
        <p className="text-xs text-slate-500 mb-4">
          Each factor's weighted contribution is shown below. They sum exactly to the final score.
        </p>

        <div className="space-y-3">
          {/* Thermal Conditions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm font-semibold text-slate-800">Thermal Conditions</span>
                <span className="text-[10px] text-slate-400">×0.40</span>
              </div>
              <span className="text-sm font-bold text-red-600">{zone.risk.thermalContribution}<span className="text-slate-400 font-normal">/40 max</span></span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div className="bg-red-500 h-full rounded-full transition-all duration-700" style={{ width: `${zone.risk.thermalContribution * 100 / 40}%` }} />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Heat Index: {zone.risk.thermalComponent}/100 → {zone.risk.thermalComponent} × 0.40 = {zone.risk.thermalContribution}
            </div>
          </div>

          {/* Humidity Impact */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm font-semibold text-slate-800">Humidity Impact</span>
                <span className="text-[10px] text-slate-400">×0.20</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{zone.risk.humidityContribution}<span className="text-slate-400 font-normal">/20 max</span></span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full transition-all duration-700" style={{ width: `${zone.risk.humidityContribution * 100 / 20}%` }} />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Humidity score: {zone.risk.humidityComponent}/100 → {zone.risk.humidityComponent} × 0.20 = {zone.risk.humidityContribution}
            </div>
          </div>

          {/* Wind Factor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="text-sm font-semibold text-slate-800">Wind Factor</span>
                <span className="text-[10px] text-slate-400">×0.10</span>
              </div>
              <span className="text-sm font-bold text-slate-600">{zone.risk.windContribution}<span className="text-slate-400 font-normal">/10 max</span></span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div className="bg-slate-500 h-full rounded-full transition-all duration-700" style={{ width: `${zone.risk.windContribution * 100 / 10}%` }} />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Wind score: {zone.risk.windComponent}/100 → {zone.risk.windComponent} × 0.10 = {zone.risk.windContribution}
            </div>
          </div>

          {/* Solar Exposure */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm font-semibold text-slate-800">Solar Exposure</span>
                <span className="text-[10px] text-slate-400">×0.15</span>
              </div>
              <span className="text-sm font-bold text-amber-600">{zone.risk.solarContribution}<span className="text-slate-400 font-normal">/15 max</span></span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-700" style={{ width: `${zone.risk.solarContribution * 100 / 15}%` }} />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Solar score: {zone.risk.solarComponent}/100 → {zone.risk.solarComponent} × 0.15 = {zone.risk.solarContribution}
            </div>
          </div>

          {/* Vulnerability */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-sm font-semibold text-slate-800">Vulnerability</span>
                <span className="text-[10px] text-slate-400">×0.15</span>
              </div>
              <span className="text-sm font-bold text-purple-600">{zone.risk.vulnContribution}<span className="text-slate-400 font-normal">/15 max</span></span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full transition-all duration-700" style={{ width: `${zone.risk.vulnContribution * 100 / 15}%` }} />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Vuln. score: {zone.risk.vulnerabilityComponent}/100 → {zone.risk.vulnerabilityComponent} × 0.15 = {zone.risk.vulnContribution}
            </div>
          </div>
        </div>

        {/* Total — sum of all contributions */}
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
          HeatShield Prototype Risk Score is an application-level decision-support model combining thermal hazard, exposure and vulnerability. It is not an internationally standardized clinical or meteorological index. Weights configurable in Settings.
        </p>
      </div>

      {/* Occupational Thresholds */}
      <div className="card">
        <h3 className="section-title text-sm mb-3">Occupational Heat Stress Thresholds (WBGT)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-xs font-semibold text-slate-500">WBGT Range</th>
                <th className="text-left py-2 text-xs font-semibold text-slate-500">Classification</th>
                <th className="text-left py-2 text-xs font-semibold text-slate-500">Rest Schedule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr><td className="py-2">&lt; 18°C</td><td className="py-2 text-green-600">Normal</td><td className="py-2 text-slate-600">No restrictions</td></tr>
              <tr><td className="py-2">18–23°C</td><td className="py-2 text-yellow-600">Caution</td><td className="py-2 text-slate-600">25% work, 75% rest per hour</td></tr>
              <tr><td className="py-2">23–28°C</td><td className="py-2 text-orange-600">Warning</td><td className="py-2 text-slate-600">50% work, 50% rest per hour</td></tr>
              <tr><td className="py-2">28–30°C</td><td className="py-2 text-red-500">Danger</td><td className="py-2 text-slate-600">75% rest per hour</td></tr>
              <tr><td className="py-2">&gt; 30°C</td><td className="py-2 text-red-700 font-bold">Extreme Danger</td><td className="py-2 text-slate-600">Cease outdoor work</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">Prototype occupational heat-risk guidance. Does not replace workplace safety standards.</p>
      </div>
    </div>
  );
}
