/* Globo terráqueo giratorio (amCharts 5) + mapa de calles (Leaflet / OpenStreetMap) */
window.CAI = window.CAI || {};

CAI.Globe = {
  root: null, chart: null, anim: null, series: null, points: null, resumeT: null, zoomed: false,

  /* el: contenedor | opts: { onPoint(id), onZoom(bool), members:Set de códigos ISO, interactive } */
  init(el, opts) {
    this.destroy();
    if (!window.am5 || !window.am5map) { el.innerHTML = '<p style="color:#9fb0d0;padding:2rem">No se pudo cargar el mapa. Revisa tu conexión.</p>'; return; }
    const self = this; this.opts = opts || {};
    const root = am5.Root.new(el); this.root = root;
    root.setThemes([am5themes_Animated.new(root)]);
    root.interfaceColors.set('text', am5.color(0xffffff));

    const chart = root.container.children.push(am5map.MapChart.new(root, {
      panX: 'rotateX', panY: 'rotateY', projection: am5map.geoOrthographic(), rotationX: 70, rotationY: -8,
      wheelY: this.opts.interactive === false ? 'none' : 'zoom', maxZoomLevel: 64
    }));
    this.chart = chart;

    // Esfera (océano)
    const bg = chart.series.unshift(am5map.MapPolygonSeries.new(root, {}));
    bg.mapPolygons.template.setAll({ fill: am5.color(0x0d1730), fillOpacity: 1, strokeOpacity: 0 });
    bg.data.push({ geometry: am5map.getGeoRectangle(90, 180, -90, -180) });
    chart.series.unshift(am5map.GraticuleSeries.new(root, { step: 15 })).mapLines.template.setAll({ stroke: am5.color(0xffffff), strokeOpacity: 0.06 });

    // Países
    const poly = chart.series.push(am5map.MapPolygonSeries.new(root, { geoJSON: am5geodata_worldLow, exclude: ['AQ'] }));
    this.series = poly;
    poly.mapPolygons.template.setAll({ fill: am5.color(0x2a3b63), stroke: am5.color(0x0d1730), strokeWidth: 0.6, interactive: true, tooltipText: '{name}', cursorOverStyle: 'pointer' });
    poly.mapPolygons.template.states.create('hover', { fill: am5.color(0xb8974f) });
    poly.events.on('datavalidated', () => {
      const m = self.opts.members || new Set();
      poly.mapPolygons.each((p) => { const id = p.dataItem && p.dataItem.get('id'); if (m.has(id)) p.set('fill', am5.color(0x46659f)); });
    });
    poly.mapPolygons.template.events.on('click', (ev) => {
      const di = ev.target.dataItem; if (!di) return; self.pause(true); poly.zoomToDataItem(di); self.zoomed = true;
      if (self.opts.onZoom) self.opts.onZoom(true);
    });

    // Puntos de apologetas
    const pts = chart.series.push(am5map.MapPointSeries.new(root, {})); this.points = pts;
    pts.bullets.push((r, s, di) => {
      const d = di.dataContext; const c = am5.Container.new(r, { cursorOverStyle: 'pointer' });
      c.children.push(am5.Circle.new(r, { radius: 5.5, fill: am5.color(d.color), stroke: am5.color(0xffffff), strokeWidth: 1.5, tooltipText: '{name}\n{rank}', tooltipY: -6 }));
      c.events.on('click', () => { if (self.opts.onPoint) self.opts.onPoint(d.id); });
      return am5.Bullet.new(r, { sprite: c });
    });
    this.setPoints(this.opts.list || []);

    // Giro continuo (se pausa al tocar y se retoma solo)
    const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!still) this.spin();
    chart.chartContainer.events.on('pointerdown', () => self.pause(false));
    chart.chartContainer.events.on('globalpointerup', () => self.resumeLater());
  },

  spin() {
    if (!this.chart || this.zoomed) return;
    const from = this.chart.get('rotationX');
    this.anim = this.chart.animate({ key: 'rotationX', from: from, to: from - 360, duration: 80000, loops: Infinity, easing: am5.ease.linear });
  },
  pause(hard) { clearTimeout(this.resumeT); if (this.anim) { this.anim.stop(); this.anim = null; } if (hard) this.zoomed = true; },
  resumeLater() { clearTimeout(this.resumeT); if (this.zoomed) return; this.resumeT = setTimeout(() => { if (!this.anim) this.spin(); }, 2500); },

  setPoints(list) {
    if (!this.points) return; this.opts.list = list;
    this.points.data.setAll(list.map((p) => ({
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] }, id: p.id, name: p.full_name, rank: CAI.rankById(p.rank).name, color: CAI.rankById(p.rank).color
    })));
  },

  home() {
    if (!this.chart) return; this.zoomed = false;
    this.chart.goHome(800); this.chart.animate({ key: 'rotationY', to: -8, duration: 600 });
    if (this.opts.onZoom) this.opts.onZoom(false); this.resumeLater();
  },

  destroy() { clearTimeout(this.resumeT); if (this.root) { this.root.dispose(); } this.root = this.chart = this.anim = this.points = this.series = null; this.zoomed = false; }
};

/* ---------- Mapa de calles detallado ---------- */
CAI.Streets = {
  map: null,
  load() {
    if (window.L) return Promise.resolve();
    return new Promise((ok, fail) => {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(css);
      const s = document.createElement('script'); s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.onload = ok; s.onerror = fail; document.head.appendChild(s);
    });
  },
  async open(el, list, focus, onPoint) {
    await this.load(); this.close();
    const m = L.map(el, { worldCopyJump: true }).setView(focus || [-10, -60], focus ? 12 : 3); this.map = m;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© colaboradores de OpenStreetMap' }).addTo(m);
    list.forEach((p) => {
      const col = CAI.rankById(p.rank).color;
      L.circleMarker([p.lat, p.lng], { radius: 8, color: '#fff', weight: 2, fillColor: col, fillOpacity: 1 }).addTo(m)
        .bindTooltip(p.full_name + ' · ' + CAI.rankById(p.rank).name).on('click', () => onPoint && onPoint(p.id));
    });
    setTimeout(() => m.invalidateSize(), 80);
  },
  close() { if (this.map) { this.map.remove(); this.map = null; } }
};
