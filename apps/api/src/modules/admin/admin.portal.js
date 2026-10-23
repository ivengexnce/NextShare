// Standalone Render Admin Portal HTML template
// Designed with NextShare brand aesthetics, dark theme, interactive charts, and hash verification

function getAdminPortalHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NextShare — Admin Portal (Render)</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23378ADD'><path d='M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z'/></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(18, 24, 38, 0.75);
      --card-bdr: rgba(255, 255, 255, 0.08);
      --accent: #378ADD;
      --accent-glow: rgba(55, 138, 221, 0.25);
      --green: #1D9E75;
      --pink: #D4537E;
      --purple: #7F77DD;
      --text: #f0f4fc;
      --muted: #8b9bb4;
      --mono: 'JetBrains Mono', monospace;
      --sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(ellipse at 20% 0%, rgba(55, 138, 221, 0.12) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 100%, rgba(127, 119, 221, 0.08) 0%, transparent 50%);
      color: var(--text);
      font-family: var(--sans);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Top bar */
    .nav-bar {
      border-bottom: 1px solid var(--card-bdr);
      background: rgba(9, 13, 22, 0.85);
      backdrop-filter: blur(12px);
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .brand-logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #378ADD, #7F77DD);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 800;
      font-size: 1.1rem;
      box-shadow: 0 4px 12px var(--accent-glow);
    }
    .brand-title {
      font-weight: 700;
      font-size: 1.1rem;
      letter-spacing: -0.02em;
      color: #fff;
    }
    .badge-render {
      background: rgba(29, 158, 117, 0.15);
      color: var(--green);
      border: 1px solid rgba(29, 158, 117, 0.3);
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      font-size: 0.65rem;
      font-family: var(--mono);
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .badge-security {
      background: rgba(127, 119, 221, 0.15);
      color: var(--purple);
      border: 1px solid rgba(127, 119, 221, 0.3);
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      font-size: 0.65rem;
      font-family: var(--mono);
      font-weight: 700;
      letter-spacing: 0.06em;
    }

    .btn {
      padding: 0.5rem 0.9rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-family: var(--sans);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      text-decoration: none;
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-bdr);
      color: var(--text);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .btn-primary {
      background: linear-gradient(135deg, #378ADD, #2b6cb0);
      border: none;
      color: #fff;
      box-shadow: 0 4px 14px var(--accent-glow);
    }
    .btn-primary:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    /* Main Container */
    .container {
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      flex: 1;
    }

    /* Card styling */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-bdr);
      border-radius: 12px;
      backdrop-filter: blur(16px);
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
    }

    /* Auth modal */
    #auth-view {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
    }
    .auth-box {
      width: 100%;
      max-width: 440px;
      padding: 2rem;
    }
    .auth-header {
      margin-bottom: 1.5rem;
    }
    .auth-tag {
      font-family: var(--mono);
      font-size: 0.65rem;
      color: var(--accent);
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 0.4rem;
    }
    .auth-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #fff;
    }
    .auth-desc {
      color: var(--muted);
      font-size: 0.85rem;
      margin-top: 0.3rem;
    }
    .input-group {
      margin-bottom: 1.25rem;
    }
    .input-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--muted);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .input-field {
      width: 100%;
      padding: 0.75rem 1rem;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--card-bdr);
      border-radius: 8px;
      color: #fff;
      font-family: var(--mono);
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .input-field:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }
    .auth-error {
      color: #f87171;
      font-family: var(--mono);
      font-size: 0.78rem;
      background: rgba(248, 113, 113, 0.1);
      border: 1px solid rgba(248, 113, 113, 0.2);
      padding: 0.6rem 0.8rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      display: none;
    }

    /* Dashboard view */
    #dashboard-view {
      display: none;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      padding: 1.25rem 1.5rem;
    }
    .stat-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
    .stat-val {
      font-family: var(--mono);
      font-size: 2.2rem;
      font-weight: 700;
      line-height: 1;
    }

    /* Tabs */
    .tabs-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--card-bdr);
      margin-bottom: 1.5rem;
    }
    .tab-btn {
      background: none;
      border: none;
      color: var(--muted);
      font-family: var(--mono);
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.75rem 1.25rem;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: all 0.2s;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .tab-btn:hover {
      color: #fff;
    }
    .tab-btn.active {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }

    .tab-pane {
      display: none;
    }
    .tab-pane.active {
      display: block;
    }

    /* Charts */
    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    @media (max-width: 860px) {
      .charts-grid { grid-template-columns: 1fr; }
    }
    .chart-box {
      padding: 1.25rem;
    }
    .chart-title {
      font-size: 0.7rem;
      font-family: var(--mono);
      color: var(--muted);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 1rem;
    }
    .canvas-wrap {
      position: relative;
      height: 220px;
    }

    /* Tables */
    .table-card {
      margin-bottom: 2rem;
    }
    .table-top {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--card-bdr);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .search-input {
      padding: 0.4rem 0.8rem;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--card-bdr);
      border-radius: 6px;
      color: #fff;
      font-family: var(--mono);
      font-size: 0.75rem;
      outline: none;
    }
    .table-wrap {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
      font-family: var(--mono);
    }
    th {
      text-align: left;
      padding: 0.75rem 1.25rem;
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-bottom: 1px solid var(--card-bdr);
      background: rgba(255, 255, 255, 0.01);
    }
    td {
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: var(--muted);
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }
    .code-pill {
      color: var(--accent);
      font-weight: 600;
    }
    .hash-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(127, 119, 221, 0.12);
      border: 1px solid rgba(127, 119, 221, 0.25);
      color: var(--purple);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.68rem;
      cursor: pointer;
    }
    .hash-badge:hover {
      background: rgba(127, 119, 221, 0.22);
    }

    footer {
      border-top: 1px solid var(--card-bdr);
      padding: 1.5rem;
      text-align: center;
      font-size: 0.75rem;
      color: var(--muted);
      font-family: var(--mono);
    }
  </style>
