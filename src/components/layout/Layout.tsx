import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { ZoneWeatherStatus } from '../../types';

interface LayoutProps {
  selectedZone: string;
  onZoneChange: (zoneId: string) => void;
  zones: { id: string; name: string }[];
  dataMode: 'live' | 'cached' | 'demo' | 'unavailable' | 'loading';
  onRefresh: () => void;
  isRefreshing: boolean;
  lastRefresh: Date | null;
  weatherStatus: Record<string, ZoneWeatherStatus>;
}

export default function Layout({
  selectedZone, onZoneChange, zones,
  dataMode, onRefresh, isRefreshing, lastRefresh, weatherStatus,
}: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          selectedZone={selectedZone}
          onZoneChange={onZoneChange}
          zones={zones}
          dataMode={dataMode}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          lastRefresh={lastRefresh}
          weatherStatus={weatherStatus}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
