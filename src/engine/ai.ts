// ============================================================
// HeatShield AI — AI Action Advisor
// Deterministic fallback recommendation engine.
// If LLM API key is provided, can use it; otherwise uses
// rule-based generation from structured data.
// ============================================================

import { Zone, RiskLevel, RiskScore, VulnerabilityData, AIRecommendation, ForecastHour } from '../types';

// ---- Risk Driver Analysis ----

export interface RiskDriver {
  id: string;
  name: string;
  emoji: string;
  value: string;           // Current value display
  rawScore: number;        // 0-100 sub-component score
  contribution: number;    // Weighted contribution to overall score
  contributionLevel: 'LOW' | 'MODERATEATE' | 'HIGH' | 'VERY HIGH';
  explanation: string;     // Why this matters
  actionImplication: string; // What to do about it
}

export interface RiskAnalysis {
  drivers: RiskDriver[];   // All drivers, sorted by contribution descending
  top3: RiskDriver[];      // Top 3 contributors
  riskExplanation: string; // Natural language summary
  forecastChange: {
    exists: boolean;
    direction: 'rising' | 'falling' | 'stable';
    changes: { name: string; from: string; to: string; direction: 'up' | 'down' | 'same' }[];
    explanation: string;
  };
}

function classifyContribution(score: number, maxPossible: number): 'LOW' | 'MODERATEATE' | 'HIGH' | 'VERY HIGH' {
  const ratio = score / maxPossible;
  if (ratio >= 0.7) return 'VERY HIGH';
  if (ratio >= 0.45) return 'HIGH';
  if (ratio >= 0.2) return 'MODERATEATE';
  return 'LOW';
}

function getDriverExplanation(id: string, score: number, value: string): string {
  const explanations: Record<string, (s: number, v: string) => string> = {
    thermal: (s, v) => s >= 70
      ? `Heat Index of ${v} creates dangerous thermal stress conditions.`
      : s >= 40
      ? `Heat Index of ${v} produces elevated thermal stress.`
      : `Heat Index of ${v} is within manageable thermal conditions.`,
    humidity: (s, v) => s >= 50
      ? `Humidity at ${v} significantly reduces the body's evaporative cooling ability.`
      : s >= 25
      ? `Humidity at ${v} moderately amplifies heat stress.`
      : `Humidity at ${v} has limited impact on thermal stress.`,
    wind: (s, v) => s >= 60
      ? `Wind speed of ${v} provides very poor convective heat dissipation.`
      : s >= 35
      ? `Wind speed of ${v} provides limited convective cooling.`
      : `Wind speed of ${v} aids convective heat dissipation.`,
    solar: (s, v) => s >= 50
      ? `Solar radiation at ${v} adds significant radiant heat load.`
      : s >= 25
      ? `Solar radiation at ${v} contributes moderate radiant heat.`
      : `Solar radiation at ${v} has minimal radiant heat contribution.`,
    vulnerability: (s, v) => s >= 50
      ? `Population vulnerability factors in this zone significantly amplify heat risk impact.`
      : s >= 25
      ? `Moderate vulnerability factors increase community heat risk.`
      : `Low vulnerability factors limit community heat risk amplification.`,
  };
  return (explanations[id] || (() => 'No specific explanation available.'))(score, value);
}

function getActionImplication(id: string, score: number): string {
  const implications: Record<string, (s: number) => string> = {
    thermal: (s) => s >= 70
      ? 'Reduce outdoor exposure during peak heat. Activate cooling measures immediately.'
      : s >= 40
      ? 'Increase caution during peak heat exposure. Ensure hydration availability.'
      : 'Standard heat awareness measures are sufficient.',
    humidity: (s) => s >= 50
      ? 'Ensure adequate hydration — high humidity reduces sweating effectiveness.'
      : s >= 25
      ? 'Increase hydration frequency in humid conditions.'
      : 'Standard hydration guidance applies.',
    wind: (s) => s >= 60
      ? 'Deploy artificial cooling (fans, misting) where natural ventilation is poor.'
      : s >= 35
      ? 'Consider supplementary cooling in enclosed or low-airflow areas.'
      : 'Natural wind provides adequate convective cooling.',
    solar: (s) => s >= 50
      ? 'Provide shaded rest areas. Schedule outdoor work away from peak sun hours.'
      : s >= 25
      ? 'Ensure shaded rest areas are available for outdoor activities.'
      : 'Solar load is within normal range for outdoor activities.',
    vulnerability: (s) => s >= 50
      ? 'Prioritize welfare checks on elderly and vulnerable. Pre-position medical resources.'
      : s >= 25
      ? 'Increase monitoring of vulnerable populations during heat events.'
      : 'Standard community monitoring is adequate.',
  };
  return (implications[id] || (() => 'Monitor conditions.'))(score);
}

