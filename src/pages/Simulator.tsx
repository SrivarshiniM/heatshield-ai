// ============================================================
// HeatShield AI — What-If Heat Scenario Simulator
// Interactive scenario adjustment using existing calculation engines.
// Does NOT modify original weather data.
// ============================================================

import { useState, useMemo, useEffect } from 'react';
import {
  Zone, WeatherData, RiskWeights, RiskScore, ThermalMetrics,
  RISK_LEVELS,
} from '../types';
import { calculateThermalMetrics } from '../engine/thermal';
import { calculateRisk } from '../engine/risk';
import {
  getAdminRecommendations,
  getCitizenRecommendations,
  getWorkerRecommendations,
} from '../engine/ai';
import RiskBadge from '../components/common/RiskBadge';
import {
  Thermometer, Droplets, Wind, Sun, RotateCcw, Play, Info,
  ArrowRight, AlertTriangle, Users, HardHat, Building2,
  Loader2, Zap,
} from 'lucide-react';

interface SimulatorProps {
  zone: Zone | null;
  riskWeights: RiskWeights;
}

interface ScenarioAdjustments {
  tempDelta: number;     // -5 to +5 °C
  humidityDelta: number; // -20 to +20 %
  windMultiplier: number; // 0.0 to 2.0 (1.0 = baseline)
  solarMultiplier: number; // 0.0 to 2.0 (1.0 = baseline)
}

const DEFAULT_ADJUSTMENTS: ScenarioAdjustments = {
  tempDelta: 0,
  humidityDelta: 0,
  windMultiplier: 1.0,
  solarMultiplier: 1.0,
};



