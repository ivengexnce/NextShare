import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || '';

export default function AdminDashboard() {
    const [secret, setSecret] = useState(() => sessionStorage.getItem('adminSecret') || '');
    const [input, setInput]   = useState('');
    const [data, setData]     = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState(null);
    const [tab, setTab]       = useState('overview');

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
                                value={input} onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchStats(input)}
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

    if (loading) return (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh' }}>
            <span style={{ color:'var(--t2)', fontFamily:'monospace', fontSize:'.85rem' }}>Loading stats…</span>
        </div>
    );

    if (!data) return null;

    const TABS = ['overview', 'urls', 'pastes', 'files'];

    return (
        <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'40px 24px' }}>
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
                    { label:'Unique Visitors', val: data.globalVisitors },
                    { label:'Short URLs',       val: data.totals.urls },
                    { label:'Pastes',           val: data.totals.pastes },
                    { label:'Files',            val: data.totals.files },
                ].map(({ label, val }) => (
                    <div key={label} style={{ padding:'1.25rem 1.5rem', border:'1px solid var(--bdr)', borderRadius:'8px', background:'rgba(255,255,255,0.02)' }}>
                        <div style={{ fontSize:'.6rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--t2)', opacity:0.5, marginBottom:'0.5rem' }}>{label}</div>
                        <div style={{ fontSize:'2rem', fontWeight:700, color:'var(--accent)', fontFamily:'monospace' }}>{val.toLocaleString()}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:'0', marginBottom:'1.5rem', borderBottom:'1px solid var(--bdr)' }}>
                {TABS.map((t) => (
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

            {tab === 'overview' && (
                <div style={{ display:'grid', gap:'1.5rem' }}>
                    <StatTable title="Top URLs" columns={['Code','Original URL','Clicks','Unique IPs']}
                        rows={[...data.urls].sort((a,b)=>b.uniqueViews-a.uniqueViews).slice(0,10).map(u=>[
                            u.code,
                            <Truncate key={u.code} text={u.originalUrl} max={50}/>,
                            u.clicks, u.uniqueViews,
                        ])}/>
                    <StatTable title="Top Pastes" columns={['Code','Title','Language','Views','Unique IPs']}
                        rows={[...data.pastes].sort((a,b)=>b.uniqueViews-a.uniqueViews).slice(0,10).map(p=>[
                            p.code, p.title, p.language, p.views, p.uniqueViews,
                        ])}/>
                    <StatTable title="Top Files" columns={['Code','Filename','Downloads','Unique IPs']}
                        rows={[...data.files].sort((a,b)=>b.uniqueViews-a.uniqueViews).slice(0,10).map(f=>[
                            f.code, f.filename, f.downloads, f.uniqueViews,
                        ])}/>
                </div>
            )}

            {tab === 'urls' && (
                <StatTable title={`All URLs (${data.urls.length})`} columns={['Code','Original URL','Clicks','Unique IPs','Created']}
                    rows={[...data.urls].sort((a,b)=>b.uniqueViews-a.uniqueViews).map(u=>[
                        u.code, <Truncate key={u.code} text={u.originalUrl} max={55}/>,
                        u.clicks, u.uniqueViews, fmtDate(u.createdAt),
                    ])}/>
            )}

            {tab === 'pastes' && (
                <StatTable title={`All Pastes (${data.pastes.length})`} columns={['Code','Title','Language','Views','Unique IPs','Created']}
                    rows={[...data.pastes].sort((a,b)=>b.uniqueViews-a.uniqueViews).map(p=>[
                        p.code, p.title, p.language, p.views, p.uniqueViews, fmtDate(p.createdAt),
                    ])}/>
            )}

            {tab === 'files' && (
                <StatTable title={`All Files (${data.files.length})`} columns={['Code','Filename','Downloads','Unique IPs','Created']}
                    rows={[...data.files].sort((a,b)=>b.uniqueViews-a.uniqueViews).map(f=>[
                        f.code, f.filename, f.downloads, f.uniqueViews, fmtDate(f.createdAt),
                    ])}/>
            )}
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
                            <tr>{columns.map((c) => (
                                <th key={c} style={{ padding:'0.55rem 1.25rem', textAlign:'left', fontSize:'.6rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--t2)', opacity:0.45, fontFamily:'monospace', borderBottom:'1px solid var(--bdr)', background:'rgba(255,255,255,0.01)', whiteSpace:'nowrap' }}>{c}</th>
                            ))}</tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr key={i} style={{ borderBottom: i < rows.length-1 ? '1px solid var(--bdr)' : 'none' }}>
                                    {row.map((cell, j) => (
                                        <td key={j} style={{ padding:'0.6rem 1.25rem', fontFamily:'monospace', fontSize:'.78rem', color: j===0 ? 'var(--accent)' : 'var(--t2)' }}>{cell}</td>
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

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}