import { useState } from 'react';
import { Zone, ActivityType, ACTIVITY_PROFILES, RISK_LEVELS } from '../types';
import RiskBadge from '../components/common/RiskBadge';
import { HardHat, Droplets, AlertTriangle, Loader2 } from 'lucide-react';
import { calculateThermalMetrics } from '../engine/thermal';
import { calculateRisk } from '../engine/risk';

interface WorkerModeProps {
  zone: Zone | null;
}

type WorkIntensity = 'light' | 'moderate' | 'heavy';
type Clothing = 'minimal' | 'standard' | 'protective';

const workIntensities: { value: WorkIntensity; label: string; factor: number }[] = [
  { value: 'light', label: 'Light (sitting, light tools)', factor: 0.85 },
  { value: 'moderate', label: 'Moderate (walking, lifting)', factor: 1.0 },
  { value: 'heavy', label: 'Heavy (digging, heavy lifting)', factor: 1.25 },
];

const clothingOptions: { value: Clothing; label: string; factor: number }[] = [
  { value: 'minimal', label: 'Minimal (shorts, t-shirt)', factor: 0.9 },
  { value: 'standard', label: 'Standard (work uniform)', factor: 1.0 },
  { value: 'protective', label: 'Protective (PPE, coveralls)', factor: 1.3 },
];

const outdoorActivities: { value: ActivityType; label: string }[] = [
  { value: 'construction', label: 'Construction' },
  { value: 'road_work', label: 'Road Work' },
  { value: 'agriculture', label: 'Agriculture' },
];