/**
 * Analyze risk drivers for a zone — ranked by contribution.
 */
export function analyzeRiskDrivers(zone: Zone, forecastHours: ForecastHour[] = []): RiskAnalysis {
  const r = zone.risk;
  const w = zone.weather;
  const t = zone.thermalMetrics;
  const v = zone.vulnerability;

  // Build drivers from the 5 sub-components
  const drivers: RiskDriver[] = [
    {
      id: 'thermal',
      name: 'Temperature & Heat Index',
      emoji: '🌡️',
      value: `${w.temperature}°C (HI: ${t.heatIndex}°C)`,
      rawScore: r.thermalComponent,
      contribution: r.thermalContribution,
      contributionLevel: classifyContribution(r.thermalContribution, 40),
      explanation: getDriverExplanation('thermal', r.thermalComponent, `${t.heatIndex}°C`),
      actionImplication: getActionImplication('thermal', r.thermalComponent),
    },
    {
      id: 'humidity',
      name: 'Humidity',
      emoji: '💧',
      value: `${w.humidity}%`,
      rawScore: r.humidityComponent,
      contribution: r.humidityContribution,
      contributionLevel: classifyContribution(r.humidityContribution, 20),
      explanation: getDriverExplanation('humidity', r.humidityComponent, `${w.humidity}%`),
      actionImplication: getActionImplication('humidity', r.humidityComponent),
    },
    {
      id: 'wind',
      name: 'Wind Speed',
      emoji: '💨',
      value: `${w.windSpeed} m/s`,
      rawScore: r.windComponent,
      contribution: r.windContribution,
      contributionLevel: classifyContribution(r.windContribution, 10),
      explanation: getDriverExplanation('wind', r.windComponent, `${w.windSpeed} m/s`),
      actionImplication: getActionImplication('wind', r.windComponent),
    },
    {
      id: 'solar',
      name: 'Solar / Radiation',
      emoji: '☀️',
      value: `${w.solarRadiation} W/m² (UV: ${w.uvIndex})`,
      rawScore: r.solarComponent,
      contribution: r.solarContribution,
      contributionLevel: classifyContribution(r.solarContribution, 15),
      explanation: getDriverExplanation('solar', r.solarComponent, `${w.solarRadiation} W/m²`),
      actionImplication: getActionImplication('solar', r.solarComponent),
    },
    {
      id: 'vulnerability',
      name: 'Population Vulnerability',
      emoji: '👥',
      value: `${v.outdoorWorkerExposure}% workers · ${v.elderlyPercentage}% elderly · ${v.populationDensity.toLocaleString()}/km²`,
      rawScore: r.vulnerabilityComponent,
      contribution: r.vulnContribution,
      contributionLevel: classifyContribution(r.vulnContribution, 15),
      explanation: getDriverExplanation('vulnerability', r.vulnerabilityComponent, ''),
      actionImplication: getActionImplication('vulnerability', r.vulnerabilityComponent),
    },
  ];

  // Sort by contribution descending
  drivers.sort((a, b) => b.contribution - a.contribution);
  const top3 = drivers.slice(0, 3);

  // Generate natural language explanation from top drivers
  const activeDrivers = drivers.filter(d => d.contributionLevel !== 'LOW');
  let riskExplanation = '';
  if (activeDrivers.length === 0) {
    riskExplanation = `Conditions in ${zone.name} are within normal range. Risk level is ${r.level.toUpperCase()} (${r.overall}/100).`;
  } else {
    const names = activeDrivers.map(d => d.name.toLowerCase());
    const driverList = names.length <= 2
      ? names.join(' and ')
      : names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
    riskExplanation = `${activeDrivers[0].name} combined with ${names.length > 1 ? names[1] : 'current conditions'} is driving the ${r.level.toUpperCase()} Risk classification (${r.overall}/100) in ${zone.name}.`;
    if (r.level === 'extreme' || r.level === 'high') {
      riskExplanation += ` Immediate action is recommended.`;
    }
  }

  // Forecast change analysis
  let forecastChange: RiskAnalysis['forecastChange'] = { exists: false, direction: 'stable', changes: [], explanation: '' };
  if (forecastHours.length > 0) {
    const peakHours = forecastHours.filter(h => h.risk.level === 'high' || h.risk.level === 'extreme');
    if (peakHours.length > 0) {
      const peakHour = peakHours.reduce((w, h) => h.risk.overall > w.risk.overall ? h : w, peakHours[0]);
      const currentScore = r.overall;
      const futureScore = peakHour.risk.overall;
      const direction = futureScore > currentScore + 3 ? 'rising' : futureScore < currentScore - 3 ? 'falling' : 'stable';

      const changes: RiskAnalysis['forecastChange']['changes'] = [];
      if (peakHour.weather.temperature > w.temperature + 1) {
        changes.push({ name: 'Temperature', from: `${w.temperature}°C`, to: `${peakHour.weather.temperature}°C`, direction: 'up' });
      } else if (peakHour.weather.temperature < w.temperature - 1) {
        changes.push({ name: 'Temperature', from: `${w.temperature}°C`, to: `${peakHour.weather.temperature}°C`, direction: 'down' });
      }
      if (peakHour.weather.humidity > w.humidity + 5) {
        changes.push({ name: 'Humidity', from: `${w.humidity}%`, to: `${peakHour.weather.humidity}%`, direction: 'up' });
      } else if (peakHour.weather.humidity < w.humidity - 5) {
        changes.push({ name: 'Humidity', from: `${w.humidity}%`, to: `${peakHour.weather.humidity}%`, direction: 'down' });
      }
      if (peakHour.weather.windSpeed < w.windSpeed - 0.5) {
        changes.push({ name: 'Wind', from: `${w.windSpeed} m/s`, to: `${peakHour.weather.windSpeed} m/s`, direction: 'down' });
      } else if (peakHour.weather.windSpeed > w.windSpeed + 0.5) {
        changes.push({ name: 'Wind', from: `${w.windSpeed} m/s`, to: `${peakHour.weather.windSpeed} m/s`, direction: 'up' });
      }
      if (peakHour.thermalMetrics.heatIndex > t.heatIndex + 2) {
        changes.push({ name: 'Thermal Stress', from: `HI ${t.heatIndex}°C`, to: `HI ${peakHour.thermalMetrics.heatIndex}°C`, direction: 'up' });
      }

      const changeDesc = changes.map(c => `${c.name} ${c.direction === 'up' ? '↑' : c.direction === 'down' ? '↓' : '→'}`).join(', ');
      forecastChange = {
        exists: true,
        direction,
        changes,
        explanation: direction === 'rising'
          ? `Risk is expected to RISE to ${futureScore}/100 (${peakHour.risk.level.toUpperCase()}) during the peak period. Key changes: ${changeDesc}.`
          : direction === 'falling'
          ? `Risk is expected to FALL from current levels. ${changeDesc}.`
          : `Risk is expected to remain STABLE around ${futureScore}/100.`,
      };
    }
  }

  return { drivers, top3, riskExplanation, forecastChange };
}

