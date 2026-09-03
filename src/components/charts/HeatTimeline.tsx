import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';
import { ForecastHour, RISK_LEVELS } from '../../types';

interface HeatTimelineProps {
  hours: ForecastHour[];
  peakWindow?: string;
}

function getRiskColor(level: string): string {
  return RISK_LEVELS[level as keyof typeof RISK_LEVELS]?.color || '#94a3b8';
}

export default function HeatTimeline({ hours, peakWindow }: HeatTimelineProps) {
  const data = hours.map((h) => ({
    time: h.time,
    temp: h.weather.temperature,
    humidity: h.weather.humidity,
    heatIndex: h.thermalMetrics.heatIndex,
    risk: h.risk.overall,
    riskLevel: h.risk.level,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">24-Hour Heat Risk Timeline</h3>
        {peakWindow && (
          <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full font-medium">
            ⚠️ Peak Risk: {peakWindow}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#94a3b8" interval={1} />
          <YAxis yAxisId="risk" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis yAxisId="temp" orientation="right" domain={[25, 50]} tick={{ fontSize: 11 }} stroke="#94a3b8" unit="°C" />
          <Tooltip
            contentStyle={{
              fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'risk') return [`${value}/100`, 'Risk Score'];
              if (name === 'temp') return [`${value}°C`, 'Temperature'];
              if (name === 'heatIndex') return [`${value}°C`, 'Heat Index'];
              if (name === 'humidity') return [`${value}%`, 'Humidity'];
              return [value, name];
            }}
          />
          {/* Danger zones */}
          <ReferenceArea yAxisId="risk" y1={75} y2={100} fill="#fef2f2" stroke="#fecaca" strokeDasharray="3 3" />
          <ReferenceArea yAxisId="risk" y1={50} y2={75} fill="#fff7ed" stroke="#fed7aa" strokeDasharray="3 3" />

          <Area yAxisId="risk" type="monotone" dataKey="risk" stroke="#ef4444" fill="url(#riskGrad)" strokeWidth={2} name="risk" />
          <Area yAxisId="temp" type="monotone" dataKey="temp" stroke="#0ea5e9" fill="url(#tempGrad)" strokeWidth={2} name="temp" />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-500 rounded" /> Risk Score</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-sky-500 rounded" /> Temperature</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-red-100 border border-red-300 rounded" /> Extreme zone</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-orange-50 border border-orange-300 rounded" /> High zone</span>
      </div>
    </div>
  );
}