export default function WorkerMode({ zone }: WorkerModeProps) {
  const [activity, setActivity] = useState<ActivityType>('construction');
  const [intensity, setIntensity] = useState<WorkIntensity>('moderate');
  const [clothing, setClothing] = useState<Clothing>('standard');
  const [acclimatized, setAcclimatized] = useState(true);

  if (!zone) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Worker Safety Mode</h1>
          <p className="text-sm text-slate-500 mt-0.5">Occupational heat-risk guidance</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm font-medium">Waiting for live weather data…</p>
        </div>
      </div>
    );
  }

  const intensityFactor = workIntensities.find(w => w.value === intensity)?.factor || 1.0;
  const clothingFactor = clothingOptions.find(c => c.value === clothing)?.factor || 1.0;
  const acclimFactor = acclimatized ? 0.85 : 1.15;

  const adjustedWeather = {
    ...zone.weather,
    temperature: zone.weather.temperature * intensityFactor * 0.1 + zone.weather.temperature * 0.9,
    solarRadiation: zone.weather.solarRadiation * clothingFactor,
  };
  const thermal = calculateThermalMetrics(adjustedWeather);
  const baseRisk = calculateRisk(adjustedWeather, thermal, zone.vulnerability);
  const workerScore = Math.min(100, Math.round(baseRisk.overall * intensityFactor * clothingFactor * acclimFactor));

  const getLevel = (score: number) => {
    if (score >= 75) return 'extreme' as const;
    if (score >= 50) return 'high' as const;
    if (score >= 25) return 'moderate' as const;
    return 'low' as const;
  };
  const level = getLevel(workerScore);

  const workRestCycle: Record<string, { work: string; rest: string }> = {
    extreme: { work: '30 min', rest: '30 min' },
    high: { work: '45 min', rest: '15 min' },
    moderate: { work: '50 min', rest: '10 min' },
    low: { work: '60 min', rest: 'No mandatory rest' },
  };

  const hydrationRate: Record<string, string> = {
    extreme: '500ml every 15 minutes',
    high: '250ml every 15 minutes',
    moderate: '200ml every 20 minutes',
    low: '200ml every 30 minutes',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Worker Safety Mode</h1>
          <p className="text-sm text-slate-500 mt-0.5">Occupational heat-risk guidance — {zone.name}</p>
        </div>
        <span className="badge bg-amber-100 text-amber-700 border-amber-200">
          Prototype — Not a workplace safety standard
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <HardHat className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-semibold">Work Parameters</h3>
            </div>

            {/* Activity Type */}
            <div className="mb-4">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Activity Type</label>
              <div className="space-y-1.5">
                {outdoorActivities.map(a => (
                  <button
                    key={a.value}
                    onClick={() => setActivity(a.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      activity === a.value
                        ? 'bg-sky-100 border-2 border-sky-400 font-medium'
                        : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Work Intensity */}
            <div className="mb-4">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Work Intensity</label>
              <div className="space-y-1.5">
                {workIntensities.map(w => (
                  <button
                    key={w.value}
                    onClick={() => setIntensity(w.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      intensity === w.value
                        ? 'bg-sky-100 border-2 border-sky-400 font-medium'
                        : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clothing */}
            <div className="mb-4">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Clothing Category</label>
              <div className="space-y-1.5">
                {clothingOptions.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setClothing(c.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      clothing === c.value
                        ? 'bg-sky-100 border-2 border-sky-400 font-medium'
                        : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Acclimatization */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Acclimatization Status</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAcclimatized(true)}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    acclimatized
                      ? 'bg-green-100 border-2 border-green-400 font-medium text-green-800'
                      : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  ✅ Acclimatized
                </button>
                <button
                  onClick={() => setAcclimatized(false)}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    !acclimatized
                      ? 'bg-red-100 border-2 border-red-400 font-medium text-red-800'
                      : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  ❌ Not Acclimatized
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Worker Risk Card */}
          <div className={`rounded-xl border-2 p-6 ${
            level === 'extreme' ? 'bg-red-50 border-red-300' :
            level === 'high' ? 'bg-orange-50 border-orange-300' :
            level === 'moderate' ? 'bg-yellow-50 border-yellow-300' :
            'bg-green-50 border-green-300'
          }`}>
            <div className="text-center">
              <div className="text-sm font-medium text-slate-500 mb-1">WORKER HEAT RISK</div>
              <div className="text-5xl font-bold mb-1" style={{ color: RISK_LEVELS[level].color }}>
                {workerScore}
              </div>
              <div className="text-xs text-slate-400 mb-2">/100</div>
              <RiskBadge level={level} size="lg" />
            </div>
          </div>

          {/* Work/Rest Strategy */}
          <div className="card">
            <h3 className="section-title text-sm mb-3">Recommended Work/Rest Strategy</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-sky-50 rounded-lg p-4 text-center">
                <div className="text-xs text-sky-600 font-medium mb-1">WORK</div>
                <div className="text-2xl font-bold text-sky-800">{workRestCycle[level].work}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-xs text-blue-600 font-medium mb-1">REST (in shade/cool area)</div>
                <div className="text-2xl font-bold text-blue-800">{workRestCycle[level].rest}</div>
              </div>
            </div>
          </div>

          {/* Hydration */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold">Hydration Requirement</h3>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-blue-800">{hydrationRate[level]}</div>
              <p className="text-xs text-blue-600 mt-1">Start drinking before you feel thirsty. Add electrolytes if sweating heavily.</p>
            </div>
          </div>

          {/* Peak Danger */}
          <div className="card border-red-200 bg-red-50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-semibold text-red-800">Peak Danger Period</h3>
            </div>
            <p className="text-sm text-red-700">
              <strong>11:00 AM – 4:00 PM</strong> — {level === 'extreme' ? 'SUSPEND outdoor work during this period.' : 'Minimize exposure during this period.'}
            </p>
          </div>

          {/* Safety Checklist */}
          <div className="card">
            <h3 className="section-title text-sm mb-3">Pre-Shift Safety Checklist</h3>
            <div className="space-y-2">
              {[
                'Check weather forecast and heat risk level before starting work',
                'Ensure adequate water supply at work site (minimum 1L per worker per hour)',
                'Identify shaded rest areas with good air circulation',
                'Brief all workers on heat illness symptoms and first response',
                'Ensure first-aid kit includes oral rehydration salts',
                'Establish buddy system — monitor each other for symptoms',
                'Have emergency transport plan ready',
                'Know the signs: dizziness, nausea, headache, confusion, stopped sweating',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-700 p-2 bg-slate-50 rounded">
                  <input type="checkbox" className="mt-0.5 accent-sky-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-400">
            ⚠️ Prototype occupational heat-risk guidance. Does not replace workplace safety standards.
            Always follow OSHA, factory inspectorate, and local labor safety regulations.
          </p>
        </div>
      </div>
    </div>
  );
}