const ADMIN_RECOMMENDATIONS: Record<RiskLevel, string[]> = {
  low: [
    'Continue routine monitoring of weather conditions.',
    'Ensure public cooling spaces remain operational.',
    'Distribute heat awareness materials in community areas.',
  ],
  moderate: [
    'Issue public heat advisory through local channels.',
    'Increase hydration availability in public spaces.',
    'Monitor outdoor worker schedules.',
    'Prepare cooling centers for potential activation.',
    'Notify schools to ensure water availability.',
  ],
  high: [
    'Activate cooling centers in high-risk zones.',
    'Issue mandatory heat advisory for outdoor workers.',
    'Reschedule non-essential outdoor municipal work.',
    'Increase emergency medical preparedness.',
    'Deploy mobile water distribution in vulnerable areas.',
    'Notify hospitals to prepare for heat-related cases.',
    'Alert schools for early dismissal consideration.',
  ],
  extreme: [
    'Declare heat emergency in affected zones.',
    'Activate all cooling centers immediately.',
    'Issue emergency public heat warnings.',
    'Mandatory suspension of outdoor work 12:00–4:00 PM.',
    'Deploy emergency ambulance standby in extreme zones.',
    'Activate hospital heat-wave protocols.',
    'Prioritize welfare checks on elderly and vulnerable.',
    'Coordinate with district disaster management.',
    'Ensure uninterrupted water supply in all zones.',
    'Set up emergency medical camps in high-vulnerability areas.',
  ],
};

