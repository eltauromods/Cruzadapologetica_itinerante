/* Iconos SVG propios (trazo uniforme, sin emojis). Uso: CAI.icon('chat', 20) o <button data-icon="chat"> */
window.CAI = window.CAI || {};
(function () {
  const P = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.4-4.6A8.5 8.5 0 1 1 21 11.5z"/>',
    send: '<path d="M21.5 2.5L10.5 13.5"/><path d="M21.5 2.5l-6.7 19-4.3-8-8-4.3 19-6.7z"/>',
    pin: '<path d="M12 21.5s-7-6-7-11.3a7 7 0 0 1 14 0c0 5.300-7 11.300-7 11.300z"/><circle cx="12" cy="10" r="2.5"/>',
    camera: '<path d="M3.5 8.5h3.2L8.300 6h7.400l1.600 2.500h3.200a1 1 0 0 1 1 1v9.500a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1V9.500a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.500" r="3.500"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10.500l5-3v9l-5-3"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1"/><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/>',
    share: '<circle cx="18" cy="5.500" r="2.500"/><circle cx="6" cy="12" r="2.500"/><circle cx="18" cy="18.500" r="2.500"/><path d="M8.200 10.800l7.600-4.100M8.200 13.200l7.600 4.100"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    thumb: '<path d="M7 11v9H3.500v-9H7z"/><path d="M7 11l3.800-7a2 2 0 0 1 3.700 1.700L13.700 9H19a2 2 0 0 1 2 2.300l-1.200 7A2 2 0 0 1 17.800 20H7"/>',
    cross: '<path d="M12 3v18M6.500 9h11"/>',
    star: '<path d="M12 3l2.600 5.600 6.100.7-4.500 4.200 1.200 6L12 16.600 6.600 19.500l1.200-6L3.300 9.300l6.100-.7L12 3z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pencil: '<path d="M4 20l1-4L16.500 4.500a2.100 2.100 0 0 1 3 3L8 19l-4 1z"/><path d="M14.500 6.500l3 3"/>',
    bookmark: '<path d="M7 4h10v17l-5-4-5 4V4z"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    down: '<path d="M5 9l7 7 7-7"/>',
    arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.500-3.500"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.500 8-8 9.500C7.500 20 4 17 4 12V6l8-3z"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    eye: '<path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.600 5.100A9.800 9.800 0 0 1 12 5c6.500 0 10 7 10 7a17 17 0 0 1-3.200 4M6.500 6.500A16.500 16.500 0 0 0 2 12s3.500 7 10 7a9.800 9.800 0 0 0 4-.9M9.900 9.900a3 3 0 0 0 4.200 4.200"/>',
    code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    check: '<path d="M5 12.500l4.500 4.500L19 7"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    logout: '<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.500 2.500 3.500 5.500 3.500 9s-1 6.500-3.500 9c-2.500-2.500-3.500-5.500-3.500-9s1-6.500 3.500-9z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.500" cy="6.500" r=".8"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9l5 3-5 3z"/>',
    x_social: '<path d="M4 4l16 16M20 4L4 20"/>',
    tiktok: '<path d="M14 3v11.500a3.500 3.500 0 1 1-3.500-3.500"/><path d="M14 3c.3 2.600 2 4.400 5 4.600"/>',
    whatsapp: '<path d="M3 21l1.600-4.800A8.500 8.500 0 1 1 8 19.600L3 21z"/><path d="M9 9.500c0 3 2.500 5.500 5.500 5.500l1-1.500-2-1-1 .8a4 4 0 0 1-1.800-1.800l.8-1-1-2L9 9.500z"/>',
    telegram: '<path d="M21 3L2.500 10.500l6 2.200L10 19l3-3.600 4.500 3.300L21 3z"/><path d="M8.500 12.700L21 3"/>'
  };
  CAI.icon = (n, s) => '<svg class="ic" width="' + (s || 20) + '" height="' + (s || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (P[n] || '') + '</svg>';
  /* Rellena los elementos con data-icon="nombre" (opcional data-size) */
  CAI.hydrateIcons = (root) => (root || document).querySelectorAll('[data-icon]:not([data-ok])').forEach((el) => {
    el.insertAdjacentHTML('afterbegin', CAI.icon(el.dataset.icon, +el.dataset.size || 20)); el.dataset.ok = '1';
  });
})();
