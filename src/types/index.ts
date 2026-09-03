// ============================================================
// HeatShield AI — Core Type Definitions
// ============================================================

// ---- Risk Levels ----
export type RiskLevel = 'low' | 'moderate' | 'high' | 'extreme';

export interface RiskLevelInfo {
  level: RiskLevel;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
  description: string;
}

export const RISK_LEVELS: Record<RiskLevel, RiskLevelInfo> = {
  low: {
    level: 'low',
    label: 'LOW',
    color: '#22c55e',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    emoji: '🟢',
    description: 'Minimal heat stress risk',
  },
  moderate: {
    level: 'moderate',
    label: 'MODERATE',
    color: '#eab308',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    emoji: '🟡',
    description: 'Elevated heat stress — vulnerable groups at risk',
  },
  high: {
    level: 'high',
    label: 'HIGH',
    color: '#f97316',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    emoji: '🟠',
    description: 'Dangerous heat conditions — action required',
  },
  extreme: {
    level: 'extreme',
    label: 'EXTREME',
    color: '#ef4444',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    emoji: '🔴',
    description: 'Life-threatening heat — emergency measures needed',
  },
};

// ---- Weather Data ----
export interface WeatherData {
  temperature: number;       // °C
  humidity: number;          // %
  windSpeed: number;         // m/s
  windDirection?: number;    // degrees
  solarRadiation: number;    // W/m²
  uvIndex: number;
  dewPoint: number;          // °C
  timestamp: Date;
  source: string;
}

// ---- Thermal Metrics ----
export interface ThermalMetrics {
  heatIndex: number;         // °C
  wetBulbTemp: number;       // °C
  wbgt: number;              // °C
  utcI: number;              // °C
}

// ---- Risk Weights (configurable) ----
export interface RiskWeights {
  thermalConditions: number;
  humidity: number;
  wind: number;
  solarExposure: number;
  populationVulnerability: number;
}

export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  thermalConditions: 0.40,
  humidity: 0.20,
  wind: 0.10,
  solarExposure: 0.15,
  populationVulnerability: 0.15,
};

// ---- Risk Score ----
export interface RiskScore {
  overall: number;           // 0–100
  level: RiskLevel;
  // Sub-component scores (0–100 each)
  thermalComponent: number;
  humidityComponent: number;
  windComponent: number;
  solarComponent: number;
  vulnerabilityComponent: number;
  // Grouped components (3-category model for explanation)
  thermalHazard: number;        // 0–40: weighted sum of thermal+humidity+wind
  exposure: number;             // 0–30: solar + wind contributions
  vulnerability: number;        // 0–30: population vulnerability
  // Weighted contributions (each sub-score × its weight)
  // These sum exactly to the overall score
  thermalContribution: number;  // thermalComponent × thermalWeight
  humidityContribution: number; // humidityComponent × humidityWeight
  windContribution: number;     // windComponent × windWeight
  solarContribution: number;    // solarComponent × solarWeight
  vulnContribution: number;     // vulnerabilityComponent × vulnWeight
  factors: string[];
}

// ---- Vulnerability Data ----
export interface VulnerabilityData {
  populationDensity: number;    // people/km²
  elderlyPercentage: number;
  childPercentage: number;
  outdoorWorkerExposure: number; // percentage
  healthcareAccessibility: 'high' | 'medium' | 'low';
  coolingCenterAccess: 'high' | 'medium' | 'low';
  waterAccess: 'high' | 'medium' | 'low';
  acclimatizationLevel: 'high' | 'medium' | 'low';
  communityVulnerability: RiskLevel;
}

// ---- Zone Metadata (static — no weather data) ----
export interface ZoneMetadata {
  id: string;
  name: string;
  lat: number;
  lng: number;
  vulnerability: VulnerabilityData;
  population: number;
  type: 'urban' | 'industrial' | 'rural' | 'residential' | 'commercial';
}

