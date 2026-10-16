/* Utilidades compartidas por la web (index.html) y la pantalla de acceso (login.html) */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = (u) => (/^(https:\/\/|data:image\/|assets\/)/.test(u || '') ? u : '');
  const U = (window.CAI = window.CAI || {}).app = {};
  Object.assign(U, { $, $$, esc, safeUrl, icon: CAI.icon });

  /* ---------- interfaz ---------- */
  U.toast = (msg) => {
    $$('.toast').forEach((t) => t.remove());
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 3400);
  };
  U.modal = (html, mount) => {
    const root = $('#modal-root') || document.body; const v = document.createElement('div'); v.className = 'veil';
    v.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><button class="icon-btn x" aria-label="Cerrar" data-close>' + CAI.icon('x', 18) + '</button>' + html + '</div>';
    const close = () => { v.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    v.addEventListener('click', (e) => { if (e.target === v || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey); root.appendChild(v);
    if (mount) mount(v, close); return close;
  };
  U.initials = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
  U.avatar = (p, cls) => {
    const u = safeUrl(p && p.avatar_url);
    return u ? '<img class="avatar ' + (cls || '') + '" src="' + esc(u) + '" alt="" loading="lazy">' : '<span class="avatar ' + (cls || '') + '" aria-hidden="true">' + esc(U.initials(p && p.full_name)) + '</span>';
  };
  U.rank = (id) => { const r = CAI.rankById(id); return '<span class="rank"><i style="background:' + r.color + '"></i>' + esc(r.name) + '</span>'; };
  U.ago = (iso) => {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return 'ahora'; if (s < 3600) return 'hace ' + Math.floor(s / 60) + ' min'; if (s < 86400) return 'hace ' + Math.floor(s / 3600) + ' h';
    if (s < 604800) return 'hace ' + Math.floor(s / 86400) + ' d'; return new Date(iso).toLocaleDateString('es');
  };
  U.place = (p) => [p.town, p.district, p.province, p.region, p.country_name].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  U.resize = (file, max, q) => new Promise((ok, fail) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); c.toBlob((b) => (b ? ok(b) : fail(new Error('No se pudo leer la imagen'))), 'image/jpeg', q || 0.8);
    };
    img.onerror = () => fail(new Error('Archivo de imagen no válido')); img.src = url;
  });
  U.formObj = (form) => { const o = {}; new FormData(form).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; }); return o; };
  /* Para entrar o crear cuenta se va a la pantalla completa login.html (se sirve como /login) */
  U.loginUrl = (hash) => 'login' + (hash || '');
  U.requireLogin = (why) => { if (Store.me) return true; U.toast(why || 'Inicia sesión para continuar'); setTimeout(() => { location.href = U.loginUrl(); }, 900); return false; };

  /* ---------- tema día / noche ---------- */
  U.initTheme = (btn) => {
    const paint = () => { btn.innerHTML = CAI.icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon', 20); };
    btn.onclick = () => {
      const d = document.documentElement; const n = d.dataset.theme === 'dark' ? 'light' : 'dark'; d.dataset.theme = n;
      try { localStorage.setItem('cai_theme', n); } catch (e) {} paint();
    };
    paint();
  };

  /* ---------- redes sociales de los perfiles ---------- */
  const SOC = { instagram: ['Instagram', 'https://instagram.com/'], facebook: ['Facebook', 'https://facebook.com/'], tiktok: ['TikTok', 'https://tiktok.com/@'], youtube: ['YouTube', 'https://youtube.com/@'], x: ['X', 'https://x.com/'], whatsapp: ['WhatsApp', 'https://wa.me/'] };
  U.SOC = SOC;
  const socialUrl = (k, v) => {
    v = String(v || '').trim(); if (!v) return '';
    if (/^https:\/\//i.test(v)) return v; if (/^http:\/\//i.test(v)) return '';
    v = v.replace(/^@/, ''); if (!/^[\w.\-+]+$/.test(v)) return '';
    return SOC[k][1] + (k === 'whatsapp' ? v.replace(/\D/g, '') : v);
  };
  U.socialsHtml = (s) => Object.keys(SOC).map((k) => { const u = socialUrl(k, s && s[k]); return u ? '<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href="' + esc(u) + '">' + SOC[k][0] + '</a>' : ''; }).join(' ');

  /* ---------- ubicación (registro y perfil) ---------- */
  U.locationBlock = (v) => {
    v = v || {}; const l = CAI.country(v.country_code || 'PE').l;
    return '<label class="f">País<select name="country_code" required>' + CAI.COUNTRIES.map((x) => '<option value="' + x.c + '"' + (x.c === (v.country_code || 'PE') ? ' selected' : '') + '>' + esc(x.n) + '</option>').join('') + '</select></label>' +
      '<div class="row2"><label class="f"><span data-l="0">' + l[0] + '</span><input name="region" value="' + esc(v.region) + '" required></label>' +
      '<label class="f"><span data-l="1">' + l[1] + '</span><input name="province" value="' + esc(v.province) + '" required></label></div>' +
      '<div class="row2"><label class="f"><span data-l="2">' + l[2] + '</span><input name="district" value="' + esc(v.district) + '" required></label>' +
      '<label class="f">Pueblo o ciudad<input name="town" value="' + esc(v.town) + '" required></label></div>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-geo>' + CAI.icon('pin', 16) + ' Usar mi ubicación actual</button> <span class="small muted" data-geo-status>' +
      (v.lat != null ? 'Ubicación guardada (aproximada, ±1 km).' : 'Si no la activas, te ubicamos según los datos que escribiste.') + '</span>' +
      '<input type="hidden" name="lat" value="' + (v.lat == null ? '' : v.lat) + '"><input type="hidden" name="lng" value="' + (v.lng == null ? '' : v.lng) + '">';
  };
  U.bindLocation = (root) => {
    const sel = $('[name=country_code]', root); const setLabels = () => { const l = CAI.country(sel.value).l; $$('[data-l]', root).forEach((s) => (s.textContent = l[s.dataset.l])); };
    const clearXY = () => { $('[name=lat]', root).value = ''; $('[name=lng]', root).value = ''; };
    sel.onchange = () => { setLabels(); clearXY(); };
    $$('[name=region],[name=province],[name=district],[name=town]', root).forEach((i) => { i.oninput = clearXY; });
    $('[data-geo]', root).onclick = () => {
      const st = $('[data-geo-status]', root);
      if (!navigator.geolocation) { st.textContent = 'Tu navegador no permite ubicación.'; return; }
      st.textContent = 'Buscando tu ubicación…';
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = +pos.coords.latitude.toFixed(2), lng = +pos.coords.longitude.toFixed(2);
        $('[name=lat]', root).value = lat; $('[name=lng]', root).value = lng; st.textContent = 'Ubicación detectada (guardamos una posición aproximada de ±1 km por tu seguridad).';
        try {
          const r = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=12&accept-language=es&lat=' + lat + '&lon=' + lng); const j = await r.json(); const a = j.address || {};
          const cc = (a.country_code || '').toUpperCase(); sel.value = CAI.COUNTRIES.some((x) => x.c === cc) ? cc : 'XX'; setLabels();
          const fill = (n, val) => { const i = $('[name=' + n + ']', root); if (i && !i.value && val) i.value = val; };
          fill('region', a.state || a.region); fill('province', a.county || a.state_district); fill('district', a.suburb || a.city_district || a.municipality); fill('town', a.city || a.town || a.village);
        } catch (e) { /* sin red: igual quedan las coordenadas */ }
      }, () => { st.textContent = 'No diste permiso de ubicación. Puedes continuar sin ella.'; }, { enableHighAccuracy: false, timeout: 12000 });
    };
  };
  U.resolveCoords = async (f) => {
    if (f.lat !== '' && f.lng !== '' && !isNaN(+f.lat)) return { lat: +f.lat, lng: +f.lng };
    const c = CAI.country(f.country_code); const parts = [f.town, f.district, f.province, f.region, c.n];
    for (let i = 0; i < 3; i++) {
      try {
        const q = parts.slice(i).filter(Boolean).join(', ');
        const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=' + encodeURIComponent(q)); const j = await r.json();
        if (j[0]) return { lat: +(+j[0].lat).toFixed(2), lng: +(+j[0].lon).toFixed(2) };
      } catch (e) { break; }
    }
    return { lat: +(c.lat + (Math.random() - .5) * 1.2).toFixed(2), lng: +(c.lng + (Math.random() - .5) * 1.2).toFixed(2) };
  };
})();
