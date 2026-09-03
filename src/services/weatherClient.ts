// ============================================================
// HeatShield AI — Weather Client with 3-Tier Fallback
// Priority 1: Live data from Open-Meteo Forecast API
// Priority 2: Valid cached response (< 15 min) or stale cache
// Priority 3: Demo / Simulated Data (clearly labelled)
// ============================================================

import { WeatherData, ForecastDay, ForecastHour, RiskLevel, VulnerabilityData } from '../types';
import { calculateThermalMetrics } from '../engine/thermal';
import { calculateRisk, getRiskLevel } from '../engine/risk';
import { getDemoZone, getDemoForecast } from '../data/demoData';

// ---- Open-Meteo API types ----

interface OpenMeteoCurrent {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  wind_speed_10m: number;
  shortwave_radiation: number;
  time: string;
}

interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  apparent_temperature: number[];
  wind_speed_10m: number[];
  shortwave_radiation: number[];
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrent;
  hourly: OpenMeteoHourly;
  timezone: string;
}

// ---- Public types ----

export interface ZoneWeatherResult {
  weather: WeatherData;
  forecast: ForecastDay;
  source: string;
  dataMode: 'live' | 'cached' | 'demo';
  fetchedAt: string;
}

export interface ZoneWeatherError {
  zoneId: string;
  error: string;
  source: string;
  dataMode: 'unavailable';
}

// ---- Constants ----

const API_BASE = 'https://api.open-meteo.com/v1/forecast';
const CACHE_PREFIX = 'hs_om_';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes for "live" freshness

// ---- Helpers ----

function calcDewPoint(tempC: number, rh: number): number {
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(rh / 100);
  return Math.round(((b * alpha) / (a - alpha)) * 10) / 10;
}

function estimateUVIndex(solarWm2: number): number {
  if (solarWm2 <= 0) return 0;
  return Math.round(Math.min(11, (solarWm2 / 1000) * 11) * 10) / 10;
}

function normalizeCurrent(current: OpenMeteoCurrent): WeatherData {
  return {
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    solarRadiation: current.shortwave_radiation,
    uvIndex: estimateUVIndex(current.shortwave_radiation),
    dewPoint: calcDewPoint(current.temperature_2m, current.relative_humidity_2m),
    timestamp: new Date(current.time),
    source: 'Open-Meteo Forecast API',
  };
}

function normalizeHourly(
  hourly: OpenMeteoHourly,
  zoneId: string,
  vulnerability: VulnerabilityData,
): { hours: ForecastHour[]; peakRiskWindow: string; peakRiskLevel: RiskLevel } {
  const hours: ForecastHour[] = [];
  let peakStart = '';
  let peakEnd = '';
  let peakLevel: RiskLevel = 'low';
  let inPeak = false;

  const now = new Date();
  const currentHour = now.getHours();
  const startIdx = hourly.time.findIndex(t => {
    const d = new Date(t);
    return d.getHours() === currentHour && d.getDate() === now.getDate();
  });
  const effectiveStart = Math.max(0, startIdx);
  const effectiveEnd = Math.min(effectiveStart + 24, hourly.time.length);

  for (let i = effectiveStart; i < effectiveEnd; i++) {
    const t = new Date(hourly.time[i]);
    const temp = hourly.temperature_2m[i];
    const rh = hourly.relative_humidity_2m[i];
    const wind = hourly.wind_speed_10m[i];
    const solar = hourly.shortwave_radiation[i];

    if (temp == null || rh == null || wind == null || solar == null) continue;

    const weather: WeatherData = {
      temperature: temp,
      humidity: rh,
      windSpeed: wind,
      solarRadiation: solar,
      uvIndex: estimateUVIndex(solar),
      dewPoint: calcDewPoint(temp, rh),
      timestamp: t,
      source: 'Open-Meteo Forecast API',
    };

    const thermalMetrics = calculateThermalMetrics(weather);
    const risk = calculateRisk(weather, thermalMetrics, vulnerability);

    const hourNum = t.getHours();
    const timeStr = `${String(hourNum).padStart(2, '0')}:00`;

    hours.push({ hour: hourNum, time: timeStr, weather, thermalMetrics, risk });

    if (risk.level === 'extreme' || risk.level === 'high') {
      if (!inPeak) { peakStart = timeStr; inPeak = true; }
      peakEnd = timeStr;
      if (getRiskLevel(risk.overall) === 'extreme') peakLevel = 'extreme';
      else if (peakLevel !== 'extreme') peakLevel = 'high';
    } else if (inPeak) { inPeak = false; }
  }

  let peakWindow = 'N/A';
  if (peakStart && peakEnd) {
    const formatTime = (t: string) => {
      const [h] = t.split(':').map(Number);
      if (h === 0) return '12:00 AM';
      if (h < 12) return `${h}:00 AM`;
      if (h === 12) return '12:00 PM';
      return `${h - 12}:00 PM`;
    };
    peakWindow = `${formatTime(peakStart)} – ${formatTime(peakEnd)}`;
  }

  return { hours, peakRiskWindow: peakWindow, peakRiskLevel: peakLevel };
}

