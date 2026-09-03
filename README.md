# 🔥 HeatShield AI

### *From Heat Forecasts to Human Safety.*

**AI-Assisted Hyperlocal Extreme Heat & Human Thermal Stress Early Warning Platform**

---

## 📋 Smart India Hackathon 2026

**Problem Statement:** Extreme Heatwave Early Warning and Human Thermal Stress Index

---

## 🎯 Problem

Traditional heat warnings focus heavily on air temperature. However, **human thermal stress depends on multiple factors**: air temperature, humidity, wind speed, solar radiation, time of day, exposure duration, physical workload, and population vulnerability.

Existing systems answer: *"How hot is it?"*

HeatShield AI asks: ***"Who is at risk, where, when, why, and what should happen next?"***

---

## 💡 Solution

HeatShield AI is an **impact-based, human-centric heat early warning and decision-support platform** that converts environmental conditions into understandable human thermal-risk information and actionable recommendations.

### Core Pipeline:

```
Weather Forecast → Thermal Stress → Vulnerability → Hyperlocal Risk → Impact → Action
```

**Key Innovation:** A slightly cooler but highly vulnerable area can have greater overall human risk than a hotter but less exposed area.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────┐
│  Weather Sources (IMD / NASA / APIs) │
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│        Data Normalization            │
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│      Thermal Stress Engine           │
│  ┌──────────┬───────┬──────┬──────┐  │
│  │Heat Index│WetBulb│ WBGT │ UTCI │  │
│  └──────────┴───────┴──────┴──────┘  │
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│    Exposure & Vulnerability Layer    │
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│     Human Risk Engine (Weighted)     │
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│     AI Decision Support (Rule/LLM)   │
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│          Alert Engine                │
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│  Citizen + Government Interfaces     │
└──────────────────────────────────────┘
```

---

## 🚀 Features

### A. Executive Dashboard
- Real-time human heat risk score (0–100)
- Multi-parameter weather display
- Risk factor explanation
- 24-hour heat risk timeline
- Zone comparison

### B. Live Heat Risk Map
- Interactive Leaflet map
- Risk zone visualization with color coding
- Layer toggling (hospitals, cooling centers, schools)
- Zone selection and inspection

### C. Thermal Stress Intelligence
- Heat Index (Rothfusz regression)
- Wet-Bulb Temperature (Stull approximation)
- WBGT (Simplified field formula)
- UTCI (Simplified approximation)
- Occupational threshold table

### D. Forecast & Early Warning
- 24-hour hourly risk prediction
- Warning progression visualization
- Peak danger window identification
- Hourly detail table

### E. Vulnerability Intelligence
- Population demographics
- Elderly/child population
- Outdoor worker exposure
- Healthcare accessibility
- Community vulnerability score

### F. Government Response Center
- Situation overview
- Priority zones table (sortable)
- Intervention recommendations by risk level
- Cooling center status

### G. AI Action Advisor
- Natural language query interface
- Recommendations for: Administration, Citizens, Workers
- Data grounding (traceable to application data)
- District-level briefing generation

### H. Citizen Safety Mode
- Activity selection (General, Walking, Agriculture, etc.)
- Exposure duration input
- Personalized heat risk assessment
- Safe action recommendations

### I. Worker Safety Mode
- Activity type, work intensity, clothing selection
- Acclimatization status
- Work/rest cycle recommendations
- Hydration requirements
- Pre-shift safety checklist

### J. Alert Simulation
- Demo alert generation
- Alert card with recommendations
- Notification system
- Multiple zone support

### K. Data & Model Transparency
- System architecture visualization
- Data source documentation
- Thermal metric explanations
- Risk model methodology
- AI role and limitations

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Maps | React Leaflet + OpenStreetMap |
| Icons | Lucide React |
| Bundler | Vite 8 |
| Backend | Express.js (proxy server) |
| Language | TypeScript (strict) |

---

## 📡 Live Data Integration

HeatShield AI supports **live weather data** alongside demo data, with automatic fallback.

### Data Sources (priority order)

| Source | Status | API Key | Notes |
|--------|--------|---------|-------|
| **NASA POWER** | Integrated | None (free) | Primary source — satellite-derived daily weather |
| **OpenWeatherMap** | Integrated | Required | Secondary — real-time current conditions |
| **IMD** | Future Scope | TBD | Official Indian weather data — production target |
| **Demo Data** | Always Available | None | Guaranteed fallback for offline/slow networks |

### Architecture

```
Frontend (React)
    ↓ API calls
Backend Proxy (Express.js) — keeps API keys server-side
    ↓
Provider Resolver
    ├── Try: NASA POWER (no key)
    ├── Try: OpenWeatherMap (needs key)
    └── Fallback: Demo Data
    ↓
Cached Response (15 min per zone)
    ↓
Normalized Weather Data → Thermal Engine → Risk Engine
```

### Fallback Behavior

- Live providers are tried in order; first success wins
- If both fail, demo data is used **for that zone only** (per-zone isolation)
- One zone's failure does not affect other zones
- Data is cached for 15 minutes per zone
- UI shows "Live Data" vs "Demo Data" badge prominently
- All API keys stay server-side via environment variables

### Running with Live Data

```bash
# Terminal 1: Start backend server (handles API calls)
npm run dev:server

# Terminal 2: Start frontend
npm run dev

