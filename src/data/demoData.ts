// ============================================================
// HeatShield AI — Static Zone Metadata, Infrastructure Data
// AND Realistic Demo Weather Data (Priority 3 fallback)
// ============================================================

import {
  ZoneMetadata, VulnerabilityData, CoolingCenter,
  Hospital, WeatherData, ThermalMetrics, RiskScore,
  Zone, ForecastDay, ForecastHour, RiskLevel,
} from '../types';
import { calculateThermalMetrics } from '../engine/thermal';
import { calculateRisk } from '../engine/risk';

// ---- Vulnerability Profiles ----
const vulnVelloreCentral: VulnerabilityData = {
  populationDensity: 5400,
  elderlyPercentage: 8.7,
  childPercentage: 12.3,
  outdoorWorkerExposure: 45,
  healthcareAccessibility: 'medium',
  coolingCenterAccess: 'medium',
  waterAccess: 'high',
  acclimatizationLevel: 'high',
  communityVulnerability: 'moderate',
};

const vulnKatpadi: VulnerabilityData = {
  populationDensity: 4200,
  elderlyPercentage: 10.1,
  childPercentage: 14.0,
  outdoorWorkerExposure: 62,
  healthcareAccessibility: 'low',
  coolingCenterAccess: 'low',
  waterAccess: 'medium',
  acclimatizationLevel: 'medium',
  communityVulnerability: 'high',
};

const vulnIndustrial: VulnerabilityData = {
  populationDensity: 2800,
  elderlyPercentage: 5.2,
  childPercentage: 8.1,
  outdoorWorkerExposure: 85,
  healthcareAccessibility: 'medium',
  coolingCenterAccess: 'low',
  waterAccess: 'medium',
  acclimatizationLevel: 'medium',
  communityVulnerability: 'high',
};

const vulnRural: VulnerabilityData = {
  populationDensity: 1200,
  elderlyPercentage: 12.5,
  childPercentage: 16.0,
  outdoorWorkerExposure: 78,
  healthcareAccessibility: 'low',
  coolingCenterAccess: 'low',
  waterAccess: 'low',
  acclimatizationLevel: 'medium',
  communityVulnerability: 'extreme',
};

const vulnResidential: VulnerabilityData = {
  populationDensity: 7200,
  elderlyPercentage: 9.0,
  childPercentage: 13.5,
  outdoorWorkerExposure: 35,
  healthcareAccessibility: 'high',
  coolingCenterAccess: 'high',
  waterAccess: 'high',
  acclimatizationLevel: 'high',
  communityVulnerability: 'moderate',
};

const vulnMelvisharam: VulnerabilityData = {
  populationDensity: 3800,
  elderlyPercentage: 9.5,
  childPercentage: 13.8,
  outdoorWorkerExposure: 70,
  healthcareAccessibility: 'low',
  coolingCenterAccess: 'low',
  waterAccess: 'medium',
  acclimatizationLevel: 'medium',
  communityVulnerability: 'high',
};

const vulnArcot: VulnerabilityData = {
  populationDensity: 2100,
  elderlyPercentage: 11.2,
  childPercentage: 15.5,
  outdoorWorkerExposure: 72,
  healthcareAccessibility: 'low',
  coolingCenterAccess: 'low',
  waterAccess: 'low',
  acclimatizationLevel: 'low',
  communityVulnerability: 'extreme',
};

