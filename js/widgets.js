/* Widgets flotantes: chat privado (tipo WhatsApp) y Tyrone AI */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const A = CAI.app; const esc = A.esc;
  const hm = (iso) => new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  /* ===================== CHAT PRIVADO ===================== */
  const chatEl = $('#chat');
  const C = (CAI.chat = { isOpen: false, peer: null, msgs: [], people: {}, seen: {} });

  const seenKey = () => 'cai_seen_' + (Store.me ? Store.me.id : '');
  const loadSeen = () => { try { C.seen = JSON.parse(localStorage.getItem(seenKey())) || {}; } catch (e) { C.seen = {}; } };
  const markSeen = (peer) => { C.seen[peer] = new Date().toISOString(); try { localStorage.setItem(seenKey(), JSON.stringify(C.seen)); } catch (e) {} };
  const peerOf = (m) => (m.from_id === Store.me.id ? m.to_id : m.from_id);
  const unreadFor = (peer) => C.msgs.filter((m) => m.from_id === peer && m.created_at > (C.seen[peer] || '')).length;
  const totalUnread = () => { if (!Store.me) return 0; const ids = new Set(C.msgs.map(peerOf)); let n = 0; ids.forEach((p) => { n += unreadFor(p); }); return n; };
  const badge = () => { const n = totalUnread(); const b = $('#chat-badge'); b.textContent = n; b.classList.toggle('hide', !n); };

  async function person(id) {
    if (C.people[id]) return C.people[id];
    const all = await Store.profiles(); all.forEach((p) => { C.people[p.id] = p; });
    return C.people[id] || (C.people[id] = (await Store.profile(id)) || { id, full_name: 'Apologeta', username: '' });
  }

  async function load() { if (!Store.me) { C.msgs = []; return; } loadSeen(); C.msgs = await Store.allMessages(); await Promise.all(Array.from(new Set(C.msgs.map(peerOf))).map(person)); badge(); }

  function shell() {
    chatEl.innerHTML =
      '<div class="lst"><header><b style="font:600 1.4rem var(--serif)">Mensajes</b><button class="icon-btn" style="margin-left:auto" id="c-close" aria-label="Cerrar mensajes">' + CAI.icon('x', 18) + '</button></header><div class="scroll" id="c-list"></div></div>' +
      '<div class="th"><header id="c-head"></header><div class="msgs" id="c-msgs" aria-live="polite"></div><form id="c-form" class="hide"><input id="c-in" placeholder="Escribe un mensaje" autocomplete="off" maxlength="2000" aria-label="Mensaje"><button class="btn btn-red">' + CAI.icon('send', 16) + ' Enviar</button></form></div>';
    $('#c-close').onclick = () => C.close();
    $('#c-form').onsubmit = async (e) => {
      e.preventDefault(); const i = $('#c-in'); const t = i.value.trim(); if (!t || !C.peer) return; i.value = '';
      try { const m = await Store.send(C.peer, t); add(m); drawThread(); drawList(); } catch (er) { A.toast(er.message); i.value = t; }
    };
  }
  const add = (m) => { if (!C.msgs.some((x) => x.id === m.id)) C.msgs.push(m); };

  async function drawList() {
    const peers = {}; C.msgs.forEach((m) => { const p = peerOf(m); if (!peers[p] || m.created_at > peers[p].created_at) peers[p] = m; });
    if (C.peer && !peers[C.peer]) peers[C.peer] = { created_at: new Date().toISOString(), body: '', from_id: C.peer };
    const ids = Object.keys(peers).sort((a, b) => peers[b].created_at.localeCompare(peers[a].created_at)); await Promise.all(ids.map(person));
    $('#c-list').innerHTML = ids.length ? ids.map((id) => { const p = C.people[id]; const n = unreadFor(id); const last = peers[id];
      return '<div class="conv' + (id === C.peer ? ' on' : '') + '" data-id="' + esc(id) + '" role="button" tabindex="0">' + A.avatar(p) + '<div class="t"><b>' + esc(p.full_name) + '</b><span>' + esc((last.from_id === Store.me.id ? 'Tú: ' : '') + last.body) + '</span></div>' + (n ? '<span class="dot-badge" style="position:static">' + n + '</span>' : '') + '</div>'; }).join('')
      : '<div class="none">Aún no tienes conversaciones.<br>Abre el perfil de un hermano y toca «Enviar mensaje».</div>';
    $$('.conv', chatEl).forEach((c) => { const go = () => C.open(c.dataset.id); c.onclick = go; c.onkeydown = (e) => { if (e.key === 'Enter') go(); }; });
  }

  async function drawThread() {
    const box = $('#c-msgs'); const head = $('#c-head');
    if (!C.peer) { head.innerHTML = '<b style="font:600 1.3rem var(--serif)">Selecciona una conversación</b>'; box.innerHTML = '<div class="none">Tus mensajes privados con otros apologetas aparecen aquí.</div>'; $('#c-form').classList.add('hide'); return; }
    const p = await person(C.peer);
    head.innerHTML = '<button class="icon-btn back" id="c-back" aria-label="Volver a la lista">' + CAI.icon('left', 18) + '</button>' + A.avatar(p, 'sm') + '<div><b style="display:block;line-height:1.1">' + esc(p.full_name) + '</b><span class="small" style="opacity:.75">@' + esc(p.username) + '</span></div><a class="btn btn-light btn-sm" style="margin-left:auto" href="#/perfil/' + esc(p.id) + '">Ver perfil</a>';
    $('#c-back').onclick = () => { C.peer = null; chatEl.classList.remove('thread'); drawThread(); drawList(); };
    const list = C.msgs.filter((m) => peerOf(m) === C.peer).sort((a, b) => a.created_at.localeCompare(b.created_at));
    box.innerHTML = list.length ? list.map((m) => '<div class="bub' + (m.from_id === Store.me.id ? ' me' : '') + '">' + esc(m.body) + '<time>' + hm(m.created_at) + '</time></div>').join('') : '<div class="none">Escribe el primer mensaje a ' + esc(p.full_name.split(' ')[0]) + '.</div>';
    box.scrollTop = box.scrollHeight; $('#c-form').classList.remove('hide'); markSeen(C.peer); badge();
  }

  C.open = async (peer) => {
    if (!A.requireLogin('Inicia sesión para usar los mensajes')) return;
    if (!chatEl.firstChild) shell(); await load(); C.peer = peer || null; C.isOpen = true; chatEl.classList.add('open'); chatEl.classList.toggle('thread', !!peer);
    await drawList(); await drawThread(); if (peer) setTimeout(() => $('#c-in') && $('#c-in').focus(), 250);
  };
  C.close = () => { C.isOpen = false; chatEl.classList.remove('open'); };
  $('#chat-btn').onclick = () => (C.isOpen ? C.close() : C.open(null));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && C.isOpen && !$('.veil')) C.close(); });

  Store.on('msg', async (m) => {
    if (!Store.me || (m.from_id !== Store.me.id && m.to_id !== Store.me.id)) return;
    add(m); const from = peerOf(m);
    if (C.isOpen && C.peer === from) { await drawThread(); } else if (m.from_id !== Store.me.id) { const p = await person(from); A.toast('Mensaje de ' + p.full_name.split(' ')[0] + ': ' + m.body.slice(0, 40)); }
    badge(); if (C.isOpen) drawList();
  });
  (async () => { if (Store.me) { try { await load(); } catch (e) {} } })();
  // al iniciar o cerrar sesión se refresca el contador
  setInterval(() => { if (Store.me && !C.msgs.length && !C.loading) { C.loading = true; load().finally(() => { C.loading = false; }); } if (!Store.me) { C.msgs = []; badge(); if (C.isOpen) C.close(); } }, 4000);

  /* ===================== TYRONE AI ===================== */
  const panel = $('#ty-panel'); const launch = $('#ty-launch'); const ENDPOINT = (window.CAI_CONFIG || {}).AI_ENDPOINT || '/api/tyrone';
  /* Mensajes amables cuando Tyrone no responde (nunca se muestran datos técnicos ni claves) */
  const DEV = (window.CAI_CONFIG || {}).DEV_EMAIL || '';
  const FAILS = [
    'Tyrone AI decidió ir a orar el día de hoy y no se encuentra disponible ahora. Regresa en unos minutos…',
    'Tyrone AI ha sufrido un problema con su libre albedrío. El equipo de desarrollo está trabajando en esto.',
    'Tyrone AI está teniendo problemas. No te preocupes, el equipo está trabajando en esto.'
  ];
  const LONG = 'Parece que esto está tardando más de lo habitual. Por favor, comunícate con el equipo de desarrollo: ' + DEV + ' para decirle que me restaure.';
  let fails = 0; const failMsg = () => { fails++; return fails >= 3 ? LONG : FAILS[fails - 1]; };
  const KEY = 'cai_ty_chats'; let chats = []; let cur = null; let busy = false;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(chats.slice(0, 40))); } catch (e) {} };
  try { chats = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { chats = []; }
  const newChat = () => { cur = { id: 'c' + Date.now(), title: 'Nueva conversación', pinned: false, updated: Date.now(), messages: [], custom: false }; chats.unshift(cur); save(); };
  const md = (t) => {
    t = esc(t).replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*(?!\s)([^*]+?)\*/g, '$1<em>$2</em>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    return t.split(/\n{2,}/).map((b) => { const l = b.split('\n'); return l.every((x) => /^\s*[-*] /.test(x)) ? '<ul>' + l.map((x) => '<li>' + x.replace(/^\s*[-*] /, '') + '</li>').join('') + '</ul>' : '<p>' + l.join('<br>') + '</p>'; }).join('');
  };

  panel.innerHTML = '<div class="ty-head"><img src="assets/img/tyrone.png" alt=""><b>Tyrone AI</b><span class="st">EN LÍNEA</span><span class="sp"><button id="ty-new" aria-label="Nueva conversación" title="Nueva conversación">' + CAI.icon('plus', 19) + '</button><button id="ty-hist-b" aria-label="Historial" title="Historial">' + CAI.icon('clock', 19) + '</button><button id="ty-x" aria-label="Cerrar">' + CAI.icon('x', 19) + '</button></span></div>' +
    '<div class="ty-hist" id="ty-hist"><div style="display:flex;gap:.5rem"><input id="ty-q" placeholder="Buscar conversación" aria-label="Buscar conversación" style="margin:0"><button class="btn btn-red btn-sm" id="ty-new2">Nueva</button></div><div class="scroll" id="ty-hl"></div></div>' +
    '<div class="ty-body" id="ty-body" aria-live="polite"></div><form class="ty-in" id="ty-form"><input id="ty-input" placeholder="Escribe tu pregunta…" autocomplete="off" maxlength="2000" aria-label="Pregunta para Tyrone AI"><button aria-label="Enviar">' + CAI.icon('send', 20) + '</button></form>';

  function drawChat() {
    const b = $('#ty-body'); const me = Store.me; const nm = me ? me.full_name.split(' ')[0] : '';
    const hi = '<div class="ty-m">' + (nm ? 'Paz y bien, <strong>' + esc(nm) + '</strong>' : 'Paz y bien') + '. Soy Tyrone AI. Puedo ayudarte a usar la plataforma o resolver dudas de apologética. ¿En qué te ayudo?</div>';
    b.innerHTML = hi + cur.messages.map((m) => '<div class="ty-m ' + (m.role === 'user' ? 'u' : m.err ? 'warn' : '') + '">' + (m.role === 'user' ? esc(m.content) : md(m.content)) + '</div>').join('') + (busy ? '<div class="ty-m ty-typing"><i></i><i></i><i></i></div>' : '');
    b.scrollTop = b.scrollHeight;
  }
  function drawHist() {
    const q = $('#ty-q').value.trim().toLowerCase(); const day = 864e5; const now = new Date().setHours(0, 0, 0, 0);
    const list = chats.filter((c) => c.messages.length && (!q || c.title.toLowerCase().includes(q))).sort((a, b) => (b.pinned - a.pinned) || (b.updated - a.updated));
    const grp = (c) => (c.pinned ? 'Fijadas' : c.updated >= now ? 'Hoy' : c.updated >= now - day ? 'Ayer' : 'Antes'); let last = '';
    $('#ty-hl').innerHTML = list.length ? list.map((c) => { const g = grp(c); const h = g !== last ? '<div class="small muted" style="margin:.8rem 0 .2rem"><b>' + g + '</b></div>' : ''; last = g;
      return h + '<div class="ty-h" data-id="' + c.id + '"><div class="t"><b>' + esc(c.title) + '</b><span class="small muted">' + new Date(c.updated).toLocaleDateString('es') + ', ' + c.messages.length + ' mensajes</span></div><button data-a="pin" title="Fijar" aria-label="Fijar">' + CAI.icon('bookmark', 17) + '</button><button data-a="ren" title="Renombrar" aria-label="Renombrar">' + CAI.icon('pencil', 17) + '</button><button data-a="del" title="Borrar" aria-label="Borrar">' + CAI.icon('trash', 17) + '</button></div>'; }).join('')
      : '<div class="empty small">No hay conversaciones guardadas.</div>';
  }
  $('#ty-hl').onclick = (e) => {
    const row = e.target.closest('.ty-h'); if (!row) return; const c = chats.find((x) => x.id === row.dataset.id); const a = e.target.closest('button'); if (!c) return;
    if (a) { e.stopPropagation(); if (a.dataset.a === 'pin') c.pinned = !c.pinned; if (a.dataset.a === 'ren') { const t = prompt('Nuevo nombre', c.title); if (t && t.trim()) { c.title = t.trim().slice(0, 60); c.custom = true; } }
      if (a.dataset.a === 'del' && confirm('¿Borrar esta conversación?')) { chats = chats.filter((x) => x !== c); if (cur === c) newChat(); } save(); drawHist(); drawChat(); return; }
    cur = c; $('#ty-hist').classList.remove('open'); drawChat();
  };
  $('#ty-q').oninput = drawHist;
  $('#ty-hist-b').onclick = () => { $('#ty-hist').classList.toggle('open'); drawHist(); };
  const fresh = () => { if (!cur || cur.messages.length) newChat(); $('#ty-hist').classList.remove('open'); drawChat(); $('#ty-input').focus(); };
  $('#ty-new').onclick = fresh; $('#ty-new2').onclick = fresh;
  const toggle = (open) => { panel.classList.toggle('open', open); launch.style.display = open && innerWidth <= 520 ? 'none' : ''; if (open) { if (!cur) { cur = chats.find((c) => !c.messages.length) || (newChat(), cur); } drawChat(); setTimeout(() => $('#ty-input').focus(), 80); } };
  launch.onclick = () => toggle(!panel.classList.contains('open')); $('#ty-x').onclick = () => toggle(false);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open') && !$('.veil') && !C.isOpen) toggle(false); });

  $('#ty-form').onsubmit = async (e) => {
    e.preventDefault(); const i = $('#ty-input'); const t = i.value.trim(); if (!t || busy) return; i.value = '';
    const history = cur.messages.filter((m) => !m.err).slice(-10).map((m) => ({ role: m.role, content: m.content }));
    cur.messages.push({ role: 'user', content: t }); if (!cur.custom && cur.messages.length === 1) cur.title = t.slice(0, 40); cur.updated = Date.now(); busy = true; save(); drawChat();
    let reply = null, failed = false;
    try {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 35000);
      const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: t, history }), signal: ctl.signal }); clearTimeout(to);
      const j = await r.json(); if (!r.ok || !j || j.ok === false || !j.reply) throw new Error('fail'); reply = j.reply; fails = 0;
    } catch (er) { failed = true; reply = failMsg(); }
    busy = false; cur.messages.push({ role: 'assistant', content: reply, err: failed }); cur.updated = Date.now(); save(); drawChat();
  };
})();
