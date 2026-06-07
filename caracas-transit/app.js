// === RutaCCS prototype — screen navigation + render ===

const state = {
  current: 'home',
  history: [],
  selectedLine: null,
  selectedDirection: 'fwd', // 'fwd' or 'bwd'
  selectedStop: null,
  searchAddress: '',
  favoritesRoutes: JSON.parse(localStorage.getItem('rutaccs_fav_lines') || '[]'),
  favoritesStops: JSON.parse(localStorage.getItem('rutaccs_fav_stops') || '[]'),
  maps: {},
  scheduleDay: 'weekday',
  filterText: '',
};

function saveFavs() {
  localStorage.setItem('rutaccs_fav_lines', JSON.stringify(state.favoritesRoutes));
  localStorage.setItem('rutaccs_fav_stops', JSON.stringify(state.favoritesStops));
}

function toggleFavLine(id) {
  const i = state.favoritesRoutes.indexOf(id);
  if (i >= 0) { state.favoritesRoutes.splice(i,1); toast('Removed from favorites'); }
  else { state.favoritesRoutes.push(id); toast('Added to favorites'); }
  saveFavs();
}
function toggleFavStop(id) {
  const i = state.favoritesStops.indexOf(id);
  if (i >= 0) { state.favoritesStops.splice(i,1); toast('Stop removed'); }
  else { state.favoritesStops.push(id); toast('Stop saved'); }
  saveFavs();
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(()=>t.classList.remove('show'), 1800);
}

// === Navigation ===
function go(screen, opts = {}) {
  if (state.current && state.current !== screen) state.history.push(state.current);
  state.current = screen;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + screen);
  if (!el) { console.warn('Unknown screen', screen); return; }
  el.classList.add('active');
  hideModal();
  renderScreen(screen, opts);
}
function back() {
  if (state.history.length === 0) { go('home'); return; }
  const prev = state.history.pop();
  state.current = prev;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + prev).classList.add('active');
  renderScreen(prev, { fromBack: true });
}

function showModal() { document.getElementById('modal').classList.add('show'); }
function hideModal() { document.getElementById('modal').classList.remove('show'); }

// === Renderers ===

function renderScreen(screen, opts) {
  if (screen === 'home') renderHome();
  if (screen === 'lines') renderLines();
  if (screen === 'route-info') renderRouteInfo();
  if (screen === 'route-details') renderRouteDetails();
  if (screen === 'route-map') renderRouteMap();
  if (screen === 'route-schedule') renderRouteSchedule();
  if (screen === 'nearby-list') renderNearbyList();
  if (screen === 'nearby-map') renderNearbyMap();
  if (screen === 'nearby-pick-address') renderNearbyPickAddress();
  if (screen === 'stop-detail') renderStopDetail();
  if (screen === 'favorites') renderFavorites();
  if (screen === 'directions-result') renderDirectionsResult();
}

// --- Home map ---
function renderHome() {
  const el = document.getElementById('map-home');
  if (!el) return;
  if (state.maps.home) {
    // already created — just fix size after re-show
    setTimeout(() => state.maps.home.invalidateSize(), 60);
    return;
  }
  const center = [10.4806, -66.9036]; // Caracas центр
  const map = L.map(el, { zoomControl: false, attributionControl: false }).setView(center, 13);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);
  // маркер «текущего адреса»
  L.circleMarker(center, { radius: 8, color: '#FC3F1D', weight: 3, fillColor: '#fff', fillOpacity: 1 })
    .addTo(map);
  state.maps.home = map;
  setTimeout(() => map.invalidateSize(), 80);
}

