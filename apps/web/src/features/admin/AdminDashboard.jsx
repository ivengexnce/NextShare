import { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || '';

const CHART_COLORS = {
  url:   '#378ADD',
  paste: '#1D9E75',
  file:  '#D4537E',
  visitor: '#7F77DD',
  bg:    'rgba(55,138,221,0.12)',
  bgPaste: 'rgba(29,158,117,0.12)',
  bgFile:  'rgba(212,83,126,0.12)',
  bgVisitor: 'rgba(127,119,221,0.12)',
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtShort(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function getLastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function bucketByDay(items, dateField, days) {
  const counts = Object.fromEntries(days.map(d => [d, 0]));
  for (const item of items) {
    const day = item[dateField]?.slice(0, 10);
    if (day && counts[day] !== undefined) counts[day]++;
  }
  return days.map(d => counts[d]);
}

export default function AdminDashboard() {
  const [secret, setSecret] = useState(() => sessionStorage.getItem('adminSecret') || '');
  const [input, setInput]   = useState('');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [tab, setTab]       = useState('analytics');

  async function fetchStats(s) {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API}/admin/stats`, { headers: { 'x-admin-secret': s } });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setData(json.data);
      sessionStorage.setItem('adminSecret', s);
      setSecret(s);
    } catch (err) {
      setError(err.message);
      sessionStorage.removeItem('adminSecret');
      setSecret('');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (secret) fetchStats(secret); }, []);

  if (!secret) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', padding:'24px' }}>
      <div className="tool-card" style={{ width:'100%', maxWidth:'400px' }}>
        <div className="tool-card-bar">
          <div className="card-dots"><div className="card-dot"/><div className="card-dot"/><div className="card-dot"/></div>
          <span className="card-tab-label">nextshare — admin</span>
        </div>
        <div className="tool-body">
          <div className="tool-header">
            <div className="tool-tag">ADMIN</div>
            <h2 className="tool-title">Admin Access</h2>
            <p className="tool-desc">Enter your admin secret to view analytics.</p>
          </div>
          {error && <p style={{ color:'rgba(220,80,40,0.9)', fontFamily:'monospace', fontSize:'.8rem', marginBottom:'1rem' }}>{error}</p>}
          <div className="form-stack">
            <div className="field">
              <label className="label">Secret Key</label>
              <input className="input" type="password" placeholder="Enter admin secret…"
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchStats(input)}
              />
            </div>
            <button className="btn-primary" disabled={loading} onClick={() => fetchStats(input)}>
              {loading ? 'Checking…' : 'Access Dashboard →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading && !data) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh' }}>
      <span style={{ color:'var(--t2)', fontFamily:'monospace', fontSize:'.85rem' }}>Loading stats…</span>
    </div>
  );

  if (!data) return null;

  const TABS = ['analytics', 'urls', 'pastes', 'files'];

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'40px 24px' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem' }}>
        <div>
          <div style={{ fontSize:'.65rem', fontWeight:700, letterSpacing:'0.1em', color:'var(--accent)', fontFamily:'monospace', marginBottom:'0.3rem' }}>ADMIN DASHBOARD</div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--t1)', margin:0 }}>NextShare Analytics</h1>
        </div>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button className="btn-copy" onClick={() => fetchStats(secret)}>↺ Refresh</button>
          <button className="btn-copy" onClick={() => { sessionStorage.removeItem('adminSecret'); setSecret(''); setData(null); }}>Sign out</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem', marginBottom:'2rem' }}>
        {[
          { label:'Unique Visitors', val: data.globalVisitors, color: CHART_COLORS.visitor },
          { label:'Short URLs',      val: data.totals.urls,    color: CHART_COLORS.url },
          { label:'Pastes',          val: data.totals.pastes,  color: CHART_COLORS.paste },
          { label:'Files',           val: data.totals.files,   color: CHART_COLORS.file },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ padding:'1.25rem 1.5rem', border:'1px solid var(--bdr)', borderRadius:'8px', background:'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize:'.6rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--t2)', opacity:0.5, marginBottom:'0.5rem' }}>{label}</div>
            <div style={{ fontSize:'2rem', fontWeight:700, color, fontFamily:'monospace' }}>{val?.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'0', marginBottom:'1.5rem', borderBottom:'1px solid var(--bdr)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background:'none', border:'none', cursor:'pointer',
            padding:'0.6rem 1.1rem',
            fontFamily:'monospace', fontSize:'.75rem', fontWeight:600,
            textTransform:'uppercase', letterSpacing:'0.06em',
            color: tab === t ? 'var(--accent)' : 'var(--t2)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom:'-1px',
          }}>{t}</button>
        ))}
      </div>

      {tab === 'analytics' && <AnalyticsTab data={data} />}
      {tab === 'urls'      && <StatTable title={`All URLs (${data.urls.length})`} columns={['Code','Original URL','Clicks','Unique IPs','Created']}
          rows={[...data.urls].sort((a,b)=>b.uniqueViews-a.uniqueViews).map(u=>[
            u.code, <Truncate key={u.code} text={u.originalUrl} max={55}/>,
            u.clicks, u.uniqueViews, fmtDate(u.createdAt),
          ])}/>}
      {tab === 'pastes'    && <StatTable title={`All Pastes (${data.pastes.length})`} columns={['Code','Title','Language','Views','Unique IPs','Created']}
          rows={[...data.pastes].sort((a,b)=>b.uniqueViews-a.uniqueViews).map(p=>[
            p.code, p.title, p.language, p.views, p.uniqueViews, fmtDate(p.createdAt),
          ])}/>}
      {tab === 'files'     && <StatTable title={`All Files (${data.files.length})`} columns={['Code','Filename','Downloads','Unique IPs','Created']}
          rows={[...data.files].sort((a,b)=>b.uniqueViews-a.uniqueViews).map(f=>[
            f.code, f.filename, f.downloads, f.uniqueViews, fmtDate(f.createdAt),
          ])}/>}
    </div>
  );
}

function AnalyticsTab({ data }) {
  return (
    <div style={{ display:'grid', gap:'1.5rem' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
        <GrowthChart data={data} />
        <ContentMixChart data={data} />
      </div>
      <EngagementChart data={data} />
      <TopContentTable data={data} />
    </div>
  );
}

function GrowthChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const days  = getLastNDays(14);
    const labels = days.map(fmtShort);
    const urls   = bucketByDay(data.urls,   'createdAt', days);
    const pastes = bucketByDay(data.pastes, 'createdAt', days);
    const files  = bucketByDay(data.files,  'createdAt', days);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    script.onload = () => {
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new window.Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'URLs',   data: urls,   borderColor: CHART_COLORS.url,   backgroundColor: CHART_COLORS.bg,       fill: true, tension: 0.4, pointRadius: 3 },
            { label: 'Pastes', data: pastes, borderColor: CHART_COLORS.paste, backgroundColor: CHART_COLORS.bgPaste,  fill: true, tension: 0.4, pointRadius: 3 },
            { label: 'Files',  data: files,  borderColor: CHART_COLORS.file,  backgroundColor: CHART_COLORS.bgFile,   fill: true, tension: 0.4, pointRadius: 3 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#888', font: { size: 10, family: 'monospace' }, autoSkip: false, maxRotation: 45 }, grid: { color: 'rgba(128,128,128,0.08)' } },
            y: { ticks: { color: '#888', font: { size: 10 }, stepSize: 1 }, grid: { color: 'rgba(128,128,128,0.08)' }, beginAtZero: true },
          },
        },
      });
    };
    if (!window.Chart) document.head.appendChild(script);
    else script.onload();
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [data]);

  return (
    <ChartCard title="Content created — last 14 days" legend={[
      { label: 'URLs',   color: CHART_COLORS.url   },
      { label: 'Pastes', color: CHART_COLORS.paste  },
      { label: 'Files',  color: CHART_COLORS.file   },
    ]}>
      <div style={{ position:'relative', height:'220px' }}>
        <canvas ref={canvasRef} role="img" aria-label="Line chart showing content created per day over last 14 days">No chart data.</canvas>
      </div>
    </ChartCard>
  );
}

function ContentMixChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const total = data.totals.urls + data.totals.pastes + data.totals.files;
    if (total === 0) return;

    const tryDraw = () => {
      if (!window.Chart) return;
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new window.Chart(canvasRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Short URLs', 'Pastes', 'Files'],
          datasets: [{
            data: [data.totals.urls, data.totals.pastes, data.totals.files],
            backgroundColor: [CHART_COLORS.url, CHART_COLORS.paste, CHART_COLORS.file],
            borderWidth: 0,
            hoverOffset: 4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '68%',
          plugins: { legend: { display: false }, tooltip: { callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.raw} (${Math.round(ctx.raw / total * 100)}%)`,
          }}},
        },
      });
    };

    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      script.onload = tryDraw;
      document.head.appendChild(script);
    } else tryDraw();
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [data]);

  const total = data.totals.urls + data.totals.pastes + data.totals.files;
  return (
    <ChartCard title="Content mix" legend={[
      { label: `URLs ${Math.round(data.totals.urls / (total || 1) * 100)}%`,   color: CHART_COLORS.url   },
      { label: `Pastes ${Math.round(data.totals.pastes / (total || 1) * 100)}%`, color: CHART_COLORS.paste },
      { label: `Files ${Math.round(data.totals.files / (total || 1) * 100)}%`,  color: CHART_COLORS.file  },
    ]}>
      <div style={{ position:'relative', height:'220px', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <canvas ref={canvasRef} role="img" aria-label="Doughnut chart showing content type distribution">No chart data.</canvas>
        <div style={{ position:'absolute', textAlign:'center', pointerEvents:'none' }}>
          <div style={{ fontSize:'1.6rem', fontWeight:700, color:'var(--accent)', fontFamily:'monospace', lineHeight:1 }}>{total}</div>
          <div style={{ fontSize:'.6rem', color:'var(--t2)', marginTop:'2px', letterSpacing:'0.06em', textTransform:'uppercase' }}>total</div>
        </div>
      </div>
    </ChartCard>
  );
}

function EngagementChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const days   = getLastNDays(14);
    const labels = days.map(fmtShort);

    const clicksByDay   = Object.fromEntries(days.map(d => [d, 0]));
    const viewsByDay    = Object.fromEntries(days.map(d => [d, 0]));
    const downloadsByDay = Object.fromEntries(days.map(d => [d, 0]));

    for (const u of data.urls) {
      const d = u.createdAt?.slice(0, 10);
      if (d && clicksByDay[d] !== undefined) clicksByDay[d] += u.clicks || 0;
    }
    for (const p of data.pastes) {
      const d = p.createdAt?.slice(0, 10);
      if (d && viewsByDay[d] !== undefined) viewsByDay[d] += p.views || 0;
    }
    for (const f of data.files) {
      const d = f.createdAt?.slice(0, 10);
      if (d && downloadsByDay[d] !== undefined) downloadsByDay[d] += f.downloads || 0;
    }

    const tryDraw = () => {
      if (!window.Chart) return;
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new window.Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'URL clicks',   data: days.map(d => clicksByDay[d]),    backgroundColor: CHART_COLORS.url,   borderRadius: 3 },
            { label: 'Paste views',  data: days.map(d => viewsByDay[d]),     backgroundColor: CHART_COLORS.paste, borderRadius: 3 },
            { label: 'File downloads', data: days.map(d => downloadsByDay[d]), backgroundColor: CHART_COLORS.file, borderRadius: 3 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#888', font: { size: 10, family: 'monospace' }, autoSkip: false, maxRotation: 45 }, grid: { display: false } },
            y: { ticks: { color: '#888', font: { size: 10 }, stepSize: 1 }, grid: { color: 'rgba(128,128,128,0.08)' }, beginAtZero: true },
          },
        },
      });
    };

    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      script.onload = tryDraw;
      document.head.appendChild(script);
    } else tryDraw();
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [data]);

  return (
    <ChartCard title="Engagement by day — last 14 days" legend={[
      { label: 'URL clicks',      color: CHART_COLORS.url   },
      { label: 'Paste views',     color: CHART_COLORS.paste  },
      { label: 'File downloads',  color: CHART_COLORS.file   },
    ]}>
      <div style={{ position:'relative', height:'240px' }}>
        <canvas ref={canvasRef} role="img" aria-label="Bar chart showing daily engagement metrics">No chart data.</canvas>
      </div>
    </ChartCard>
  );
}

