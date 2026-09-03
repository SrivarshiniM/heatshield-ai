import { Database, Thermometer, Brain, ShieldAlert, Info, Layers, GitBranch, Wifi, ArrowRight, Calculator, AlertTriangle } from 'lucide-react';

export default function Transparency() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Data & Model Transparency</h1>
        <p className="text-sm text-slate-500 mt-0.5">How HeatShield AI calculates risk and generates recommendations</p>
      </div>

      {/* Live Data Integration */}
      <div className="card border-green-200 bg-green-50">
        <div className="flex items-center gap-2 mb-4">
          <Wifi className="w-4 h-4 text-green-600" />
          <h2 className="section-title text-green-800">Weather Data — Open-Meteo Forecast API</h2>
        </div>
        <div className="space-y-3 text-sm text-green-700">
          <p>HeatShield AI fetches live weather data directly from the Open-Meteo Forecast API — a free, open-source weather service that requires no API key.</p>
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="font-medium text-green-800 mb-1">What is Open-Meteo?</div>
            <div className="text-xs text-green-600">
              Open-Meteo provides free weather forecast APIs using open meteorological data. It aggregates data from national weather services and ECMWF models.
              No API key is required for non-commercial use. <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="underline">open-meteo.com</a>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="font-medium text-green-800">Data Retrieved</div>
              <div className="text-xs text-green-600 mt-1">
                • Temperature (°C)<br/>
                • Relative Humidity (%)<br/>
                • Wind Speed (m/s)<br/>
                • Shortwave Radiation (W/m²)<br/>
                • Apparent Temperature (°C)
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="font-medium text-green-800">Per-Zone Fetching</div>
              <div className="text-xs text-green-600 mt-1">
                • Each Vellore zone fetched by lat/lng<br/>
                • Zones fail independently<br/>
                • Cached 15 minutes per zone<br/>
                • Stale cache used on network failure<br/>
                • Demo data as final fallback
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="font-medium text-green-800 mb-1">Important: Forecast ≠ Observation</div>
            <div className="text-xs text-green-600">
              Open-Meteo provides model-based forecasts, not direct sensor observations.
              Values may differ from official IMD measurements.
              This data is labeled "Forecast Data · Open-Meteo" throughout the application.
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Pipeline */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-sky-600" />
          <h2 className="section-title">System Architecture</h2>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 font-mono text-xs text-slate-700 overflow-x-auto">
          <pre>{`Open-Meteo Forecast API (free, no key)
        ↓
  Client-Side Fetch (per zone lat/lng)
        ↓
  Normalized Weather Data
        ↓
  Thermal Stress Engine
  ├── Heat Index (Rothfusz / NWS)
  ├── Wet-Bulb Temperature (Stull)
  ├── WBGT (Simplified Field Formula)
  └── UTCI (Simplified Approximation)
        ↓
  Exposure & Vulnerability Layer
        ↓
  Human Risk Engine (Weighted Prototype Score)
        ↓
  AI Decision Support (Rule-Based / LLM)
        ↓
  Alert Engine
        ↓
  Citizen + Government Interfaces`}</pre>
        </div>
      </div>

      {/* Data Sources */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-sky-600" />
          <h2 className="section-title">Data Sources</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-700">
          <p>HeatShield AI is designed to consume weather data from multiple sources:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'Open-Meteo Forecast API', status: 'Active', desc: 'Free, open-source weather forecasts — Primary source for this prototype', badge: 'bg-green-100 text-green-700 border-green-200' },
              { name: 'IMD (India Met Dept)', status: 'Future Scope', desc: 'Official Indian weather data — Target for production deployment', badge: 'bg-sky-100 text-sky-700 border-sky-200' },
              { name: 'NASA POWER', status: 'Future Scope', desc: 'Satellite-derived weather data — Additional source for historical analysis', badge: 'bg-sky-100 text-sky-700 border-sky-200' },
              { name: 'Ground Sensors', status: 'Future Scope', desc: 'Hyperlocal IoT weather stations — For production-grade accuracy', badge: 'bg-sky-100 text-sky-700 border-sky-200' },
            ].map(src => (
              <div key={src.name} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{src.name}</span>
                  <span className={`badge text-[10px] ${src.badge}`}>{src.status}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{src.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Thermal Metrics */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Thermometer className="w-4 h-4 text-red-500" />
          <h2 className="section-title">Thermal Stress Metrics</h2>
        </div>
        <div className="space-y-4">
          {[
            {
              name: 'Heat Index (HI)',
              formula: 'Rothfusz regression equation (NWS standard)',
              desc: 'Combines air temperature and humidity to determine perceived temperature. Used worldwide by weather agencies.',
              source: 'US National Weather Service',
            },
            {
              name: 'Wet-Bulb Temperature (Tw)',
              formula: 'Stull approximation',
              desc: 'Lowest temperature achievable through evaporative cooling. Indicates the body\'s ability to cool through sweating.',
              source: 'Stull, R. (2011). Meteorology for Scientists and Engineers',
            },
            {
              name: 'Wet Bulb Globe Temperature (WBGT)',
              formula: 'WBGT ≈ 0.7×Tw + 0.2×Tg + 0.1×Ta',
              desc: 'Gold standard for occupational heat stress. Used by OSHA, military, and sports organizations worldwide.',
              source: 'ISO 7243, OSHA Technical Manual',
            },
            {
              name: 'Universal Thermal Climate Index (UTCI)',
              formula: 'Multi-node thermoregulation model (simplified)',
              desc: 'Comprehensive human thermal comfort/stress index developed by EU COST Action 730.',
              source: 'COST Action 730, Fiala D. et al.',
            },
          ].map(metric => (
            <div key={metric.name} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-slate-900">{metric.name}</h3>
                <span className="text-xs text-slate-400">{metric.source}</span>
              </div>
              <p className="text-sm text-slate-700 mb-2">{metric.desc}</p>
              <div className="font-mono text-xs text-slate-500 bg-white rounded p-2 border border-slate-200">
                {metric.formula}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* RISK SCORE METHODOLOGY — The core deliverable for SIH judges */}
      {/* ================================================================ */}
      <div className="card border-2 border-orange-200 bg-orange-50/30">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-4 h-4 text-orange-600" />
          <h2 className="section-title text-orange-900">Risk Score Methodology</h2>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 mb-5">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>Prototype Label:</strong> This is the <strong>HeatShield Prototype Risk Score</strong> — an application-level
            decision-support score (0–100). It is NOT an internationally standardized index like the NWS Heat Index or
            OSHA WBGT thresholds. It is designed for SIH demonstration and is transparent and configurable.
          </p>
        </div>

        {/* Formula Overview */}
        <div className="bg-white rounded-xl border border-orange-200 p-5 mb-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Core Formula</h3>
          <div className="font-mono text-center text-sm py-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-center gap-1.5 flex-wrap text-xs">
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-bold">Thermal × 0.40</span>
              <span className="text-slate-400 font-bold">+</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-bold">Humidity × 0.20</span>
              <span className="text-slate-400 font-bold">+</span>
              <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded font-bold">Wind × 0.10</span>
              <span className="text-slate-400 font-bold">+</span>
              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded font-bold">Solar × 0.15</span>
              <span className="text-slate-400 font-bold">+</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded font-bold">Vuln. × 0.15</span>
            </div>
            <div className="text-slate-400 text-lg my-1">↓</div>
            <div className="px-4 py-2 bg-orange-100 text-orange-900 rounded font-bold text-base">
              HeatShield Prototype Risk Score (0–100)
            </div>
            <div className="text-[10px] text-slate-400 mt-2">Each weighted contribution sums exactly to the final score.</div>
          </div>
        </div>

        {/* Inputs */}
        <div className="mb-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">1. Inputs</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-xs font-semibold text-red-700 mb-2">Weather Inputs (from API)</div>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Air Temperature (°C)</li>
                <li>• Relative Humidity (%)</li>
                <li>• Wind Speed (m/s)</li>
                <li>• Solar Radiation (W/m²)</li>
                <li>• UV Index (estimated from radiation)</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-xs font-semibold text-red-700 mb-2">Derived Thermal Metrics</div>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Heat Index (°C)</li>
                <li>• Wet-Bulb Temperature (°C)</li>
                <li>• WBGT (°C)</li>
                <li>• UTCI (°C)</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-xs font-semibold text-purple-700 mb-2">Zone Vulnerability (static)</div>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Population density (people/km²)</li>
                <li>• Elderly population (%)</li>
                <li>• Outdoor worker exposure (%)</li>
                <li>• Healthcare accessibility</li>
                <li>• Cooling center access</li>
                <li>• Acclimatization level</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Normalization */}
        <div className="mb-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">2. Component Normalization (each 0–100)</h3>
          <div className="space-y-2">
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-bold text-slate-900">Thermal Conditions (0–100)</span>
              </div>
              <p className="text-xs text-slate-600 ml-4">
                Based on <strong>Heat Index</strong> (Rothfusz regression). Piecewise mapping:
                HI &lt;27°C → 0–10, 27–33°C → 10–40, 33–41°C → 40–70, 41–46°C → 70–90, 46–54°C → 90–100, &ge;54°C → 100.
                Higher Heat Index = higher score.
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-bold text-slate-900">Humidity Impact (0–100)</span>
              </div>
              <p className="text-xs text-slate-600 ml-4">
                When temperature &ge;27°C: <code>score = ((RH - 30) / 70) × 100 × (T / 45)</code>.
                Higher humidity at higher temperatures = worse evaporative cooling = higher score.
                Below 27°C, humidity contribution is reduced.
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="text-xs font-bold text-slate-900">Wind Factor (0–100, inverted)</span>
              </div>
              <p className="text-xs text-slate-600 ml-4">
                <strong>Inverted scale:</strong> Low wind = high score (can't dissipate heat).
                &ge;5 m/s → 10, 3–5 → 30, 2–3 → 55, 1–2 → 75, &lt;1 → 95.
                This reflects that calm conditions trap heat at ground level.
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-slate-900">Solar Exposure (0–100)</span>
              </div>
              <p className="text-xs text-slate-600 ml-4">
                Weighted average: <code>(radiation/1000 × 60) + (UV_index/11 × 40)</code>.
                Radiation capped at 1000 W/m², UV capped at 11. Higher solar load = higher score.
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-xs font-bold text-slate-900">Population Vulnerability (0–100)</span>
              </div>
              <p className="text-xs text-slate-600 ml-4">
                Composite of 6 factors: population density (max 25 pts), elderly % (max 20 pts),
                outdoor worker % (max 20 pts), healthcare access (2–15 pts), cooling center access (1–10 pts),
                acclimatization level (2–10 pts). Capped at 100.
              </p>
            </div>
          </div>
        </div>

        {/* Weights */}
        <div className="mb-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">3. Default Weights (configurable in Settings)</h3>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Component</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-600">Weight</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-3 py-2"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Thermal Conditions</span></td>
                  <td className="text-center px-3 py-2 font-bold">40%</td>
                  <td className="px-3 py-2 text-slate-500">Largest weight — Heat Index is the primary human-impact metric</td>
                </tr>
                <tr>
                  <td className="px-3 py-2"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Humidity Impact</span></td>
                  <td className="text-center px-3 py-2 font-bold">20%</td>
                  <td className="px-3 py-2 text-slate-500">Humidity reduces body's evaporative cooling capacity</td>
                </tr>
                <tr>
                  <td className="px-3 py-2"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" /> Wind Factor</span></td>
                  <td className="text-center px-3 py-2 font-bold">10%</td>
                  <td className="px-3 py-2 text-slate-500">Wind provides convective cooling — less wind = more risk</td>
                </tr>
                <tr>
                  <td className="px-3 py-2"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Solar Exposure</span></td>
                  <td className="text-center px-3 py-2 font-bold">15%</td>
                  <td className="px-3 py-2 text-slate-500">Direct solar radiation adds radiant heat load</td>
                </tr>
                <tr>
                  <td className="px-3 py-2"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> Population Vulnerability</span></td>
                  <td className="text-center px-3 py-2 font-bold">15%</td>
                  <td className="px-3 py-2 text-slate-500">Determines human impact from equal weather conditions</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Weighted Formula */}
        <div className="mb-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">4. Weighted Composite Formula</h3>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 font-mono text-xs text-slate-700 overflow-x-auto">
            <pre>{`Overall = (Thermal × 0.40 + Humidity × 0.20 + Wind × 0.10 + Solar × 0.15 + Vulnerability × 0.15)
         ─────────────────────────────────────────────────────────────────────────────────────
                                          (sum of weights)

Risk Level Thresholds:
  ≥ 75  →  🔴 EXTREME   (life-threatening — emergency measures)
  ≥ 50  →  🟠 HIGH      (dangerous — action required)
  ≥ 25  →  🟡 MODERATE  (elevated — vulnerable groups at risk)
   < 25 →  🟢 LOW       (minimal heat stress risk)`}</pre>
          </div>
        </div>

        {/* Worked Example */}
        <div className="mb-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">5. Worked Example — Vellore Central</h3>
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <div className="text-xs text-slate-500">
              <strong>Weather:</strong> Temp 38.5°C · Humidity 62% · Wind 2.8 m/s · Solar 580 W/m²
            </div>

            <div className="bg-slate-50 rounded p-3">
              <div className="text-xs font-bold text-red-700 mb-1">Step 1: Compute Heat Index</div>
              <div className="text-xs text-slate-600">
                Using the Rothfusz regression (NWS standard) with T=38.5°C and RH=62%:<br/>
                <code className="bg-white px-1 rounded">Heat Index ≈ 51.2°C</code> — This is the perceived temperature
                accounting for humidity. Much higher than the 38.5°C air temperature.
              </div>
            </div>

            <div className="bg-slate-50 rounded p-3">
              <div className="text-xs font-bold text-red-700 mb-1">Step 2: Score Each Component (0–100)</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                <div className="bg-white rounded p-2 text-center border border-red-200">
                  <div className="text-[10px] text-red-600">Thermal</div>
                  <div className="text-lg font-bold text-red-800">94</div>
                  <div className="text-[10px] text-slate-400">HI = 51.2°C → 90 + (51.2-46) × 1.25</div>
                </div>
                <div className="bg-white rounded p-2 text-center border border-blue-200">
                  <div className="text-[10px] text-blue-600">Humidity</div>
                  <div className="text-lg font-bold text-blue-800">39</div>
                  <div className="text-[10px] text-slate-400">(62-30)/70 × 100 × (38.5/45)</div>
                </div>
                <div className="bg-white rounded p-2 text-center border border-slate-200">
                  <div className="text-[10px] text-slate-600">Wind</div>
                  <div className="text-lg font-bold text-slate-800">55</div>
                  <div className="text-[10px] text-slate-400">2.8 m/s → step function</div>
                </div>
                <div className="bg-white rounded p-2 text-center border border-amber-200">
                  <div className="text-[10px] text-amber-600">Solar</div>
                  <div className="text-lg font-bold text-amber-800">58</div>
                  <div className="text-[10px] text-slate-400">580/1000 × 60 + UV × 40</div>
                </div>
                <div className="bg-white rounded p-2 text-center border border-purple-200">
                  <div className="text-[10px] text-purple-600">Vulnerability</div>
                  <div className="text-lg font-bold text-purple-800">49</div>
                  <div className="text-[10px] text-slate-400">6 factors combined</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded p-3">
              <div className="text-xs font-bold text-red-700 mb-1">Step 3: Apply Weights → Weighted Contributions</div>
              <div className="text-xs text-slate-600 font-mono">
                <div className="grid grid-cols-5 gap-1 my-2">
                  <div className="bg-white rounded p-2 text-center border border-red-200">
                    <div className="text-[10px] text-red-600">Thermal</div>
                    <div className="text-lg font-bold text-red-800">38</div>
                    <div className="text-[10px] text-slate-400">94 × 0.40</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center border border-blue-200">
                    <div className="text-[10px] text-blue-600">Humidity</div>
                    <div className="text-lg font-bold text-blue-800">8</div>
                    <div className="text-[10px] text-slate-400">39 × 0.20</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center border border-slate-200">
                    <div className="text-[10px] text-slate-600">Wind</div>
                    <div className="text-lg font-bold text-slate-800">6</div>
                    <div className="text-[10px] text-slate-400">55 × 0.10</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center border border-amber-200">
                    <div className="text-[10px] text-amber-600">Solar</div>
                    <div className="text-lg font-bold text-amber-800">9</div>
                    <div className="text-[10px] text-slate-400">58 × 0.15</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center border border-purple-200">
                    <div className="text-[10px] text-purple-600">Vuln.</div>
                    <div className="text-lg font-bold text-purple-800">6</div>
                    <div className="text-[10px] text-slate-400">67 − 61</div>
                  </div>
                </div>
                <div className="text-center my-1">38 + 8 + 6 + 9 + 6 = <strong>67</strong>/100 → 🟠 <strong>HIGH</strong></div>
                <div className="text-[10px] text-slate-400 text-center">Each contribution = sub-score × weight. Vulnerability is the remainder to guarantee exact sum.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Zone Comparison */}
        <div className="mb-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">6. Why Different Zones Get Different Scores</h3>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-2 py-2 font-semibold text-slate-600">Zone</th>
                  <th className="text-center px-2 py-2 font-semibold text-slate-600">Temp</th>
                  <th className="text-center px-2 py-2 font-semibold text-slate-600">Wind</th>
                  <th className="text-center px-2 py-2 font-semibold text-slate-600">Outdoor Workers</th>
                  <th className="text-center px-2 py-2 font-semibold text-slate-600">Healthcare</th>
                  <th className="text-center px-2 py-2 font-semibold text-slate-600">Score</th>
                  <th className="text-center px-2 py-2 font-semibold text-slate-600">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-2 py-2 font-medium">Vellore Central</td>
                  <td className="text-center px-2 py-2">38.5°C</td>
                  <td className="text-center px-2 py-2">2.8 m/s</td>
                  <td className="text-center px-2 py-2">45%</td>
                  <td className="text-center px-2 py-2">Medium</td>
                  <td className="text-center px-2 py-2 font-bold">67</td>
                  <td className="px-2 py-2 text-slate-500">High humidity amplifies heat stress</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-2 py-2 font-medium">Industrial Zone</td>
                  <td className="text-center px-2 py-2">40.1°C</td>
                  <td className="text-center px-2 py-2">2.5 m/s</td>
                  <td className="text-center px-2 py-2">85%</td>
                  <td className="text-center px-2 py-2">Medium</td>
                  <td className="text-center px-2 py-2 font-bold">68</td>
                  <td className="px-2 py-2 text-slate-500">Highest temperature + extreme outdoor exposure</td>
                </tr>
                <tr>
                  <td className="px-2 py-2 font-medium">Rural Zone</td>
                  <td className="text-center px-2 py-2">37.8°C</td>
                  <td className="text-center px-2 py-2">1.6 m/s</td>
                  <td className="text-center px-2 py-2">78%</td>
                  <td className="text-center px-2 py-2">Low</td>
                  <td className="text-center px-2 py-2 font-bold">69</td>
                  <td className="px-2 py-2 text-slate-500">Low wind + high vulnerability offset lower temp</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            <strong>Key insight:</strong> The Rural Zone has the <em>lowest</em> temperature but the <em>highest</em> score
            because low wind (1.6 m/s) prevents heat dissipation, and high vulnerability (12.5% elderly, 78% outdoor workers,
            low healthcare access) amplifies the human impact. This demonstrates that HeatShield combines hazard with
            vulnerability — not just raw temperature.
          </p>
        </div>

        {/* Risk Level Thresholds */}
        <div className="mb-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">7. Risk Level Definitions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { level: 'EXTREME', range: '≥ 75', color: 'bg-red-100 border-red-300 text-red-800', desc: 'Life-threatening — emergency measures needed' },
              { level: 'HIGH', range: '50–74', color: 'bg-orange-100 border-orange-300 text-orange-800', desc: 'Dangerous — action required' },
              { level: 'MODERATE', range: '25–49', color: 'bg-yellow-100 border-yellow-300 text-yellow-800', desc: 'Elevated — vulnerable groups at risk' },
              { level: 'LOW', range: '0–24', color: 'bg-green-100 border-green-300 text-green-800', desc: 'Minimal heat stress risk' },
            ].map(r => (
              <div key={r.level} className={`rounded-lg border p-3 ${r.color}`}>
                <div className="text-xs font-bold">{r.level}</div>
                <div className="text-[10px] opacity-70">{r.range}</div>
                <div className="text-[10px] mt-1 opacity-80">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Limitations */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3">8. Prototype Model Limitations</h3>
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-2 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">⚠</span>
              <span><strong>Not a standardized index:</strong> Unlike the NWS Heat Index or OSHA WBGT thresholds,
              the HeatShield Prototype Risk Score has not been validated against epidemiological outcome data.
              It is an application-level heuristic for decision-support demonstration.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">⚠</span>
              <span><strong>Vulnerability is static:</strong> Zone vulnerability data (population density, elderly %,
  healthcare access) is hardcoded for the prototype. In production, this would come from Census data and GIS databases.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">⚠</span>
              <span><strong>No mortality prediction:</strong> The score does not predict deaths, hospitalizations, or specific health outcomes.
  The "Relative Health Risk" shown in the Vulnerability page is a prototype estimate, not a clinical metric.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">⚠</span>
              <span><strong>Humidity overlap:</strong> The Heat Index already incorporates humidity, and Humidity Impact is a separate
  weighted component. This intentional overlap ensures humidity's role in both perceived temperature and evaporative
  cooling is explicitly represented.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">⚠</span>
              <span><strong>Weather data source:</strong> Open-Meteo provides model-based forecasts, not direct sensor observations.
  Values may differ from IMD official measurements. Labeled throughout as "Forecast Data · Open-Meteo."</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">⚠</span>
              <span><strong>Simplified thermal models:</strong> The WBGT and UTCI calculations use simplified approximations.
  Full WBGT requires a globe thermometer reading; full UTCI requires a multi-node thermoregulation model.
  The Heat Index (Rothfusz) is the most accurate of the four metrics as it uses the standard NWS formula.</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Role */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-purple-600" />
          <h2 className="section-title">AI Role & Limitations</h2>
        </div>
        <div className="space-y-4 text-sm text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">✅ AI IS USED FOR:</h3>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Interpreting structured risk data</li>
                <li>• Summarizing district-level situations</li>
                <li>• Prioritizing recommended actions</li>
                <li>• Generating natural language explanations</li>
                <li>• Answering queries about risk data</li>
              </ul>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h3 className="font-semibold text-red-800 mb-2">❌ AI DOES NOT:</h3>
              <ul className="space-y-1 text-sm text-red-700">
                <li>• Invent weather measurements</li>
                <li>• Predict exact mortality</li>
                <li>• Issue official government orders</li>
                <li>• Diagnose medical conditions</li>
                <li>• Replace IMD warnings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Version */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="w-4 h-4 text-slate-500" />
          <h2 className="section-title">Prototype Version</h2>
        </div>
        <div className="text-sm text-slate-600">
          <p>HeatShield AI v2.0 — SIH 2026 Prototype</p>
          <p className="text-xs text-slate-400 mt-1">
            v2.0: Live weather data from Open-Meteo Forecast API. 3-tier fallback (Live → Cached → Demo).
            Transparent risk methodology with configurable weights. Prototype Risk Score clearly labeled.
          </p>
        </div>
      </div>
    </div>
  );
}