// --- Lines list ---
function renderLines() {
  const container = document.getElementById('lines-list');
  const filter = state.filterText.toLowerCase();
  const filtered = LINES.filter(l =>
    !filter || l.id.toLowerCase().includes(filter) || l.name.toLowerCase().includes(filter) || l.op.toLowerCase().includes(filter)
  );
  container.innerHTML = '';
  filtered.forEach(line => {
    const row = document.createElement('div');
    row.className = 'line-row';
    row.innerHTML = `
      <div class="line-chip lg" style="background:${colorForLine(line)}">${line.id}</div>
      <div class="line-name">
        ${escapeHtml(line.name)}
        <div class="line-op">${line.op}</div>
      </div>
      <div class="arrow">${svgArrowRight()}</div>
    `;
    row.onclick = () => { state.selectedLine = line.id; go('route-info'); };
    container.appendChild(row);
  });
  if (filtered.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:40px; color:#6C8794; font-size:14px;">No lines found</div>';
  }
}

// --- Route info (direction picker) ---
function renderRouteInfo() {
  const line = getLine(state.selectedLine);
  if (!line) return;
  const headerSub = document.querySelector('#screen-route-info .header h1 .sub');
  if (headerSub) headerSub.textContent = line.name.length > 32 ? line.name.slice(0,30)+'…' : line.name;

  const container = document.getElementById('route-info-body');
  const hasDirs = line.fwd && line.bwd;
  const isFav = state.favoritesRoutes.includes(line.id);

  container.innerHTML = `
    <div class="route-header">
      <div class="line-chip lg" style="background:${colorForLine(line)}">${line.id}</div>
      <div class="route-name">${escapeHtml(line.name)}<div class="line-op">${line.op}</div></div>
      <svg class="star ${isFav?'active':''}" id="route-fav-btn" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
      </svg>
    </div>
    <div class="section-title">Routes</div>
    ${ hasDirs ? `
      <div class="direction-row" data-dir="fwd">
        <svg class="dir-icon" viewBox="0 0 24 24"><path d="M3 10c0-3 2-5 5-5s5 2 5 5v4M13 14l-3-3M13 14l3-3M19 18l3-3M19 18l-3-3M19 18v-8"/></svg>
        <div class="dir-text">${escapeHtml(line.fwd[0] + ' — ' + line.fwd[line.fwd.length-1])}</div>
        <div class="arrow">${svgArrowRight()}</div>
      </div>
      <div class="direction-row" data-dir="bwd">
        <svg class="dir-icon" viewBox="0 0 24 24"><path d="M3 10c0-3 2-5 5-5s5 2 5 5v4M13 14l-3-3M13 14l3-3M19 18l3-3M19 18l-3-3M19 18v-8"/></svg>
        <div class="dir-text">${escapeHtml(line.bwd[0] + ' — ' + line.bwd[line.bwd.length-1])}</div>
        <div class="arrow">${svgArrowRight()}</div>
      </div>
    ` : `
      <div class="direction-row" data-dir="fwd">
        <svg class="dir-icon" viewBox="0 0 24 24"><path d="M3 10c0-3 2-5 5-5s5 2 5 5v4M13 14l-3-3M13 14l3-3"/></svg>
        <div class="dir-text">${escapeHtml(line.name)}</div>
        <div class="arrow">${svgArrowRight()}</div>
      </div>
      <div style="padding:14px 16px; color:#6C8794; font-size:13px; text-align:center; background:#fff; border-top:1px solid #f0f0f0;">
        Detailed stop list not available<br>for this line yet
      </div>
    `}
    <div class="gmaps-open" id="gmaps-route">
      <svg viewBox="0 0 24 24"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
      View route in Google Maps
    </div>
  `;

  // Bind
  container.querySelectorAll('.direction-row').forEach(r => {
    r.onclick = () => { state.selectedDirection = r.dataset.dir; go('route-details'); };
  });
  document.getElementById('route-fav-btn').onclick = (e) => {
    e.stopPropagation(); toggleFavLine(line.id); renderRouteInfo();
  };
  document.getElementById('gmaps-route').onclick = () => openLineInGmaps(line);
}