function TopContentTable({ data }) {
  const topUrls   = [...data.urls].sort((a,b) => b.clicks - a.clicks).slice(0, 5);
  const topPastes = [...data.pastes].sort((a,b) => b.views - a.views).slice(0, 5);
  const topFiles  = [...data.files].sort((a,b) => b.downloads - a.downloads).slice(0, 5);

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'1rem' }}>
      <LeaderBoard title="Top URLs by clicks" color={CHART_COLORS.url} items={topUrls.map(u => ({
        code: u.code, label: u.originalUrl, value: u.clicks, unit: 'clicks',
      }))} />
      <LeaderBoard title="Top pastes by views" color={CHART_COLORS.paste} items={topPastes.map(p => ({
        code: p.code, label: p.title || p.code, value: p.views, unit: 'views',
      }))} />
      <LeaderBoard title="Top files by downloads" color={CHART_COLORS.file} items={topFiles.map(f => ({
        code: f.code, label: f.filename, value: f.downloads, unit: 'dl',
      }))} />
    </div>
  );
}

function LeaderBoard({ title, color, items }) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div style={{ border:'1px solid var(--bdr)', borderRadius:'8px', overflow:'hidden' }}>
      <div style={{ padding:'0.7rem 1.1rem', borderBottom:'1px solid var(--bdr)', background:'rgba(255,255,255,0.02)' }}>
        <span style={{ fontSize:'.65rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--t2)', fontFamily:'monospace' }}>{title}</span>
      </div>
      {items.length === 0 ? (
        <div style={{ padding:'1.5rem', textAlign:'center', color:'var(--t2)', opacity:0.4, fontFamily:'monospace', fontSize:'.75rem' }}>No data yet</div>
      ) : (
        <div style={{ padding:'0.5rem 0' }}>
          {items.map((item, i) => (
            <div key={item.code} style={{ padding:'0.45rem 1.1rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'3px' }}>
                <span style={{ fontFamily:'monospace', fontSize:'.72rem', color: color, fontWeight:600 }}>{item.code}</span>
                <span style={{ fontFamily:'monospace', fontSize:'.7rem', color:'var(--t2)' }}>{item.value.toLocaleString()} {item.unit}</span>
              </div>
              <div style={{ fontSize:'.68rem', color:'var(--t2)', opacity:0.55, marginBottom:'5px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {item.label}
              </div>
              <div style={{ height:'3px', borderRadius:'2px', background:'rgba(128,128,128,0.12)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.round(item.value / max * 100)}%`, background: color, borderRadius:'2px', transition:'width 0.4s ease' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, legend, children }) {
  return (
    <div style={{ border:'1px solid var(--bdr)', borderRadius:'8px', overflow:'hidden', padding:'1rem 1.25rem' }}>
      <div style={{ marginBottom:'0.75rem' }}>
        <span style={{ fontSize:'.65rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--t2)', fontFamily:'monospace' }}>{title}</span>
      </div>
      {legend && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'12px', marginBottom:'12px' }}>
          {legend.map(l => (
            <span key={l.label} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'.68rem', color:'var(--t2)', fontFamily:'monospace' }}>
              <span style={{ width:'8px', height:'8px', borderRadius:'2px', background: l.color, flexShrink:0 }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

function StatTable({ title, columns, rows }) {
  return (
    <div style={{ border:'1px solid var(--bdr)', borderRadius:'8px', overflow:'hidden' }}>
      <div style={{ padding:'0.75rem 1.25rem', borderBottom:'1px solid var(--bdr)', background:'rgba(255,255,255,0.02)' }}>
        <span style={{ fontSize:'.68rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--t2)', fontFamily:'monospace' }}>{title}</span>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding:'2rem', textAlign:'center', color:'var(--t2)', opacity:0.4, fontFamily:'monospace', fontSize:'.78rem' }}>No data yet</div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>{columns.map(c => (
                <th key={c} style={{ padding:'0.55rem 1.25rem', textAlign:'left', fontSize:'.6rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--t2)', opacity:0.45, fontFamily:'monospace', borderBottom:'1px solid var(--bdr)', background:'rgba(255,255,255,0.01)', whiteSpace:'nowrap' }}>{c}</th>
              ))}</tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--bdr)' : 'none' }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding:'0.6rem 1.25rem', fontFamily:'monospace', fontSize:'.78rem', color: j === 0 ? 'var(--accent)' : 'var(--t2)' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Truncate({ text, max }) {
  if (!text) return <span style={{ opacity:0.4 }}>—</span>;
  return <span style={{ fontSize:'.72rem', opacity:0.7 }}>{text.length > max ? text.slice(0, max) + '…' : text}</span>;
}