// ---- ZONE METADATA ----
export const zoneMetadata: ZoneMetadata[] = [
  { id: 'vellore-central', name: 'Vellore Central', lat: 12.9165, lng: 79.1325, vulnerability: vulnVelloreCentral, population: 280000, type: 'urban' },
  { id: 'katpadi', name: 'Katpadi', lat: 12.9634, lng: 79.1406, vulnerability: vulnKatpadi, population: 120000, type: 'residential' },
  { id: 'industrial-zone', name: 'Industrial Zone', lat: 12.8900, lng: 79.1600, vulnerability: vulnIndustrial, population: 45000, type: 'industrial' },
  { id: 'rural-zone', name: 'Rural Zone (Pernambut)', lat: 12.9300, lng: 78.9700, vulnerability: vulnRural, population: 35000, type: 'rural' },
  { id: 'dense-residential', name: 'Dense Residential (Sathuvachari)', lat: 12.9450, lng: 79.1100, vulnerability: vulnResidential, population: 95000, type: 'residential' },
  { id: 'arani-road', name: 'Arani Road Area', lat: 12.9100, lng: 79.1600, vulnerability: vulnKatpadi, population: 65000, type: 'commercial' },
  { id: 'melvisharam', name: 'Melvisharam', lat: 12.9290, lng: 79.0640, vulnerability: vulnMelvisharam, population: 52000, type: 'industrial' },
  { id: 'arcot', name: 'Arcot', lat: 12.9049, lng: 79.3187, vulnerability: vulnArcot, population: 48000, type: 'rural' },
];

// ---- DEMO WEATHER DATA (Priority 3 fallback) ----
// Realistic Vellore afternoon values. Clearly labelled as DEMO.

interface DemoWeatherEntry {
  temperature: number;
  humidity: number;
  windSpeed: number;
  solarRadiation: number;
}

const demoWeatherByZone: Record<string, DemoWeatherEntry> = {
  'vellore-central':      { temperature: 38.5, humidity: 62, windSpeed: 2.8, solarRadiation: 580 },
  'katpadi':              { temperature: 39.2, humidity: 58, windSpeed: 2.1, solarRadiation: 620 },
  'industrial-zone':      { temperature: 40.1, humidity: 55, windSpeed: 2.5, solarRadiation: 650 },
  'rural-zone':           { temperature: 37.8, humidity: 52, windSpeed: 1.6, solarRadiation: 700 },
  'dense-residential':    { temperature: 38.0, humidity: 65, windSpeed: 3.0, solarRadiation: 540 },
  'arani-road':           { temperature: 39.5, humidity: 60, windSpeed: 2.3, solarRadiation: 610 },
  'melvisharam':          { temperature: 40.3, humidity: 57, windSpeed: 2.0, solarRadiation: 640 },
  'arcot':                { temperature: 39.8, humidity: 54, windSpeed: 1.4, solarRadiation: 680 },
};
// Note: Melvisharam is slightly hotter due to industrial heat island.
// Arcot has higher solar exposure and lower wind due to open terrain.

