// ============================================================
// Data Source Banner — replaces the old DemoModeBanner
// Shows whether live weather data is available or unavailable.
// ============================================================

import { Wifi, WifiOff, Clock } from 'lucide-react';

interface DataSourceBannerProps {
  mode: 'live' | 'cached' | 'demo' | 'unavailable' | 'loading';
  lastRefresh?: Date | null;
}

export default function DataSourceBanner({ mode, lastRefresh }: DataSourceBannerProps) {
  if (mode === 'loading') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
        <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-600">Connecting to Open-Meteo…</span>
      </div>
    );
  }

  if (mode === 'live') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
        <Wifi className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
        <span className="text-xs font-semibold text-green-700">Live Forecast Data · Open-Meteo</span>
        {lastRefresh && (
          <span className="text-[10px] text-green-500 flex items-center gap-0.5 ml-1">
            <Clock className="w-2.5 h-2.5" />
            Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    );
  }

  if (mode === 'cached') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
        <span className="text-xs font-semibold text-blue-700">Cached Weather Data</span>
        {lastRefresh && (
          <span className="text-[10px] text-blue-500 flex items-center gap-0.5 ml-1">
            · Last updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    );
  }

  if (mode === 'demo') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
        <span className="text-amber-600 font-semibold text-xs">⚠️ DEMO / SIMULATED DATA</span>
        <span className="text-[10px] text-amber-600">
          Weather data is simulated prototype data. Not live observations.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
      <WifiOff className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
      <span className="text-xs font-semibold text-amber-700">Live weather temporarily unavailable</span>
      <span className="text-[10px] text-amber-600">
        — No synthetic data is shown. Click Refresh to retry.
      </span>
    </div>
  );
}
