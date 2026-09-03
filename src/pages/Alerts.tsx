import { useState, useEffect } from 'react';
import { Zone, HeatAlert, RISK_LEVELS } from '../types';
import RiskBadge from '../components/common/RiskBadge';
import { Bell, Play, AlertTriangle, CheckCircle, X, Clock, Loader2 } from 'lucide-react';
import { getAdminRecommendations } from '../engine/ai';

interface AlertsProps {
  zones: Zone[];
  selectedZone: Zone | null;
}

export default function Alerts({ zones, selectedZone }: AlertsProps) {
  const [alerts, setAlerts] = useState<HeatAlert[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState(selectedZone?.id || '');
  const [notification, setNotification] = useState<HeatAlert | null>(null);

  // Sync selectedZoneId when header zone changes
  useEffect(() => {
    if (selectedZone && selectedZoneId !== selectedZone.id) {
      setSelectedZoneId(selectedZone.id);
    }
  }, [selectedZone, selectedZoneId]);

  const simulateAlert = () => {
    if (!selectedZone) return;
    setSimulating(true);
    const zone = zones.find(z => z.id === selectedZoneId) || selectedZone;

    setTimeout(() => {
      const recs = getAdminRecommendations(zone);
      const newAlert: HeatAlert = {
        id: `alert-${Date.now()}`,
        zone: zone.name,
        level: zone.risk.level,
        issuedAt: new Date(),
        validFrom: new Date(),
        validTo: new Date(Date.now() + 24 * 60 * 60 * 1000),
        peakWindow: '12:30 PM – 4:30 PM',
        confidence: 'high',
        message: `HEATWAVE RISK — ${zone.name} — ${zone.risk.level.toUpperCase()} risk detected. Temperature: ${zone.weather.temperature}°C, Humidity: ${zone.weather.humidity}%.`,
        affectedPopulation: zone.population,
        recommendations: recs.actions,
      };

      setAlerts(prev => [newAlert, ...prev]);
      setNotification(newAlert);
      setSimulating(false);

      // Auto-dismiss notification after 8 seconds
      setTimeout(() => setNotification(null), 8000);
    }, 1500);
  };

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a } : a));
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (!selectedZone) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alert Simulation</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generate and manage heat emergency alerts</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm font-medium">Waiting for live weather data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Alert Simulation</h1>
        <p className="text-sm text-slate-500 mt-0.5">Generate and manage heat emergency alerts</p>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 w-96 bg-white rounded-xl shadow-2xl border-2 p-4 animate-pulse"
          style={{ borderColor: RISK_LEVELS[notification.level].color }}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 mt-0.5" style={{ color: RISK_LEVELS[notification.level].color }} />
              <div>
                <div className="text-sm font-bold text-slate-900">⚠️ HEAT ALERT ISSUED</div>
                <div className="text-xs text-slate-600 mt-1">{notification.message}</div>
              </div>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Alert Simulation Controls */}
      <div className="card border-purple-200 bg-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-purple-800">🎬 SIH Demo — Simulate Alert</h3>
            <p className="text-xs text-purple-600 mt-1">
              Generate an alert for a high-risk zone. This demonstrates the full alert pipeline.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {zones.filter(z => z.risk.level === 'extreme' || z.risk.level === 'high').map(z => (
                <option key={z.id} value={z.id}>{z.name} ({RISK_LEVELS[z.risk.level].emoji} {z.risk.overall})</option>
              ))}
            </select>
            <button
              onClick={simulateAlert}
              disabled={simulating}
              className="btn-danger flex items-center gap-2 disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Simulate Alert
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div>
        <h3 className="section-title text-sm mb-3">
          Active Alerts ({alerts.length})
        </h3>
        {alerts.length === 0 ? (
          <div className="card text-center py-12 text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No active alerts. Use "Simulate Alert" to generate one.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="rounded-xl border-2 p-5"
                style={{ borderColor: RISK_LEVELS[alert.level].color + '60' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" style={{ color: RISK_LEVELS[alert.level].color }} />
                    <div>
                      <div className="text-sm font-bold text-slate-900">HEATWAVE RISK DETECTED</div>
                      <div className="text-xs text-slate-500 mt-0.5">{alert.zone}</div>
                    </div>
                    <RiskBadge level={alert.level} size="sm" />
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500">Peak Window</span>
                    <div className="font-medium">{alert.peakWindow}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Confidence</span>
                    <div className="font-medium capitalize">{alert.confidence}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Affected Population</span>
                    <div className="font-medium">{alert.affectedPopulation.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Issued</span>
                    <div className="font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Just now
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-700 mb-3">{alert.message}</p>

                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs font-semibold text-slate-500 mb-2">Recommended Actions:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {alert.recommendations.slice(0, 6).map((rec, i) => (
                      <div key={i} className="text-xs text-slate-600 flex items-start gap-1">
                        <span>•</span> {rec}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="btn-secondary text-xs flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" /> Acknowledge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
