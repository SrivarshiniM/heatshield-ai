import { MapPin, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import DataModeIndicator from '../common/DataModeIndicator';
import { ZoneWeatherStatus } from '../../types';

interface HeaderProps {
  selectedZone: string;
  onZoneChange: (zoneId: string) => void;
  zones: { id: string; name: string }[];
  dataMode: 'live' | 'cached' | 'demo' | 'unavailable' | 'loading';
  onRefresh: () => void;
  isRefreshing: boolean;
  lastRefresh: Date | null;
  weatherStatus: Record<string, ZoneWeatherStatus>;
}

export default function Header({
  selectedZone, onZoneChange, zones,
  dataMode, onRefresh, isRefreshing, lastRefresh,
  weatherStatus,
}: HeaderProps) {
  const selectedStatus = weatherStatus[selectedZone];

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Left: Location + zone status */}
      <div className="flex items-center gap-3">
        <MapPin className="w-4 h-4 text-sky-600" />
        <select
          value={selectedZone}
          onChange={(e) => onZoneChange(e.target.value)}
          className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="Select zone"
        >
          {zones.map(z => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
        <span className="text-xs text-slate-400 hidden sm:inline">Vellore, Tamil Nadu, India</span>
        {selectedStatus?.status === 'unavailable' && (
          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1">
            <WifiOff className="w-2.5 h-2.5" />
            This zone unavailable
          </span>
        )}
      </div>

      {/* Right: Data Mode + Refresh */}
      <div className="flex items-center gap-3">
        <DataModeIndicator
          mode={dataMode}
          lastRefresh={lastRefresh}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-all disabled:opacity-50"
          aria-label="Refresh weather data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    </header>
  );
}