// Hourly demo data: temperature profile across 24 hours for each zone
// Different zones have distinct diurnal profiles
const demoHourlyProfiles: Record<string, {
  temps: number[];
  humids: number[];
  winds: number[];
  solars: number[];
}> = {
  'vellore-central': {
    temps: [27.0,27.5,28.0,29.0,30.5,32.0,33.5,35.0,36.5,38.0,38.5,38.5,38.0,37.5,36.5,35.0,33.5,32.0,30.5,29.5,28.5,28.0,27.5,27.0],
    humids: [82,80,78,74,70,66,62,58,54,52,50,48,50,52,55,58,62,66,70,74,78,80,81,82],
    winds: [1.2,1.1,1.0,1.3,1.8,2.2,2.5,2.8,3.0,3.2,2.8,2.5,2.3,2.5,2.8,3.0,2.8,2.5,2.2,1.8,1.5,1.3,1.2,1.2],
    solars: [0,0,0,10,80,200,350,480,550,580,570,520,450,350,230,120,40,0,0,0,0,0,0,0],
  },
  'katpadi': {
    temps: [27.5,28.0,28.5,29.5,31.0,33.0,35.0,36.5,38.0,39.0,39.2,39.0,38.5,37.8,36.5,35.0,33.5,31.5,30.0,29.0,28.5,28.0,27.8,27.5],
    humids: [80,78,75,70,66,62,56,52,48,46,44,43,45,48,52,56,60,65,70,74,77,79,80,80],
    winds: [0.8,0.7,0.6,0.8,1.2,1.5,1.8,2.0,2.2,2.1,2.0,1.8,1.8,2.0,2.2,2.5,2.3,2.0,1.8,1.5,1.2,1.0,0.9,0.8],
    solars: [0,0,0,15,90,220,380,510,590,620,610,560,480,370,240,130,45,0,0,0,0,0,0,0],
  },
  'industrial-zone': {
    temps: [28.0,28.5,29.0,30.0,32.0,34.0,36.0,37.5,39.0,40.0,40.1,39.8,39.2,38.5,37.0,35.5,34.0,32.5,31.0,30.0,29.2,28.8,28.3,28.0],
    humids: [78,76,73,68,63,58,53,49,45,43,42,43,45,48,52,56,60,65,70,73,76,77,78,78],
    winds: [1.0,0.9,0.8,1.1,1.5,1.9,2.2,2.5,2.7,2.5,2.3,2.2,2.3,2.5,2.8,3.0,2.8,2.5,2.2,1.8,1.5,1.2,1.1,1.0],
    solars: [0,0,0,20,100,240,410,550,630,650,640,590,510,390,260,140,50,0,0,0,0,0,0,0],
  },
  'rural-zone': {
    temps: [26.5,27.0,27.5,28.5,30.0,31.5,33.0,34.5,36.0,37.5,37.8,37.5,37.0,36.5,35.5,34.0,32.5,31.0,29.5,28.5,27.8,27.2,26.8,26.5],
    humids: [85,83,80,76,72,68,63,58,53,50,48,47,49,52,56,60,65,70,75,79,82,84,85,85],
    winds: [0.6,0.5,0.5,0.7,1.0,1.3,1.5,1.6,1.8,1.6,1.5,1.4,1.5,1.7,1.9,2.0,1.8,1.5,1.3,1.0,0.8,0.7,0.6,0.6],
    solars: [0,0,0,25,110,260,440,580,670,700,690,640,550,420,280,150,55,0,0,0,0,0,0,0],
  },
  'dense-residential': {
    temps: [27.0,27.5,28.0,29.0,30.5,32.0,33.5,35.0,36.5,37.8,38.0,37.8,37.5,37.0,36.0,34.5,33.0,31.5,30.0,29.0,28.2,27.8,27.3,27.0],
    humids: [84,82,80,76,72,68,64,60,56,54,52,51,53,56,60,64,68,72,76,80,83,84,84,84],
    winds: [1.5,1.4,1.2,1.5,2.0,2.5,2.8,3.0,3.2,3.0,2.8,2.7,2.8,3.0,3.2,3.5,3.2,2.8,2.5,2.0,1.8,1.6,1.5,1.5],
    solars: [0,0,0,8,70,180,320,430,500,540,530,480,410,320,210,110,35,0,0,0,0,0,0,0],
  },
  'arani-road': {
    temps: [27.5,28.0,28.5,29.5,31.5,33.5,35.5,37.0,38.5,39.3,39.5,39.2,38.8,38.0,36.8,35.2,33.8,32.0,30.5,29.5,28.8,28.2,27.8,27.5],
    humids: [80,78,75,71,66,62,57,53,48,46,45,44,46,49,53,57,62,67,72,76,79,80,80,80],
    winds: [0.9,0.8,0.7,1.0,1.4,1.8,2.0,2.3,2.5,2.3,2.1,2.0,2.1,2.3,2.6,2.8,2.6,2.3,2.0,1.6,1.3,1.1,1.0,0.9],
    solars: [0,0,0,12,85,210,370,500,580,610,600,550,470,360,240,130,42,0,0,0,0,0,0,0],
  },
  'melvisharam': {
    temps: [27.8,28.3,29.0,30.2,32.0,34.0,36.0,37.5,39.0,40.0,40.3,40.0,39.5,38.8,37.2,35.5,34.0,32.5,31.0,30.0,29.0,28.5,28.0,27.8],
    humids: [76,74,70,65,60,55,50,47,44,42,41,42,44,47,51,55,60,65,70,73,75,76,76,76],
    winds: [0.8,0.7,0.6,0.9,1.3,1.6,1.8,2.0,2.1,2.0,1.9,1.8,1.9,2.0,2.2,2.4,2.2,2.0,1.8,1.5,1.2,1.0,0.9,0.8],
    solars: [0,0,0,18,95,230,400,540,620,640,635,590,500,380,250,135,48,0,0,0,0,0,0,0],
  },
  'arcot': {
    temps: [27.0,27.5,28.2,29.5,31.5,33.5,35.5,37.0,38.5,39.5,39.8,39.5,39.0,38.2,37.0,35.5,34.0,32.0,30.5,29.5,28.5,27.8,27.2,27.0],
    humids: [78,76,72,67,62,57,52,48,44,42,40,41,43,46,50,55,60,66,72,75,77,78,78,78],
    winds: [0.5,0.4,0.4,0.6,0.9,1.1,1.3,1.4,1.5,1.4,1.3,1.2,1.3,1.4,1.6,1.8,1.7,1.5,1.3,1.0,0.8,0.6,0.5,0.5],
    solars: [0,0,0,22,105,255,430,570,660,680,675,630,540,410,270,145,52,0,0,0,0,0,0,0],
  },
};

