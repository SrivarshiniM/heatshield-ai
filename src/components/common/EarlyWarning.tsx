// ============================================================
// HeatShield AI — Early Warning Component
// Analyzes forecast timeline to generate warnings and lead times.
// ============================================================

import { useMemo } from 'react';
import { ForecastHour, ForecastDay, RISK_LEVELS, RiskLevel } from '../../types';
import {
  AlertTriangle, Clock, MapPin, Shield, Users, HardHat, Building2,
  Info, ArrowRight, Zap, ChevronRight,
} from 'lucide-react';

interface EarlyWarningProps {
  forecast: ForecastDay;
  zoneName: string;
  dataMode: 'live' | 'cached' | 'demo' | 'unavailable';
}

interface PeakWindow {
  startHour: string;
  endHour: string;
  startLabel: string;
  endLabel: string;
  maxScore: number;
  maxLevel: RiskLevel;
  hours: ForecastHour[];
  primaryDrivers: string[];
}

interface LeadTime {
  hoursUntil: number;
  message: string;
  isActive: boolean;
}

function formatTime12(time24: string): string {
  const [h] = time24.split(':').map(Number);
  if (h === 0) return '12:00 AM';
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return '12:00 PM';
  return `${h - 12}:00 PM`;
}

function getWarningLevel(level: RiskLevel): { label: string; color: string; bg: string; border: string; icon: React.ElementType } {
  switch (level) {
    case 'extreme': return { label: 'EXTREME HEAT WARNING', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300', icon: AlertTriangle };
    case 'high': return { label: 'HEAT ALERT', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300', icon: AlertTriangle };
    case 'moderate': return { label: 'HEAT WATCH', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-300', icon: Clock };
    default: return { label: 'MONITORING', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-300', icon: Shield };
  }
}

function getDriversAtPeak(peakHours: ForecastHour[]): string[] {
  if (peakHours.length === 0) return [];
  const peak = peakHours.reduce((worst, h) => h.risk.overall > worst.risk.overall ? h : worst, peakHours[0]);
  return peak.risk.factors.slice(0, 4);
}

function calculatePeakWindow(hours: ForecastHour[]): PeakWindow | null {
  if (hours.length === 0) return null;

  // Find the best contiguous window of HIGH+ risk
  let bestStart = 0;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;

  for (let i = 0; i < hours.length; i++) {
    if (hours[i].risk.level === 'high' || hours[i].risk.level === 'extreme') {
      if (curStart < 0) curStart = i;
      curLen++;
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }

  if (bestLen === 0) return null;

  const peakHours = hours.slice(bestStart, bestStart + bestLen);
  const maxHour = peakHours.reduce((worst, h) => h.risk.overall > worst.risk.overall ? h : worst, peakHours[0]);

  return {
    startHour: peakHours[0].time,
    endHour: peakHours[peakHours.length - 1].time,
    startLabel: formatTime12(peakHours[0].time),
    endLabel: formatTime12(peakHours[peakHours.length - 1].time),
    maxScore: maxHour.risk.overall,
    maxLevel: maxHour.risk.level,
    hours: peakHours,
    primaryDrivers: getDriversAtPeak(peakHours),
  };
}

function calculateLeadTime(hours: ForecastHour[], peakWindow: PeakWindow | null): LeadTime {
  if (!peakWindow) {
    return { hoursUntil: -1, message: 'No elevated risk period in the next 24 hours.', isActive: false };
  }

  const now = new Date();
  const currentHour = now.getHours();
  const peakStartH = parseInt(peakWindow.startHour.split(':')[0]);

  // Check if currently inside the peak window
  const peakEndH = parseInt(peakWindow.endHour.split(':')[0]);
  const isInPeak = peakWindow.hours.some(h => h.hour === currentHour);

  if (isInPeak) {
    return { hoursUntil: 0, message: `${peakWindow.maxLevel.toUpperCase()} conditions are currently active.`, isActive: true };
  }

  // Calculate hours until peak starts
  let hoursUntil = peakStartH - currentHour;
  if (hoursUntil < 0) hoursUntil += 24; // crosses midnight

  const levelInfo = RISK_LEVELS[peakWindow.maxLevel];
  return {
    hoursUntil,
    message: `${levelInfo.label} conditions expected in approximately ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}.`,
    isActive: false,
  };
}

export default function EarlyWarning({ forecast, zoneName, dataMode }: EarlyWarningProps) {
  const peakWindow = useMemo(() => calculatePeakWindow(forecast.hours), [forecast.hours]);
  const leadTime = useMemo(() => calculateLeadTime(forecast.hours, peakWindow), [forecast.hours, peakWindow]);

  const warningLevel = peakWindow ? getWarningLevel(peakWindow.maxLevel) : null;
  const WarningIcon = warningLevel?.icon || Shield;

  // Determine overall forecast warning level
  const hasExtreme = forecast.hours.some(h => h.risk.level === 'extreme');
  const hasHigh = forecast.hours.some(h => h.risk.level === 'high');
  const forecastLevel: RiskLevel = hasExtreme ? 'extreme' : hasHigh ? 'high' : forecast.peakRiskLevel;

  // Data mode label
  const dataLabel = dataMode === 'demo'
    ? 'Demonstration Scenario — Simulated Forecast Data'
    : dataMode === 'cached'
    ? 'Cached Forecast Data'
    : 'Live Forecast Data';

  if (!peakWindow) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-green-800">No Elevated Risk</span>
        </div>
        <p className="text-xs text-green-700 mt-1">
          No HIGH or EXTREME heat risk periods detected in the next 24 hours for {zoneName}.
          Continue routine monitoring.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Early Warning Card */}
      <div className={`rounded-xl border-2 p-5 ${warningLevel!.bg} ${warningLevel!.border}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${warningLevel!.bg}`}>
            <WarningIcon className={`w-5 h-5 ${warningLevel!.color}`} />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${warningLevel!.color}`}>
              {warningLevel!.label}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">HeatShield Decision-Support Recommendations</p>
          </div>
        </div>

        {/* 4-Question Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* 1. WHAT */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">What is expected?</div>
            <p className="text-xs text-slate-700">
              {forecastLevel === 'extreme'
                ? 'Extreme human thermal stress is expected.'
                : 'Dangerous heat conditions are expected.'}
            </p>
          </div>

          {/* 2. WHEN */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">When will it happen?</div>
            <p className="text-xs text-slate-700 font-semibold">
              {peakWindow.startLabel} – {peakWindow.endLabel}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{leadTime.message}</p>
          </div>

          {/* 3. WHERE */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Where?</div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">{zoneName}</span>
            </div>
          </div>

          {/* 4. Peak Score */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Maximum Predicted Risk</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold" style={{ color: RISK_LEVELS[peakWindow.maxLevel].color }}>
                {peakWindow.maxScore}/100
              </span>
              <span className="text-xs font-semibold" style={{ color: RISK_LEVELS[peakWindow.maxLevel].color }}>
                — {RISK_LEVELS[peakWindow.maxLevel].label}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Drivers */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Primary Drivers</div>
          <div className="flex flex-wrap gap-1.5">
            {peakWindow.primaryDrivers.map((driver, i) => (
              <span key={i} className="text-[10px] bg-white/80 border border-slate-200 rounded-full px-2 py-0.5 text-slate-600">
                {driver}
              </span>
            ))}
          </div>
        </div>

        {/* Recommended Action */}
        <div className="bg-white/60 rounded-lg p-3 border border-slate-200">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Recommended Immediate Action</div>
          <p className="text-xs text-slate-700">
            {forecastLevel === 'extreme'
              ? 'Avoid strenuous outdoor activity during the peak danger window. Activate targeted protection measures for vulnerable populations.'
              : 'Reduce outdoor exposure during the danger window. Ensure adequate hydration and cooling resources are available.'}
          </p>
        </div>
      </div>

      {/* Action Recommendations by Audience */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Citizens */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold text-slate-700">For Citizens</span>
          </div>
          <ul className="space-y-1.5">
            {forecastLevel === 'extreme' ? (
              <>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  Avoid prolonged outdoor exposure during {peakWindow.startLabel}–{peakWindow.endLabel}
                </li>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  Increase hydration — drink water before feeling thirsty
                </li>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  Check on elderly and vulnerable family members
                </li>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  Move strenuous activity outside the peak danger period
                </li>
              </>
            ) : (
              <>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  Stay hydrated throughout the day
                </li>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  Take rest breaks in shaded or cool areas
                </li>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  Watch for signs of heat exhaustion
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Workers */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <HardHat className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold text-slate-700">For Outdoor Workers</span>
          </div>
          <ul className="space-y-1.5">
            {forecastLevel === 'extreme' ? (
              <>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                  Reduce heavy physical activity during {peakWindow.startLabel}–{peakWindow.endLabel}
                </li>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                  Follow work-rest-hydration guidance
                </li>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                  Use shaded or cooled recovery areas where available
                </li>
              </>
            ) : (
              <>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                  Increase hydration frequency
                </li>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                  Take mandatory shade breaks every hour
                </li>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                  Monitor colleagues for heat symptoms
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Government */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-semibold text-slate-700">For Authorities</span>
          </div>
          <ul className="space-y-1.5">
            {forecastLevel === 'extreme' ? (
              <>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-sky-500 mt-0.5 flex-shrink-0" />
                  Prioritize {zoneName} for heat-response resources
                </li>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-sky-500 mt-0.5 flex-shrink-0" />
                  Activate targeted public communication
                </li>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-sky-500 mt-0.5 flex-shrink-0" />
                  Monitor vulnerable populations
                </li>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-sky-500 mt-0.5 flex-shrink-0" />
                  Prepare heat-response resources per local protocols
                </li>
              </>
            ) : (
              <>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-sky-500 mt-0.5 flex-shrink-0" />
                  Issue public heat advisory
                </li>
                <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-sky-500 mt-0.5 flex-shrink-0" />
                  Increase monitoring of vulnerable areas
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-slate-500 leading-relaxed">
          HeatShield Decision-Support Recommendations — not official government orders or medical advice.
          Always follow official IMD and local authority directives.
        </p>
      </div>
    </div>
  );
}
