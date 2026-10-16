/* Pantalla completa de acceso: entrar, crear cuenta (4 pasos), recuperar y nueva contraseña */
(function () {
  const U = CAI.app; const { $, $$, esc, formObj } = U; const box = $('#box');
  const HOME = './'; const MAP = './#/mapa';
  U.initTheme($('#theme')); CAI.hydrateIcons();

  const tabs = (on) => '<div class="auth-tabs"><a href="#entrar" class="' + (on === 'in' ? 'on' : '') + '">Entrar</a><a href="#registro" class="' + (on === 'up' ? 'on' : '') + '">Crear cuenta</a></div>';
  const pw = (name, label, auto, extra) => '<label class="f">' + label + (extra || '') + '<span class="pwbox"><input name="' + name + '" type="password" autocomplete="' + auto + '" required><button type="button" class="icon-btn" data-eye aria-label="Mostrar u ocultar contraseña">' + CAI.icon('eye', 18) + '</button></span></label>';
  const bindEyes = (root) => $$('[data-eye]', root).forEach((b) => { b.onclick = () => { const i = b.previousElementSibling; const show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.innerHTML = CAI.icon(show ? 'eyeoff' : 'eye', 18); }; });
  const busy = (b, on, txt) => { b.disabled = on; if (txt) b.textContent = txt; };

  /* ---------- Entrar ---------- */
  function viewLogin() {
    document.title = 'Entrar · Cruzada Apologética Itinerante';
    box.innerHTML = tabs('in') + '<h1>Paz y bien</h1><p class="sub">Entra con tu usuario o tu correo para ver tu perfil y tu punto en el mapa.</p>' +
      '<form id="f" novalidate><label class="f">Usuario o correo<input name="id" autocomplete="username" autocapitalize="none" required></label>' + pw('pw', 'Contraseña', 'current-password') +
      '<div class="err" id="e" role="alert"></div><button class="btn btn-red" style="width:100%">Entrar</button></form>' +
      '<div class="auth-links"><a href="#recuperar">Olvidé mi contraseña</a><a href="#registro">Crear cuenta</a></div>';
    bindEyes(box);
    $('#f').onsubmit = async (e) => {
      e.preventDefault(); const f = formObj(e.target); const b = $('button.btn', e.target); $('#e').textContent = '';
      if (!f.id || !f.pw) { $('#e').textContent = 'Escribe tu usuario y tu contraseña.'; return; }
      busy(b, true, 'Entrando…');
      try { await Store.signIn(f.id, f.pw); location.replace(MAP); } catch (er) { $('#e').textContent = er.message; busy(b, false, 'Entrar'); }
    };
  }

  /* ---------- Crear cuenta (4 pasos) ---------- */
  function viewRegister() {
    document.title = 'Crear cuenta · Cruzada Apologética Itinerante';
    let step = 1; const total = 4;
    box.innerHTML = tabs('up') + '<h1>Únete a la cruzada</h1><p class="sub">Cuatro pasos breves. Al terminar tu punto aparece en el mapa.</p><div class="progress">' + '<b></b>'.repeat(total) + '</div><form id="f" novalidate>' +
      '<section data-s="1"><label class="f">Nombre de usuario<span class="h">Letras minúsculas, números y guion bajo (3 a 20)</span><input name="username" autocomplete="username" autocapitalize="none" required></label>' +
      '<label class="f">Correo electrónico<input name="email" type="email" autocomplete="email" required></label>' +
      '<div class="row2">' + pw('password', 'Contraseña', 'new-password', '<span class="h">Mínimo 8 caracteres</span>') + pw('password2', 'Repite la contraseña', 'new-password') + '</div></section>' +
      '<section data-s="2" class="hide"><label class="f">Nombre completo<input name="full_name" autocomplete="name" required></label>' +
      '<div class="row2"><label class="f">Edad<span class="h">Debes ser mayor de 18 años</span><input name="age" type="number" min="18" max="120" inputmode="numeric" required></label><label class="f">Teléfono (privado)<input name="phone" type="tel" autocomplete="tel" required></label></div>' +
      '<label class="f">¿En qué sección participas?<select name="section"><option value="apologeta">Varón apologeta (campo de misión)</option><option value="caridad">Mujer en caridad y apoyo a la obra</option></select></label>' +
      '<label class="check" id="formacion"><input type="checkbox" name="formacion"> <span>Confirmo que completé la formación básica de los cursos del Padre Luis Toro.</span></label>' +
      '<p class="small muted" style="margin-bottom:.5rem">Redes sociales (opcionales, se muestran en tu perfil)</p><div class="row2"><label class="f">Instagram<input name="s_instagram" placeholder="@usuario"></label><label class="f">Facebook<input name="s_facebook" placeholder="usuario o enlace"></label><label class="f">TikTok<input name="s_tiktok" placeholder="@usuario"></label><label class="f">YouTube<input name="s_youtube" placeholder="@canal"></label></div></section>' +
      '<section data-s="3" class="hide">' + U.locationBlock({ country_code: 'PE' }) + '</section>' +
      '<section data-s="4" class="hide"><label class="f">Pregunta de recuperación<select name="security_question">' + CAI.SECURITY_QUESTIONS.map((q) => '<option>' + esc(q) + '</option>').join('') + '</select></label>' +
      '<label class="f">Tu respuesta<input name="security_answer" autocomplete="off" required></label><label class="f">Foto de perfil (opcional)<input name="avatar" type="file" accept="image/*"></label>' +
      '<label class="check"><input type="checkbox" name="terms"> <span>Acepto que mi nombre, rango y ubicación aproximada (±1 km) sean visibles en el mapa y que mis publicaciones sean revisadas por el equipo. <a href="./#/privacidad" target="_blank" rel="noopener">Ver privacidad</a>.</span></label></section>' +
      '<div class="err" id="e" role="alert"></div><div style="display:flex;gap:.6rem"><button type="button" class="btn btn-ghost" id="prev" style="flex:0 0 auto">Atrás</button><button class="btn btn-red" id="next" style="flex:1">Siguiente</button></div></form>' +
      '<div class="auth-links"><span class="muted">¿Ya tienes cuenta?</span><a href="#entrar">Entrar</a></div>';
    bindEyes(box); const form = $('#f'); const err = $('#e'); U.bindLocation(form);
    const show = () => {
      $$('section[data-s]', form).forEach((s) => s.classList.toggle('hide', +s.dataset.s !== step));
      $$('.progress b', box).forEach((b, i) => b.classList.toggle('on', i < step)); $('#prev').classList.toggle('hide', step === 1);
      $('#next').textContent = step === total ? 'Crear mi cuenta' : 'Siguiente'; err.textContent = ''; scrollTo(0, 0);
    };
    $('[name=section]', form).onchange = (e) => $('#formacion', form).classList.toggle('hide', e.target.value !== 'apologeta');
    $('[name=avatar]', form).onchange = (e) => { const f = e.target.files[0]; if (f && f.size > 15e6) { err.textContent = 'La foto es muy pesada (máx. 15 MB).'; e.target.value = ''; } };
    const check = () => {
      const f = formObj(form);
      if (step === 1) {
        if (!/^[a-z0-9_]{3,20}$/.test(f.username)) return 'El usuario debe tener 3 a 20 letras minúsculas, números o guion bajo.';
        if (!/^\S+@\S+\.\S+$/.test(f.email)) return 'Escribe un correo válido.';
        if ((f.password || '').length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
        if (f.password !== f.password2) return 'Las contraseñas no coinciden.';
      }
      if (step === 2) {
        if (!f.full_name || f.full_name.length < 3) return 'Escribe tu nombre completo.';
        if (!(+f.age >= 18)) return 'Debes ser mayor de 18 años para registrarte.';
        if (!f.phone || f.phone.replace(/\D/g, '').length < 6) return 'Escribe un teléfono válido.';
        if (f.section === 'apologeta' && !f.formacion) return 'Confirma que completaste la formación básica, o elige la sección de caridad.';
      }
      if (step === 3 && (!f.region || !f.province || !f.district || !f.town)) return 'Completa todos los datos de tu ubicación.';
      if (step === 4) { if (!f.security_answer || f.security_answer.length < 2) return 'Escribe la respuesta de tu pregunta de recuperación.'; if (!f.terms) return 'Debes aceptar las condiciones para continuar.'; }
      return '';
    };
    $('#prev').onclick = () => { step--; show(); };
    form.onsubmit = async (e) => {
      e.preventDefault(); const m = check(); if (m) { err.textContent = m; return; }
      if (step < total) { step++; show(); return; }
      const b = $('#next'); busy(b, true, 'Creando tu cuenta…');
      try {
        const f = formObj(form); const c = CAI.country(f.country_code); const xy = await U.resolveCoords(f);
        const socials = {}; Object.keys(U.SOC).forEach((k) => { if (f['s_' + k]) socials[k] = f['s_' + k]; });
        const hash = await Store.sha256(f.security_answer.toLowerCase() + ':' + f.username);
        const res = await Store.signUp({ email: f.email, password: f.password, username: f.username,
          profile: { full_name: f.full_name, age: +f.age, section: f.section, country_code: f.country_code, country_name: c.n, region: f.region, province: f.province, district: f.district, town: f.town, lat: xy.lat, lng: xy.lng, socials, bio: '' },
          private: { phone: f.phone, security_question: f.security_question, security_answer_hash: hash } });
        if (res.needsConfirm) {
          box.innerHTML = '<h1>Revisa tu correo</h1><p class="sub">Te enviamos un enlace para confirmar tu cuenta. Después de confirmar, entra con tu usuario y contraseña.</p><a class="btn btn-red" href="#entrar">Ir a entrar</a>'; return;
        }
        const file = form.avatar.files[0];
        if (file) { try { const url = await Store.upload(await U.resize(file, 400, 0.82), 'avatars'); await Store.updateMe({ avatar_url: url }); } catch (er) { /* la foto se puede subir luego desde el perfil */ } }
        location.replace(MAP);
      } catch (er) { err.textContent = er.message; busy(b, false, 'Crear mi cuenta'); }
    };
    show();
  }

  /* ---------- Recuperar contraseña ---------- */
  function viewForgot() {
    document.title = 'Recuperar contraseña · Cruzada Apologética Itinerante';
    if (Store.mode === 'supabase') {
      box.innerHTML = '<h1>Recuperar contraseña</h1><p class="sub">Escribe tu correo y te enviaremos un enlace para elegir una nueva contraseña.</p><form id="f"><label class="f">Correo<input name="email" type="email" autocomplete="email" required></label><div class="err" id="e" role="alert"></div><button class="btn btn-red" style="width:100%">Enviar enlace</button></form><div class="auth-links"><a href="#entrar">Volver a entrar</a></div>';
      $('#f').onsubmit = async (e) => { e.preventDefault(); try { await Store.resetPassword(formObj(e.target).email); box.innerHTML = '<h1>Revisa tu correo</h1><p class="sub">Si ese correo está registrado, te llegará el enlace en unos minutos.</p><a class="btn btn-red" href="#entrar">Volver a entrar</a>'; } catch (er) { $('#e').textContent = er.message; } };
      return;
    }
    box.innerHTML = '<h1>Recuperar contraseña</h1><p class="sub">Responde la pregunta de seguridad que elegiste al registrarte.</p><form id="f"><label class="f">Tu usuario<input name="u" autocapitalize="none" required></label><div id="q"></div><div class="err" id="e" role="alert"></div><button class="btn btn-red" style="width:100%">Continuar</button></form><div class="auth-links"><a href="#entrar">Volver a entrar</a></div>';
    let q = '';
    $('#f').onsubmit = async (e) => {
      e.preventDefault(); const f = formObj(e.target); const b = $('button.btn', e.target); $('#e').textContent = '';
      try {
        if (!q) { q = await Store.securityQuestion(f.u); $('[name=u]').readOnly = true; $('#q').innerHTML = '<p class="small muted" style="margin-bottom:.5rem">' + esc(q) + '</p><label class="f">Tu respuesta<input name="a" autocomplete="off" required></label>' + pw('np', 'Nueva contraseña', 'new-password', '<span class="h">Mínimo 8 caracteres</span>'); bindEyes(box); b.textContent = 'Cambiar contraseña'; return; }
        if ((f.np || '').length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
        busy(b, true); await Store.resetWithAnswer(f.u, f.a, f.np);
        box.innerHTML = '<h1>Contraseña actualizada</h1><p class="sub">Ya puedes entrar con tu nueva contraseña.</p><a class="btn btn-red" href="#entrar">Entrar</a>';
      } catch (er) { $('#e').textContent = er.message; busy(b, false); }
    };
  }

  /* ---------- Nueva contraseña (enlace del correo, solo con base de datos) ---------- */
  function viewNew() {
    box.innerHTML = '<h1>Nueva contraseña</h1><p class="sub">Elige una contraseña nueva para tu cuenta.</p><form id="f">' + pw('pw', 'Nueva contraseña', 'new-password', '<span class="h">Mínimo 8 caracteres</span>') + '<div class="err" id="e" role="alert"></div><button class="btn btn-red" style="width:100%">Guardar</button></form>';
    bindEyes(box);
    $('#f').onsubmit = async (e) => { e.preventDefault(); const f = formObj(e.target); if (f.pw.length < 8) { $('#e').textContent = 'Mínimo 8 caracteres.'; return; } try { await Store.setPassword(f.pw); location.replace(MAP); } catch (er) { $('#e').textContent = er.message; } };
  }

  const route = () => {
    const h = location.hash.replace('#', '');
    ({ registro: viewRegister, recuperar: viewForgot, nueva: viewNew }[h] || viewLogin)(); CAI.hydrateIcons(box);
  };
  window.addEventListener('hashchange', route);
  Store.on('recovery', () => { location.hash = '#nueva'; });
  (async () => {
    try { await Store.init(); } catch (e) { /* sin conexión con la base: se sigue en pantalla */ }
    if (Store.me && location.hash !== '#nueva') { location.replace(HOME); return; }
    route();
  })();
})();
