// ============================================================
// HeatShield AI — Risk Scoring Engine
// "HeatShield Prototype Risk Score"
// This is an application decision-support score, NOT an
// internationally standardized index.
// ============================================================

import {
  WeatherData, ThermalMetrics, VulnerabilityData,
  RiskScore, RiskLevel, RiskWeights, DEFAULT_RISK_WEIGHTS,
} from '../types';

/**
 * Score thermal conditions (0-100)
 */
function scoreThermal(thermal: ThermalMetrics): number {
  // Based on Heat Index primarily
  if (thermal.heatIndex >= 54) return 100;
  if (thermal.heatIndex >= 46) return 90 + (thermal.heatIndex - 46) * 1.25;
  if (thermal.heatIndex >= 41) return 70 + (thermal.heatIndex - 41) * 4;
  if (thermal.heatIndex >= 33) return 40 + (thermal.heatIndex - 33) * 3.75;
  if (thermal.heatIndex >= 27) return 10 + (thermal.heatIndex - 27) * 5;
  return Math.max(0, thermal.heatIndex * 0.37);
}

/**
 * Score humidity contribution (0-100)
 */
function scoreHumidity(humidity: number, tempC: number): number {
  if (tempC < 27) return humidity * 0.3;
  const rhFactor = Math.max(0, humidity - 30) / 70;
  return Math.min(100, rhFactor * 100 * (tempC / 45));
}

/**
 * Score wind contribution (0-100, higher = worse)
 * Low wind = high risk (can't dissipate heat)
 */
function scoreWind(windSpeed: number): number {
  if (windSpeed >= 5) return 10;
  if (windSpeed >= 3) return 30;
  if (windSpeed >= 2) return 55;
  if (windSpeed >= 1) return 75;
  return 95;
}

/**
 * Score solar exposure (0-100)
 */
function scoreSolar(radiation: number, uvIndex: number): number {
  const radScore = Math.min(100, (radiation / 1000) * 100);
  const uvScore = Math.min(100, (uvIndex / 11) * 100);
  return radScore * 0.6 + uvScore * 0.4;
}

/**
 * Score vulnerability (0-100)
 */
function scoreVulnerability(vuln: VulnerabilityData): number {
  let score = 0;

  // Population density (0-25)
  score += Math.min(25, (vuln.populationDensity / 10000) * 25);

  // Elderly population (0-20)
  score += Math.min(20, (vuln.elderlyPercentage / 15) * 20);

  // Outdoor worker exposure (0-20)
  score += Math.min(20, (vuln.outdoorWorkerExposure / 100) * 20);

  // Healthcare access (0-15)
  if (vuln.healthcareAccessibility === 'low') score += 15;
  else if (vuln.healthcareAccessibility === 'medium') score += 8;
  else score += 2;

  // Cooling center access (0-10)
  if (vuln.coolingCenterAccess === 'low') score += 10;
  else if (vuln.coolingCenterAccess === 'medium') score += 5;
  else score += 1;

  // Acclimatization (0-10)
  if (vuln.acclimatizationLevel === 'low') score += 10;
  else if (vuln.acclimatizationLevel === 'medium') score += 5;
  else score += 2;

  return Math.min(100, score);
}

/**
 * Determine risk level from score
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return 'extreme';
  if (score >= 50) return 'high';
  if (score >= 25) return 'moderate';
  return 'low';
}

/**
 * Generate risk explanation factors
 */
function generateFactors(
  weather: WeatherData,
  thermal: ThermalMetrics,
  vulnerability: VulnerabilityData,
  thermalScore: number,
  humidityScore: number,
  windScore: number,
  solarScore: number,
): string[] {
  const factors: string[] = [];

  if (weather.temperature >= 40) factors.push('Extremely high air temperature');
  else if (weather.temperature >= 35) factors.push('High air temperature');

  if (weather.humidity >= 60 && weather.temperature >= 33) factors.push('High humidity reducing evaporative cooling');
  else if (weather.humidity >= 50 && weather.temperature >= 35) factors.push('Moderate humidity amplifying heat stress');

  if (weather.windSpeed < 1.5) factors.push('Very low wind reducing heat dissipation');
  else if (weather.windSpeed < 3) factors.push('Low wind limiting convective cooling');

  if (weather.solarRadiation >= 600) factors.push('Very high solar radiation exposure');
  else if (weather.solarRadiation >= 400) factors.push('Significant solar radiation exposure');

  if (thermal.heatIndex >= 50) factors.push('Dangerous heat index equivalent');
  else if (thermal.heatIndex >= 41) factors.push('High heat index indicating combined heat-humidity stress');

  if (thermal.wbgt >= 30) factors.push('WBGT at occupational danger level');

  if (vulnerability.outdoorWorkerExposure >= 60) factors.push('High outdoor worker exposure in zone');
  if (vulnerability.elderlyPercentage >= 10) factors.push('Significant elderly population at risk');
  if (vulnerability.healthcareAccessibility === 'low') factors.push('Limited healthcare accessibility');
  if (vulnerability.coolingCenterAccess === 'low') factors.push('Limited access to cooling centers');
  if (vulnerability.populationDensity >= 5000) factors.push('High population density increases impact');

  if (factors.length === 0) factors.push('Conditions within normal range');

  return factors;
}