function ComparisonRow({
  label, baseline, simulated, unit, color = 'text-slate-700',
}: {
  label: string;
  baseline: number | string;
  simulated: number | string;
  unit: string;
  color?: string;
}) {
  const bNum = typeof baseline === 'number' ? baseline : parseFloat(baseline);
  const sNum = typeof simulated === 'number' ? simulated : parseFloat(simulated);
  const diff = !isNaN(bNum) && !isNaN(sNum) ? sNum - bNum : 0;
  const isChanged = Math.abs(diff) > 0.01;

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 w-28">{label}</span>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-slate-600 font-mono w-16 text-right">{baseline}{unit}</span>
        <ArrowRight className="w-3 h-3 text-slate-300" />
        <span className={`font-mono w-16 text-right font-bold ${color}`}>{simulated}{unit}</span>
        {isChanged && (
          <span className={`w-14 text-right font-semibold ${diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {diff > 0 ? '+' : ''}{typeof diff === 'number' ? diff.toFixed(1) : diff}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Simulator({ zone, riskWeights }: SimulatorProps) {
  const [adjustments, setAdjustments] = useState<ScenarioAdjustments>(DEFAULT_ADJUSTMENTS);

  // Reset adjustments when zone changes
  useEffect(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
  }, [zone?.id]);

  const isScenarioActive = useMemo(() => {
    return adjustments.tempDelta !== 0
      || adjustments.humidityDelta !== 0
      || adjustments.windMultiplier !== 1.0
      || adjustments.solarMultiplier !== 1.0;
  }, [adjustments]);

  // Compute simulated weather and risk
  const simulation = useMemo(() => {
    if (!zone) return null;

    const base = zone.weather;

    // Apply adjustments to create simulated weather
    const simulatedWeather: WeatherData = {
      ...base,
      temperature: Math.round((base.temperature + adjustments.tempDelta) * 10) / 10,
      humidity: Math.max(0, Math.min(100,
        Math.round((base.humidity + adjustments.humidityDelta) * 10) / 10
      )),
      windSpeed: Math.max(0, Math.round(base.windSpeed * adjustments.windMultiplier * 10) / 10),
      solarRadiation: Math.max(0, Math.round(base.solarRadiation * adjustments.solarMultiplier)),
      uvIndex: Math.max(0, Math.round(base.uvIndex * adjustments.solarMultiplier * 10) / 10),
      dewPoint: base.dewPoint, // dew point doesn't change with these adjustments
      timestamp: base.timestamp,
      source: base.source,
    };

    // Run through existing engines
    const thermalMetrics = calculateThermalMetrics(simulatedWeather);
    const risk = calculateRisk(simulatedWeather, thermalMetrics, zone.vulnerability, riskWeights);

    // Generate recommendations based on simulated risk
    const simulatedZone: Zone = {
      ...zone,
      weather: simulatedWeather,
      thermalMetrics,
      risk,
    };

    return {
      weather: simulatedWeather,
      thermalMetrics,
      risk,
      adminRecs: getAdminRecommendations(simulatedZone),
      citizenRecs: getCitizenRecommendations(simulatedZone),
      workerRecs: getWorkerRecommendations(simulatedZone),
    };
  }, [zone, adjustments, riskWeights]);

  // Loading state
  if (!zone || !simulation) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">What-If Scenario Simulator</h1>
          <p className="text-sm text-slate-500 mt-0.5">Explore how environmental changes affect heat risk</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm font-medium">Waiting for weather data…</p>
        </div>
      </div>
    );
  }

  const base = zone.weather;
  const sim = simulation;
  const riskDiff = sim.risk.overall - zone.risk.overall;
  const levelChanged = sim.risk.level !== zone.risk.level;

  const handleReset = () => setAdjustments(DEFAULT_ADJUSTMENTS);

  const updateTemp = (val: number) => setAdjustments(a => ({ ...a, tempDelta: val }));
  const updateHumidity = (val: number) => setAdjustments(a => ({ ...a, humidityDelta: val }));
  const updateWind = (val: number) => setAdjustments(a => ({ ...a, windMultiplier: val }));
  const updateSolar = (val: number) => setAdjustments(a => ({ ...a, solarMultiplier: val }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">What-If Scenario Simulator</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Adjust conditions for {zone.name} and see how heat risk changes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isScenarioActive && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Scenario
            </button>
          )}
        </div>
      </div>

      {/* Scenario Mode Indicator */}
      {isScenarioActive && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-3">
          <Zap className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <div>
            <span className="text-sm font-bold text-orange-800">🔥 What-If Scenario Active</span>
            <p className="text-xs text-orange-600 mt-0.5">
              Simulated conditions — original weather data has not been modified.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Controls + Comparison */}
        <div className="space-y-5">
          {/* Controls */}
          <div className="card">
            <h3 className="section-title text-sm mb-4">Adjust Conditions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Temperature */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-50">
                      <Thermometer className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">Temperature</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900">
                      {(base.temperature + adjustments.tempDelta).toFixed(1)}°C
                    </span>
                    {adjustments.tempDelta !== 0 && (
                      <span className={`text-xs ml-1 font-semibold ${adjustments.tempDelta > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {adjustments.tempDelta > 0 ? '+' : ''}{adjustments.tempDelta.toFixed(1)}°C
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min={-5}
                  max={5}
                  step={0.5}
                  value={adjustments.tempDelta}
                  onChange={(e) => updateTemp(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>-5°C</span>
                  <span className="text-slate-500 font-medium">Baseline: {base.temperature}°C</span>
                  <span>+5°C</span>
                </div>
              </div>

              {/* Humidity */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50">
                      <Droplets className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">Humidity</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900">
                      {Math.max(0, Math.min(100, base.humidity + adjustments.humidityDelta))}%
                    </span>
                    {adjustments.humidityDelta !== 0 && (
                      <span className={`text-xs ml-1 font-semibold ${adjustments.humidityDelta > 0 ? 'text-blue-500' : 'text-green-500'}`}>
                        {adjustments.humidityDelta > 0 ? '+' : ''}{adjustments.humidityDelta}%
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min={-20}
                  max={20}
                  step={1}
                  value={adjustments.humidityDelta}
                  onChange={(e) => updateHumidity(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>-20%</span>
                  <span className="text-slate-500 font-medium">Baseline: {base.humidity}%</span>
                  <span>+20%</span>
                </div>
              </div>

              {/* Wind Speed */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100">
                      <Wind className="w-4 h-4 text-slate-500" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">Wind Speed</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900">
                      {(base.windSpeed * adjustments.windMultiplier).toFixed(1)} m/s
                    </span>
                    {adjustments.windMultiplier !== 1.0 && (
                      <span className={`text-xs ml-1 font-semibold ${adjustments.windMultiplier < 1.0 ? 'text-red-500' : 'text-green-500'}`}>
                        {adjustments.windMultiplier < 1.0 ? '↓' : '↑'}{((adjustments.windMultiplier - 1) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={adjustments.windMultiplier}
                  onChange={(e) => updateWind(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Calm</span>
                  <span className="text-slate-500 font-medium">Baseline: {base.windSpeed} m/s</span>
                  <span>Windy</span>
                </div>
              </div>

              {/* Solar / Radiation */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-50">
                      <Sun className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">Solar Load</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900">
                      {Math.round(base.solarRadiation * adjustments.solarMultiplier)} W/m²
                    </span>
                    {adjustments.solarMultiplier !== 1.0 && (
                      <span className={`text-xs ml-1 font-semibold ${adjustments.solarMultiplier > 1.0 ? 'text-amber-500' : 'text-green-500'}`}>
                        {adjustments.solarMultiplier > 1.0 ? '+' : ''}{((adjustments.solarMultiplier - 1) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={adjustments.solarMultiplier}
                  onChange={(e) => updateSolar(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Low</span>
                  <span className="text-slate-500 font-medium">Baseline: {base.solarRadiation} W/m²</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          </div>

          {/* Baseline vs Scenario Comparison */}
          <div className="card">
            <h3 className="section-title text-sm mb-3">Baseline → Scenario</h3>

            {/* Weather Comparison */}
            <div className="mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Weather Conditions</div>
              <ComparisonRow label="Temperature" baseline={base.temperature} simulated={sim.weather.temperature.toFixed(1)} unit="°C" />
              <ComparisonRow label="Humidity" baseline={base.humidity} simulated={Math.max(0, Math.min(100, base.humidity + adjustments.humidityDelta))} unit="%" />
              <ComparisonRow label="Wind Speed" baseline={base.windSpeed.toFixed(1)} simulated={sim.weather.windSpeed.toFixed(1)} unit=" m/s" />
              <ComparisonRow label="Solar Radiation" baseline={base.solarRadiation} simulated={sim.weather.solarRadiation} unit=" W/m²" />
            </div>

            {/* Thermal Metrics Comparison */}
            <div className="mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Thermal Stress Metrics</div>
              <ComparisonRow
                label="Heat Index"
                baseline={zone.thermalMetrics.heatIndex.toFixed(1)}
                simulated={sim.thermalMetrics.heatIndex.toFixed(1)}
                unit="°C"
                color={sim.thermalMetrics.heatIndex > zone.thermalMetrics.heatIndex ? 'text-red-600' : 'text-green-600'}
              />
              <ComparisonRow
                label="WBGT"
                baseline={zone.thermalMetrics.wbgt.toFixed(1)}
                simulated={sim.thermalMetrics.wbgt.toFixed(1)}
                unit="°C"
                color={sim.thermalMetrics.wbgt > zone.thermalMetrics.wbgt ? 'text-red-600' : 'text-green-600'}
              />
              <ComparisonRow
                label="Wet-Bulb"
                baseline={zone.thermalMetrics.wetBulbTemp.toFixed(1)}
                simulated={sim.thermalMetrics.wetBulbTemp.toFixed(1)}
                unit="°C"
              />
              <ComparisonRow
                label="UTCI"
                baseline={zone.thermalMetrics.utcI.toFixed(1)}
                simulated={sim.thermalMetrics.utcI.toFixed(1)}
                unit="°C"
              />
            </div>

            {/* Risk Score Comparison */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Risk Score</div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-slate-500 w-28">HeatShield Score</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-700">{zone.risk.overall}</span>
                    <RiskBadge level={zone.risk.level} size="sm" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${riskDiff > 0 ? 'text-red-600' : riskDiff < 0 ? 'text-green-600' : 'text-slate-700'}`}>
                      {sim.risk.overall}
                    </span>
                    <RiskBadge level={sim.risk.level} size="sm" />
                  </div>
                  {riskDiff !== 0 && (
                    <span className={`text-sm font-bold ${riskDiff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {riskDiff > 0 ? '+' : ''}{riskDiff}
                    </span>
                  )}
                </div>
              </div>
              {levelChanged && (
                <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-semibold text-orange-700">
                    Risk level changed: {RISK_LEVELS[zone.risk.level].label} → {RISK_LEVELS[sim.risk.level].label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Scenario Results */}
        <div className="space-y-5">
          {/* Why This Risk? — Scenario Breakdown */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h3 className="section-title text-sm">Why this risk? (Scenario)</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Thermal', contrib: sim.risk.thermalContribution, max: 40, color: 'bg-red-500', baseContrib: zone.risk.thermalContribution },
                { label: 'Humidity', contrib: sim.risk.humidityContribution, max: 20, color: 'bg-blue-500', baseContrib: zone.risk.humidityContribution },
                { label: 'Wind', contrib: sim.risk.windContribution, max: 10, color: 'bg-slate-500', baseContrib: zone.risk.windContribution },
                { label: 'Solar', contrib: sim.risk.solarContribution, max: 15, color: 'bg-amber-500', baseContrib: zone.risk.solarContribution },
                { label: 'Vulnerability', contrib: sim.risk.vulnContribution, max: 15, color: 'bg-purple-500', baseContrib: zone.risk.vulnContribution },
              ].map(item => {
                const diff = item.contrib - item.baseContrib;
                return (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600 w-20">{item.label}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${item.contrib * 100 / item.max}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 w-8 text-right">{item.contrib}</span>
                    {diff !== 0 && (
                      <span className={`text-[10px] font-semibold w-8 text-right ${diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Total</span>
                <RiskBadge level={sim.risk.level} size="sm" />
              </div>
              <span className="text-base font-bold text-slate-900">{sim.risk.overall}/100</span>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="card">
            <h3 className="section-title text-sm mb-2">Contributing Factors (Scenario)</h3>
            <div className="space-y-1.5">
              {sim.risk.factors.map((factor, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="card">
            <h3 className="section-title text-sm mb-3">Recommended Actions (Scenario)</h3>
            <div className="space-y-3">
              {/* Government */}
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  <span className="text-xs font-semibold text-slate-700">Government Response</span>
                  <RiskBadge level={sim.adminRecs.priority} size="sm" />
                </div>
                <ul className="space-y-1">
                  {sim.adminRecs.actions.slice(0, 3).map((action, i) => (
                    <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                      <span className="text-sky-500 mt-0.5">→</span>{action}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Citizen */}
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-slate-700">Citizen Guidance</span>
                  <RiskBadge level={sim.citizenRecs.priority} size="sm" />
                </div>
                <ul className="space-y-1">
                  {sim.citizenRecs.actions.slice(0, 3).map((action, i) => (
                    <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">→</span>{action}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Worker */}
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <HardHat className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs font-semibold text-slate-700">Worker Safety</span>
                  <RiskBadge level={sim.workerRecs.priority} size="sm" />
                </div>
                <ul className="space-y-1">
                  {sim.workerRecs.actions.slice(0, 3).map((action, i) => (
                    <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">→</span>{action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-slate-500 leading-relaxed">
              What-If results are scenario simulations for decision support and do not replace official weather forecasts or warnings.
              All calculations use the existing HeatShield thermal and risk engines with the same weights and formulas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
