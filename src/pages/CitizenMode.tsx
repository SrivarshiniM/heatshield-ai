import { useState } from 'react';
import { Zone, ActivityType, ACTIVITY_PROFILES, RISK_LEVELS } from '../types';
import { Loader2 } from 'lucide-react';
import RiskBadge from '../components/common/RiskBadge';
import { Users, Clock, Shield, Droplets, ThermometerSun } from 'lucide-react';
import { calculateThermalMetrics } from '../engine/thermal';
import { calculateRisk } from '../engine/risk';

interface CitizenModeProps {
  zone: Zone | null;
}

const exposureDurations = [
  { label: '< 30 min', minutes: 15, riskMultiplier: 0.7 },
  { label: '30 – 60 min', minutes: 45, riskMultiplier: 1.0 },
  { label: '1 – 2 hours', minutes: 90, riskMultiplier: 1.3 },
  { label: '> 2 hours', minutes: 150, riskMultiplier: 1.6 },
];

export default function CitizenMode({ zone }: CitizenModeProps) {
  const [activity, setActivity] = useState<ActivityType>('general');
  const [durationIdx, setDurationIdx] = useState(1);

  if (!zone) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Citizen Safety Mode</h1>
          <p className="text-sm text-slate-500 mt-0.5">Personalized heat risk assessment</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm font-medium">Waiting for live weather data…</p>
        </div>
      </div>
    );
  }

  const profile = ACTIVITY_PROFILES[activity];
  const duration = exposureDurations[durationIdx];

  // Calculate personalized risk
  const adjustedWeather = {
    ...zone.weather,
    solarRadiation: zone.weather.solarRadiation * profile.exposureMultiplier,
  };
  const thermal = calculateThermalMetrics(adjustedWeather);
  const baseRisk = calculateRisk(adjustedWeather, thermal, zone.vulnerability);
  const personalizedScore = Math.min(100, Math.round(baseRisk.overall * duration.riskMultiplier * profile.exposureMultiplier));

  const getLevel = (score: number) => {
    if (score >= 75) return 'extreme' as const;
    if (score >= 50) return 'high' as const;
    if (score >= 25) return 'moderate' as const;
    return 'low' as const;
  };

  const level = getLevel(personalizedScore);

  const safeActions: Record<string, string[]> = {
    extreme: [
      '⚠️ Avoid outdoor exposure during peak hours (11 AM – 4 PM)',
      'Carry at least 1 liter of water per hour of exposure',
      'Wear wide-brimmed hat, sunglasses, and loose light clothing',
      'Take rest breaks in shaded/air-conditioned areas every 15 minutes',
      'Watch for heat stroke symptoms: confusion, no sweating, hot skin',
      'Have emergency contacts ready: Ambulance 108, Health Helpline 104',
    ],
    high: [
      'Minimize outdoor exposure during midday',
      'Drink water regularly — at least 500ml per hour',
      'Wear sun-protective clothing',
      'Take breaks in shade every 20–30 minutes',
      'Carry oral rehydration salts',
      'Check on elderly neighbors and family members',
    ],
    moderate: [
      'Stay hydrated — drink water before you feel thirsty',
      'Wear light, loose-fitting clothing',
      'Seek shade when possible',
      'Take rest breaks if doing physical activity',
      'Keep track of how you feel',
    ],
    low: [
      'Maintain normal hydration',
      'Wear comfortable clothing',
      'No special precautions needed',
      'Continue monitoring weather updates',
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Citizen Safety Mode</h1>
        <p className="text-sm text-slate-500 mt-0.5">Personalized heat risk assessment — {zone.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          {/* Location */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-semibold">Your Location</h3>
            </div>
            <div className="bg-sky-50 rounded-lg p-3 text-sm text-sky-800">
              📍 {zone.name}, Vellore
            </div>
          </div>

          {/* Activity Selection */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Your Activity</h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(ACTIVITY_PROFILES) as [ActivityType, typeof profile][]).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setActivity(key)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-sm text-left transition-all ${
                    activity === key
                      ? 'bg-sky-100 border-2 border-sky-400 text-sky-800'
                      : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-lg">{p.icon}</span>
                  <span className="font-medium text-xs">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Exposure Duration */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-semibold">Exposure Duration</h3>
            </div>
            <div className="space-y-2">
              {exposureDurations.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setDurationIdx(i)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    durationIdx === i
                      ? 'bg-sky-100 border-2 border-sky-400 font-medium'
                      : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Result */}
        <div className="lg:col-span-2 space-y-4">
          {/* Big Risk Card */}
          <div className={`rounded-xl border-2 p-8 text-center ${
            level === 'extreme' ? 'bg-red-50 border-red-300' :
            level === 'high' ? 'bg-orange-50 border-orange-300' :
            level === 'moderate' ? 'bg-yellow-50 border-yellow-300' :
            'bg-green-50 border-green-300'
          }`}>
            <div className="text-sm font-medium text-slate-500 mb-2">YOUR CURRENT HEAT RISK</div>
            <div className="text-6xl font-bold mb-2" style={{ color: RISK_LEVELS[level].color }}>
              {personalizedScore}
            </div>
            <div className="text-sm text-slate-400 mb-3">out of 100</div>
            <RiskBadge level={level} size="lg" />
          </div>

          {/* Explanation */}
          <div className="card">
            <h3 className="section-title text-sm mb-2">Risk Explanation</h3>
            <p className="text-sm text-slate-700">
              Your selected activity (<strong>{profile.label}</strong>) with{' '}
              <strong>{duration.label}</strong> exposure involves{' '}
              {activity === 'general' ? 'minimal' :
               activity === 'walking' ? 'moderate' :
               activity === 'agriculture' ? 'prolonged outdoor' :
               activity === 'construction' ? 'heavy outdoor labor with high metabolic heat' :
               activity === 'road_work' ? 'prolonged outdoor labor' :
               'intense physical'} exposure
              during a period of {level} thermal stress.
              {profile.exposureMultiplier > 1.3 &&
                ` The physical intensity of this activity significantly increases heat absorption.`}
            </p>
          </div>

          {/* Safe Actions */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold">Safe Actions</h3>
            </div>
            <div className="space-y-2">
              {safeActions[level].map((action, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                  {action}
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-700">
            <strong>⚠️ Disclaimer:</strong> This is a prototype risk assessment tool. It does not provide medical diagnosis
            or predict individual health outcomes. Always follow official local health and meteorological guidance.
            If you feel unwell, seek medical attention immediately.
          </div>
        </div>
      </div>
    </div>
  );
}
