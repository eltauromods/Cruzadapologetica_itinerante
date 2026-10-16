/* App principal (SPA con rutas por hash): inicio, mapa, comunidad, rangos, recursos, perfil y panel */
(function () {
  const U = CAI.app; const { $, $$, esc, safeUrl, socialsHtml, locationBlock, bindLocation, resolveCoords, formObj } = U; const SOC = U.SOC;
  const view = $('#view'); let token = 0;

  /* ---------- estado ---------- */
  let profiles = [];
  const loadProfiles = async () => { profiles = await Store.profiles(); return profiles; };
  const withCoords = (l) => l.filter((p) => p.lat != null && p.lng != null);
  const byId = (id) => profiles.find((p) => p.id === id);

  /* ---------- cabecera ---------- */
  function renderAuth() {
    const me = Store.me; const slot = $('#auth-slot');
    $('#chat-btn').classList.toggle('hide', !me); $('#nav-admin').classList.toggle('hide', !(me && (me.role === 'admin' || me.role === 'moderador')));
    slot.innerHTML = me
      ? '<a class="btn btn-ghost btn-sm" href="#/perfil/me">' + U.avatar(me, 'sm') + 'Mi perfil</a> <button class="btn btn-ghost btn-sm" id="logout">' + CAI.icon('logout', 16) + 'Salir</button>'
      : '<a class="btn btn-ghost btn-sm" href="login">Entrar</a> <a class="btn btn-red btn-sm" href="login#registro">Registrarme</a>';
    const lo = $('#logout'); if (lo) lo.onclick = async () => { await Store.signOut(); renderAuth(); U.toast('Sesión cerrada'); route(); };
  }
  U.renderAuth = renderAuth;
  U.initTheme($('#theme'));
  $('#burger').onclick = () => $('#nav').classList.toggle('open');

  /* Pie de página: redes y correo salen de js/config.js (lo vacío no se muestra) */
  function footerConfig() {
    const c = window.CAI_CONFIG || {}; const soc = c.SOCIAL || {}; let any = false;
    $$('#socials [data-social]').forEach((a) => {
      const k = a.dataset.social; const v = k === 'email' ? (c.CONTACT_EMAIL ? 'mailto:' + c.CONTACT_EMAIL : '') : soc[k];
      if (v) { a.href = v; any = true; } else a.classList.add('hide');
    });
    $('#socials').classList.toggle('hide', !any);
  }

  /* ---------- tarjeta rápida de apologeta (clic en un punto del mapa) ---------- */
  U.openProfileCard = async (id) => {
    const p = byId(id) || (await Store.profile(id)); if (!p) return;
    U.modal('<div style="display:flex;gap:1rem;align-items:center">' + U.avatar(p, 'lg') + '<div><h3 style="margin:0">' + esc(p.full_name) + '</h3><div class="muted">@' + esc(p.username) + '</div><div style="margin-top:.4rem">' + U.rank(p.rank) + '</div></div></div>' +
      '<p style="margin-top:1rem">' + CAI.icon('pin', 18) + ' ' + esc(U.place(p)) + '</p><div>' + socialsHtml(p.socials) + '</div>' +
      '<div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1.2rem"><a class="btn btn-red" href="#/perfil/' + esc(p.id) + '" data-close>Ver perfil</a>' +
      (Store.me && Store.me.id === p.id ? '' : '<button class="btn btn-ghost" id="dm">Enviar mensaje</button>') + '</div>', (v, close) => {
      const dm = $('#dm', v); if (dm) dm.onclick = () => { if (!U.requireLogin('Inicia sesión para enviar mensajes')) return; close(); CAI.chat.open(p.id); };
    });
  };

  /* ---------- Vista: Inicio ---------- */
  async function viewHome() {
    const my = token; const join = Store.me ? '#/comunidad' : 'login#registro';
    view.innerHTML =
      '<section class="hero"><div class="wrap"><div><p class="eyebrow">Cruzada Apologética Itinerante</p><h1>Mientras respiremos, defenderemos</h1>' +
      '<p class="lead">Somos una red de apologetas católicos de habla hispana. Regístrate, ubica tu misión en el mapa y comparte lo que Dios hace en tu ciudad.</p>' +
      '<div class="cta"><a class="btn btn-red" href="' + join + '">Unirme a la cruzada</a><a class="btn btn-light" href="#/mapa">Ver el mapa</a></div>' +
      '<div class="live"><span><b id="st-m">0</b>apologetas</span><span><b id="st-c">0</b>países</span><span><b id="st-p">0</b>misiones validadas</span></div></div>' +
      '<div class="globe" id="globe" role="img" aria-label="Globo terráqueo con la ubicación de los apologetas"></div></div></section>' +
      '<section class="sec"><div class="wrap"><div class="sec-head"><p class="eyebrow">Cómo participar</p><h2>Tres pasos para no evangelizar solo</h2><p>Un camino sencillo para estar organizados y caminar acompañados.</p></div><div class="steps">' +
      '<div class="step"><h3>Regístrate y aparece en el mapa</h3><p>Crea tu cuenta con tu ubicación. Tu punto se colorea según tu rango y todos pueden ver dónde hay misión.</p></div>' +
      '<div class="step"><h3>Sal a misión</h3><p>Predica, reta o debate. Una misión al mes en tu ciudad, una cada tres meses en tu región y al menos una al año a nivel nacional.</p></div>' +
      '<div class="step"><h3>Sube tu evidencia y asciende</h3><p>Comparte fotos o enlaces de video. Los moderadores revisan y el administrador aprueba tu ascenso de rango.</p></div></div>' +
      '<div class="ranks-strip">' + CAI.RANKS.map((r) => U.rank(r.id)).join('') + U.rank('voluntaria') + '</div></div></section>' +
      '<section class="papa"><div class="wrap"><div class="txt"><p class="eyebrow">Fieles a la Iglesia</p><h2>Unidos al sucesor de Pedro</h2><p>Esta cruzada nace de la fidelidad a la Iglesia y al Papa. Cada misión busca acercar personas a Cristo con preparación, respeto y caridad.</p><a class="btn btn-red" href="#/rangos">Cómo se asciende</a></div>' +
      '<img src="assets/img/leon-xiv.webp" alt="El Papa León XIV saludando" width="380" height="438" loading="lazy"></div></section>' +
      '<section class="sec"><div class="wrap about"><div><img class="emblem" src="assets/img/logo-cai.png" alt="Escudo de la cruzada: una espada que rompe cadenas sobre un libro abierto" loading="lazy"></div>' +
      '<div><p class="eyebrow">Quiénes somos</p><h2>Una cruzada de hermanos</h2><p style="margin-top:1.2rem">Esta plataforma existe para registrar, organizar y conectar a los apologetas católicos de Latinoamérica y de habla hispana, y para ver con claridad dónde se hacen misiones, dónde faltan apologetas y dónde hay que reforzar la evangelización.</p>' +
      '<figure class="cap"><div class="photos"><img src="assets/img/hermanos.jpg" alt="Cuatro hermanos de la cruzada posando juntos en un aeropuerto" loading="lazy"><img src="assets/img/soldado-campo.jpg" alt="Un hermano de la cruzada junto a un cañón antiguo, en un museo militar" loading="lazy"></div>' +
      '<figcaption>Santiago Alarcón y Carlos Amariles, servidores de la apologética.</figcaption></figure></div></div></section>' +
      '<section class="rock"><div class="pic"><img src="assets/img/estatua-pedro.jpg" alt="Estatua de san Pedro con las llaves del Reino" loading="lazy"></div>' +
      '<div class="box"><p class="eyebrow">El primado de Pedro</p><h2>Sobre esta piedra</h2><blockquote>«Tú eres Pedro, y sobre esta piedra edificaré mi Iglesia.»<cite>Mateo 16,18</cite></blockquote><a class="btn btn-gold" href="' + join + '">Súmate a la cruzada</a></div></section>';
    const [pl, posts] = await Promise.all([loadProfiles(), Store.posts()]); if (my !== token) return;
    const list = withCoords(pl); const members = new Set(pl.map((p) => p.country_code));
    $('#st-m').textContent = pl.filter((p) => p.section === 'apologeta').length; $('#st-c').textContent = members.size; $('#st-p').textContent = posts.filter((p) => p.status === 'aprobada').length;
    CAI.Globe.init($('#globe'), { list, members, interactive: false, onPoint: U.openProfileCard });
  }

  /* ---------- Vista: Mapa ---------- */
  async function viewMap() {
    const my = token;
    view.innerHTML = '<section class="mapview"><div class="wrap"><div class="mapbar"><h2 style="font-size:2rem;margin-right:auto">Mapa de apologetas</h2><input type="search" id="mq" placeholder="Buscar por nombre, usuario o lugar" aria-label="Buscar en el mapa"></div>' +
      '<div class="mapbar" id="legend" role="group" aria-label="Filtrar por rango"></div><div class="mapstage"><div class="globe" id="globe"></div><div class="streets hide" id="streets"></div>' +
      '<div class="floatbtn" style="display:flex;gap:.5rem;flex-wrap:wrap"><button class="btn btn-gold btn-sm" id="b-streets">Ver mapa de calles</button><button class="btn btn-light btn-sm hide" id="b-home">Volver al globo</button></div></div>' +
      '<p class="small" style="color:#9fb0d0;padding:1rem 0 2rem">Arrastra para girar, rueda o pellizca para acercar, toca un país para verlo completo y toca un punto para ver al apologeta. Las posiciones son aproximadas (±1 km).</p></div></section>';
    await loadProfiles(); if (my !== token) return; let streets = false; const on = new Set(CAI.RANKS.map((r) => r.id).concat('voluntaria')); let q = '';
    if (!profiles.length) $('.mapbar').insertAdjacentHTML('afterend', '<p class="small" style="color:#c9d2e6;margin:0 0 .8rem">Todavía no hay apologetas registrados. Cuando te registres, tu punto aparecerá aquí.</p>');
    const all = withCoords(profiles); const members = new Set(profiles.map((p) => p.country_code));
    const filtered = () => all.filter((p) => on.has(p.rank) && (!q || (p.full_name + ' ' + p.username + ' ' + U.place(p)).toLowerCase().includes(q)));
    const legend = () => { $('#legend').innerHTML = CAI.RANKS.concat([CAI.RANK_CARIDAD]).map((r) => '<button class="chipf' + (on.has(r.id) ? '' : ' off') + '" data-r="' + r.id + '"><i style="background:' + r.color + '"></i>' + esc(r.name) + ' (' + all.filter((p) => p.rank === r.id).length + ')</button>').join(''); };
    const refresh = () => { legend(); if (streets) openStreets(); else CAI.Globe.setPoints(filtered()); };
    const openStreets = () => { const l = filtered(); const me = Store.me && l.find((p) => p.id === Store.me.id); CAI.Streets.open($('#streets'), l, me ? [me.lat, me.lng] : null, U.openProfileCard); };
    CAI.Globe.init($('#globe'), { list: filtered(), members, interactive: true, onPoint: U.openProfileCard, onZoom: (z) => $('#b-home').classList.toggle('hide', !z) });
    legend();
    $('#legend').onclick = (e) => { const b = e.target.closest('[data-r]'); if (!b) return; on.has(b.dataset.r) ? on.delete(b.dataset.r) : on.add(b.dataset.r); refresh(); };
    $('#mq').oninput = (e) => { q = e.target.value.trim().toLowerCase(); refresh(); };
    $('#b-home').onclick = () => CAI.Globe.home();
    $('#b-streets').onclick = () => {
      streets = !streets; $('#streets').classList.toggle('hide', !streets); $('#b-streets').textContent = streets ? 'Ver globo' : 'Ver mapa de calles';
      if (streets) openStreets().catch(() => U.toast('No se pudo cargar el mapa de calles')); else CAI.Streets.close();
    };
  }

  /* ---------- Vista: Comunidad (feed) ---------- */
  const ytId = (u) => { const m = String(u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : ''; };
  const STATUS = { pendiente: ['wait', 'En revisión'], revisada: ['wait', 'Revisada'], aprobada: ['ok', 'Validada'], rechazada: ['no', 'No validada'] };
  function postHtml(p) {
    const a = p.author || {}; const m = CAI.MISSIONS[p.type] || { name: p.type }; const st = STATUS[p.status] || STATUS.pendiente; const img = safeUrl(p.media_url); const yt = ytId(p.video_url);
    const total = p.counts.like + p.counts.amen + p.counts.wow;
    return '<article class="card post" data-id="' + esc(p.id) + '"><div class="head">' + U.avatar(a) + '<div><b data-u="' + esc(a.id) + '">' + esc(a.full_name) + '</b><span class="small muted">@' + esc(a.username) + ' · ' + U.ago(p.created_at) + (p.place ? ' · ' + esc(p.place) : '') + '</span></div>' +
      '<div class="m"><span class="pill">' + esc(m.name) + '</span> <span class="pill ' + st[0] + '">' + st[1] + '</span></div></div><div class="body">' + esc(p.body) + '</div>' +
      (img ? '<div class="media"><img src="' + esc(img) + '" alt="Evidencia de la misión" loading="lazy"></div>' : '') +
      (yt ? '<div class="media"><iframe src="https://www.youtube-nocookie.com/embed/' + yt + '" title="Video de la misión" allowfullscreen loading="lazy"></iframe></div>' : '') +
      '<div class="counts"><span class="reacts">' + Object.keys(CAI.REACTIONS).filter((k) => p.counts[k]).map((k) => CAI.icon(CAI.REACTIONS[k].icon, 16)).join('') + '</span><span>' + (total ? total + ' reacciones' : '') + '</span><span style="margin-left:auto">' + (p.ncomments ? p.ncomments + ' comentarios' : '') + '</span></div>' +
      '<div class="bar">' + Object.keys(CAI.REACTIONS).map((k) => '<button data-act="react" data-k="' + k + '" class="' + (p.mine === k ? 'on' : '') + '" aria-pressed="' + (p.mine === k) + '">' + CAI.icon(CAI.REACTIONS[k].icon, 17) + CAI.REACTIONS[k].label + '</button>').join('') +
      '<button data-act="cmt">' + CAI.icon('chat', 17) + 'Comentar</button><button data-act="share">' + CAI.icon('share', 17) + 'Compartir</button>' + (Store.me && Store.me.id === a.id ? '<button data-act="del">' + CAI.icon('trash', 17) + 'Borrar</button>' : '') + '</div><div class="cmts hide"></div></article>';
  }
  U.postHtml = postHtml;
  function bindPosts(root, reload) {
    root.onclick = async (e) => {
      const u = e.target.closest('[data-u]'); if (u) { location.hash = '#/perfil/' + u.dataset.u; return; }
      const b = e.target.closest('[data-act]'); if (!b) return; const art = b.closest('.post'); const id = art.dataset.id;
      if (b.dataset.act === 'react') { if (!U.requireLogin('Inicia sesión para reaccionar')) return; await Store.react(id, b.dataset.k); reload(); }
      if (b.dataset.act === 'share') {
        const url = location.origin + location.pathname + '#/comunidad'; const text = $('.body', art).textContent.slice(0, 120);
        if (navigator.share) navigator.share({ title: 'Cruzada Apologética Itinerante', text, url }).catch(() => {}); else { try { await navigator.clipboard.writeText(url); U.toast('Enlace copiado'); } catch (er) { U.toast(url); } }
      }
      if (b.dataset.act === 'del' && confirm('¿Borrar esta publicación?')) { await Store.deletePost(id); reload(); }
      if (b.dataset.act === 'cmt') {
        const box = $('.cmts', art); box.classList.toggle('hide'); if (box.classList.contains('hide')) return;
        const draw = async () => {
          const cs = await Store.comments(id);
          box.innerHTML = cs.map((c) => '<div class="cmt">' + U.avatar(c.author, 'sm') + '<div class="b"><b>' + esc((c.author || {}).full_name) + '</b>' + esc(c.body) + '</div></div>').join('') +
            '<form class="cmt-form"><input placeholder="Escribe un comentario" maxlength="1000" required aria-label="Comentario"><button class="btn btn-red btn-sm">Enviar</button></form>';
          $('form', box).onsubmit = async (ev) => { ev.preventDefault(); if (!U.requireLogin('Inicia sesión para comentar')) return; const i = $('input', box); const t = i.value.trim(); if (!t) return; await Store.addComment(id, t); await draw(); };
        }; draw();
      }
    };
  }
  async function viewCommunity() {
    const me = Store.me; let filter = 'todas'; const types = me && me.section === 'caridad' ? ['caridad', 'testimonio'] : ['base', 'reto', 'debate', 'especial', 'testimonio'];
    view.innerHTML = '<div class="wrap page"><div class="page-head"><h2>Comunidad</h2><p class="muted">Comparte tus misiones y evidencias, apoya a tus hermanos y mantente en contacto.</p></div><div class="cols">' +
      '<aside class="side"><div class="card"><b>Filtrar</b><div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.7rem" id="flt"></div></div></aside><div><div id="comp"></div><div id="feed"></div></div>' +
      '<aside class="side"><div class="card"><b>Ranking de apologetas</b><div id="top" style="margin-top:.5rem"></div></div></aside></div></div>';
    $('#comp').innerHTML = me ? '<form class="card composer" id="f-post"><textarea name="body" maxlength="3000" placeholder="Cuenta tu misión, comparte un testimonio o sube una evidencia…" required aria-label="Nueva publicación"></textarea>' +
      '<div class="tools"><select name="type" aria-label="Tipo de publicación">' + types.map((t) => '<option value="' + t + '">' + CAI.MISSIONS[t].name + (CAI.MISSIONS[t].pts ? ' (+' + CAI.MISSIONS[t].pts + ' pts)' : '') + '</option>').join('') + '</select><input name="place" placeholder="Lugar de la misión" maxlength="120"></div>' +
      '<div class="tools"><label class="btn btn-ghost btn-sm" style="margin:0">' + CAI.icon('camera', 17) + ' Foto<input type="file" name="photo" accept="image/*" class="sr"></label><input name="video" placeholder="Enlace de YouTube (opcional)"><button type="button" class="btn btn-ghost btn-sm" disabled title="Próximamente">' + CAI.icon('video', 17) + ' Subir video (pronto)</button><button class="btn btn-red btn-sm" style="margin-left:auto">Publicar</button></div><div class="small muted" id="pname"></div><div class="err" id="e"></div></form>'
      : '<div class="card"><b>Únete para publicar</b><p class="muted small" style="margin:.6rem 0 .8rem">Regístrate para compartir tus misiones, reaccionar y comentar.</p><a class="btn btn-red btn-sm" href="login#registro">Crear mi cuenta</a> <a class="btn btn-ghost btn-sm" href="login">Entrar</a></div>';
    const draw = async () => {
      const posts = (await Store.posts()).filter((p) => filter === 'todas' || p.type === filter); const y = scrollY;
      $('#feed').innerHTML = posts.length ? posts.map(postHtml).join('') : '<div class="card empty">Aún no hay publicaciones. ¡Sé el primero en compartir una misión!</div>'; scrollTo(0, y);
    };
    $('#flt').innerHTML = ['todas'].concat(Object.keys(CAI.MISSIONS)).map((t) => '<button class="btn btn-ghost btn-sm" data-t="' + t + '">' + (t === 'todas' ? 'Todas' : CAI.MISSIONS[t].name) + '</button>').join('');
    $('#flt').onclick = (e) => { const b = e.target.closest('[data-t]'); if (!b) return; filter = b.dataset.t; draw(); };
    bindPosts($('#feed'), draw);
    const f = $('#f-post');
    if (f) {
      f.photo.onchange = () => { $('#pname').textContent = f.photo.files[0] ? 'Foto: ' + f.photo.files[0].name : ''; };
      f.onsubmit = async (e) => {
        e.preventDefault(); const err = $('#e'); err.textContent = ''; const b = $('.btn-red', f); b.disabled = true;
        try {
          let media = null; if (f.photo.files[0]) media = await Store.upload(await U.resize(f.photo.files[0], 1280, 0.8), 'evidence');
          const vid = f.video.value.trim(); if (vid && !ytId(vid)) throw new Error('El enlace debe ser de YouTube.');
          await Store.createPost({ type: f.type.value, body: f.body.value.trim(), place: f.place.value.trim(), media_url: media, video_url: vid || null });
          f.reset(); $('#pname').textContent = ''; U.toast('Publicado. Un moderador la revisará para validar tus puntos.'); draw();
        } catch (er) { err.textContent = er.message; } b.disabled = false;
      };
    }
    await loadProfiles(); draw();
    $('#top').innerHTML = profiles.filter((p) => p.section === 'apologeta').sort((a, b) => b.points - a.points).slice(0, 8).map((p, i) => '<div class="list-item" data-u="' + esc(p.id) + '"><b style="width:1.2rem">' + (i + 1) + '</b>' + U.avatar(p, 'sm') + '<div><b>' + esc(p.full_name) + '</b><span class="small muted">' + p.points + ' pts</span></div></div>').join('');
    $('#top').onclick = (e) => { const r = e.target.closest('[data-u]'); if (r) location.hash = '#/perfil/' + r.dataset.u; };
  }

  /* ---------- Vista: Rangos ---------- */
  function viewRanks() {
    view.innerHTML = '<div class="wrap page"><div class="page-head" style="display:flex;align-items:flex-end;justify-content:space-between;gap:1rem"><div><h2>Rangos y misiones</h2><p class="muted" style="max-width:40rem">Tu rango sube con las misiones que realizas. Cada rango tiene un color y es el color de tu punto en el mapa.</p></div><img class="hide-sm" src="assets/img/papa-mitra.webp" alt="" style="height:210px;width:auto" loading="lazy"></div>' +
      '<div class="card"><table class="t"><thead><tr><th>Rango</th><th>Puntos necesarios</th></tr></thead><tbody>' + CAI.RANKS.map((r) => '<tr><td>' + U.rank(r.id) + '</td><td>' + r.min + '</td></tr>').join('') + '<tr><td>' + U.rank('voluntaria') + '</td><td>Sección de caridad (mujeres)</td></tr></tbody></table></div>' +
      '<h3 style="margin:2.2rem 0 1rem">Tipos de misión</h3><div class="mgrid">' + Object.keys(CAI.MISSIONS).filter((k) => k !== 'testimonio').map((k) => '<div class="mission"><h3>' + CAI.MISSIONS[k].name + ' (+' + CAI.MISSIONS[k].pts + ' puntos)</h3><p>' + CAI.MISSIONS[k].desc + '</p></div>').join('') + '</div>' +
      '<h3 style="margin:2.2rem 0 1rem">Frecuencia de misiones</h3><div class="mgrid"><div class="mission"><h3>Cada mes</h3><p>Una misión para quienes están cerca, en una misma ciudad.</p></div><div class="mission"><h3>Cada 3 meses</h3><p>Para quienes están en el mismo estado o departamento.</p></div><div class="mission"><h3>Al menos una vez al año</h3><p>Para quienes se organizan a nivel nacional.</p></div></div>' +
      '<h3 style="margin:2.2rem 0 .6rem">Cómo se validan tus puntos</h3><p class="muted" style="max-width:40rem">Subes la evidencia (fotos o video). Un moderador la marca como revisada y el administrador la aprueba. Solo entonces se suman los puntos y, si corresponde, subes de rango.</p></div>';
  }

  /* ---------- Vista: Perfil ---------- */
  async function viewProfile(arg) {
    if (arg === 'me') { if (!Store.me) { location.href = U.loginUrl(); return; } arg = Store.me.id; }
    await loadProfiles(); const p = byId(arg) || (await Store.profile(arg));
    if (!p) { view.innerHTML = '<div class="wrap page"><div class="card empty">No encontramos a esta persona.</div></div>'; return; }
    const mine = Store.me && Store.me.id === p.id; const me = mine ? Store.me : null; const nx = p.section === 'apologeta' ? CAI.nextRank(p.points) : null; const cur = CAI.rankById(p.rank);
    const pct = nx ? Math.min(100, Math.round(((p.points - cur.min) / (nx.min - cur.min)) * 100)) : 100;
    const all = (await Store.posts()).filter((x) => x.user_id === p.id || (x.author && x.author.id === p.id));
    view.innerHTML = '<div class="wrap page" style="max-width:860px"><div class="card" style="padding:0"><div class="cover"><img src="assets/img/logo-cai.png" alt=""></div><div class="pro"><div class="av">' + U.avatar(p, 'lg') + '<div style="padding-bottom:.4rem"><h2 style="font-size:2rem">' + esc(p.full_name) + '</h2><div class="muted">@' + esc(p.username) + '</div></div>' +
      '<div class="acts">' + (mine ? '<button class="btn btn-ghost btn-sm" id="edit">Editar perfil</button>' : '<button class="btn btn-red btn-sm" id="dm">Enviar mensaje</button>') + '</div></div>' +
      '<div style="margin:1rem 0 .3rem">' + U.rank(p.rank) + (p.role !== 'miembro' ? ' <span class="pill">' + (p.role === 'admin' ? 'Administrador' : 'Moderador') + '</span>' : '') + '</div>' +
      (p.section === 'apologeta' ? '<div class="small muted">' + p.points + ' puntos' + (nx ? ', faltan ' + (nx.min - p.points) + ' para ' + nx.name : ', rango máximo') + '</div><div class="bar-xp"><i style="width:' + pct + '%"></i></div>' : '') +
      '<div class="kv"><div><span>Ubicación</span>' + esc(U.place(p) || 'Sin datos') + '</div><div><span>Sección</span>' + (p.section === 'caridad' ? 'Caridad y apoyo' : 'Apologeta') + '</div>' +
      (p.age ? '<div><span>Edad</span>' + p.age + ' años</div>' : '') + '<div><span>Misiones validadas</span>' + all.filter((x) => x.status === 'aprobada').length + '</div>' +
      (me ? '<div><span>Correo (solo tú lo ves)</span>' + esc(me.private.email || '') + '</div><div><span>Teléfono (solo tú lo ves)</span>' + esc(me.private.phone || '') + '</div>' : '') + '</div>' +
      (p.bio ? '<p style="margin-top:1rem">' + esc(p.bio) + '</p>' : '') + '<div style="margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap">' + socialsHtml(p.socials) + '</div></div></div>' +
      '<h3 style="margin:2rem 0 1rem">Misiones y publicaciones</h3><div id="pf">' + (all.length ? all.map(postHtml).join('') : '<div class="card empty">Todavía no hay publicaciones.</div>') + '</div></div>';
    const reload = () => viewProfile(arg); bindPosts($('#pf'), reload);
    const dm = $('#dm'); if (dm) dm.onclick = () => { if (U.requireLogin('Inicia sesión para enviar mensajes')) CAI.chat.open(p.id); };
    const ed = $('#edit'); if (ed) ed.onclick = () => editProfile(p, reload);
  }
  function editProfile(p, done) {
    const s = p.socials || {};
    U.modal('<h3>Editar perfil</h3><form id="f-ed"><label class="f">Nombre completo<input name="full_name" value="' + esc(p.full_name) + '" required></label><label class="f">Presentación<textarea name="bio" maxlength="300">' + esc(p.bio) + '</textarea></label>' +
      '<label class="f">Foto de perfil<input type="file" name="avatar" accept="image/*"></label><label class="f">Teléfono (privado)<input name="phone" value="' + esc((Store.me.private || {}).phone) + '"></label>' +
      '<div class="row2">' + Object.keys(SOC).map((k) => '<label class="f">' + SOC[k][0] + '<input name="s_' + k + '" value="' + esc(s[k]) + '"></label>').join('') + '</div>' + locationBlock(p) + '<div class="err" id="e"></div><button class="btn btn-red" style="width:100%">Guardar cambios</button></form>', (v, close) => {
      const f = $('#f-ed', v); bindLocation(f);
      f.onsubmit = async (e) => {
        e.preventDefault(); const b = $('button.btn-red', f); b.disabled = true;
        try {
          const o = formObj(f); const c = CAI.country(o.country_code); const xy = await resolveCoords(o); const socials = {}; Object.keys(SOC).forEach((k) => { if (o['s_' + k]) socials[k] = o['s_' + k]; });
          const patch = { full_name: o.full_name, bio: o.bio, socials, country_code: o.country_code, country_name: c.n, region: o.region, province: o.province, district: o.district, town: o.town, lat: xy.lat, lng: xy.lng };
          if (f.avatar.files[0]) patch.avatar_url = await Store.upload(await U.resize(f.avatar.files[0], 400, 0.82), 'avatars');
          await Store.updateMe(patch, { phone: o.phone }); close(); renderAuth(); U.toast('Perfil actualizado'); done();
        } catch (er) { $('#e', v).textContent = er.message; b.disabled = false; }
      };
    });
  }

  /* ---------- Vista: Panel (moderador / administrador) ---------- */
  async function viewAdmin() {
    const me = Store.me;
    if (!me || (me.role !== 'admin' && me.role !== 'moderador')) { view.innerHTML = '<div class="wrap page"><div class="card empty">Esta sección es solo para moderadores y administradores.</div></div>'; return; }
    const isAdmin = me.role === 'admin'; let q = '';
    view.innerHTML = '<div class="wrap page"><div class="page-head"><h2>Panel de validación</h2>' + (Store.mode === 'local' ? '<p class="note">' + CAI.icon('lock', 15) + ' Datos guardados en este navegador (aún no hay base de datos conectada). La primera cuenta creada es la administradora.</p>' : '') + '<p class="muted">' + (isAdmin ? 'Como administrador apruebas evidencias, subes de rango y asignas roles.' : 'Como moderador marcas las evidencias como revisadas. El ascenso lo aprueba el administrador.') + '</p></div>' +
      '<h3 style="margin-bottom:1rem">Evidencias por validar</h3><div id="pend"></div><h3 style="margin:2.2rem 0 1rem">Miembros</h3><input type="search" id="aq" placeholder="Buscar miembro" aria-label="Buscar miembro"><div class="card" style="margin-top:1rem;overflow:auto"><table class="t"><thead><tr><th>Miembro</th><th>Rango</th><th>Puntos</th><th>Rol</th></tr></thead><tbody id="mem"></tbody></table></div></div>';
    const drawPend = async () => {
      const l = (await Store.posts()).filter((p) => p.status === 'pendiente' || p.status === 'revisada');
      $('#pend').innerHTML = l.length ? l.map((p) => '<div data-p="' + esc(p.id) + '">' + postHtml(p).replace(/<div class="bar">[\s\S]*?<\/div><div class="cmts hide">/, '<div class="bar" style="gap:.5rem">' +
        (p.status === 'pendiente' ? '<button class="btn btn-ghost btn-sm" data-s="revisada">Marcar revisada</button>' : '') + (isAdmin ? '<button class="btn btn-red btn-sm" data-s="aprobada">Aprobar (+' + ((CAI.MISSIONS[p.type] || {}).pts || 0) + ' pts)</button><button class="btn btn-ghost btn-sm" data-s="rechazada">Rechazar</button>' : '') + '</div><div class="cmts hide">') + '</div>').join('') : '<div class="card empty">No hay evidencias pendientes.</div>';
    };
    $('#pend').onclick = async (e) => { const b = e.target.closest('[data-s]'); if (!b) return; const id = b.closest('[data-p]').dataset.p; try { await Store.review(id, b.dataset.s); U.toast('Listo'); drawPend(); drawMem(); } catch (er) { U.toast(er.message); } };
    const drawMem = async () => {
      await loadProfiles(); const l = profiles.filter((p) => !q || (p.full_name + p.username).toLowerCase().includes(q)).slice(0, 100);
      $('#mem').innerHTML = l.map((p) => '<tr><td><a href="#/perfil/' + esc(p.id) + '">' + esc(p.full_name) + '</a><div class="small muted">@' + esc(p.username) + '</div></td><td>' + U.rank(p.rank) + '</td><td>' + p.points + '</td><td>' +
        (isAdmin ? '<select data-id="' + esc(p.id) + '" aria-label="Rol de ' + esc(p.full_name) + '">' + ['miembro', 'moderador', 'admin'].map((r) => '<option' + (p.role === r ? ' selected' : '') + '>' + r + '</option>').join('') + '</select>' : esc(p.role)) + '</td></tr>').join('');
    };
    $('#mem').onchange = async (e) => { const s = e.target.closest('select[data-id]'); if (!s) return; try { await Store.setRole(s.dataset.id, s.value); U.toast('Rol actualizado'); } catch (er) { U.toast(er.message); } };
    $('#aq').oninput = (e) => { q = e.target.value.trim().toLowerCase(); drawMem(); };
    drawPend(); drawMem();
  }

  /* ---------- Vista: Recursos de apologética ---------- */
  function viewResources(topic) {
    view.innerHTML = '<div class="wrap page" style="max-width:980px"><div class="page-head"><p class="eyebrow">Para estudiar y responder</p><h2>Recursos de apologética</h2><p class="muted" style="max-width:42rem;margin-top:.8rem">Fichas breves para empezar. Cada una remite a la Biblia y al Catecismo de la Iglesia Católica: léelas ahí antes de salir a misión. La formación base son los cursos del Padre Luis Toro.</p></div>' +
      CAI.TOPICS.map((t) => '<article class="topic' + (t.id === topic ? ' on' : '') + '" id="t-' + t.id + '"><h3>' + esc(t.t) + '</h3><div><p>' + esc(t.s) + '</p><p class="refs"><b>Biblia</b>' + esc(t.b) + '</p><p class="refs"><b>Catecismo</b><a href="' + CAI.CCC + '" target="_blank" rel="noopener noreferrer">' + esc(t.c) + '</a></p></div></article>').join('') +
      '<div class="linkrow"><a class="btn btn-ghost" href="' + CAI.CCC + '" target="_blank" rel="noopener noreferrer">Catecismo completo ' + CAI.icon('external', 16) + '</a><a class="btn btn-ghost" href="https://www.vatican.va/content/vatican/es.html" target="_blank" rel="noopener noreferrer">La Santa Sede ' + CAI.icon('external', 16) + '</a></div></div>';
    const el = topic && $('#t-' + topic); if (el) { el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -86); } 
  }

  /* ---------- Vista: Privacidad ---------- */
  function viewPrivacy() {
    const li = (t, d) => '<div class="mission"><h3>' + t + '</h3><p>' + d + '</p></div>';
    view.innerHTML = '<div class="wrap page" style="max-width:860px"><div class="page-head"><p class="eyebrow">Tus datos</p><h2>Privacidad</h2><p class="muted" style="margin-top:.8rem">Pedimos lo mínimo para organizar la cruzada y cuidarte.</p></div><div class="mgrid" style="grid-template-columns:1fr">' +
      li('Lo que se ve en el mapa', 'Tu nombre, rango y una ubicación aproximada de unos 1000 metros. Nunca tu dirección exacta.') +
      li('Lo que es privado', 'Tu correo y tu teléfono solo los ven tú y el administrador. Tu contraseña se guarda cifrada y nadie puede leerla.') +
      li('Edad mínima', 'Para registrarse se requiere ser mayor de 18 años.') +
      li('Tus publicaciones', 'Las evidencias las revisa el equipo de moderación antes de validar puntos. Puedes borrar lo que publicaste.') +
      li('Redes sociales', 'Solo se muestran las que tú decidas poner en tu perfil.') + '</div></div>';
  }

  /* ---------- Vista oculta: sobre el desarrollo ---------- */
  function viewDev() {
    const ext = (u, t) => '<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href="' + u + '">' + t + ' ' + CAI.icon('external', 14) + '</a>';
    view.innerHTML = '<div class="wrap page"><div class="devcard"><div><div class="mono" aria-hidden="true">EM</div><p class="eyebrow">Detrás de la plataforma</p><h2>Un servidor más de la obra</h2>' +
      '<p style="margin-top:1.2rem;max-width:36rem">Esta plataforma la construye <b>Enrique Meza</b> (Tauro Modder), estudiante de Ingeniería de Sistemas de Información en la UPC, como servicio voluntario a la Cruzada Apologética Itinerante. La idea y el impulso de la cruzada son de Soldado Apologeta; aquí solo se pone la técnica para que se haga realidad.</p>' +
      '<blockquote style="margin:1.4rem 0;font:italic 500 1.5rem var(--serif);border-left:2px solid var(--gold);padding-left:1rem">«Si puedo imaginarlo, puedo programarlo.»</blockquote>' +
      '<div class="linkrow">' + ext('https://eltauromods.gt.tc/biografia?i=1', 'Biografía completa') + ext('https://eltauromods.gt.tc/', 'El Tauro Mods') + ext('https://www.instagram.com/eltauromods_official', 'Instagram') + ext('https://www.youtube.com/@eltauromods', 'YouTube') + '<a class="btn btn-ghost btn-sm" href="mailto:' + esc((window.CAI_CONFIG || {}).DEV_EMAIL || '') + '">' + CAI.icon('mail', 14) + ' Escribir</a></div></div>' +
      '<div class="card"><b>Cómo está hecha</b><div class="kv" style="grid-template-columns:1fr"><div><span>Interfaz</span>HTML, CSS y JavaScript puros, sin frameworks</div><div><span>Mapa</span>Globo con amCharts 5 y calles con OpenStreetMap</div><div><span>Datos</span>Almacenamiento local o Supabase (listo para conectar)</div><div><span>Asistente</span>Tyrone AI, con su motor en PHP</div></div></div></div></div>';
  }

  /* ---------- router ---------- */
  async function route() {
    token++; CAI.Globe.destroy(); CAI.Streets.close(); $('#nav').classList.remove('open');
    const parts = location.hash.replace(/^#\/?/, '').split('/'); const name = parts[0] || 'home';
    $$('#nav a.l').forEach((a) => a.classList.toggle('on', a.dataset.r === name));
    const routes = { home: viewHome, mapa: viewMap, comunidad: viewCommunity, rangos: viewRanks, perfil: () => viewProfile(parts[1]), admin: viewAdmin, recursos: () => viewResources(parts[1]), privacidad: viewPrivacy, dev: viewDev };
    try { await (routes[name] || viewHome)(); } catch (e) { console.error(e); view.innerHTML = '<div class="wrap page"><div class="card empty">Algo salió mal al cargar esta sección. Recarga la página e inténtalo de nuevo.</div></div>'; }
    CAI.hydrateIcons(); if (!(name === 'recursos' && parts[1])) scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  (async function start() {
    CAI.hydrateIcons(); footerConfig();
    try { await Store.init(); } catch (e) { console.error(e); U.toast('No se pudo conectar con la base de datos'); }
    Store.on('recovery', () => { location.href = U.loginUrl('#nueva'); });
    renderAuth(); route();
  })();
})();