function estimateUVIndex(solarWm2: number): number {
  if (solarWm2 <= 0) return 0;
  return Math.round(Math.min(11, (solarWm2 / 1000) * 11) * 10) / 10;
}

function calcDewPoint(tempC: number, rh: number): number {
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(rh / 100);
  return Math.round(((b * alpha) / (a - alpha)) * 10) / 10;
}

/**
 * Create a demo WeatherData from raw values
 */
function makeDemoWeather(temp: number, humidity: number, wind: number, solar: number): WeatherData {
  return {
    temperature: Math.round(temp * 10) / 10,
    humidity,
    windSpeed: Math.round(wind * 10) / 10,
    solarRadiation: Math.round(solar),
    uvIndex: estimateUVIndex(solar),
    dewPoint: calcDewPoint(temp, humidity),
    timestamp: new Date(),
    source: 'Demo / Simulated Data',
  };
}

/**
 * Generate a 24-hour demo forecast for a zone
 */
function generateDemoForecast(zoneId: string): ForecastDay {
  const profile = demoHourlyProfiles[zoneId] || demoHourlyProfiles['vellore-central'];
  const vuln = zoneMetadata.find(z => z.id === zoneId)?.vulnerability || vulnVelloreCentral;
  const hours: ForecastHour[] = [];
  let peakStart = '';
  let peakEnd = '';
  let peakLevel: RiskLevel = 'low';
  let inPeak = false;

  for (let i = 0; i < 24; i++) {
    const weather = makeDemoWeather(profile.temps[i], profile.humids[i], profile.winds[i], profile.solars[i]);
    const thermalMetrics = calculateThermalMetrics(weather);
    const risk = calculateRisk(weather, thermalMetrics, vuln);
    const timeStr = `${String(i).padStart(2, '0')}:00`;

    hours.push({ hour: i, time: timeStr, weather, thermalMetrics, risk });

    if (risk.level === 'extreme' || risk.level === 'high') {
      if (!inPeak) { peakStart = timeStr; inPeak = true; }
      peakEnd = timeStr;
      if (risk.level === 'extreme') peakLevel = 'extreme';
      else if (peakLevel !== 'extreme') peakLevel = 'high';
    } else if (inPeak) { inPeak = false; }
  }

  let peakWindow = 'N/A';
  if (peakStart && peakEnd) {
    const fmt = (t: string) => {
      const [h] = t.split(':').map(Number);
      if (h === 0) return '12:00 AM';
      if (h < 12) return `${h}:00 AM`;
      if (h === 12) return '12:00 PM';
      return `${h - 12}:00 PM`;
    };
    peakWindow = `${fmt(peakStart)} – ${fmt(peakEnd)}`;
  }

  return {
    date: new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    hours,
    peakRiskWindow: peakWindow,
    peakRiskLevel: peakLevel,
  };
}

