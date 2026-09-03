// ============================================================
// HeatShield AI — Government Response / Decision-Support Page
// Answers: "WHAT SHOULD WE DO NOW?"
// Uses actual risk scores, forecast data, and vulnerability profiles.
// ============================================================

import { useMemo } from 'react';
import { Zone, CoolingCenter, ForecastDay, ForecastHour, RISK_LEVELS, RiskLevel } from '../types';
import RiskBadge from '../components/common/RiskBadge';
import {
  AlertTriangle, Users, Snowflake, HardHat, Clock, MapPin,
  ChevronRight, Shield, Building2, Activity, Info, ArrowUp,
  Eye, Zap, CheckCircle2, Target,
} from 'lucide-react';

interface GovernmentProps {
  zones: Zone[];
  selectedZone: Zone | null;
  selectedForecast: ForecastDay | null;
  coolingCenters: CoolingCenter[];
  dataMode: 'live' | 'cached' | 'demo' | 'unavailable';
}

function formatTime12(time24: string): string {
  const [h] = time24.split(':').map(Number);
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function getPeakFromForecast(forecast: ForecastHour[]): { start: string; end: string; maxScore: number; maxLevel: RiskLevel; hours: ForecastHour[] } | null {
  if (forecast.length === 0) return null;
  let bestStart = 0, bestLen = 0, curStart = -1, curLen = 0;
  for (let i = 0; i < forecast.length; i++) {
    if (forecast[i].risk.level === 'high' || forecast[i].risk.level === 'extreme') {
      if (curStart < 0) curStart = i;
      curLen++;
      if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
    } else { curStart = -1; curLen = 0; }
  }
  if (bestLen === 0) return null;
  const peakHours = forecast.slice(bestStart, bestStart + bestLen);
  const maxHour = peakHours.reduce((w, h) => h.risk.overall > w.risk.overall ? h : w, peakHours[0]);
  return {
    start: peakHours[0].time,
    end: peakHours[peakHours.length - 1].time,
    maxScore: maxHour.risk.overall,
    maxLevel: maxHour.risk.level,
    hours: peakHours,
  };
}

function getLeadTimeHours(forecast: ForecastHour[]): number {
  const now = new Date().getHours();
  for (const h of forecast) {
    if (h.risk.level === 'high' || h.risk.level === 'extreme') {
      let diff = h.hour - now;
      if (diff < 0) diff += 24;
      return diff;
    }
  }
  return -1;
}

function getVulnerabilityReason(zone: Zone): string {
  const v = zone.vulnerability;
  const reasons: string[] = [];
  if (v.outdoorWorkerExposure >= 60) reasons.push(`${v.outdoorWorkerExposure}% outdoor worker exposure`);
  if (v.elderlyPercentage >= 10) reasons.push(`${v.elderlyPercentage}% elderly population`);
  if (v.healthcareAccessibility === 'low') reasons.push('limited healthcare access');
  if (v.coolingCenterAccess === 'low') reasons.push('limited cooling center access');
  if (v.populationDensity >= 5000) reasons.push('high population density');
  if (v.acclimatizationLevel === 'low') reasons.push('low community acclimatization');
  return reasons.length > 0 ? reasons.join(', ') : 'standard vulnerability profile';
}

function getLocalityFocus(zone: Zone): string {
  const v = zone.vulnerability;
  if (zone.type === 'industrial' || v.outdoorWorkerExposure >= 60) {
    return 'Prioritize outdoor and industrial worker protection.';
  }
  if (zone.type === 'residential' && (v.elderlyPercentage >= 10 || v.populationDensity >= 5000)) {
    return 'Prioritize vulnerable populations and heat exposure communication.';
  }
  if (zone.type === 'rural') {
    return 'Prioritize outdoor labour and access to cooling/hydration support.';
  }
  if (v.healthcareAccessibility === 'low') {
    return 'Pre-position medical teams due to limited healthcare access.';
  }
  return 'Apply standard heat emergency protocols for this area.';
}

interface PriorityAction {
  tier: 1 | 2 | 3;
  tierLabel: string;
  tierColor: string;
  tierBg: string;
  tierBorder: string;
  icon: React.ElementType;
  action: string;
  reason: string;
  timeframe?: string;
}

function generatePriorityActions(zone: Zone, forecast: ForecastDay | null): PriorityAction[] {
  const level = zone.risk.level;
  const peak = forecast ? getPeakFromForecast(forecast.hours) : null;
  const leadHours = forecast ? getLeadTimeHours(forecast.hours) : -1;
  const v = zone.vulnerability;
  const actions: PriorityAction[] = [];

  // Priority 1 — IMMEDIATE
  if (level === 'extreme') {
    actions.push({ tier: 1, tierLabel: 'IMMEDIATE', tierColor: 'text-red-700', tierBg: 'bg-red-50', tierBorder: 'border-red-200', icon: Zap, action: `Declare heat emergency in ${zone.name}. Activate all cooling centers immediately.`, reason: `Current risk is EXTREME (${zone.risk.overall}/100). Life-threatening heat conditions are present.`, timeframe: 'Now' });
    actions.push({ tier: 1, tierLabel: 'IMMEDIATE', tierColor: 'text-red-700', tierBg: 'bg-red-50', tierBorder: 'border-red-200', icon: AlertTriangle, action: `Issue emergency public heat warnings for ${zone.name}.`, reason: `Temperature ${zone.weather.temperature}°C with Heat Index ${zone.thermalMetrics.heatIndex}°C — dangerous thermal stress.`, timeframe: 'Now' });
    if (v.outdoorWorkerExposure >= 40) {
      actions.push({ tier: 1, tierLabel: 'IMMEDIATE', tierColor: 'text-red-700', tierBg: 'bg-red-50', tierBorder: 'border-red-200', icon: HardHat, action: `Mandatory suspension of outdoor work during peak hours in ${zone.name}.`, reason: `${v.outdoorWorkerExposure}% outdoor worker exposure at EXTREME risk level.`, timeframe: 'Now' });
    }
  } else if (level === 'high') {
    actions.push({ tier: 1, tierLabel: 'IMMEDIATE', tierColor: 'text-orange-700', tierBg: 'bg-orange-50', tierBorder: 'border-orange-200', icon: Zap, action: `Activate cooling centers in ${zone.name}. Issue mandatory heat advisory.`, reason: `Current risk is HIGH (${zone.risk.overall}/100). Dangerous heat conditions require action.`, timeframe: 'Now' });
    if (v.outdoorWorkerExposure >= 40) {
      actions.push({ tier: 1, tierLabel: 'IMMEDIATE', tierColor: 'text-orange-700', tierBg: 'bg-orange-50', tierBorder: 'border-orange-200', icon: HardHat, action: `Issue mandatory heat advisory for outdoor workers in ${zone.name}.`, reason: `${v.outdoorWorkerExposure}% outdoor worker exposure at HIGH risk.`, timeframe: 'Now' });
    }
  } else if (level === 'moderate') {
    actions.push({ tier: 1, tierLabel: 'IMMEDIATE', tierColor: 'text-yellow-700', tierBg: 'bg-yellow-50', tierBorder: 'border-yellow-200', icon: Shield, action: `Issue public heat advisory for ${zone.name}. Prepare cooling centers for activation.`, reason: `Current risk is MODERATE (${zone.risk.overall}/100). Elevated conditions — vulnerable groups at risk.`, timeframe: 'Now' });
  } else {
    actions.push({ tier: 1, tierLabel: 'IMMEDIATE', tierColor: 'text-green-700', tierBg: 'bg-green-50', tierBorder: 'border-green-200', icon: CheckCircle2, action: `Continue routine monitoring for ${zone.name}. Ensure cooling spaces remain operational.`, reason: `Current risk is LOW (${zone.risk.overall}/100). No immediate action required.`, timeframe: 'Routine' });
  }

  // Priority 2 — BEFORE PEAK RISK
  if (peak && (level === 'extreme' || level === 'high' || level === 'moderate')) {
    const peakLabel = `${formatTime12(peak.start)} – ${formatTime12(peak.end)}`;
    if (leadHours > 0) {
      actions.push({ tier: 2, tierLabel: 'BEFORE PEAK', tierColor: 'text-blue-700', tierBg: 'bg-blue-50', tierBorder: 'border-blue-200', icon: Clock, action: `Prepare response resources for ${zone.name} peak window (${peakLabel}).`, reason: `${peak.maxLevel.toUpperCase()} risk (${peak.maxScore}/100) expected during ${peakLabel}. Action recommended within the next ${leadHours} hour${leadHours !== 1 ? 's' : ''}.`, timeframe: `Within ${leadHours}h` });
    }
    if (v.outdoorWorkerExposure >= 40) {
      actions.push({ tier: 2, tierLabel: 'BEFORE PEAK', tierColor: 'text-blue-700', tierBg: 'bg-blue-50', tierBorder: 'border-blue-200', icon: HardHat, action: `Notify outdoor workers and employers in ${zone.name} about peak danger window.`, reason: `${v.outdoorWorkerExposure}% outdoor worker exposure — schedule adjustment needed before ${peakLabel}.`, timeframe: leadHours > 0 ? `Within ${leadHours}h` : 'Before peak' });
    }
    if (v.coolingCenterAccess === 'low' || v.coolingCenterAccess === 'medium') {
      actions.push({ tier: 2, tierLabel: 'BEFORE PEAK', tierColor: 'text-blue-700', tierBg: 'bg-blue-50', tierBorder: 'border-blue-200', icon: Snowflake, action: `Deploy mobile cooling/hydration stations in ${zone.name}.`, reason: `Cooling center access is ${v.coolingCenterAccess} — supplementary relief needed before peak.`, timeframe: leadHours > 0 ? `Within ${leadHours}h` : 'Before peak' });
    }
    if (v.elderlyPercentage >= 10) {
      actions.push({ tier: 2, tierLabel: 'BEFORE PEAK', tierColor: 'text-blue-700', tierBg: 'bg-blue-50', tierBorder: 'border-blue-200', icon: Users, action: `Initiate welfare checks on elderly residents in ${zone.name}.`, reason: `${v.elderlyPercentage}% elderly population — vulnerable to heat before conditions worsen.`, timeframe: leadHours > 0 ? `Within ${leadHours}h` : 'Before peak' });
    }
  }

  // Priority 3 — MONITOR
  actions.push({ tier: 3, tierLabel: 'MONITOR', tierColor: 'text-slate-600', tierBg: 'bg-slate-50', tierBorder: 'border-slate-200', icon: Eye, action: `Monitor thermal conditions and risk trajectory in ${zone.name}.`, reason: 'Track whether the risk category is rising, stable, or falling.', timeframe: 'Ongoing' });
  if (v.healthcareAccessibility === 'low') {
    actions.push({ tier: 3, tierLabel: 'MONITOR', tierColor: 'text-slate-600', tierBg: 'bg-slate-50', tierBorder: 'border-slate-200', icon: Activity, action: `Monitor healthcare capacity — ${zone.name} has limited healthcare access.`, reason: `${v.healthcareAccessibility} healthcare accessibility increases impact of heat-related illness.`, timeframe: 'Ongoing' });
  }
  if (v.populationDensity >= 5000) {
    actions.push({ tier: 3, tierLabel: 'MONITOR', tierColor: 'text-slate-600', tierBg: 'bg-slate-50', tierBorder: 'border-slate-200', icon: Users, action: `Monitor high-density residential areas in ${zone.name}.`, reason: `${v.populationDensity.toLocaleString()} people/km² — heat impact scales with density.`, timeframe: 'Ongoing' });
  }

  return actions;
}

export default function Government({ zones, selectedZone, selectedForecast, coolingCenters, dataMode }: GovernmentProps) {
  // Rank zones by current risk
  const rankedZones = useMemo(() => {
    return [...zones].sort((a, b) => b.risk.overall - a.risk.overall);
  }, [zones]);

  // Peak info for selected zone
  const peak = useMemo(() => {
    if (!selectedForecast) return null;
    return getPeakFromForecast(selectedForecast.hours);
  }, [selectedForecast]);

  // Lead time
  const leadHours = useMemo(() => {
    if (!selectedForecast) return -1;
    return getLeadTimeHours(selectedForecast.hours);
  }, [selectedForecast]);

  // Priority actions
  const priorityActions = useMemo(() => {
    if (!selectedZone) return [];
    return generatePriorityActions(selectedZone, selectedForecast);
  }, [selectedZone, selectedForecast]);

  // Stats
  const extremeCount = zones.filter(z => z.risk.level === 'extreme').length;
  const highCount = zones.filter(z => z.risk.level === 'high').length;
  const totalPopAtRisk = zones.filter(z => ['extreme', 'high'].includes(z.risk.level)).reduce((s, z) => s + z.population, 0);
  const totalOutdoor = zones.reduce((s, z) => s + Math.round(z.population * z.vulnerability.outdoorWorkerExposure / 100), 0);
  const openCenters = coolingCenters.filter(c => c.status === 'open');

  // Determine overall district warning
  const districtLevel: RiskLevel = extremeCount > 0 ? 'extreme' : highCount > 0 ? 'high' : zones.some(z => z.risk.level === 'moderate') ? 'moderate' : 'low';

  // Loading state
  if (!selectedZone) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Heat Emergency Decision Support</h1>
          <p className="text-sm text-slate-500 mt-0.5">Loading locality data…</p>
        </div>
      </div>
    );
  }

  const peakLabel = peak ? `${formatTime12(peak.start)} – ${formatTime12(peak.end)}` : 'N/A';
  const warningLabel = selectedZone.risk.level === 'extreme' ? 'EXTREME HEAT WARNING' :
    selectedZone.risk.level === 'high' ? 'HEAT ALERT' :
    selectedZone.risk.level === 'moderate' ? 'HEAT WATCH' : 'No Warning';

  const leadTimeText = leadHours > 0
    ? `Expected in approximately ${leadHours} hour${leadHours !== 1 ? 's' : ''}`
    : leadHours === 0 ? 'Currently active' : 'No elevated risk in forecast';

  // Top priority action for summary card
  const topAction = priorityActions.length > 0 ? priorityActions[0] : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Heat Emergency Decision Support</h1>
        <p className="text-sm text-slate-500 mt-0.5">What should we do now? — {selectedZone.name}</p>
      </div>

      {/* Decision Summary Card */}
      <div className={`rounded-xl border-2 p-5 ${
        selectedZone.risk.level === 'extreme' ? 'bg-red-50 border-red-200' :
        selectedZone.risk.level === 'high' ? 'bg-orange-50 border-orange-200' :
        selectedZone.risk.level === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
        'bg-green-50 border-green-200'
      }`}>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Current Situation</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Location</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span className="text-sm font-bold text-slate-900">{selectedZone.name}</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Current Risk</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold" style={{ color: RISK_LEVELS[selectedZone.risk.level].color }}>
                {selectedZone.risk.overall}
              </span>
              <RiskBadge level={selectedZone.risk.level} size="sm" />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Next Peak</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{peakLabel}</div>
            {peak && <div className="text-[10px] text-slate-500">Max: {peak.maxScore}/100 ({RISK_LEVELS[peak.maxLevel].label})</div>}
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Early Warning</div>
            <div className="text-sm font-bold mt-0.5" style={{ color: RISK_LEVELS[selectedZone.risk.level].color }}>
              {warningLabel}
            </div>
            <div className="text-[10px] text-slate-500">{leadTimeText}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Recommended Decision</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {selectedZone.risk.level === 'extreme' ? 'Activate emergency response' :
               selectedZone.risk.level === 'high' ? 'Activate targeted protections' :
               selectedZone.risk.level === 'moderate' ? 'Issue advisory & prepare' :
               'Continue routine monitoring'}
            </div>
          </div>
        </div>
      </div>

      {/* District Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: AlertTriangle, label: 'Extreme Zones', value: extremeCount, color: 'text-red-600', bg: 'bg-red-50' },
          { icon: AlertTriangle, label: 'High-Risk Zones', value: highCount, color: 'text-orange-600', bg: 'bg-orange-50' },
          { icon: Users, label: 'Pop. at High+ Risk', value: totalPopAtRisk.toLocaleString(), color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: Snowflake, label: 'Cooling Centers', value: `${openCenters.length}/${coolingCenters.length}`, color: 'text-sky-600', bg: 'bg-sky-50' },
          { icon: HardHat, label: 'Outdoor Workers', value: totalOutdoor.toLocaleString(), color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-3 border border-slate-200`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                <span className="text-[10px] font-medium text-slate-600">{stat.label}</span>
              </div>
              <div className="text-xl font-bold text-slate-900">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* High-Risk Localities Ranking */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title text-sm">High-Risk Localities</h3>
          <span className="text-[10px] text-slate-400">Ranked by current risk score</span>
        </div>
        <div className="space-y-2">
          {rankedZones.map((z, i) => (
            <div key={z.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              z.id === selectedZone.id
                ? 'border-sky-300 bg-sky-50 ring-1 ring-sky-200'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}>
              <span className="text-xs font-bold text-slate-400 w-5 text-center">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800 truncate">{z.name}</span>
                  {z.id === selectedZone.id && (
                    <span className="text-[9px] bg-sky-100 text-sky-700 px-1.5 rounded">SELECTED</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {getVulnerabilityReason(z)}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-lg font-bold" style={{ color: RISK_LEVELS[z.risk.level].color }}>
                  {z.risk.overall}
                </span>
                <RiskBadge level={z.risk.level} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prioritized Actions */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-sky-600" />
          <h3 className="section-title text-sm">Prioritized Actions for {selectedZone.name}</h3>
        </div>
        <p className="text-[10px] text-slate-400 mb-4">
          HeatShield Decision-Support Recommendations — not official government orders.
        </p>

        <div className="space-y-4">
          {([1, 2, 3] as const).map(tier => {
            const tierActions = priorityActions.filter(a => a.tier === tier);
            if (tierActions.length === 0) return null;
            const first = tierActions[0];

            return (
              <div key={tier} className={`rounded-xl border p-4 ${first.tierBg} ${first.tierBorder}`}>
                <div className="flex items-center gap-2 mb-3">
                  <first.icon className={`w-4 h-4 ${first.tierColor}`} />
                  <span className={`text-xs font-bold ${first.tierColor} uppercase tracking-wider`}>
                    Priority {tier} — {first.tierLabel}
                  </span>
                  {first.timeframe && (
                    <span className="text-[10px] bg-white/80 border border-slate-200 rounded-full px-2 py-0.5 text-slate-500">
                      {first.timeframe}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {tierActions.map((action, idx) => (
                    <div key={idx} className="bg-white/60 rounded-lg p-3 border border-slate-200">
                      <div className="flex items-start gap-2">
                        <ChevronRight className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${first.tierColor}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{action.action}</p>
                          <div className="mt-1.5 flex items-start gap-1.5">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase flex-shrink-0">Reason:</span>
                            <p className="text-[11px] text-slate-600 leading-relaxed">{action.reason}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Locality-Specific Focus */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-sky-600" />
          <h3 className="section-title text-sm">Locality-Specific Response</h3>
        </div>
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-sky-600" />
            <span className="text-sm font-bold text-sky-800">{selectedZone.name}</span>
            <span className="text-xs text-sky-600 capitalize">({selectedZone.type})</span>
          </div>
          <p className="text-sm text-sky-700 font-medium">{getLocalityFocus(selectedZone)}</p>
          <div className="mt-2 text-xs text-sky-600">
            <span className="font-semibold">Vulnerability profile:</span> {getVulnerabilityReason(selectedZone)}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-slate-500 leading-relaxed">
          HeatShield Decision-Support Recommendations — generated from application risk calculations and vulnerability data.
          Not official government orders or medical directives. Always follow official IMD and local authority guidance.
        </p>
      </div>
    </div>
  );
}