</head>
<body>

  <!-- Navigation -->
  <nav class="nav-bar">
    <div class="brand-wrap">
      <div class="brand-logo">N</div>
      <span class="brand-title">NextShare Admin</span>
      <span class="badge-render">Render Backend</span>
      <span class="badge-security">SHA-256 Hashing</span>
    </div>
    <div style="display: flex; gap: 0.75rem; align-items: center;">
      <a href="/" target="_blank" class="btn btn-secondary">API Health ↗</a>
      <button id="btn-refresh" class="btn btn-secondary" style="display:none;" onclick="loadStats()">↺ Refresh</button>
      <button id="btn-logout" class="btn btn-secondary" style="display:none;" onclick="logout()">Sign Out</button>
    </div>
  </nav>

  <!-- Content Container -->
  <main class="container">

    <!-- Auth View -->
    <section id="auth-view">
      <div class="card auth-box">
        <div class="auth-header">
          <div class="auth-tag">Render Security Gate</div>
          <h1 class="auth-title">Admin Access</h1>
          <p class="auth-desc">Enter your Render ADMIN_SECRET to inspect analytics and hash security.</p>
        </div>
        <div id="auth-error" class="auth-error"></div>
        <div class="input-group">
          <label class="input-label" for="secret-input">Secret Key</label>
          <input type="password" id="secret-input" class="input-field" placeholder="Enter ADMIN_SECRET…" onkeydown="if(event.key==='Enter')login()">
        </div>
        <button id="btn-login" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 0.8rem;" onclick="login()">
          Access Admin Dashboard →
        </button>
      </div>
    </section>

    <!-- Dashboard View -->
    <section id="dashboard-view">

      <!-- Stat Cards -->
      <div class="stats-grid">
        <div class="card stat-card">
          <div class="stat-label">Unique Visitors</div>
          <div class="stat-val" style="color: var(--purple);" id="stat-visitors">0</div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">Short URLs</div>
          <div class="stat-val" style="color: var(--accent);" id="stat-urls">0</div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">Code Pastes</div>
          <div class="stat-val" style="color: var(--green);" id="stat-pastes">0</div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">Shared Files</div>
          <div class="stat-val" style="color: var(--pink);" id="stat-files">0</div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-bar">
        <button class="tab-btn active" onclick="switchTab('analytics')">📊 Analytics</button>
        <button class="tab-btn" onclick="switchTab('urls')">🔗 URLs</button>
        <button class="tab-btn" onclick="switchTab('pastes')">📝 Pastes</button>
        <button class="tab-btn" onclick="switchTab('files')">📁 Files & Hashes</button>
      </div>

      <!-- Tab: Analytics -->
      <div id="tab-analytics" class="tab-pane active">
        <div class="charts-grid">
          <div class="card chart-box">
            <div class="chart-title">Content Created (Last 14 Days)</div>
            <div class="canvas-wrap">
              <canvas id="growthChart"></canvas>
            </div>
          </div>
          <div class="card chart-box">
            <div class="chart-title">Content Mix Distribution</div>
            <div class="canvas-wrap">
              <canvas id="mixChart"></canvas>
            </div>
          </div>
        </div>

        <div class="card chart-box" style="margin-bottom: 2rem;">
          <div class="chart-title">Daily Engagement Activity (Clicks, Views, Downloads)</div>
          <div class="canvas-wrap" style="height: 240px;">
            <canvas id="engagementChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Tab: URLs -->
      <div id="tab-urls" class="tab-pane">
        <div class="card table-card">
          <div class="table-top">
            <span class="chart-title" style="margin:0;">Shortened URLs (<span id="urls-count">0</span>)</span>
            <input type="text" class="search-input" placeholder="Filter URLs…" oninput="filterTable('urls-table', this.value)">
          </div>
          <div class="table-wrap">
            <table id="urls-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Destination URL</th>
                  <th>Clicks</th>
                  <th>Unique IPs</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody id="urls-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab: Pastes -->
      <div id="tab-pastes" class="tab-pane">
        <div class="card table-card">
          <div class="table-top">
            <span class="chart-title" style="margin:0;">Text & Code Pastes (<span id="pastes-count">0</span>)</span>
            <input type="text" class="search-input" placeholder="Filter pastes…" oninput="filterTable('pastes-table', this.value)">
          </div>
          <div class="table-wrap">
            <table id="pastes-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Language</th>
                  <th>Views</th>
                  <th>Unique IPs</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody id="pastes-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab: Files -->
      <div id="tab-files" class="tab-pane">
        <div class="card table-card">
          <div class="table-top">
            <span class="chart-title" style="margin:0;">Uploaded Files & Cryptographic Checksums (<span id="files-count">0</span>)</span>
            <input type="text" class="search-input" placeholder="Filter files…" oninput="filterTable('files-table', this.value)">
          </div>
          <div class="table-wrap">
            <table id="files-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Filename</th>
                  <th>Downloads</th>
                  <th>Unique IPs</th>
                  <th>SHA-256 Checksum</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody id="files-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>

    </section>

  </main>

  <footer>
    NextShare Platform • Render Express Service • SHA-256 Checksums • Timing-Safe Admin Security
  </footer>

  <!-- Scripts -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
  <script>
    let currentData = null;
    let growthChartInst = null;
    let mixChartInst = null;
    let engagementChartInst = null;

    function getSecret() {
      return sessionStorage.getItem('nextshare_admin_secret') || '';
    }

    async function login() {
      const input = document.getElementById('secret-input').value.trim();
      if (!input) return;
      const btn = document.getElementById('btn-login');
      btn.innerText = 'Verifying…';
      btn.disabled = true;
      document.getElementById('auth-error').style.display = 'none';

      try {
        const res = await fetch('/api/admin/stats', {
          headers: { 'x-admin-secret': input }
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Invalid admin secret');
        }
        sessionStorage.setItem('nextshare_admin_secret', input);
        currentData = json.data;
        renderDashboard();
      } catch (err) {
        const errEl = document.getElementById('auth-error');
        errEl.innerText = err.message || 'Authentication failed. Please verify ADMIN_SECRET.';
        errEl.style.display = 'block';
      } finally {
        btn.innerText = 'Access Admin Dashboard →';
        btn.disabled = false;
      }
    }

    function logout() {
      sessionStorage.removeItem('nextshare_admin_secret');
      document.getElementById('auth-view').style.display = 'flex';
      document.getElementById('dashboard-view').style.display = 'none';
      document.getElementById('btn-refresh').style.display = 'none';
      document.getElementById('btn-logout').style.display = 'none';
      document.getElementById('secret-input').value = '';
    }

    async function loadStats() {
      const secret = getSecret();
      if (!secret) return;
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { 'x-admin-secret': secret }
        });
        const json = await res.json();
        if (json.success) {
          currentData = json.data;
          renderDashboard();
        } else {
          logout();
        }
      } catch {
        logout();
      }
    }

    function renderDashboard() {
      if (!currentData) return;
      document.getElementById('auth-view').style.display = 'none';
      document.getElementById('dashboard-view').style.display = 'block';
      document.getElementById('btn-refresh').style.display = 'inline-flex';
      document.getElementById('btn-logout').style.display = 'inline-flex';

      // Totals
      document.getElementById('stat-visitors').innerText = (currentData.globalVisitors || 0).toLocaleString();
      document.getElementById('stat-urls').innerText = (currentData.totals?.urls || 0).toLocaleString();
      document.getElementById('stat-pastes').innerText = (currentData.totals?.pastes || 0).toLocaleString();
      document.getElementById('stat-files').innerText = (currentData.totals?.files || 0).toLocaleString();

      document.getElementById('urls-count').innerText = currentData.urls.length;
      document.getElementById('pastes-count').innerText = currentData.pastes.length;
      document.getElementById('files-count').innerText = currentData.files.length;

      renderCharts();
      renderTables();
    }

    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('tab-' + tab).classList.add('active');
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

    function bucketByDay(items, days) {
      const counts = Object.fromEntries(days.map(d => [d, 0]));
      for (const item of items) {
        const day = item.createdAt ? item.createdAt.slice(0, 10) : null;
        if (day && counts[day] !== undefined) counts[day]++;
      }
      return days.map(d => counts[d]);
    }

    function renderCharts() {
      const days = getLastNDays(14);
      const labels = days.map(d => d.slice(5));

      const urlsCounts = bucketByDay(currentData.urls, days);
      const pastesCounts = bucketByDay(currentData.pastes, days);
      const filesCounts = bucketByDay(currentData.files, days);

      // Growth chart
      if (growthChartInst) growthChartInst.destroy();
      const ctxGrowth = document.getElementById('growthChart').getContext('2d');
      growthChartInst = new Chart(ctxGrowth, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'URLs', data: urlsCounts, borderColor: '#378ADD', backgroundColor: 'rgba(55,138,221,0.1)', tension: 0.35, fill: true },
            { label: 'Pastes', data: pastesCounts, borderColor: '#1D9E75', backgroundColor: 'rgba(29,158,117,0.1)', tension: 0.35, fill: true },
            { label: 'Files', data: filesCounts, borderColor: '#D4537E', backgroundColor: 'rgba(212,83,126,0.1)', tension: 0.35, fill: true },
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#8b9bb4', font: { family: 'JetBrains Mono' } } } },
          scales: {
            x: { ticks: { color: '#8b9bb4' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#8b9bb4', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
          }
        }
      });

      // Mix doughnut
      if (mixChartInst) mixChartInst.destroy();
      const ctxMix = document.getElementById('mixChart').getContext('2d');
      mixChartInst = new Chart(ctxMix, {
        type: 'doughnut',
        data: {
          labels: ['Short URLs', 'Text Pastes', 'Files'],
          datasets: [{
            data: [currentData.totals.urls, currentData.totals.pastes, currentData.totals.files],
            backgroundColor: ['#378ADD', '#1D9E75', '#D4537E'],
            borderWidth: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: { legend: { labels: { color: '#8b9bb4', font: { family: 'JetBrains Mono' } } } }
        }
      });

      // Daily Engagement
      if (engagementChartInst) engagementChartInst.destroy();
      const clicksByDay = Object.fromEntries(days.map(d => [d, 0]));
      const viewsByDay = Object.fromEntries(days.map(d => [d, 0]));
      const dlByDay = Object.fromEntries(days.map(d => [d, 0]));

      for (const u of currentData.urls) {
        const d = u.createdAt ? u.createdAt.slice(0, 10) : null;
        if (d && clicksByDay[d] !== undefined) clicksByDay[d] += (u.clicks || 0);
      }
      for (const p of currentData.pastes) {
        const d = p.createdAt ? p.createdAt.slice(0, 10) : null;
        if (d && viewsByDay[d] !== undefined) viewsByDay[d] += (p.views || 0);
      }
      for (const f of currentData.files) {
        const d = f.createdAt ? f.createdAt.slice(0, 10) : null;
        if (d && dlByDay[d] !== undefined) dlByDay[d] += (f.downloads || 0);
      }

      const ctxEngage = document.getElementById('engagementChart').getContext('2d');
      engagementChartInst = new Chart(ctxEngage, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'URL Clicks', data: days.map(d => clicksByDay[d]), backgroundColor: '#378ADD' },
            { label: 'Paste Views', data: days.map(d => viewsByDay[d]), backgroundColor: '#1D9E75' },
            { label: 'File Downloads', data: days.map(d => dlByDay[d]), backgroundColor: '#D4537E' },
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#8b9bb4', font: { family: 'JetBrains Mono' } } } },
          scales: {
            x: { ticks: { color: '#8b9bb4' }, grid: { display: false } },
            y: { ticks: { color: '#8b9bb4', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
          }
        }
      });
    }

    function renderTables() {
      // URLs
      const urlsTbody = document.getElementById('urls-tbody');
      urlsTbody.innerHTML = currentData.urls.map(u => \`
        <tr>
          <td><span class="code-pill">\${escapeHtml(u.code)}</span></td>
          <td style="max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="\${escapeHtml(u.originalUrl)}">\${escapeHtml(u.originalUrl)}</td>
          <td>\${(u.clicks || 0).toLocaleString()}</td>
          <td>\${(u.uniqueViews || 0).toLocaleString()}</td>
          <td>\${formatDate(u.createdAt)}</td>
        </tr>
      \`).join('') || '<tr><td colspan="5" style="text-align:center; opacity:0.5;">No URLs created yet</td></tr>';

      // Pastes
      const pastesTbody = document.getElementById('pastes-tbody');
      pastesTbody.innerHTML = currentData.pastes.map(p => \`
        <tr>
          <td><span class="code-pill" style="color:var(--green);">\${escapeHtml(p.code)}</span></td>
          <td>\${escapeHtml(p.title || 'Untitled')}</td>
          <td><span style="background:rgba(29,158,117,0.15); padding:2px 6px; border-radius:4px; font-size:0.7rem;">\${escapeHtml(p.language || 'text')}</span></td>
          <td>\${(p.views || 0).toLocaleString()}</td>
          <td>\${(p.uniqueViews || 0).toLocaleString()}</td>
          <td>\${formatDate(p.createdAt)}</td>
        </tr>
      \`).join('') || '<tr><td colspan="6" style="text-align:center; opacity:0.5;">No pastes created yet</td></tr>';

      // Files
      const filesTbody = document.getElementById('files-tbody');
      filesTbody.innerHTML = currentData.files.map(f => \`
        <tr>
          <td><span class="code-pill" style="color:var(--pink);">\${escapeHtml(f.code)}</span></td>
          <td>\${escapeHtml(f.filename || f.code)}</td>
          <td>\${(f.downloads || 0).toLocaleString()}</td>
          <td>\${(f.uniqueViews || 0).toLocaleString()}</td>
          <td>
            \${f.sha256 
              ? \`<span class="hash-badge" onclick="navigator.clipboard.writeText('\${f.sha256}'); alert('Copied SHA-256 hash!');" title="\${f.sha256}">
                  🔒 \${f.sha256.substring(0, 10)}… (copy)
                 </span>\` 
              : '<span style="opacity:0.4;">Legacy</span>'}
          </td>
          <td>\${formatDate(f.createdAt)}</td>
        </tr>
      \`).join('') || '<tr><td colspan="6" style="text-align:center; opacity:0.5;">No files uploaded yet</td></tr>';
    }

    function filterTable(tableId, query) {
      const q = query.toLowerCase();
      const rows = document.querySelectorAll('#' + tableId + ' tbody tr');
      rows.forEach(r => {
        r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none';
      });
    }

    function formatDate(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function escapeHtml(str) {
      return (str || '').replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
      }[tag] || tag));
    }

    // Auto-login if secret is in session
    window.addEventListener('DOMContentLoaded', () => {
      if (getSecret()) loadStats();
    });
  </script>
</body>
</html>`;
}

module.exports = { getAdminPortalHtml };
