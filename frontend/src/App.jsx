import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Settings,
  LayoutDashboard,
  History,
  TrendingUp,
  Cpu,
  Lock,
  Download,
  LogOut,
  Camera,
  Globe,
  Eye,
  ShieldCheck,
  Zap,
  Clock,
  Wrench
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const TRANSLATIONS = {
  en: { dashboard: "Dashboard", logs: "System Logs", settings: "Settings", predictive: "Predictive AI", efficiency: "Efficiency", defects: "Defects Found", processed: "Total Processed", live: "LIVE FEED", confidence: "Confidence", audit: "EXPORT AUDIT", language: "Language", logout: "Logout", scanning: "Scanning...", threat: "Threat Detected", optimal: "Optimal", critical: "Critical", normal: "Normal", maintenance: "Maintenance", health: "System Health" },
  ha: { dashboard: "Dashboard", logs: "Bayanan Tsari", settings: "Saituna", predictive: "Hasashen AI", efficiency: "Inganci", defects: "Lalacewa", processed: "An Gudanar", live: "RAYAYYE", confidence: "Amincewa", audit: " FITAR DA AUDIT", language: "Harshe", logout: "Fita", scanning: "Dukawa...", threat: "Barazana", optimal: "Mafi kyau", critical: "Guduwa", normal: "Lafiya", maintenance: "Gyara", health: "Lafiyar Tsari" },
  yo: { dashboard: "Dashboard", logs: "Àkọsílẹ Ètò", settings: "Ètò", predictive: "Àpọtí AI", efficiency: "Ìṣiṣẹ́", defects: "Àléébù", processed: "Gbogbo Ètò", live: "WÍWÀ LÁÀYÈ", confidence: "Ìgbẹ́kẹ̀lé", audit: "ÌSÀMÚLÒ AUDIT", language: "Èdè", logout: "Jáde", scanning: "Ṣíṣàyẹ̀wò...", threat: "Ewu", optimal: "Dídara", critical: "Ewu Gidi", normal: "Dára", maintenance: "Àtúnṣe", health: "Ìlera Ètò" }
};

