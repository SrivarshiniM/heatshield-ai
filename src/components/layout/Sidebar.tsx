import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Map, Thermometer, Cloud, ShieldAlert,
  Building2, Brain, Users, HardHat, Bell, FileText,
  Settings, Flame, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import { useState } from 'react';

const navSections = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'map', label: 'Heat Risk Map', icon: Map, path: '/map' },
    ],
  },
  {
    title: 'Analysis',
    items: [
      { id: 'thermal', label: 'Thermal Stress', icon: Thermometer, path: '/thermal' },
      { id: 'forecast', label: 'Forecast & Warning', icon: Cloud, path: '/forecast' },
      { id: 'vulnerability', label: 'Vulnerability', icon: ShieldAlert, path: '/vulnerability' },
      { id: 'simulator', label: 'What-If Simulator', icon: Zap, path: '/simulator' },
    ],
  },
  {
    title: 'Response',
    items: [
      { id: 'government', label: 'Govt Response', icon: Building2, path: '/government' },
      { id: 'ai-advisor', label: 'AI Action Advisor', icon: Brain, path: '/ai-advisor' },
      { id: 'alerts', label: 'Alerts', icon: Bell, path: '/alerts' },
    ],
  },
  {
    title: 'Safety',
    items: [
      { id: 'citizen', label: 'Citizen Mode', icon: Users, path: '/citizen' },
      { id: 'worker', label: 'Worker Safety', icon: HardHat, path: '/worker' },
    ],
  },
  {
    title: 'Info',
    items: [
      { id: 'transparency', label: 'Data & Models', icon: FileText, path: '/transparency' },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`bg-slate-900 text-white flex flex-col h-screen sticky top-0 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 h-16 border-b border-slate-700">
        <Flame className="w-7 h-7 text-orange-400 flex-shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-bold text-sm leading-tight">HeatShield</div>
            <div className="text-[10px] text-slate-400 leading-tight">AI Platform</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navSections.map((section) => (
          <div key={section.title} className="mb-3">
            {!collapsed && (
              <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 mb-0.5 ${
                    isActive
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
