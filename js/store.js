/* Capa de datos única para toda la web.
   - Con SUPABASE_URL y ANON_KEY en js/config.js usa Supabase (base de datos real, auth, storage, realtime).
   - Sin ellos detecta que no hay backend y guarda todo localmente en el navegador (localStorage). */
(function () {
  const cfg = window.CAI_CONFIG || {};
  const live = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  const sb = live ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const handlers = {};
  const S = { mode: live ? 'supabase' : 'local', me: null };
  const emit = (ev, d) => (handlers[ev] || []).forEach((f) => f(d));
  S.on = (ev, f) => { (handlers[ev] = handlers[ev] || []).push(f); };

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now() + Math.random().toString(16).slice(2));
  S.sha256 = async (txt) => {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
    return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
  };
  const PUBLIC = 'id,username,full_name,age,bio,avatar_url,section,role,points,rank,country_code,country_name,region,province,district,town,lat,lng,socials,created_at';
  const AUTHOR = 'id,username,full_name,avatar_url,rank,section';

  /* ===================== MODO LOCAL (sin base de datos conectada) ===================== */
  /* Todo se guarda en este navegador. La primera cuenta creada queda como administrador para poder probar el panel. */
  const KEY = 'cai_local_v1';
  let db = null;
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { throw new Error('Se llenó el espacio de este navegador. Prueba con fotos más livianas.'); }
  };
  const emptyDb = () => ({ users: [], profiles: [], priv: {}, posts: [], reactions: [], comments: [], messages: [], session: null });
  function loadDb() {
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db) { db = emptyDb(); try { save(); } catch (e) {} }
  }
  const pwHash = (pw, user) => S.sha256(pw + ':' + String(user).toLowerCase());
  const D = {
    async init() { loadDb(); if (db.session) S.me = D.meFull(db.session); },
    meFull(id) { const p = db.profiles.find((x) => x.id === id); return p ? Object.assign({}, p, { private: db.priv[id] || {} }) : null; },
    async signUp(f) {
      if (db.users.some((u) => u.username === f.username || u.email === f.email) || db.profiles.some((p) => p.username === f.username)) throw new Error('Ese usuario o correo ya está registrado.');
      const id = uid(); const sec = f.profile.section; const first = db.profiles.length === 0;
      db.users.push({ id, email: f.email.toLowerCase(), username: f.username, pw: await pwHash(f.password, f.username) });
      db.profiles.push(Object.assign({ id, username: f.username, bio: '', avatar_url: f.avatar_url || null, role: first ? 'admin' : 'miembro', points: 0,
        rank: CAI.rankFor(0, sec), created_at: new Date().toISOString() }, f.profile));
      db.priv[id] = Object.assign({ email: f.email }, f.private);
      db.session = id; save(); S.me = D.meFull(id); return { needsConfirm: false };
    },
    async signIn(ident, pw) {
      const i = ident.trim().toLowerCase();
      const u = db.users.find((x) => x.username === i || x.email === i);
      if (!u || u.pw !== (await pwHash(pw, u.username))) throw new Error('Usuario o contraseña incorrectos.');
      db.session = u.id; save(); S.me = D.meFull(u.id);
    },
    async signOut() { db.session = null; save(); S.me = null; },
    async setPassword() { return true; },
    async resetPassword() { return true; },
    /* Recuperación local: pregunta y respuesta de seguridad (en la base real se usa el correo) */
    async securityQuestion(username) {
      const u = db.users.find((x) => x.username === String(username).trim().toLowerCase()); const pr = u && db.priv[u.id];
      if (!pr || !pr.security_question) throw new Error('No encontramos ese usuario.'); return pr.security_question;
    },
    async resetWithAnswer(username, answer, newPw) {
      const un = String(username).trim().toLowerCase(); const u = db.users.find((x) => x.username === un); const pr = u && db.priv[u.id];
      if (!pr || (await S.sha256(String(answer).trim().toLowerCase() + ':' + un)) !== pr.security_answer_hash) throw new Error('La respuesta no coincide.');
      u.pw = await pwHash(newPw, un); save();
    },
    async profiles() { return db.profiles.slice(); },
    async profile(id) { return db.profiles.find((p) => p.id === id) || null; },
    async updateMe(patch, priv) {
      const p = db.profiles.find((x) => x.id === S.me.id); Object.assign(p, patch);
      if (priv) db.priv[p.id] = Object.assign(db.priv[p.id] || {}, priv);
      save(); S.me = D.meFull(p.id);
    },
    async upload(blob) {
      return new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); });
    },
    async posts() {
      return db.posts.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)).map((po) => D.decorate(po));
    },
    decorate(po) {
      const a = db.profiles.find((p) => p.id === po.user_id) || {};
      const rs = db.reactions.filter((r) => r.post_id === po.id); const mine = S.me && rs.find((r) => r.user_id === S.me.id);
      return Object.assign({}, po, { author: { id: a.id, username: a.username, full_name: a.full_name, avatar_url: a.avatar_url, rank: a.rank, section: a.section },
        counts: { like: rs.filter((r) => r.kind === 'like').length, amen: rs.filter((r) => r.kind === 'amen').length, wow: rs.filter((r) => r.kind === 'wow').length },
        mine: mine ? mine.kind : null, ncomments: db.comments.filter((c) => c.post_id === po.id).length });
    },
    async createPost(f) {
      db.posts.push({ id: uid(), user_id: S.me.id, status: 'pendiente', created_at: new Date().toISOString(), media_url: null, video_url: null, place: '', ...f });
      try { save(); } catch (e) { db.posts.pop(); throw e; }
    },
    async deletePost(id) { db.posts = db.posts.filter((p) => p.id !== id); save(); },
    async react(pid, kind) {
      const i = db.reactions.findIndex((r) => r.post_id === pid && r.user_id === S.me.id);
      if (i >= 0 && db.reactions[i].kind === kind) db.reactions.splice(i, 1);
      else if (i >= 0) db.reactions[i].kind = kind; else db.reactions.push({ post_id: pid, user_id: S.me.id, kind });
      save();
    },
    async comments(pid) {
      return db.comments.filter((c) => c.post_id === pid).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((c) => {
        const a = db.profiles.find((p) => p.id === c.user_id) || {};
        return Object.assign({}, c, { author: { id: a.id, username: a.username, full_name: a.full_name, avatar_url: a.avatar_url, rank: a.rank } });
      });
    },
    async addComment(pid, body) { db.comments.push({ id: uid(), post_id: pid, user_id: S.me.id, body, created_at: new Date().toISOString() }); save(); },
    async review(pid, status) {
      const r = S.me.role; const po = db.posts.find((p) => p.id === pid);
      if (status === 'revisada' && (r === 'moderador' || r === 'admin')) po.status = 'revisada';
      else if (r === 'admin' && (status === 'aprobada' || status === 'rechazada')) {
        const was = po.status; po.status = status;
        if (status === 'aprobada' && was !== 'aprobada') {
          const u = db.profiles.find((p) => p.id === po.user_id); u.points += (CAI.MISSIONS[po.type] || {}).pts || 0; u.rank = CAI.rankFor(u.points, u.section);
        }
      } else throw new Error('Sin permisos');
      save();
    },
    async setRole(id, role) { db.profiles.find((p) => p.id === id).role = role; save(); },
    async allMessages() { return db.messages.filter((m) => m.from_id === S.me.id || m.to_id === S.me.id); },
    async send(to, body) {
      const m = { id: uid(), from_id: S.me.id, to_id: to, body, created_at: new Date().toISOString() };
      db.messages.push(m); save(); emit('msg', m); return m;
    }
  };

  /* ===================== SUPABASE ===================== */
  const msgChannel = { on: false };
  const R = {
    async init() {
      sb.auth.onAuthStateChange((ev) => { if (ev === 'PASSWORD_RECOVERY') emit('recovery'); });
      const { data } = await sb.auth.getSession();
      if (data.session) await R.loadMe(data.session.user.id);
    },
    async loadMe(id) {
      const { data: p } = await sb.from('profiles').select('*').eq('id', id).single();
      const { data: pr } = await sb.from('profiles_private').select('*').eq('id', id).single();
      S.me = p ? Object.assign({}, p, { private: pr || {} }) : null;
      if (S.me && !msgChannel.on) {
        msgChannel.on = true;
        sb.channel('cai-msgs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (pl) => emit('msg', pl.new)).subscribe();
      }
    },
    async signUp(f) {
      const meta = Object.assign({ username: f.username }, f.profile, f.private, { age: String(f.profile.age || ''), lat: f.profile.lat == null ? '' : String(f.profile.lat), lng: f.profile.lng == null ? '' : String(f.profile.lng) });
      const { data, error } = await sb.auth.signUp({ email: f.email, password: f.password, options: { data: meta } });
      if (error) throw new Error(error.message.includes('already') ? 'Ese correo ya está registrado.' : error.message);
      if (!data.session) return { needsConfirm: true };
      await R.loadMe(data.user.id);
      return { needsConfirm: false };
    },
    async signIn(ident, pw) {
      let email = ident.trim();
      if (!email.includes('@')) {
        const { data } = await sb.rpc('email_for_username', { u: email });
        if (!data) throw new Error('Usuario o contraseña incorrectos.');
        email = data;
      }
      const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
      if (error) throw new Error('Usuario o contraseña incorrectos.');
      await R.loadMe(data.user.id);
    },
    async signOut() { await sb.auth.signOut(); S.me = null; },
    async setPassword(pw) { const { error } = await sb.auth.updateUser({ password: pw }); if (error) throw new Error(error.message); },
    async resetPassword(email) {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
      if (error) throw new Error(error.message); return true;
    },
    async profiles() { const { data } = await sb.from('profiles').select(PUBLIC).limit(5000); return data || []; },
    async profile(id) { const { data } = await sb.from('profiles').select(PUBLIC).eq('id', id).single(); return data; },
    async updateMe(patch, priv) {
      const { error } = await sb.from('profiles').update(patch).eq('id', S.me.id); if (error) throw new Error(error.message);
      if (priv) await sb.from('profiles_private').update(priv).eq('id', S.me.id);
      await R.loadMe(S.me.id);
    },
    async upload(blob, bucket) {
      const path = S.me.id + '/' + Date.now() + '.jpg';
      const { error } = await sb.storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) throw new Error(error.message);
      return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    },
    async posts() {
      const { data } = await sb.from('posts').select('*, author:profiles!posts_user_id_fkey(' + AUTHOR + ')').order('created_at', { ascending: false }).limit(60);
      const list = data || []; const ids = list.map((p) => p.id); if (!ids.length) return [];
      const [{ data: rs }, { data: cs }] = await Promise.all([
        sb.from('reactions').select('post_id,user_id,kind').in('post_id', ids), sb.from('comments').select('post_id').in('post_id', ids)]);
      return list.map((po) => {
        const r = (rs || []).filter((x) => x.post_id === po.id); const mine = S.me && r.find((x) => x.user_id === S.me.id);
        return Object.assign(po, { counts: { like: r.filter((x) => x.kind === 'like').length, amen: r.filter((x) => x.kind === 'amen').length, wow: r.filter((x) => x.kind === 'wow').length },
          mine: mine ? mine.kind : null, ncomments: (cs || []).filter((c) => c.post_id === po.id).length });
      });
    },
    async createPost(f) {
      const { error } = await sb.from('posts').insert(Object.assign({ user_id: S.me.id }, f)); if (error) throw new Error(error.message);
    },
    async deletePost(id) { await sb.from('posts').delete().eq('id', id); },
    async react(pid, kind) {
      const { data } = await sb.from('reactions').select('kind').eq('post_id', pid).eq('user_id', S.me.id).maybeSingle();
      if (data && data.kind === kind) await sb.from('reactions').delete().eq('post_id', pid).eq('user_id', S.me.id);
      else await sb.from('reactions').upsert({ post_id: pid, user_id: S.me.id, kind });
    },
    async comments(pid) {
      const { data } = await sb.from('comments').select('*, author:profiles!comments_user_id_fkey(' + AUTHOR + ')').eq('post_id', pid).order('created_at'); return data || [];
    },
    async addComment(pid, body) { const { error } = await sb.from('comments').insert({ post_id: pid, user_id: S.me.id, body }); if (error) throw new Error(error.message); },
    async review(pid, status) { const { error } = await sb.rpc('review_post', { p_post: pid, p_status: status }); if (error) throw new Error(error.message); },
    async setRole(id, role) { const { error } = await sb.rpc('set_role', { p_user: id, p_role: role }); if (error) throw new Error(error.message); },
    async allMessages() {
      const { data } = await sb.from('messages').select('*').or('from_id.eq.' + S.me.id + ',to_id.eq.' + S.me.id).order('created_at').limit(500); return data || [];
    },
    async send(to, body) {
      const { data, error } = await sb.from('messages').insert({ from_id: S.me.id, to_id: to, body }).select().single();
      if (error) throw new Error(error.message); return data;
    }
  };

  const B = live ? R : D;
  ['securityQuestion', 'resetWithAnswer'].forEach((k) => { S[k] = B[k] || (async () => { throw new Error('No disponible'); }); });
  ['init', 'signUp', 'signIn', 'signOut', 'setPassword', 'resetPassword', 'profiles', 'profile', 'updateMe', 'upload', 'posts', 'createPost', 'deletePost',
    'react', 'comments', 'addComment', 'review', 'setRole', 'allMessages', 'send'].forEach((k) => { S[k] = B[k]; });
  window.Store = S;
})();
