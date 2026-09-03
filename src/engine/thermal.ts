// ============================================================
// HeatShield AI — Thermal Stress Calculation Engine
// Uses established scientific formulas for demonstration.
// Marked as "Prototype Risk Model" where exact validation
// data is unavailable.
// ============================================================

import { WeatherData, ThermalMetrics } from '../types';

/**
 * Heat Index — Rothfusz regression (NWS standard)
 * Input: Temperature (°C), Relative Humidity (%)
 * Output: Heat Index (°C)
 */
export function calculateHeatIndex(tempC: number, rh: number): number {
  const T = tempC * 9 / 5 + 32; // Convert to Fahrenheit
  if (T < 80) return tempC;

  const HI = -42.379
    + 2.04901523 * T
    + 10.14333127 * rh
    - 0.22475541 * T * rh
    - 0.00683783 * T * T
    - 0.05481717 * rh * rh
    + 0.00122874 * T * T * rh
    + 0.00085282 * T * rh * rh
    - 0.00000199 * T * T * rh * rh;

  let hiC = (HI - 32) * 5 / 9;
  if (rh < 13 && T >= 80 && T <= 112) {
    hiC -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  }
  if (rh > 85 && T >= 80 && T <= 87) {
    hiC += ((rh - 85) / 10) * ((87 - T) / 5);
  }

  return Math.round(hiC * 10) / 10;
}

/**
 * Wet-Bulb Temperature — Stull approximation
 * Input: Temperature (°C), Relative Humidity (%)
 * Output: Wet-Bulb Temperature (°C)
 */
export function calculateWetBulb(tempC: number, rh: number): number {
  const Tw = tempC * Math.atan(0.151977 * Math.sqrt(rh + 8.313659))
    + Math.atan(tempC + rh)
    - Math.atan(rh - 1.676331)
    + 0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh)
    - 4.686035;
  return Math.round(Tw * 10) / 10;
}

/**
 * WBGT (Wet Bulb Globe Temperature) — Simplified field formula
 * WBGT ≈ 0.7 × Tw + 0.2 × Tg + 0.1 × Ta
 * For prototype: Tg ≈ Ta + solar_factor, Tw from calculation
 */
export function calculateWBGT(tempC: number, rh: number, solarRadiation: number, windSpeed: number): number {
  const tw = calculateWetBulb(tempC, rh);
  // Globe temperature approximation based on solar load
  const solarFactor = solarRadiation > 600 ? 8 : solarRadiation > 400 ? 5 : solarRadiation > 200 ? 3 : 1;
  const windCooling = Math.min(windSpeed * 0.5, 3);
  const tg = tempC + solarFactor - windCooling;

  const wbgt = 0.7 * tw + 0.2 * tg + 0.1 * tempC;
  return Math.round(wbgt * 10) / 10;
}

/**
 * UTCI (Universal Thermal Climate Index) — Simplified approximation
 * Full UTCI requires a multi-node thermoregulation model.
 * This prototype uses a simplified regression.
 */
export function calculateUTCI(tempC: number, rh: number, windSpeed: number, solarRadiation: number): number {
  const mrt = tempC + (solarRadiation / 100) * 2.5 - windSpeed * 1.2;
  const tDiff = mrt - tempC;
  const rhFactor = (rh - 50) / 100;

  // Simplified UTCI approximation
  let utcI = tempC + tDiff * 0.3 + rhFactor * 3 + (solarRadiation > 500 ? 3 : 0);
  utcI -= windSpeed > 3 ? (windSpeed - 3) * 0.8 : 0;

  return Math.round(utcI * 10) / 10;
}

/**
 * Calculate all thermal metrics from weather data
 */
export function calculateThermalMetrics(weather: WeatherData): ThermalMetrics {
  const heatIndex = calculateHeatIndex(weather.temperature, weather.humidity);
  const wetBulbTemp = calculateWetBulb(weather.temperature, weather.humidity);
  const wbgt = calculateWBGT(weather.temperature, weather.humidity, weather.solarRadiation, weather.windSpeed);
  const utcI = calculateUTCI(weather.temperature, weather.humidity, weather.windSpeed, weather.solarRadiation);

  return { heatIndex, wetBulbTemp, wbgt, utcI };
}

/**
 * Get thermal stress classification based on WBGT
 */
export function getWBGTClassification(wbgt: number): string {
  if (wbgt < 18) return 'Normal';
  if (wbgt < 23) return 'Caution — Fatigue possible';
  if (wbgt < 28) return 'Warning — Heat cramps likely';
  if (wbgt < 30) return 'Danger — Heat exhaustion likely';
  if (wbgt < 32) return 'Extreme Danger — Heat stroke likely';
  return 'Emergency — Heat stroke imminent';
}

/**
 * Get UTCI comfort classification
 */
export function getUTCIClassification(utci: number): string {
  if (utci < 9) return 'Strong cold stress';
  if (utci < 26) return 'No thermal stress (Comfortable)';
  if (utci < 29) return 'Moderate heat stress';
  if (utci < 32) return 'Strong heat stress';
  if (utci < 35) return 'Very strong heat stress';
  if (utci < 38) return 'Extreme heat stress';
  return 'Extreme heat stress (dangerous)';
}
