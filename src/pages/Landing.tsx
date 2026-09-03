import { useNavigate } from 'react-router-dom';
import { Flame, ArrowRight, Thermometer, Users, AlertTriangle, Shield, Brain, Map, BarChart3, Building2 } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10" />
        <div className="max-w-6xl mx-auto px-6 py-24 relative">
          <div className="flex items-center gap-3 mb-6">
            <Flame className="w-10 h-10 text-orange-400" />
            <span className="text-sm font-semibold text-orange-400 tracking-wider uppercase">SIH 2026</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4">
            Heat<span className="text-orange-400">Shield</span> AI
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-2">From Heat Forecasts to Human Safety.</p>
          <p className="text-base text-slate-400 max-w-2xl mb-8">
            An AI-assisted impact-based heat intelligence platform that transforms multi-parameter
            weather conditions into human thermal stress, vulnerability-aware risk and actionable
            early warnings.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors text-lg"
            >
              Explore Live Heat Risk <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/transparency')}
              className="border border-slate-600 hover:border-slate-400 text-slate-300 font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              How It Works
            </button>
          </div>
        </div>
      </header>

      {/* Detect → Assess → Act */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Thermometer, color: 'text-orange-400', bg: 'bg-orange-500/10',
              title: '🌡️ Detect', heading: 'Multi-Parameter Detection',
              desc: 'Goes beyond air temperature. Captures humidity, wind, solar radiation, and creates comprehensive thermal stress profiles.',
            },
            {
              icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10',
              title: '🧍 Assess', heading: 'Human-Centric Assessment',
              desc: 'Combines thermal stress with population vulnerability, outdoor worker exposure, and healthcare accessibility for true impact risk.',
            },
            {
              icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10',
              title: '🚨 Act', heading: 'Actionable Intelligence',
              desc: 'Generates specific, targeted recommendations for district administration, citizens, outdoor workers, and emergency services.',
            },
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <h3 className="text-lg font-bold mb-2">{card.title}</h3>
                <h4 className="text-sm font-medium text-slate-300 mb-2">{card.heading}</h4>
                <p className="text-sm text-slate-400">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">The HeatShield Difference</h2>
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Traditional Weather Warning</th>
                <th className="text-left py-3 px-4 text-orange-400 font-medium">HeatShield AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {[
                ['Temperature focused', 'Multi-factor thermal stress'],
                ['Broad area', 'Hyperlocal zones'],
                ['Hazard information', 'Human impact'],
                ['Generic warning', 'Vulnerability-aware'],
                ['Information only', 'Recommended action'],
                ['Weather dashboard', 'Decision-support platform'],
                ['"How hot is it?"', '"Who is at risk, where, when, why?"'],
              ].map(([old, nu], i) => (
                <tr key={i}>
                  <td className="py-3 px-4 text-slate-400">{old}</td>
                  <td className="py-3 px-4 text-orange-300 font-medium">{nu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">Platform Features</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Map, label: 'Interactive Heat Risk Map' },
            { icon: BarChart3, label: '24-Hour Risk Timeline' },
            { icon: Brain, label: 'AI Action Advisor' },
            { icon: Shield, label: 'Vulnerability Intelligence' },
            { icon: Building2, label: 'Government Response Center' },
            { icon: Users, label: 'Citizen Safety Mode' },
            { icon: AlertTriangle, label: 'Alert Simulation' },
            { icon: Thermometer, label: 'WBGT / UTCI / Heat Index' },
          ].map(f => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700 text-center">
                <Icon className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <span className="text-xs font-medium text-slate-300">{f.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Architecture Pipeline */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">Core Pipeline</h2>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          {['Forecast', 'Thermal Stress', 'Vulnerability', 'Hyperlocal Risk', 'Impact', 'Action'].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 font-medium text-slate-200">
                {step}
              </div>
              {i < 5 && <span className="text-orange-400 text-lg">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Explore?</h2>
        <p className="text-slate-400 mb-6">See the complete platform in action.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors inline-flex items-center gap-2"
        >
          Launch Dashboard <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 text-center text-xs text-slate-500">
        <p>HeatShield AI — Smart India Hackathon 2026</p>
        <p className="mt-1">From Heat Forecasts to Human Safety.</p>
        <p className="mt-2 text-slate-600">
          Weather data sourced from Open-Meteo Forecast API. Not official IMD data.
        </p>
      </footer>
    </div>
  );
}