function openLineInGmaps(line) {
  const stops = (line.fwd || []).filter(s => coordOf(s));
  if (stops.length >= 2) {
    const origin = encodeURIComponent(stops[0] + ', Caracas');
    const dest = encodeURIComponent(stops[stops.length-1] + ', Caracas');
    const waypoints = stops.slice(1,-1).slice(0,8).map(s => encodeURIComponent(s+', Caracas')).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=transit${waypoints?'&waypoints='+waypoints:''}`;
    window.open(url, '_blank');
  } else {
    const q = encodeURIComponent(line.name + ', Caracas, Venezuela');
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
  }
}

// --- Route details (List / Map / Schedule tabs) ---
function renderRouteDetails() {
  const line = getLine(state.selectedLine);
  if (!line) return;
  const dir = state.selectedDirection;
  const stops = line[dir] || line.fwd || [];

  const headerSub = document.querySelector('#screen-route-details .header h1 .sub');
  if (headerSub) {
    const dirLabel = stops.length ? `${stops[0]} → ${stops[stops.length-1]}` : line.name;
    headerSub.textContent = dirLabel.length > 36 ? dirLabel.slice(0,34)+'…' : dirLabel;
  }

  // Set active tab to LIST
  document.querySelectorAll('#screen-route-details .tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === 'list');
  });

  const container = document.getElementById('route-details-stops');
  container.style.setProperty('--line-color', colorForLine(line));
  container.innerHTML = '';
  stops.forEach((s, idx) => {
    const node = document.createElement('div');
    node.className = 'stop-node';
    node.innerHTML = `
      <div class="stop-name">${escapeHtml(s)}</div>
      <div class="arrow">${svgArrowRight()}</div>
    `;
    node.onclick = () => { state.selectedStop = s; go('stop-detail'); };
    container.appendChild(node);
  });
  if (stops.length === 0) {
    container.innerHTML = '<div style="padding:40px; text-align:center; color:#6C8794;">No stops registered</div>';
  }
}

function renderRouteMap() {
  const line = getLine(state.selectedLine);
  if (!line) return;
  const dir = state.selectedDirection;
  const stops = (line[dir] || line.fwd || []).filter(s => coordOf(s));

  const headerSub = document.querySelector('#screen-route-map .header h1 .sub');
  if (headerSub) {
    const dirLabel = stops.length ? `${stops[0]} → ${stops[stops.length-1]}` : line.name;
    headerSub.textContent = dirLabel.length > 36 ? dirLabel.slice(0,34)+'…' : dirLabel;
  }

  document.querySelectorAll('#screen-route-map .tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === 'map');
  });

  const id = 'map-route';
  const el = document.getElementById(id);
  if (state.maps[id]) { state.maps[id].remove(); }
  const map = L.map(el, { zoomControl: false, attributionControl: false }).setView([10.495, -66.87], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  if (stops.length > 0) {
    const latlngs = stops.map(s => coordOf(s));
    L.polyline(latlngs, { color: colorForLine(line), weight: 5, opacity: 0.8 }).addTo(map);
    stops.forEach((s, i) => {
      const marker = L.circleMarker(coordOf(s), {
        radius: i === 0 || i === stops.length-1 ? 9 : 6,
        color: colorForLine(line), weight: 3, fillColor: '#fff', fillOpacity: 1
      }).addTo(map);
      marker.bindPopup(`<b>${escapeHtml(s)}</b><br>Line ${line.id}`);
    });
    map.fitBounds(latlngs, { padding: [30,30] });
  }
  state.maps[id] = map;
}

function renderRouteSchedule() {
  const line = getLine(state.selectedLine);
  if (!line) return;
  const dir = state.selectedDirection;
  const stops = line[dir] || line.fwd || [line.name];
  const dirLabel = stops[0] && stops[stops.length-1] ? `${stops[0]} → ${stops[stops.length-1]}` : line.name;

  const headerSub = document.querySelector('#screen-route-schedule .header h1 .sub');
  if (headerSub) headerSub.textContent = dirLabel.length > 36 ? dirLabel.slice(0,34)+'…' : dirLabel;

  document.querySelectorAll('#screen-route-schedule .tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === 'schedule');
  });

  const sch = generateSchedule(line.id);
  const day = state.scheduleDay;
  const times = sch[day];

  const grouped = {};
  times.forEach(t => {
    const h = t.split(':')[0];
    if (!grouped[h]) grouped[h] = [];
    grouped[h].push(t.split(':')[1]);
  });

  let gridHtml = '';
  Object.keys(grouped).sort().forEach(h => {
    gridHtml += `<div class="hour">${h}:00</div><div class="mins">${grouped[h].map(m=>`<span>:${m}</span>`).join('')}</div>`;
  });

  document.getElementById('schedule-info').innerHTML = `
    <b>Line ${line.id}</b> · ${escapeHtml(line.op)}<br>
    Route: ${escapeHtml(dirLabel)}<br>
    Approximate frequency: ${8 + (line.id.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % 8)} min
  `;
  document.getElementById('schedule-grid').innerHTML = gridHtml || '<div style="grid-column:1/-1; text-align:center; color:#6C8794;">No service on this day</div>';

  document.querySelectorAll('#screen-route-schedule .schedule-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.day === day);
  });
}

// --- Nearby stops ---
function renderNearbyList() {
  document.querySelectorAll('#screen-nearby-list .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'list'));
  const container = document.getElementById('nearby-list-body');
  container.innerHTML = '';
  NEARBY_FROM.stops.forEach(stop => {
    const isFav = state.favoritesStops.includes(stop.id);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-row">
        <div class="card-title">${escapeHtml(stop.name)}</div>
        <svg class="star ${isFav?'active':''}" data-stop="${stop.id}" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
        </svg>
      </div>
      <div class="card-sub">
        <span>#${stop.id}</span>
        <span>${stop.dist} m</span>
      </div>
      <div class="card-row">
        <div class="line-chips">
          ${stop.lines.map(id => {
            const l = getLine(id);
            const color = l ? colorForLine(l) : '#5D6D7E';
            return `<div class="line-chip" style="background:${color}">${id}</div>`;
          }).join('')}
        </div>
        <div class="arrow">${svgArrowRight()}</div>
      </div>
    `;
    card.onclick = (e) => {
      if (e.target.closest('.star')) return;
      state.selectedStop = stop.name;
      state.currentStopMeta = stop;
      go('stop-detail');
    };
    card.querySelector('.star').onclick = (e) => {
      e.stopPropagation();
      toggleFavStop(stop.id);
      renderNearbyList();
    };
    container.appendChild(card);
  });
}