function App() {
  const [lang, setLang] = useState('en');
  const t = TRANSLATIONS[lang];
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [stats, setStats] = useState({ total_processed: 0, defects_count: 0, uptime_seconds: 0, efficiency: 0 });
  const [detections, setDetections] = useState([]);
  const [efficiencyHistory, setEfficiencyHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [config, setConfig] = useState({ detection_threshold: 0.5, simulation_speed: 1.0 });
  const [logs, setLogs] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      connectWebSocket();
      fetchHistoricalData();
      fetchConfig();
    }
  }, [isAuthenticated]);

  const fetchConfig = async () => {
    try {
      const response = await fetch('http://localhost:8000/config');
      const data = await response.json();
      setConfig(data);
    } catch (e) { console.error(e); }
  };

  const updateConfig = (newConfig) => {
    fetch('http://localhost:8000/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(newConfig)
    }).then(res => res.json()).then(data => setConfig(data));
  };

  const connectWebSocket = () => {
    ws.current = new WebSocket('ws://localhost:8000/ws');
    ws.current.onopen = () => setIsConnected(true);
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.event === 'PROD_STATS_UPDATE') {
        setStats(message.data);
        setEfficiencyHistory(prev => [...prev, {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          efficiency: message.data.efficiency,
          wear: 15 + (message.data.total_processed / 1000) * 2 // Simulated machine wear
        }].slice(-30));
      } else if (message.event === 'DEFECT_DETECTED' || message.event === 'NORMAL_DETECTION') {
        setDetections(prev => [message.data, ...prev].slice(0, 50));
      }
    };
  };

  const fetchHistoricalData = () => fetch('http://localhost:8000/detections?limit=50').then(r => r.json()).then(d => setDetections(d));

  if (!isAuthenticated) return <LoginGate onLogin={(u, p) => {
    const f = new FormData(); f.append('username', u); f.append('password', p);
    fetch('http://localhost:8000/token', { method: 'POST', body: f }).then(r => {
      if (r.ok) r.json().then(data => { localStorage.setItem('token', data.access_token); setIsAuthenticated(true); });
      else alert("admin / admin123");
    });
  }} />;

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo-container">
          <ShieldCheck size={32} />
          <span>CornVision<span style={{ color: 'white' }}>AI</span></span>
        </div>
        <nav className="nav-links">
          <NavItem icon={<LayoutDashboard size={20} />} label={t.dashboard} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Zap size={20} />} label={t.predictive} active={activeTab === 'predictive'} onClick={() => setActiveTab('predictive')} />
          <NavItem icon={<Activity size={20} />} label={t.logs} active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
          <NavItem icon={<Settings size={20} />} label={t.settings} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>
        <div style={{ marginTop: 'auto', padding: '1rem' }}>
          <select value={lang} onChange={e => setLang(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <option value="en">English</option>
            <option value="ha">Hausa</option>
            <option value="yo">Yoruba</option>
          </select>
          <div className="nav-item" onClick={() => { localStorage.removeItem('token'); setIsAuthenticated(false); }} style={{ color: 'var(--danger)', padding: 0 }}><LogOut size={18} /> {t.logout}</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="title-group">
            <h1>{t[activeTab] || activeTab.toUpperCase()}</h1>
            <p style={{ color: 'var(--text-muted)' }}>{t.scanning}</p>
          </div>
          <div className="status-badge" style={{ marginLeft: 'auto' }}>
            <div className={`status-dot ${isConnected ? '' : 'disconnected'}`}></div> {isConnected ? t.live : 'OFFLINE'}
          </div>
        </header>

        <AnimatePresence mode='wait'>
          {activeTab === 'dashboard' && <DashboardView stats={stats} detections={detections} t={t} />}
          {activeTab === 'predictive' && <PredictiveView history={efficiencyHistory} t={t} />}
          {activeTab === 'logs' && <LogsView />}
          {activeTab === 'settings' && <SettingsView config={config} updateConfig={updateConfig} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

const DashboardView = ({ stats, detections, t }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="view-container">
    <div className="kpi-grid">
      <KPICard title={t.processed} value={stats.total_processed} color="var(--primary)" icon={<TrendingUp size={16} />} />
      <KPICard title={t.defects} value={stats.defects_count} color="var(--danger)" icon={<AlertTriangle size={16} />} />
      <KPICard title={t.efficiency} value={`${stats.efficiency}%`} color="var(--success)" progress={stats.efficiency} />
      <KPICard title={t.health} value={t.optimal} color="var(--accent)" icon={<CheckCircle2 size={16} />} />
    </div>

    <div className="visual-grid">
      <div className="card vision-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Eye size={18} color="var(--primary)" /> AI Detection Stream</h3>
        <div className="stream-container">
          {detections[0] ? <img src={detections[0].image_url} alt="stream" className="stream-img" /> : <div className="loader">INITIALIZING SENSORS...</div>}
          <div className="overlay-tag">SECURE_CAM_01 // 24FPS</div>
        </div>
      </div>
      <div className="card logs-card">
        <h3>Defect History</h3>
        <div className="feed-container">
          {detections.filter(d => d.type !== 'normal').map(d => (
            <div key={d.id} className="detection-item defect">
              <img src={d.image_url} alt="d" style={{ width: '32px', height: '32px', borderRadius: '4px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{d.type.toUpperCase()}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{new Date(d.timestamp).toLocaleTimeString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{(d.confidence * 100).toFixed(0)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

const PredictiveView = ({ history, t }) => {
  const latestWear = history.length > 0 ? history[history.length - 1].wear : 0;
  const status = latestWear > 25 ? "MAINTENANCE_REQUIRED" : "SYSTEM_HEALTHY";

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="predictive-view">
      <div className="kpi-grid">
        <KPICard title="Mechanical Wear" value={`${latestWear.toFixed(1)}%`} color={latestWear > 25 ? "var(--danger)" : "var(--primary)"} />
        <KPICard title="Next Service" value="14 Days" color="var(--accent)" />
        <KPICard title="Failure Probability" value={`${(latestWear / 2).toFixed(1)}%`} color="var(--success)" />
        <KPICard title="Status" value={status} color="var(--text-main)" />
      </div>

      <div className="card" style={{ height: '400px', marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}><Wrench size={18} color="var(--primary)" /> Predictive Analytics Modeling</h3>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" hide />
            <YAxis stroke="var(--text-muted)" fontSize={10} />
            <Tooltip contentStyle={{ background: '#0f172a', border: 'none' }} />
            <Line type="monotone" dataKey="wear" stroke="var(--danger)" strokeWidth={3} dot={false} name="Belt Wear %" />
            <Line type="monotone" dataKey="efficiency" stroke="var(--success)" strokeWidth={2} dot={false} name="Production Efficiency" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

const KPICard = ({ title, value, color, progress, icon }) => (
  <div className="card kpi-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{title}</span>
      <span style={{ color: 'rgba(255,255,255,0.1)' }}>{icon}</span>
    </div>
    <div style={{ fontSize: '1.75rem', fontWeight: '900', color }}>{value}</div>
    {progress && <div className="progress-bg"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="progress-fill" style={{ background: color }} /></div>}
  </div>
);

const NavItem = ({ icon, label, active, onClick }) => (
  <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon} <span>{label}</span></div>
);

const LoginGate = ({ onLogin }) => {
  const [u, setU] = useState(''); const [p, setP] = useState('');
  return (
    <div className="login-screen">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card login-card">
        <ShieldCheck size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
        <h2>CornVision <span>AI</span></h2>
        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '2rem' }}>Industrial Monitoring Gateway // West Africa</p>
        <input type="text" placeholder="Username" value={u} onChange={e => setU(e.target.value)} />
        <input type="password" placeholder="Password" value={p} onChange={e => setP(e.target.value)} />
        <button onClick={() => onLogin(u, p)}>AUTHENTICATE SYSTEM</button>
      </motion.div>
    </div>
  );
};

const LogsView = () => <div className="card"><h3>System Log Interface</h3><p style={{ marginTop: '1rem', opacity: 0.5 }}>Initializing log buffer...</p></div>;
const SettingsView = ({ config, updateConfig }) => (
  <div className="card" style={{ maxWidth: '500px' }}>
    <h3>Control Parameters</h3>
    <div style={{ marginTop: '2rem' }}>
      <label>Conveyor Speed ({config.simulation_speed}x)</label>
      <input type="range" min="0.1" max="5" step="0.1" value={config.simulation_speed} onChange={e => updateConfig({ ...config, simulation_speed: parseFloat(e.target.value) })} style={{ width: '100%', accentColor: 'var(--primary)' }} />
    </div>
  </div>
);

export default App;
