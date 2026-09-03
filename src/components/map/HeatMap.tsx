import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Zone, CoolingCenter, Hospital, RISK_LEVELS, RiskLevel } from '../../types';
import RiskBadge from '../common/RiskBadge';

interface HeatMapProps {
  zones: Zone[];
  coolingCenters: CoolingCenter[];
  hospitals: Hospital[];
  schools: { id: string; name: string; lat: number; lng: number }[];
  selectedZoneId: string;
  onZoneSelect: (zoneId: string) => void;
  layers: { riskZones: boolean; hospitals: boolean; coolingCenters: boolean; schools: boolean; outdoorWorkers: boolean };
}

function getRadius(level: RiskLevel): number {
  switch (level) {
    case 'extreme': return 35;
    case 'high': return 28;
    case 'moderate': return 22;
    case 'low': return 16;
  }
}

function getRiskOpacity(level: RiskLevel): number {
  switch (level) {
    case 'extreme': return 0.55;
    case 'high': return 0.45;
    case 'moderate': return 0.35;
    case 'low': return 0.25;
  }
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  return null;
}

export default function HeatMap({
  zones, coolingCenters, hospitals, schools,
  selectedZoneId, onZoneSelect, layers,
}: HeatMapProps) {
  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const center: [number, number] = selectedZone
    ? [selectedZone.lat, selectedZone.lng]
    : [12.9165, 79.1325];

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: '500px' }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} />

        {/* Risk Zones */}
        {layers.riskZones && zones.map(zone => (
          <CircleMarker
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={getRadius(zone.risk.level)}
            pathOptions={{
              color: RISK_LEVELS[zone.risk.level].color,
              fillColor: RISK_LEVELS[zone.risk.level].color,
              fillOpacity: getRiskOpacity(zone.risk.level),
              weight: zone.id === selectedZoneId ? 3 : 1.5,
            }}
            eventHandlers={{
              click: () => onZoneSelect(zone.id),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <div className="text-xs font-bold" style={{ color: RISK_LEVELS[zone.risk.level].color }}>
                {zone.name} — {zone.risk.overall}/100
              </div>
            </Tooltip>
            <Popup>
              <div className="text-sm min-w-[200px]">
                <div className="font-bold text-slate-900 mb-1">{zone.name}</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold" style={{ color: RISK_LEVELS[zone.risk.level].color }}>
                    {zone.risk.overall}/100
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: RISK_LEVELS[zone.risk.level].color + '20', color: RISK_LEVELS[zone.risk.level].color }}>
                    {RISK_LEVELS[zone.risk.level].emoji} {RISK_LEVELS[zone.risk.level].label}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <div>🌡 {zone.weather.temperature}°C | 💧 {zone.weather.humidity}%</div>
                  <div>💨 {zone.weather.windSpeed} m/s | ☀️ {zone.weather.solarRadiation} W/m²</div>
                  <div>Pop: ~{zone.population.toLocaleString()}</div>
                  <div className="mt-1 pt-1 border-t border-slate-100 text-slate-500">Click for full details →</div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Cooling Centers */}
        {layers.coolingCenters && coolingCenters.map(cc => (
          <CircleMarker
            key={cc.id}
            center={[cc.lat, cc.lng]}
            radius={8}
            pathOptions={{
              color: cc.status === 'open' ? '#0ea5e9' : '#94a3b8',
              fillColor: cc.status === 'open' ? '#0ea5e9' : '#94a3b8',
              fillOpacity: 0.7,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm min-w-[160px]">
                <div className="font-bold">{cc.name}</div>
                <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                  <div>Status: {cc.status === 'open' ? '✅ OPEN' : '❌ CLOSED'}</div>
                  <div>Capacity: {cc.capacity} people</div>
                  <div>Water: {cc.waterAvailable ? '✅ Available' : '❌ Not Available'}</div>
                  <div>Contact: {cc.contact}</div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Hospitals */}
        {layers.hospitals && hospitals.map(h => (
          <CircleMarker
            key={h.id}
            center={[h.lat, h.lng]}
            radius={10}
            pathOptions={{
              color: '#dc2626',
              fillColor: '#fecaca',
              fillOpacity: 0.8,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-bold">{h.name}</div>
                <div className="text-xs text-slate-600 mt-1">
                  Beds: {h.beds} | Emergency: {h.emergencyCapacity}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Schools */}
        {layers.schools && schools.map(s => (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={7}
            pathOptions={{
              color: '#7c3aed',
              fillColor: '#ede9fe',
              fillOpacity: 0.8,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-bold">{s.name}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
