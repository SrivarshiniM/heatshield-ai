import { Wifi, WifiOff, Clock, RefreshCw, Database } from 'lucide-react';

interface DataModeIndicatorProps {
  mode: 'live' | 'cached' | 'demo' | 'unavailable' | 'loading';
  lastRefresh?: Date | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function DataModeIndicator({
  mode, lastRefresh, onRefresh, isRefreshing = false,
}: DataModeIndicatorProps) {
  if (mode === 'loading') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-xs font-semibold">
        <span className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
        <span>Loading…</span>
      </div>
    );
  }

  if (mode === 'live') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
        <Wifi className="w-3 h-3" />
        <span>Live Forecast Data · Open-Meteo</span>
        {lastRefresh && (
          <span className="flex items-center gap-0.5 text-green-500 font-normal">
            <Clock className="w-2.5 h-2.5" />
            {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-green-500 hover:text-green-700 disabled:opacity-50 transition-colors"
            aria-label="Refresh weather data"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    );
  }

  if (mode === 'cached') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
        <Clock className="w-3 h-3" />
        <span>Cached Weather Data</span>
        {lastRefresh && (
          <span className="flex items-center gap-0.5 text-blue-500 font-normal">
            <Clock className="w-2.5 h-2.5" />
            {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-blue-500 hover:text-blue-700 disabled:opacity-50 transition-colors"
            aria-label="Refresh weather data"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    );
  }

  if (mode === 'demo') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
        <Database className="w-3 h-3" />
        <span>Demo / Simulated Data</span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-amber-500 hover:text-amber-700 disabled:opacity-50 transition-colors"
            aria-label="Retry weather fetch"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    );
  }

  // unavailable
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
      <WifiOff className="w-3 h-3" />
      <span>Weather Unavailable</span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
          aria-label="Retry weather fetch"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}