/**
 * Get complete demo zones (weather + thermal + risk + forecast) for a given zone id.
 * Used as Priority 3 fallback when API and cache both fail.
 */
export function getDemoZone(zoneId: string): Zone | null {
  const meta = zoneMetadata.find(z => z.id === zoneId);
  if (!meta) return null;

  const entry = demoWeatherByZone[zoneId] || demoWeatherByZone['vellore-central'];
  const weather = makeDemoWeather(entry.temperature, entry.humidity, entry.windSpeed, entry.solarRadiation);
  const thermalMetrics = calculateThermalMetrics(weather);
  const risk = calculateRisk(weather, thermalMetrics, meta.vulnerability);

  return {
    ...meta,
    weather,
    thermalMetrics,
    risk,
  };
}

/**
 * Get demo forecast for a zone.
 */
export function getDemoForecast(zoneId: string): ForecastDay {
  return generateDemoForecast(zoneId);
}

/**
 * Get all demo zones at once.
 */
export function getAllDemoZones(): Zone[] {
  return zoneMetadata
    .map(meta => getDemoZone(meta.id))
    .filter((z): z is Zone => z !== null);
}

// ---- COOLING CENTERS ----
export const coolingCenters: CoolingCenter[] = [
  { id: 'cc1', name: 'Vellore Community Cooling Center', lat: 12.9180, lng: 79.1300, distance: 1.2, capacity: 120, status: 'open', waterAvailable: true, accessibility: 'wheelchair', contact: '0416-2222222' },
  { id: 'cc2', name: 'Municipal Corporation Relief Center', lat: 12.9200, lng: 79.1280, distance: 0.8, capacity: 200, status: 'open', waterAvailable: true, accessibility: 'full', contact: '0416-2233333' },
  { id: 'cc3', name: 'Katpadi School Ground Cooling Area', lat: 12.9650, lng: 79.1420, distance: 5.2, capacity: 80, status: 'open', waterAvailable: true, accessibility: 'limited', contact: '0416-2244444' },
  { id: 'cc4', name: 'Industrial Zone Worker Rest Center', lat: 12.8920, lng: 79.1580, distance: 3.5, capacity: 150, status: 'open', waterAvailable: true, accessibility: 'full', contact: '0416-2255555' },
  { id: 'cc5', name: 'Sathuvachari Community Hall', lat: 12.9470, lng: 79.1120, distance: 2.1, capacity: 100, status: 'closed', waterAvailable: false, accessibility: 'limited', contact: '0416-2266666' },
];

// ---- HOSPITALS ----
export const hospitals: Hospital[] = [
  { id: 'h1', name: 'CMC Vellore', lat: 12.9228, lng: 79.1360, beds: 2500, emergencyCapacity: 150 },
  { id: 'h2', name: 'Government Vellore Medical College Hospital', lat: 12.9150, lng: 79.1250, beds: 800, emergencyCapacity: 60 },
  { id: 'h3', name: 'Vinayaka Mission Medical College', lat: 12.9050, lng: 79.1500, beds: 600, emergencyCapacity: 40 },
  { id: 'h4', name: 'SRM Medical College Hospital', lat: 12.9350, lng: 79.1050, beds: 400, emergencyCapacity: 30 },
];

// ---- SCHOOLS ----
export const schools = [
  { id: 's1', name: 'Vellore Government Higher Secondary School', lat: 12.9175, lng: 79.1340 },
  { id: 's2', name: "St. Joseph's Boys Higher Secondary School", lat: 12.9190, lng: 79.1280 },
  { id: 's3', name: 'Katpadi Government School', lat: 12.9640, lng: 79.1390 },
  { id: 's4', name: 'Sathuvachari Municipal School', lat: 12.9440, lng: 79.1110 },
];

export const defaultZoneId = 'vellore-central';
