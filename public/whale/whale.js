const POLL_INTERVAL_MS = 15000;

const JSON_HEADERS = {
  Accept: 'application/json'
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function prettyLabel(value) {
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.length ? value.map((entry) => formatValue(entry)).join(', ') : '—';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function countItems(value) {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).length;
  }

  return 0;
}

function firstNumber(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== '') {
      return value;
    }
  }
  return null;
}

function firstArray(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const preferredKeys = ['items', 'events', 'receipts', 'transitions', 'timeline', 'envelopes', 'nodes', 'anchors', 'data'];
  for (const key of preferredKeys) {
    if (Array.isArray(value[key])) {
      return value[key];
    }
  }

  return [];
}

function $(id) {
  return document.getElementById(id);
}

function renderMetrics(containerId, metrics) {
  const container = $(containerId);
  if (!container) {
    return;
  }

  container.innerHTML = metrics.map((metric) => `
    <article class="whale-card metric-card ${metric.tone ? `metric-tone-${metric.tone}` : ''}">
      <div class="metric-label">${escapeHtml(metric.label)}</div>
      <div class="metric-value">${escapeHtml(formatValue(metric.value))}</div>
      ${metric.note ? `<div class="metric-note">${escapeHtml(metric.note)}</div>` : ''}
    </article>
  `).join('');
}

function renderKeyValue(containerId, source, preferredKeys = []) {
  const container = $(containerId);
  if (!container) {
    return;
  }

  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    container.innerHTML = '<div class="empty-state">No structured data available.</div>';
    return;
  }

  const keys = [];
  const seen = new Set();
  for (const key of preferredKeys.concat(Object.keys(source))) {
    if (!seen.has(key) && key in source) {
      seen.add(key);
      keys.push(key);
    }
  }

  container.innerHTML = `<dl class="kv-grid">${keys.map((key) => `
    <dt>${escapeHtml(prettyLabel(key))}</dt>
    <dd>${escapeHtml(formatValue(source[key]))}</dd>
  `).join('')}</dl>`;
}

function renderTokens(containerId, values) {
  const container = $(containerId);
  if (!container) {
    return;
  }

  const list = Array.isArray(values) ? values : [];
  if (!list.length) {
    container.innerHTML = '<div class="empty-state">No items available.</div>';
    return;
  }

  container.innerHTML = `<div class="token-list">${list.map((value) => `<span class="token">${escapeHtml(formatValue(value))}</span>`).join('')}</div>`;
}

function summarizeItem(item, index) {
  if (typeof item !== 'object' || item === null) {
    return {
      title: `Entry ${index + 1}`,
      body: formatValue(item),
      meta: ''
    };
  }

  const title = firstValue(
    item.title,
    item.name,
    item.layer,
    item.event,
    item.state,
    item.transition,
    item.id,
    item.envelope_id,
    item.identity_version,
    `Entry ${index + 1}`
  );

  const meta = firstValue(
    item.timestamp,
    item.at,
    item.time,
    item.disposition,
    item.risk_class,
    item.status,
    item.kind,
    item.type,
    ''
  );

  const bodyPairs = Object.entries(item)
    .filter(([key, value]) => !['title', 'name', 'layer', 'event', 'state', 'transition', 'id', 'timestamp', 'at', 'time'].includes(key) && value !== null && value !== undefined && value !== '')
    .slice(0, 4)
    .map(([key, value]) => `${prettyLabel(key)}: ${formatValue(value)}`);

  return {
    title: formatValue(title),
    body: bodyPairs.join(' • ') || 'Structured event available.',
    meta: formatValue(meta)
  };
}

function renderTimeline(containerId, items) {
  const container = $(containerId);
  if (!container) {
    return;
  }

  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    container.innerHTML = '<div class="empty-state">No timeline data available.</div>';
    return;
  }

  container.innerHTML = `<div class="timeline-list">${list.map((item, index) => {
    const summary = summarizeItem(item, index);
    return `
      <article class="timeline-item">
        <strong>${escapeHtml(summary.title)}</strong>
        <p>${escapeHtml(summary.body)}</p>
        ${summary.meta && summary.meta !== '—' ? `<small>${escapeHtml(summary.meta)}</small>` : ''}
      </article>
    `;
  }).join('')}</div>`;
}

function renderTable(containerId, items) {
  const container = $(containerId);
  if (!container) {
    return;
  }

  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    container.innerHTML = '<div class="empty-state">No tabular data available.</div>';
    return;
  }

  const columns = Array.from(
    new Set(
      list.flatMap((item) => (item && typeof item === 'object' && !Array.isArray(item) ? Object.keys(item) : ['value']))
    )
  ).slice(0, 6);

  container.innerHTML = `
    <div class="table-shell">
      <table class="whale-table">
        <thead>
          <tr>${columns.map((column) => `<th>${escapeHtml(prettyLabel(column))}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${list.map((item) => `<tr>${columns.map((column) => `<td>${escapeHtml(formatValue(item && typeof item === 'object' && !Array.isArray(item) ? item[column] : item))}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderJson(containerId, value) {
  const container = $(containerId);
  if (!container) {
    return;
  }

  container.innerHTML = '';
  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(value ?? {}, null, 2);
  container.appendChild(pre);
}

function setStatus(containerId, text, tone = 'pending') {
  const container = $(containerId);
  if (!container) {
    return;
  }

  container.textContent = text;
  container.dataset.tone = tone;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...JSON_HEADERS,
      ...(options.headers || {})
    }
  });

  const payload = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') && payload ? JSON.parse(payload) : payload;

  if (!response.ok) {
    throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
  }

  return data;
}

function startPolling(callback) {
  callback();
  return window.setInterval(callback, POLL_INTERVAL_MS);
}

window.whaleUI = {
  $,
  asArray,
  countItems,
  fetchJson,
  firstArray,
  firstNumber,
  firstValue,
  formatValue,
  prettyLabel,
  renderJson,
  renderKeyValue,
  renderMetrics,
  renderTable,
  renderTimeline,
  renderTokens,
  setStatus,
  startPolling
};