function renderNearbyMap() {
  document.querySelectorAll('#screen-nearby-list .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'map'));
  const id = 'map-nearby';
  const el = document.getElementById(id);
  if (state.maps[id]) state.maps[id].remove();
  const center = NEARBY_FROM.coord;
  const map = L.map(el, { zoomControl: false, attributionControl: false }).setView(center, 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.circleMarker(center, { radius: 7, color: '#A6B43E', weight: 3, fillColor: '#fff', fillOpacity: 1 })
    .addTo(map).bindPopup(`<b>${NEARBY_FROM.name}</b><br>Your location`);

  NEARBY_FROM.stops.forEach(stop => {
    const c = coordOf(stop.name);
    if (!c) return;
    const marker = L.marker(c).addTo(map);
    marker.bindPopup(`
      <b>${escapeHtml(stop.name)}</b><br>
      #${stop.id} · ${stop.dist} m<br>
      Lines: ${stop.lines.join(', ')}<br>
      <a href="javascript:void(0)" onclick="state.selectedStop='${escapeHtml(stop.name)}'; state.currentStopMeta=NEARBY_FROM.stops.find(s=>s.id==='${stop.id}'); go('stop-detail');" style="color:#A6B43E; font-weight:700;">View stop →</a>
    `);
  });
  state.maps[id] = map;
}

function renderNearbyPickAddress() {
  const id = 'map-pick';
  const el = document.getElementById(id);
  if (state.maps[id]) state.maps[id].remove();
  const map = L.map(el, { zoomControl: false, attributionControl: false }).setView([10.4972, -66.8911], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.marker([10.4972, -66.8911]).addTo(map).bindPopup('Plaza Venezuela, Caracas').openPopup();
  state.maps[id] = map;
  document.getElementById('pick-input').value = 'Plaza Venezuela, Caracas, Venezuela';
}

// --- Stop detail ---
function renderStopDetail() {
  const stopName = state.selectedStop;
  const meta = state.currentStopMeta;
  const linesForStop = LINES.filter(l =>
    (l.fwd && l.fwd.includes(stopName)) || (l.bwd && l.bwd.includes(stopName))
  );

  const headerSub = document.querySelector('#screen-stop-detail .header h1 .sub');
  if (headerSub) headerSub.textContent = stopName;

  const container = document.getElementById('stop-detail-body');
  const isFav = meta && state.favoritesStops.includes(meta.id);

  container.innerHTML = `
    <div class="stop-detail-header">
      ${meta ? `<div class="id">Stop #${meta.id} · ${meta.dist} m</div>` : ''}
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
        <h2>${escapeHtml(stopName)}</h2>
        ${meta ? `
        <svg class="star ${isFav?'active':''}" id="stop-fav-btn" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
        </svg>` : ''}
      </div>
    </div>
    <div class="section-title">Lines passing through</div>
    ${linesForStop.length > 0 ? linesForStop.map(line => `
      <div class="line-row" data-line="${line.id}">
        <div class="line-chip lg" style="background:${colorForLine(line)}">${line.id}</div>
        <div class="line-name">${escapeHtml(line.name)}<div class="line-op">${line.op}</div></div>
        <div class="arrow">${svgArrowRight()}</div>
      </div>
    `).join('') : `<div style="padding:20px; text-align:center; color:#6C8794; font-size:14px;">No detailed lines for this stop yet</div>`}
    <div class="gmaps-open" id="gmaps-stop">
      <svg viewBox="0 0 24 24"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
      Open stop in Google Maps
    </div>
  `;

  container.querySelectorAll('[data-line]').forEach(r => {
    r.onclick = () => { state.selectedLine = r.dataset.line; go('route-info'); };
  });
  if (meta) {
    const btn = document.getElementById('stop-fav-btn');
    if (btn) btn.onclick = (e) => { e.stopPropagation(); toggleFavStop(meta.id); renderStopDetail(); };
  }
  document.getElementById('gmaps-stop').onclick = () => {
    const c = coordOf(stopName);
    const q = c ? `${c[0]},${c[1]}` : encodeURIComponent(stopName + ', Caracas');
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
  };
}

// --- Favorites ---
function renderFavorites() {
  const container = document.getElementById('favorites-body');
  const lines = state.favoritesRoutes.map(id => getLine(id)).filter(Boolean);
  const stops = state.favoritesStops.map(id => NEARBY_FROM.stops.find(s => s.id === id)).filter(Boolean);

  if (lines.length === 0 && stops.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
        <h3>No favorites yet</h3>
        <p>Tap the star on any line or stop to save it here for quick access.</p>
      </div>
    `;
    return;
  }

  let html = '';
  if (lines.length) {
    html += '<div class="fav-section-title">Favorite lines</div>';
    lines.forEach(line => {
      html += `
        <div class="line-row" data-fav-line="${line.id}">
          <div class="line-chip lg" style="background:${colorForLine(line)}">${line.id}</div>
          <div class="line-name">${escapeHtml(line.name)}<div class="line-op">${line.op}</div></div>
          <div class="arrow">${svgArrowRight()}</div>
        </div>
      `;
    });
  }
  if (stops.length) {
    html += '<div class="fav-section-title">Favorite stops</div>';
    stops.forEach(stop => {
      html += `
        <div class="card" data-fav-stop="${stop.id}">
          <div class="card-row">
            <div class="card-title">${escapeHtml(stop.name)}</div>
          </div>
          <div class="card-sub">
            <span>#${stop.id}</span>
            <span>${stop.dist} m</span>
          </div>
          <div class="card-row">
            <div class="line-chips">
              ${stop.lines.map(id => {
                const l = getLine(id);
                return `<div class="line-chip" style="background:${l?colorForLine(l):'#5D6D7E'}">${id}</div>`;
              }).join('')}
            </div>
            <div class="arrow">${svgArrowRight()}</div>
          </div>
        </div>
      `;
    });
  }
  container.innerHTML = html;
  container.querySelectorAll('[data-fav-line]').forEach(r => {
    r.onclick = () => { state.selectedLine = r.dataset.favLine; go('route-info'); };
  });
  container.querySelectorAll('[data-fav-stop]').forEach(c => {
    c.onclick = () => {
      const stopId = c.dataset.favStop;
      const stop = NEARBY_FROM.stops.find(s => s.id === stopId);
      state.selectedStop = stop.name;
      state.currentStopMeta = stop;
      go('stop-detail');
    };
  });
}

// --- Directions result ---
function renderDirectionsResult() {
  const from = document.getElementById('dir-from').value || 'Plaza Venezuela, Caracas';
  const to = document.getElementById('dir-to').value || 'Petare, Caracas';

  // Update map
  const id = 'map-dir-result';
  const el = document.getElementById(id);
  if (state.maps[id]) state.maps[id].remove();
  const fromCoord = guessCoord(from) || [10.4972, -66.8911];
  const toCoord = guessCoord(to) || [10.4761, -66.8077];
  const map = L.map(el, { zoomControl: false, attributionControl: false });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
  L.marker(fromCoord).addTo(map).bindPopup('From: ' + from);
  L.marker(toCoord).addTo(map).bindPopup('To: ' + to);
  L.polyline([fromCoord, toCoord], { color: '#A6B43E', weight: 4, dashArray: '8 8' }).addTo(map);
  map.fitBounds([fromCoord, toCoord], { padding: [30, 30] });
  state.maps[id] = map;

  // Generate options (procedural fake based on input hash)
  const options = generateRouteOptions(from, to);
  const list = document.getElementById('dir-options');
  list.innerHTML = '';
  options.forEach(opt => {
    const card = document.createElement('div');
    card.className = 'dir-option';
    card.innerHTML = `
      <div class="dir-option-head">
        <div>
          <div class="duration">${opt.duration}</div>
          <div class="time-range">${opt.range}</div>
        </div>
        <div class="price">${opt.price}</div>
      </div>
      <div class="steps">
        <div class="step-chip walk">🚶 ${opt.walk1}</div>
        ${opt.legs.map(l => `<span class="step-sep">›</span><div class="step-chip" style="background:${l.color}">🚌 ${l.line}</div>`).join('')}
        <span class="step-sep">›</span><div class="step-chip walk">🚶 ${opt.walk2}</div>
      </div>
      <div class="leave">Leaves ${opt.leave} from ${escapeHtml(opt.startStop)}</div>
      <div class="actions">
        <div class="gmaps-btn" data-open="gmaps">Open in Google Maps</div>
      </div>
    `;
    card.querySelector('.gmaps-btn').onclick = (e) => {
      e.stopPropagation();
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=transit`;
      window.open(url, '_blank');
    };
    list.appendChild(card);
  });
}

function guessCoord(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  for (const [k, v] of Object.entries(STOP_COORDS)) {
    if (t.includes(k.toLowerCase())) return v;
  }
  return null;
}

function generateRouteOptions(from, to) {
  const allLineIds = LINES.filter(l => l.fwd && l.fwd.length >= 2).map(l => l.id);
  const seed = (from + to).split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  function pick(n) { return allLineIds[(seed*n) % allLineIds.length]; }

  const o1 = [pick(3), pick(7)];
  const o2 = [pick(11)];
  const o3 = [pick(5), pick(13), pick(17)];

  function chip(id) {
    const l = getLine(id);
    return { line: id, color: l ? colorForLine(l) : '#5D6D7E' };
  }

  return [
    {
      duration: '38 min', range: '15:00 — 15:38', price: 'Bs. 18',
      walk1: '4', walk2: '3',
      legs: o1.map(chip),
      leave: 'in 5 min',
      startStop: 'Plaza Venezuela'
    },
    {
      duration: '45 min', range: '15:00 — 15:45', price: 'Bs. 12',
      walk1: '7', walk2: '5',
      legs: o2.map(chip),
      leave: 'in 8 min',
      startStop: 'Sabana Grande'
    },
    {
      duration: '52 min', range: '15:00 — 15:52', price: 'Bs. 25',
      walk1: '3', walk2: '4',
      legs: o3.map(chip),
      leave: 'in 2 min',
      startStop: 'Bellas Artes'
    },
  ];
}

// --- Util ---
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function svgArrowRight() {
  return `<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>`;
}

// === Event binding (init) ===
document.addEventListener('DOMContentLoaded', () => {
  // Home tiles
  document.querySelectorAll('[data-go]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const screen = el.dataset.go;
      if (screen === 'nearby-modal') { showModal(); return; }
      go(screen);
    });
  });

  // Back buttons
  document.querySelectorAll('[data-back]').forEach(el => {
    el.addEventListener('click', back);
  });

  // Modal items
  document.getElementById('modal-current').onclick = () => { hideModal(); go('nearby-list'); };
  document.getElementById('modal-address').onclick = () => { hideModal(); go('nearby-pick-address'); };
  document.getElementById('modal-cancel').onclick = () => hideModal();
  document.getElementById('modal').onclick = e => { if (e.target.id === 'modal') hideModal(); };

  // Tabs for nearby (both list and map screens)
  document.querySelectorAll('#screen-nearby-list .tab, #screen-nearby-map .tab').forEach(t => {
    t.onclick = () => {
      const tab = t.dataset.tab;
      if (tab === 'list') go('nearby-list');
      else go('nearby-map');
      state.history.pop();
    };
  });

  // Tabs for route details
  document.querySelectorAll('#screen-route-details .tab, #screen-route-map .tab, #screen-route-schedule .tab').forEach(t => {
    t.onclick = () => {
      const tab = t.dataset.tab;
      if (tab === 'list') go('route-details');
      else if (tab === 'map') go('route-map');
      else if (tab === 'schedule') go('route-schedule');
      state.history.pop();
    };
  });

  // Schedule day tabs
  document.querySelectorAll('.schedule-tab').forEach(t => {
    t.onclick = () => { state.scheduleDay = t.dataset.day; renderRouteSchedule(); };
  });

  // Lines filter
  const filter = document.getElementById('lines-filter');
  if (filter) {
    filter.oninput = (e) => { state.filterText = e.target.value; renderLines(); };
  }

  // Directions button
  document.getElementById('dir-route-btn').onclick = () => go('directions-result');

  // Pick address — Find
  document.getElementById('pick-find-btn').onclick = () => {
    state.searchAddress = document.getElementById('pick-input').value;
    go('nearby-list');
    state.history.pop();
    state.history.pop(); // drop pick + modal
  };

  // Pick input clear
  document.getElementById('pick-clear').onclick = () => { document.getElementById('pick-input').value = ''; };

  // Direction form clear
  document.querySelectorAll('.field .clear').forEach(el => {
    el.onclick = () => el.parentElement.querySelector('input').value = '';
  });

  // Home: locate button → recenter map
  const locate = document.getElementById('home-locate');
  if (locate) locate.onclick = () => {
    if (state.maps.home) state.maps.home.flyTo([10.4806, -66.9036], 14);
    toast('Centering on your location…');
  };

  // Home: Pago Móvil "Fare payment"
  const pago = document.getElementById('pago-pay');
  if (pago) pago.onclick = (e) => { e.stopPropagation(); toast('Opening Pago Móvil…'); };

  // Initial render
  renderScreen('home');
});
