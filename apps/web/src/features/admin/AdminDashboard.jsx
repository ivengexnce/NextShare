import { useState, useEffect, useRef } from 'react';

const API_ADMIN = `${import.meta.env.VITE_API_URL || ''}/api/admin`;
const API_FEEDBACK = `${import.meta.env.VITE_API_URL || ''}/api/feedback`;

const CHART_COLORS = {
  url: '#378ADD',
  paste: '#1D9E75',
  file: '#D4537E',
  visitor: '#7F77DD',
  bg: 'rgba(55,138,221,0.12)',
  bgPaste: 'rgba(29,158,117,0.12)',
  bgFile: 'rgba(212,83,126,0.12)',
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
  const counts = Object.fromEntries(days.map((d) => [d, 0]));
  for (const item of items) {
    const day = item[dateField]?.slice(0, 10);
    if (day && counts[day] !== undefined) counts[day]++;
  }
  return days.map((d) => counts[d]);
}

export default function AdminDashboard() {
  const [secret, setSecret] = useState(() => sessionStorage.getItem('adminSecret') || '');
  const [input, setInput] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('analytics');

  useEffect(() => {
    let metaRobots = document.querySelector('meta[name="robots"]');
    const prev = metaRobots ? metaRobots.content : 'index, follow';
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      document.head.appendChild(metaRobots);
    }
    metaRobots.content = 'noindex, nofollow';
    return () => {
      if (metaRobots) metaRobots.content = prev;
    };
  }, []);

  async function fetchStats(s) {
    if (!s || !s.trim()) {
      setError('Please enter your admin secret key.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_ADMIN}/stats`, { headers: { 'x-admin-secret': s.trim() } });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response (${res.status}). Verify API server is running.`);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Invalid admin secret');
      setData(json.data);
      sessionStorage.setItem('adminSecret', s.trim());
      setSecret(s.trim());
    } catch (err) {
      setError(err.message);
      sessionStorage.removeItem('adminSecret');
      setSecret('');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (secret) fetchStats(secret);
  }, []);

  if (!secret) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '24px', background: '#0C0B0A' }}>
        <div className="tool-card" style={{ width: '100%', maxWidth: '400px', background: '#141312', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}>
          <div className="tool-card-bar" style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#9CA3AF' }}>nextshare — admin access</span>
          </div>
          <div className="tool-body" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#F0EDE8', margin: '0 0 6px 0' }}>Admin Login</h2>
              <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>Enter your admin secret key to access system metrics.</p>
            </div>
            {error && (
              <p style={{ color: '#EF4444', fontFamily: 'monospace', fontSize: '12px', marginBottom: '12px' }}>
                {error}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                className="input"
                type="password"
                placeholder="Enter admin secret..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchStats(input)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#0C0B0A',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#F0EDE8',
                  fontSize: '13px',
                }}
              />
              <button
                disabled={loading}
                onClick={() => fetchStats(input)}
                style={{
                  padding: '8px 14px',
                  background: '#6366f1',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Verifying...' : 'Access Dashboard →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0C0B0A' }}>
        <span style={{ color: '#9CA3AF', fontFamily: 'monospace', fontSize: '13px' }}>Loading metrics...</span>
      </div>
    );
  }

  if (!data) return null;

  const pendingCount = (data.feedbacks || []).filter(
    (f) => f.type === 'testimonial' && !f.approved
  ).length;

  const TABS = [
    { id: 'analytics', label: 'Analytics' },
    { id: 'urls', label: `URLs (${data.urls.length})` },
    { id: 'pastes', label: `Pastes (${data.pastes.length})` },
    { id: 'files', label: `Files (${data.files.length})` },
    { id: 'feedback', label: `Feedback ${pendingCount > 0 ? `(${pendingCount} pending)` : ''}` },
  ];

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '40px 24px', background: '#0C0B0A', minHeight: '100vh', color: '#F0EDE8', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: '#6366f1', textTransform: 'uppercase', marginBottom: '4px' }}>
            NextShare Administration
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#F0EDE8', margin: 0 }}>
            System Dashboard
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => fetchStats(secret)}
            style={{
              padding: '6px 12px',
              background: '#141312',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#F0EDE8',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem('adminSecret');
              setSecret('');
              setData(null);
            }}
            style={{
              padding: '6px 12px',
              background: '#141312',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#9CA3AF',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Unique Visitors', val: data.globalVisitors, color: CHART_COLORS.visitor },
          { label: 'Short URLs', val: data.totals.urls, color: CHART_COLORS.url },
          { label: 'Pastes', val: data.totals.pastes, color: CHART_COLORS.paste },
          { label: 'Files', val: data.totals.files, color: CHART_COLORS.file },
          { label: 'Feedback & Issues', val: data.feedbacks ? data.feedbacks.length : 0, color: '#6366f1' },
        ].map(({ label, val, color }) => (
          <div
            key={label}
            style={{
              padding: '1.25rem 1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              background: '#141312',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '0.5rem' }}>
              {label}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color, fontFamily: 'monospace' }}>
              {val?.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.65rem 1rem',
              fontSize: '12px',
              fontWeight: 500,
              color: tab === t.id ? '#6366f1' : '#9CA3AF',
              borderBottom: tab === t.id ? '2px solid #6366f1' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'all 0.15s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'analytics' && <AnalyticsTab data={data} />}

      {tab === 'urls' && (
        <StatTable
          title={`All Shortened URLs (${data.urls.length})`}
          columns={['Code', 'Original URL', 'Clicks', 'Unique Views', 'Created']}
          rows={[...data.urls]
            .sort((a, b) => b.uniqueViews - a.uniqueViews)
            .map((u) => [
              u.code,
              <Truncate key={u.code} text={u.originalUrl} max={55} />,
              u.clicks,
              u.uniqueViews,
              fmtDate(u.createdAt),
            ])}
        />
      )}

      {tab === 'pastes' && (
        <StatTable
          title={`All Code Pastes (${data.pastes.length})`}
          columns={['Code', 'Title', 'Language', 'Views', 'Unique Views', 'Created']}
          rows={[...data.pastes]
            .sort((a, b) => b.uniqueViews - a.uniqueViews)
            .map((p) => [
              p.code,
              p.title,
              p.language,
              p.views,
              p.uniqueViews,
              fmtDate(p.createdAt),
            ])}
        />
      )}

      {tab === 'files' && (
        <StatTable
          title={`All Shared Files (${data.files.length})`}
          columns={['Code', 'Filename', 'Downloads', 'Unique Views', 'Created']}
          rows={[...data.files]
            .sort((a, b) => b.uniqueViews - a.uniqueViews)
            .map((f) => [
              f.code,
              f.filename,
              f.downloads,
              f.uniqueViews,
              fmtDate(f.createdAt),
            ])}
        />
      )}

      {tab === 'feedback' && (
        <FeedbackModerationTab
          feedbacks={data.feedbacks || []}
          secret={secret}
          onRefresh={() => fetchStats(secret)}
        />
      )}
    </div>
  );
}

function AnalyticsTab({ data }) {
  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
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
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const days = getLastNDays(14);
    const labels = days.map(fmtShort);
    const urls = bucketByDay(data.urls, 'createdAt', days);
    const pastes = bucketByDay(data.pastes, 'createdAt', days);
    const files = bucketByDay(data.files, 'createdAt', days);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    script.onload = () => {
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new window.Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'URLs', data: urls, borderColor: CHART_COLORS.url, backgroundColor: CHART_COLORS.bg, fill: true, tension: 0.4, pointRadius: 3 },
            { label: 'Pastes', data: pastes, borderColor: CHART_COLORS.paste, backgroundColor: CHART_COLORS.bgPaste, fill: true, tension: 0.4, pointRadius: 3 },
            { label: 'Files', data: files, borderColor: CHART_COLORS.file, backgroundColor: CHART_COLORS.bgFile, fill: true, tension: 0.4, pointRadius: 3 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#9CA3AF', font: { size: 11 } } } },
          scales: {
            x: { ticks: { color: '#6B7280', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { ticks: { color: '#6B7280', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          },
        },
      });
    };
    document.body.appendChild(script);
    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [data]);

  return (
    <div style={{ padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', background: '#141312' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', marginBottom: '1rem', textTransform: 'uppercase' }}>
        Creation Velocity (14 Days)
      </div>
      <div style={{ height: '220px' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

function ContentMixChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    script.onload = () => {
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new window.Chart(canvasRef.current, {
        type: 'doughnut',
        data: {
          labels: ['URLs', 'Pastes', 'Files'],
          datasets: [
            {
              data: [data.totals.urls, data.totals.pastes, data.totals.files],
              backgroundColor: [CHART_COLORS.url, CHART_COLORS.paste, CHART_COLORS.file],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { color: '#9CA3AF', font: { size: 11 } } } },
        },
      });
    };
    document.body.appendChild(script);
    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [data]);

  return (
    <div style={{ padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', background: '#141312' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', marginBottom: '1rem', textTransform: 'uppercase' }}>
        Resource Composition
      </div>
      <div style={{ height: '220px' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

function EngagementChart({ data }) {
  const totalViews =
    data.urls.reduce((a, b) => a + (b.clicks || 0), 0) +
    data.pastes.reduce((a, b) => a + (b.views || 0), 0) +
    data.files.reduce((a, b) => a + (b.downloads || 0), 0);

  return (
    <div style={{ padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', background: '#141312' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
        Aggregate Engagement
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6B7280' }}>Total Interactions</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#F0EDE8', fontFamily: 'monospace' }}>
            {totalViews.toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#6B7280' }}>Global IP Cache</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: CHART_COLORS.visitor, fontFamily: 'monospace' }}>
            {data.globalVisitors.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopContentTable({ data }) {
  const topUrls = [...data.urls].sort((a, b) => b.clicks - a.clicks).slice(0, 5);

  return (
    <div style={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', background: '#141312', overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>
        Top 5 Most Clicked Short URLs
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0C0B0A', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              {['Code', 'Target URL', 'Clicks', 'Unique Views'].map((c) => (
                <th key={c} style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '11px', color: '#6B7280' }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topUrls.map((u, i) => (
              <tr key={u.code || i} style={{ borderBottom: i < topUrls.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <td style={{ padding: '0.5rem 1rem', color: '#6366f1', fontFamily: 'monospace', fontSize: '12px' }}>{u.code}</td>
                <td style={{ padding: '0.5rem 1rem', fontSize: '12px', color: '#9CA3AF' }}><Truncate text={u.originalUrl} max={60} /></td>
                <td style={{ padding: '0.5rem 1rem', fontFamily: 'monospace', fontSize: '12px', color: '#F0EDE8' }}>{u.clicks}</td>
                <td style={{ padding: '0.5rem 1rem', fontFamily: 'monospace', fontSize: '12px', color: '#6B7280' }}>{u.uniqueViews}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatTable({ title, columns, rows }) {
  return (
    <div style={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', background: '#141312', overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '12px', fontWeight: 600, color: '#9CA3AF' }}>
        {title}
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>No records found</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0C0B0A', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                {columns.map((c) => (
                  <th key={c} style={{ padding: '0.55rem 1rem', textAlign: 'left', fontSize: '11px', color: '#6B7280' }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: '0.6rem 1rem', fontSize: '12px', color: j === 0 ? '#6366f1' : '#9CA3AF', fontFamily: j === 0 || typeof cell === 'number' ? 'monospace' : 'inherit' }}>
                      {cell}
                    </td>
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
  if (!text) return <span style={{ opacity: 0.4 }}>—</span>;
  return <span style={{ fontSize: '12px' }}>{text.length > max ? text.slice(0, max) + '…' : text}</span>;
}

function FeedbackModerationTab({ feedbacks = [], secret, onRefresh }) {
  const [filter, setFilter] = useState('all'); // all, pending, testimonials, issues
  const [loadingId, setLoadingId] = useState(null);

  const pendingTestimonials = feedbacks.filter((f) => f.type === 'testimonial' && !f.approved);
  const openIssues = feedbacks.filter((f) => f.type === 'issue' && f.status === 'open');

  const filteredItems = feedbacks.filter((item) => {
    if (filter === 'pending') return item.type === 'testimonial' && !item.approved;
    if (filter === 'testimonials') return item.type === 'testimonial';
    if (filter === 'issues') return item.type === 'issue';
    return true;
  });

  async function handleApprove(id, approved) {
    setLoadingId(id);
    try {
      await fetch(`${API_FEEDBACK}/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({ approved }),
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleStatusChange(id, status) {
    setLoadingId(id);
    try {
      await fetch(`${API_FEEDBACK}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({ status }),
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;
    setLoadingId(id);
    try {
      await fetch(`${API_FEEDBACK}/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div style={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', background: '#141312', overflow: 'hidden' }}>
      {/* Top Header & Sub-filter bar */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: `All (${feedbacks.length})` },
            { id: 'pending', label: `Pending Approvals (${pendingTestimonials.length})` },
            { id: 'testimonials', label: 'Testimonials' },
            { id: 'issues', label: `Issues (${openIssues.length} open)` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 500,
                background: filter === f.id ? '#6366f1' : '#0C0B0A',
                color: filter === f.id ? '#FFFFFF' : '#9CA3AF',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '11px', color: '#6B7280' }}>
          Approved testimonials display publicly on the landing page
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
          No submissions match the selected filter.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0C0B0A', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                {['Type', 'Name / Page', 'Message', 'Rating / Status', 'Date', 'Actions'].map((c) => (
                  <th key={c} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '11px', color: '#6B7280' }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, i) => {
                const isTestimonial = item.type === 'testimonial';
                const isIssue = item.type === 'issue';

                return (
                  <tr
                    key={item._id || i}
                    style={{
                      borderBottom: i < filteredItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      background: !item.approved && isTestimonial ? 'rgba(99,102,241,0.03)' : 'transparent',
                    }}
                  >
                    {/* Type badge */}
                    <td style={{ padding: '0.65rem 1rem', fontSize: '12px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          background: isTestimonial ? 'rgba(99, 102, 241, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          color: isTestimonial ? '#6366f1' : '#EAB308',
                        }}
                      >
                        {item.type || 'testimonial'}
                      </span>
                    </td>

                    {/* Author & Page */}
                    <td style={{ padding: '0.65rem 1rem', fontSize: '12px', color: '#F0EDE8' }}>
                      <div style={{ fontWeight: 500 }}>{item.name || 'Anonymous'}</div>
                      <div style={{ fontSize: '10px', color: '#6B7280', fontFamily: 'monospace' }}>
                        {item.page || '/'}
                      </div>
                    </td>

                    {/* Message */}
                    <td style={{ padding: '0.65rem 1rem', fontSize: '12px', color: '#9CA3AF', maxWidth: '340px' }}>
                      {item.message || item.comment || <span style={{ opacity: 0.4 }}>No message</span>}
                    </td>

                    {/* Rating or Issue Status */}
                    <td style={{ padding: '0.65rem 1rem', fontSize: '12px' }}>
                      {isTestimonial && (
                        <div>
                          <span style={{ color: '#6366f1', fontSize: '13px' }}>
                            {'★'.repeat(item.rating || 5)}
                          </span>
                          <span style={{ fontSize: '11px', color: '#6B7280', marginLeft: '6px' }}>
                            ({item.rating || 5}/5)
                          </span>
                          <div style={{ marginTop: '2px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                color: item.approved ? '#10B981' : '#EAB308',
                                fontWeight: 500,
                              }}
                            >
                              {item.approved ? 'Approved' : 'Pending Approval'}
                            </span>
                          </div>
                        </div>
                      )}

                      {isIssue && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              background:
                                item.status === 'resolved'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : item.status === 'in_progress'
                                  ? 'rgba(59, 130, 246, 0.15)'
                                  : 'rgba(234, 179, 8, 0.15)',
                              color:
                                item.status === 'resolved'
                                  ? '#10B981'
                                  : item.status === 'in_progress'
                                  ? '#3B82F6'
                                  : '#EAB308',
                            }}
                          >
                            {item.status || 'open'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td style={{ padding: '0.65rem 1rem', fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {fmtDate(item.createdAt)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.65rem 1rem', whiteSpace: 'nowrap' }}>
                      {isTestimonial && (
                        <button
                          onClick={() => handleApprove(item._id, !item.approved)}
                          disabled={loadingId === item._id}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: item.approved ? 'transparent' : '#6366f1',
                            color: item.approved ? '#9CA3AF' : '#FFFFFF',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            marginRight: '6px',
                          }}
                        >
                          {item.approved ? 'Reject' : 'Approve'}
                        </button>
                      )}

                      {isIssue && (
                        <select
                          value={item.status || 'open'}
                          onChange={(e) => handleStatusChange(item._id, e.target.value)}
                          disabled={loadingId === item._id}
                          style={{
                            padding: '4px 6px',
                            background: '#0C0B0A',
                            color: '#F0EDE8',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            fontSize: '11px',
                            marginRight: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      )}

                      <button
                        onClick={() => handleDelete(item._id)}
                        disabled={loadingId === item._id}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: 'transparent',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