// ---- Zone (fully hydrated with live weather) ----
export interface Zone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  weather: WeatherData;
  thermalMetrics: ThermalMetrics;
  risk: RiskScore;
  vulnerability: VulnerabilityData;
  population: number;
  type: 'urban' | 'industrial' | 'rural' | 'residential' | 'commercial';
}

/** Create a Zone from metadata + live weather */
export function hydrateZone(meta: ZoneMetadata, weather: WeatherData, thermalMetrics: ThermalMetrics, risk: RiskScore): Zone {
  return { ...meta, weather, thermalMetrics, risk };
}

// ---- Weather fetch status per zone ----
export type DataSource = 'live' | 'cached' | 'demo' | 'unavailable' | 'loading';

export interface ZoneWeatherStatus {
  zoneId: string;
  status: DataSource;
  error?: string;
  fetchedAt?: string;
  source?: string;
}

// ---- Forecast ----
export interface ForecastHour {
  hour: number;             // 0-23
  time: string;             // "08:00"
  weather: WeatherData;
  thermalMetrics: ThermalMetrics;
  risk: RiskScore;
}

export interface ForecastDay {
  date: string;
  hours: ForecastHour[];
  peakRiskWindow: string;
  peakRiskLevel: RiskLevel;
}

// ---- Cooling Center ----
export interface CoolingCenter {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number;       // km
  capacity: number;
  status: 'open' | 'closed';
  waterAvailable: boolean;
  accessibility: 'wheelchair' | 'limited' | 'full';
  contact: string;
}

// ---- Hospital ----
export interface Hospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  beds: number;
  emergencyCapacity: number;
}

// ---- Alert ----
export interface HeatAlert {
  id: string;
  zone: string;
  level: RiskLevel;
  issuedAt: Date;
  validFrom: Date;
  validTo: Date;
  peakWindow: string;
  confidence: 'high' | 'medium' | 'low';
  message: string;
  affectedPopulation: number;
  recommendations: string[];
}

// ---- Activity Types ----
export type ActivityType = 'general' | 'walking' | 'agriculture' | 'construction' | 'road_work' | 'sports';

export interface ActivityProfile {
  type: ActivityType;
  label: string;
  icon: string;
  metabolicRate: number;   // W/m²
  exposureMultiplier: number;
}

export const ACTIVITY_PROFILES: Record<ActivityType, ActivityProfile> = {
  general: { type: 'general', label: 'General', icon: '🏠', metabolicRate: 80, exposureMultiplier: 1.0 },
  walking: { type: 'walking', label: 'Walking', icon: '🚶', metabolicRate: 150, exposureMultiplier: 1.2 },
  agriculture: { type: 'agriculture', label: 'Agriculture', icon: '🌾', metabolicRate: 230, exposureMultiplier: 1.5 },
  construction: { type: 'construction', label: 'Construction', icon: '🏗️', metabolicRate: 300, exposureMultiplier: 1.6 },
  road_work: { type: 'road_work', label: 'Road Work', icon: '🛣️', metabolicRate: 280, exposureMultiplier: 1.5 },
  sports: { type: 'sports', label: 'Sports', icon: '⚽', metabolicRate: 350, exposureMultiplier: 1.7 },
};

// ---- Worker Safety ----
export type ClothingCategory = 'minimal' | 'standard' | 'protective';
export type WorkIntensity = 'light' | 'moderate' | 'heavy';

export interface WorkerProfile {
  activityType: ActivityType;
  workIntensity: WorkIntensity;
  exposureDuration: number;  // minutes
  clothing: ClothingCategory;
  acclimatized: boolean;
}

// ---- AI Recommendation ----
export interface AIRecommendation {
  targetAudience: string;
  actions: string[];
  priority: RiskLevel;
  dataGrounding: string[];
}

// ---- Map ----
export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  type: 'risk_zones' | 'hospitals' | 'schools' | 'cooling_centers' | 'vulnerability' | 'outdoor_workers';
}

// ---- Navigation ----
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  section?: string;
}