const CITIZEN_RECOMMENDATIONS: Record<RiskLevel, string[]> = {
  low: [
    'Stay hydrated throughout the day.',
    'Wear light-colored, loose-fitting clothing.',
    'Keep windows and curtains closed during peak sun.',
  ],
  moderate: [
    'Avoid prolonged outdoor exposure during midday.',
    'Carry water when going outside.',
    'Take rest breaks in shaded areas.',
    'Check on elderly neighbors and family.',
    'Watch for signs of heat exhaustion: dizziness, nausea, heavy sweating.',
  ],
  high: [
    'Stay indoors during peak heat hours (11 AM – 4 PM).',
    'Use fans or air conditioning if available.',
    'Drink water frequently — at least 3 liters/day.',
    'Avoid physical exertion during peak hours.',
    'Visit a cooling center if your home is not cool.',
    'Check on elderly and vulnerable people regularly.',
    'Seek medical help immediately if you feel faint or confused.',
  ],
  extreme: [
    'DO NOT go outside during peak hours unless absolutely necessary.',
    'If you must go out, carry water, wear sun protection, and take breaks.',
    'Stay in air-conditioned or cool spaces.',
    'Drink water continuously — do not wait until thirsty.',
    'Watch for heat stroke symptoms: no sweating, confusion, hot skin.',
    'Call emergency services (108) for heat-related emergencies.',
    'Check on all elderly and vulnerable family members and neighbors.',
    'Keep children indoors and ensure they stay hydrated.',
    'Follow official local health and meteorological guidance.',
  ],
};

const WORKER_RECOMMENDATIONS: Record<RiskLevel, string[]> = {
  low: [
    'Standard hydration: 200ml every 20 minutes.',
    'Take short breaks in shade every hour.',
    'Monitor colleagues for heat symptoms.',
  ],
  moderate: [
    'Increase hydration: 250ml every 15 minutes.',
    'Mandatory 10-minute shade break every hour.',
    'Reschedule heavy work to cooler hours if possible.',
    'Use buddy system to monitor heat symptoms.',
  ],
  high: [
    'Reduce work intensity during peak hours.',
    'Mandatory 15-minute cool-down breaks every 45 minutes.',
    'Work-rest cycle: 45 min work / 15 min rest.',
    'Ensure immediate access to drinking water.',
    'Provide shaded rest areas at work site.',
    'Postpone non-critical heavy work to early morning or evening.',
  ],
  extreme: [
    'SUSPEND outdoor work during peak hours (11 AM – 4 PM).',
    'If work cannot stop, limit to 30 min work / 30 min rest.',
    'Ensure on-site first-aid and water supply.',
    'Monitor workers for heat stroke symptoms continuously.',
    'Have emergency transport ready for heat casualties.',
    'Resume outdoor work only when conditions improve.',
  ],
};

/**
 * Generate AI recommendations for district administration
 */
export function getAdminRecommendations(zone: Zone): AIRecommendation {
  const level = zone.risk.level;
  return {
    targetAudience: 'District Administration & Municipal Authorities',
    actions: ADMIN_RECOMMENDATIONS[level],
    priority: level,
    dataGrounding: [
      `Zone: ${zone.name}`,
      `Temperature: ${zone.weather.temperature}°C`,
      `Humidity: ${zone.weather.humidity}%`,
      `Risk Score: ${zone.risk.overall}/100 (${level.toUpperCase()})`,
      `Vulnerable population: ${zone.vulnerability.communityVulnerability}`,
      `Outdoor worker exposure: ${zone.vulnerability.outdoorWorkerExposure}%`,
    ],
  };
}

/**
 * Generate AI recommendations for citizens
 */
export function getCitizenRecommendations(zone: Zone): AIRecommendation {
  const level = zone.risk.level;
  return {
    targetAudience: 'Citizens & General Public',
    actions: CITIZEN_RECOMMENDATIONS[level],
    priority: level,
    dataGrounding: [
      `Your area: ${zone.name}`,
      `Current risk: ${level.toUpperCase()}`,
      `Heat Index equivalent: ${zone.risk.thermalComponent}°C`,
      `Peak danger: Midday to late afternoon`,
    ],
  };
}

/**
 * Generate AI recommendations for outdoor workers
 */
export function getWorkerRecommendations(zone: Zone): AIRecommendation {
  const level = zone.risk.level;
  return {
    targetAudience: 'Outdoor Workers & Employers',
    actions: WORKER_RECOMMENDATIONS[level],
    priority: level,
    dataGrounding: [
      `Zone: ${zone.name}`,
      `WBGT: ${zone.thermalMetrics.wbgt}°C`,
      `Risk Score: ${zone.risk.overall}/100`,
      `Workplace heat stress level: ${level.toUpperCase()}`,
    ],
  };
}