// ---- Cache (supports both fresh and stale reads) ----

interface CacheEntry {
  result: ZoneWeatherResult;
  cachedAt: number;
}

function readCache(zoneId: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + zoneId);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function writeCache(zoneId: string, result: ZoneWeatherResult): void {
  try {
    localStorage.setItem(CACHE_PREFIX + zoneId, JSON.stringify({ result, cachedAt: Date.now() }));
  } catch {
    // localStorage full or unavailable
  }
}

// ---- Public API ----

/**
 * Fetch weather for a single zone with 3-tier fallback:
 * 1. Fresh cache (< 15 min) — returns as 'cached'
 * 2. Live API fetch — returns as 'live'
 * 3. Stale cache (> 15 min) — returns as 'cached'
 * 4. Demo data — returns as 'demo'
 *
 * Never throws. Always returns a ZoneWeatherResult.
 */
export async function fetchZoneWeather(
  zoneId: string,
  lat: number,
  lng: number,
  vulnerability: VulnerabilityData,
): Promise<ZoneWeatherResult> {
  // Priority 2: Check for fresh cache
  const freshCache = readCache(zoneId);
  if (freshCache && Date.now() - freshCache.cachedAt < CACHE_TTL_MS) {
    return { ...freshCache.result, dataMode: 'cached' as const };
  }

  // Priority 1: Try live API
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,shortwave_radiation',
      hourly: 'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,shortwave_radiation',
      forecast_days: '2',
      timezone: 'Asia/Kolkata',
      wind_speed_unit: 'ms',
    });

    const res = await fetch(`${API_BASE}?${params.toString()}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);

    const data: OpenMeteoResponse = await res.json();
    if (!data.current || !data.hourly) throw new Error('Invalid response');

    const weather = normalizeCurrent(data.current);
    const forecastData = normalizeHourly(data.hourly, zoneId, vulnerability);

    const forecast: ForecastDay = {
      date: new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      hours: forecastData.hours,
      peakRiskWindow: forecastData.peakRiskWindow,
      peakRiskLevel: forecastData.peakRiskLevel,
    };

    const result: ZoneWeatherResult = {
      weather,
      forecast,
      source: 'Open-Meteo Forecast API',
      dataMode: 'live',
      fetchedAt: new Date().toISOString(),
    };

    writeCache(zoneId, result);
    return result;

  } catch {
    // Priority 2 (fallback): Use stale cache if available
    if (freshCache) {
      return { ...freshCache.result, dataMode: 'cached' as const };
    }

    // Priority 3: Demo data
    return getFallbackDemo(zoneId);
  }
}

/**
 * Get demo fallback for a zone. Always succeeds.
 */
function getFallbackDemo(zoneId: string): ZoneWeatherResult {
  const demoZone = getDemoZone(zoneId);
  const demoForecast = getDemoForecast(zoneId);

  if (demoZone) {
    return {
      weather: demoZone.weather,
      forecast: demoForecast,
      source: 'Demo / Simulated Data',
      dataMode: 'demo',
      fetchedAt: new Date().toISOString(),
    };
  }

  // Absolute last resort — shouldn't happen if zoneMetadata is valid
  const now = new Date();
  const fallbackWeather: WeatherData = {
    temperature: 30, humidity: 60, windSpeed: 2, solarRadiation: 400,
    uvIndex: 4, dewPoint: 22, timestamp: now, source: 'Demo / Simulated Data',
  };
  return {
    weather: fallbackWeather,
    forecast: {
      date: now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      hours: [], peakRiskWindow: 'N/A', peakRiskLevel: 'low',
    },
    source: 'Demo / Simulated Data',
    dataMode: 'demo',
    fetchedAt: now.toISOString(),
  };
}

/**
 * Fetch weather for all zones concurrently.
 * Each zone falls back independently — one failure doesn't affect others.
 */
export async function fetchAllZoneWeather(
  zones: { id: string; lat: number; lng: number; vulnerability: VulnerabilityData }[],
): Promise<Map<string, ZoneWeatherResult>> {
  const results = new Map<string, ZoneWeatherResult>();

  const settled = await Promise.allSettled(
    zones.map(async (zone) => {
      const result = await fetchZoneWeather(zone.id, zone.lat, zone.lng, zone.vulnerability);
      results.set(zone.id, result);
    }),
  );

  for (const s of settled) {
    if (s.status === 'rejected') {
      console.error('[WeatherClient] Unexpected rejection:', s.reason);
    }
  }

  // Ensure every zone has a result (even if something unexpected happened)
  for (const zone of zones) {
    if (!results.has(zone.id)) {
      results.set(zone.id, getFallbackDemo(zone.id));
    }
  }

  return results;
}

/**
 * Clear localStorage cache.
 */
export function clearWeatherCache(zoneId?: string): void {
  if (zoneId) {
    localStorage.removeItem(CACHE_PREFIX + zoneId);
  } else {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach(k => localStorage.removeItem(k));
  }
}