/**
 * Calculate complete risk score
 */
export function calculateRisk(
  weather: WeatherData,
  thermal: ThermalMetrics,
  vulnerability: VulnerabilityData,
  weights: RiskWeights = DEFAULT_RISK_WEIGHTS,
): RiskScore {
  const thermalScore = scoreThermal(thermal);
  const humidityScore = scoreHumidity(weather.humidity, weather.temperature);
  const windScore = scoreWind(weather.windSpeed);
  const solarScore = scoreSolar(weather.solarRadiation, weather.uvIndex);
  const vulnScore = scoreVulnerability(vulnerability);

  // Weighted composite
  const totalWeight =
    weights.thermalConditions +
    weights.humidity +
    weights.wind +
    weights.solarExposure +
    weights.populationVulnerability;

  const overall = Math.round(
    (thermalScore * weights.thermalConditions +
      humidityScore * weights.humidity +
      windScore * weights.wind +
      solarScore * weights.solarExposure +
      vulnScore * weights.populationVulnerability) / totalWeight
  );

  const clampedOverall = Math.max(0, Math.min(100, overall));
  const level = getRiskLevel(clampedOverall);

  // Grouped 3-category model for explainability
  // The overall score is distributed proportionally into 3 groups based on
  // each group's raw weighted contribution. The remainder goes to the largest
  // group to guarantee: thermalHazard + exposure + vulnerability ≡ overall.
  //
  // Thermal Hazard (max 40): thermal(40%) + humidity(20%) + wind(10%)
  // Exposure (max 30): solar(15%) + wind(10%) + humidity(5%)
  // Vulnerability (max 30): pop. vulnerability(15%)
  const rawThermal = thermalScore * 0.40 + humidityScore * 0.20 + windScore * 0.10;
  const rawExposure = solarScore * 0.15 + windScore * 0.10 + humidityScore * 0.05;
  const rawVuln = vulnScore * 0.15;
  const rawTotal = rawThermal + rawExposure + rawVuln;

  let thermalHazardFinal: number;
  let exposureFinal: number;
  let vulnFinal: number;

  if (rawTotal === 0) {
    thermalHazardFinal = 0;
    exposureFinal = 0;
    vulnFinal = 0;
  } else {
    // Distribute overall proportionally by raw contribution
    const th = Math.round(clampedOverall * rawThermal / rawTotal);
    const ex = Math.round(clampedOverall * rawExposure / rawTotal);
    // Assign rounding remainder to largest group to guarantee sum
    thermalHazardFinal = Math.min(40, th + (clampedOverall - th - ex));
    exposureFinal = Math.min(30, ex);
    vulnFinal = Math.min(30, clampedOverall - thermalHazardFinal - exposureFinal);
  }

  const factors = generateFactors(
    weather, thermal, vulnerability,
    thermalScore, humidityScore, windScore, solarScore,
  );

  return {
    overall: clampedOverall,
    level,
    thermalComponent: Math.round(thermalScore),
    humidityComponent: Math.round(humidityScore),
    windComponent: Math.round(windScore),
    solarComponent: Math.round(solarScore),
    vulnerabilityComponent: Math.round(vulnScore),
    thermalHazard: thermalHazardFinal,
    exposure: exposureFinal,
    vulnerability: vulnFinal,
    // Weighted contributions — each sub-score × its weight
    // Remainder-based to guarantee they sum exactly to clampedOverall
    thermalContribution: Math.round(thermalScore * weights.thermalConditions),
    humidityContribution: Math.round(humidityScore * weights.humidity),
    windContribution: Math.round(windScore * weights.wind),
    solarContribution: Math.round(solarScore * weights.solarExposure),
    vulnContribution: clampedOverall
      - Math.round(thermalScore * weights.thermalConditions)
      - Math.round(humidityScore * weights.humidity)
      - Math.round(windScore * weights.wind)
      - Math.round(solarScore * weights.solarExposure),
    factors,
  };
}

/**
 * Population health impact estimation (relative risk)
 * Research/Prototype Estimate — Not a clinical mortality prediction.
 */
export function estimateRelativeRisk(score: RiskScore): {
  baseline: number;
  current: number;
  highScenario: number;
} {
  const base = 1.0;
  const current = 1 + (score.overall / 100) * 1.5;
  const highScenario = current * 1.3;
  return {
    baseline: base,
    current: Math.round(current * 100) / 100,
    highScenario: Math.round(highScenario * 100) / 100,
  };
}