/**
 * Generate zone risk explanation
 */
export function explainZoneRisk(zone: Zone): string {
  const w = zone.weather;
  const r = zone.risk;
  const v = zone.vulnerability;

  let explanation = `**${zone.name}** is at **${r.level.toUpperCase()}** risk `;
  explanation += `(${r.overall}/100) because:\n\n`;

  r.factors.forEach(f => {
    explanation += `• ${f}\n`;
  });

  if (v.outdoorWorkerExposure >= 60) {
    explanation += `\nWith ${v.outdoorWorkerExposure}% outdoor worker exposure, this zone needs immediate workplace safety measures.`;
  }

  if (v.healthcareAccessibility === 'low') {
    explanation += `\nLimited healthcare access in this area increases vulnerability — consider pre-positioning medical teams.`;
  }

  return explanation;
}

/**
 * Generate district-level briefing summary
 */
export function generateDistrictBriefing(zones: Zone[]): string {
  const extremeZones = zones.filter(z => z.risk.level === 'extreme');
  const highZones = zones.filter(z => z.risk.level === 'high');
  const totalPopAtRisk = zones
    .filter(z => z.risk.level === 'extreme' || z.risk.level === 'high')
    .reduce((sum, z) => sum + z.population, 0);

  let briefing = `## District Heat Risk Briefing\n\n`;
  briefing += `**Zones at Extreme Risk:** ${extremeZones.length}\n`;
  briefing += `**Zones at High Risk:** ${highZones.length}\n`;
  briefing += `**Estimated Population at High+ Risk:** ${totalPopAtRisk.toLocaleString()}\n\n`;

  if (extremeZones.length > 0) {
    briefing += `### Immediate Actions Required:\n`;
    briefing += `• Activate emergency cooling centers in: ${extremeZones.map(z => z.name).join(', ')}\n`;
    briefing += `• Issue emergency heat warnings\n`;
    briefing += `• Suspend outdoor work 11 AM – 4 PM\n`;
    briefing += `• Deploy emergency medical teams\n\n`;
  }

  briefing += `### Priority Monitoring:\n`;
  zones.forEach(z => {
    briefing += `• ${z.name}: ${z.risk.overall}/100 (${z.risk.level.toUpperCase()})\n`;
  });

  briefing += `\n*Disclaimer: This is AI-generated guidance from application data. Always follow official IMD and local government directives.*`;

  return briefing;
}

/**
 * Natural language query handler (deterministic fallback)
 */
export function handleQuery(query: string, zones: Zone[]): string {
  const q = query.toLowerCase();

  if (q.includes('dangerous') || q.includes('highest risk') || q.includes('most dangerous')) {
    const sorted = [...zones].sort((a, b) => b.risk.overall - a.risk.overall);
    let answer = `**Most Dangerous Zones Right Now:**\n\n`;
    sorted.forEach((z, i) => {
      answer += `${i + 1}. **${z.name}** — Risk: ${z.risk.overall}/100 (${z.risk.level.toUpperCase()})\n`;
      answer += `   Temp: ${z.weather.temperature}°C, Humidity: ${z.weather.humidity}%\n`;
    });
    return answer;
  }

  if (q.includes('katpadi') || q.includes('why')) {
    const katpadi = zones.find(z => z.id === 'katpadi');
    if (katpadi) {
      return explainZoneRisk(katpadi);
    }
  }

  if (q.includes('cooling center') || q.includes('cooling')) {
    return `**Cooling Centers:**\n\nActive cooling centers should be deployed in zones with risk level HIGH or EXTREME. Priority areas based on current data:\n\n` +
      zones.filter(z => z.risk.level === 'extreme' || z.risk.level === 'high')
        .map(z => `• **${z.name}** (${z.risk.level.toUpperCase()}) — ${z.vulnerability.coolingCenterAccess} access`)
        .join('\n');
  }

  if (q.includes('admin') || q.includes('government') || q.includes('district')) {
    const worstZone = [...zones].sort((a, b) => b.risk.overall - a.risk.overall)[0];
    const recs = getAdminRecommendations(worstZone);
    return `**District Administration Recommendations (Priority: ${worstZone.name}):**\n\n` +
      recs.actions.map(a => `• ${a}`).join('\n');
  }

  return `I can help with:\n• "Which zones are most dangerous?"\n• "Why is Katpadi at risk?"\n• "Where do we need cooling centers?"\n• "What should the administration do?"\n\nPlease try one of these questions.`;
}