# Or both at once:
npm run dev:all
```

Toggle between live and demo data in **Settings → Data Source Configuration**.

### Fallback Diagram

```
🟢 NASA POWER  →  🟢 OpenWeatherMap  →  🟡 Demo Data
   (free, no key)     (needs key)          (always works)
```

> **Note:** Even with live data, all thermal indices, risk calculations, and AI recommendations use the same scientific formulas. The data source does not change the methodology.

---

## 📊 Thermal Indices

| Index | Formula Source | What It Measures |
|-------|---------------|-----------------|
| **Heat Index** | Rothfusz regression (NWS) | Perceived temperature from T + RH |
| **Wet-Bulb Temp** | Stull approximation | Evaporative cooling capacity |
| **WBGT** | 0.7×Tw + 0.2×Tg + 0.1×Ta | Occupational heat stress |
| **UTCI** | Simplified multi-node model | Comprehensive thermal comfort |

---

## 🧠 AI Role

AI is used for:
- ✅ Interpreting structured risk data
- ✅ Summarizing district-level situations
- ✅ Prioritizing recommended actions
- ✅ Generating natural language explanations

AI does NOT:
- ❌ Invent weather measurements
- ❌ Predict exact mortality
- ❌ Issue official government orders
- ❌ Diagnose medical conditions
- ❌ Replace IMD warnings

---

## 📏 Risk Methodology

### HeatShield Prototype Risk Score (0–100)

| Component | Weight | Description |
|-----------|--------|-------------|
| Thermal Conditions | 40% | Heat Index and thermal metrics |
| Humidity Impact | 20% | Evaporative cooling reduction |
| Wind Factor | 10% | Convective cooling capacity |
| Solar Exposure | 15% | Radiation and UV impact |
| Population Vulnerability | 15% | Demographics, healthcare, access |

> **Note:** This is an application-level decision-support score, NOT an internationally standardized index. Weights are configurable.

---

## 📸 Screenshots

> *Screenshots will be added after final demo run.*

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/your-team/heatshield-ai.git
cd heatshield-ai

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🔧 Environment Variables

Create a `.env` file:

```env
# Application
VITE_APP_TITLE=HeatShield AI

# Weather API (optional — demo mode used when not set)
VITE_WEATHER_API_KEY=
VITE_WEATHER_API_URL=

# AI Provider (optional — rule engine used when not set)
VITE_AI_API_KEY=
VITE_AI_API_URL=
VITE_AI_PROVIDER=rule-engine
```

> API keys are kept server-side in production. This prototype runs entirely client-side with demo data.

---

## 🎬 Demo Instructions

### SIH Judging Flow (3–5 minutes):

1. **Open Dashboard** → Show extreme heat risk for Vellore
2. **Click "Why is this risky?"** → Show risk factors
3. **Open Heat Risk Map** → Show risk zones with markers
4. **Click Katpadi / Industrial Zone** → Show vulnerable outdoor workers
5. **Open Forecast** → Show danger window and timeline
6. **Click AI Action Advisor** → Show government recommendations
7. **Click Simulate Alert** → Generate warning and notification
8. **Open Citizen Mode** → Show personalized risk assessment
9. **Open Data & Transparency** → Show how the score is calculated

### Demo Scenarios:

| Scenario | Description |
|----------|------------|
| **Normal Day** | Warm but manageable (+0°C offset) |
| **Heatwave Developing** | Rising temperatures (+0°C, baseline) |
| **Extreme Emergency** | Dangerous conditions (+4°C, low wind) |

---

## ⚠️ Limitations

### Prototype Limitations:
- Uses simulated/demo data, not live weather feeds
- Thermal models are simplified approximations
- No real-time API integration
- No user authentication
- No persistent database
- AI uses rule-based fallback (no LLM integration yet)

### Scientific Limitations:
- WBGT formula is a simplified field approximation
- UTCI uses a regression approximation, not the full thermoregulation model
- Risk scores are not medically validated
- No individual mortality prediction capability

---

## 🚀 Future Scope

1. **Live Data Integration:** Connect to IMD, NASA POWER, Open-Meteo APIs
2. **Full LLM Integration:** Upgrade AI to use GPT/Claude for richer analysis
3. **Historical Analysis:** Track heat events over time
4. **Mobile App:** Native iOS/Android with push notifications
5. **IoT Sensors:** Integrate ground-level temperature/humidity sensors
6. **Satellite Imagery:** Real-time land surface temperature
7. **Epidemiological Data:** Integrate hospital admission data for validated impact models
8. **Multi-Language:** Hindi, Tamil, and regional language support
9. **Offline Mode:** PWA with cached data for areas with poor connectivity
10. **Government API Integration:** Connect with state disaster management systems

---

## ⚖️ Ethical Considerations

- **Does not replace official warnings:** HeatShield AI is complementary to IMD and government meteorological services
- **No medical claims:** Risk scores are decision-support tools, not medical diagnoses
- **Data transparency:** All algorithms and weights are documented and configurable
- **No fake data:** Demo data is clearly labeled as simulated
- **Accessibility:** Risk information uses both color AND text/icons
- **Vulnerability-aware:** Considers vulnerable populations, not just weather data

---

## 👥 Team Contribution

| Member | Contribution |
|--------|-------------|
| *Add team members* | *Add contributions* |

---

## 📄 License

Built for Smart India Hackathon 2026.

---

> **HeatShield AI** — From Heat Forecasts to Human Safety.
> *An impact-based decision-support and visualization layer that converts weather intelligence into human-impact intelligence.*
