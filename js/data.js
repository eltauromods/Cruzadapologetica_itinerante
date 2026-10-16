/* Datos base de la plataforma: rangos, misiones, países y fichas de apologética. Edita aquí los puntos/colores/textos. */
window.CAI = window.CAI || {};

CAI.RANKS = [
  { id: 'cadete',     name: 'Cadete',     min: 0,    color: '#8FA3B8' },
  { id: 'soldado',    name: 'Soldado',    min: 30,   color: '#3FA364' },
  { id: 'cabo',       name: 'Cabo',       min: 80,   color: '#2F80ED' },
  { id: 'sargento',   name: 'Sargento',   min: 160,  color: '#9B51E0' },
  { id: 'teniente',   name: 'Teniente',   min: 300,  color: '#F2994A' },
  { id: 'capitan',    name: 'Capitán',    min: 500,  color: '#EB4D4D' },
  { id: 'comandante', name: 'Comandante', min: 800,  color: '#19B5B0' },
  { id: 'general',    name: 'General',    min: 1200, color: '#F2C94C' }
];
CAI.RANK_CARIDAD = { id: 'voluntaria', name: 'Voluntaria de caridad', min: 0, color: '#F06FA0' };

CAI.rankById = (id) => CAI.RANKS.find((r) => r.id === id) || (id === 'voluntaria' ? CAI.RANK_CARIDAD : CAI.RANKS[0]);
CAI.rankFor = (pts, section) => {
  if (section === 'caridad') return 'voluntaria';
  let r = CAI.RANKS[0];
  CAI.RANKS.forEach((x) => { if (pts >= x.min) r = x; });
  return r.id;
};
CAI.nextRank = (pts) => CAI.RANKS.find((r) => r.min > pts) || null;

CAI.MISSIONS = {
  base:       { name: 'Misión base',        pts: 10,  desc: 'Predicar el Evangelio en una población o comunidad.' },
  reto:       { name: 'Misión de reto',     pts: 25,  desc: 'Retar formalmente a un pastor protestante a un debate.' },
  debate:     { name: 'Debate en vivo',     pts: 50,  desc: 'Debatir cara a cara con uno o varios pastores, incluso en sus eventos o templos.' },
  especial:   { name: 'Misión especial',    pts: 100, desc: 'Nivel Negro: misiones extremas o internacionales, como rescates o las que promueve la Orden San Elías.' },
  caridad:    { name: 'Caridad y apoyo',    pts: 15,  desc: 'Obras de caridad y apoyo para integrar a más personas a la obra.' },
  testimonio: { name: 'Testimonio',         pts: 0,   desc: 'Comparte una experiencia o reflexión con la comunidad (no suma puntos).' }
};

/* Etiquetas de ubicación según el país: [nivel 1, nivel 2, nivel 3] */
CAI.COUNTRIES = [
  { c: 'PE', n: 'Perú',            lat: -9.2,  lng: -75.0, l: ['Región', 'Provincia', 'Distrito'] },
  { c: 'MX', n: 'México',          lat: 23.6,  lng: -102.5, l: ['Estado', 'Municipio', 'Colonia o localidad'] },
  { c: 'CO', n: 'Colombia',        lat: 4.6,   lng: -74.1, l: ['Departamento', 'Municipio', 'Barrio o vereda'] },
  { c: 'AR', n: 'Argentina',       lat: -34.6, lng: -64.0, l: ['Provincia', 'Departamento o partido', 'Localidad'] },
  { c: 'CL', n: 'Chile',           lat: -33.4, lng: -70.7, l: ['Región', 'Provincia', 'Comuna'] },
  { c: 'EC', n: 'Ecuador',         lat: -1.8,  lng: -78.2, l: ['Provincia', 'Cantón', 'Parroquia'] },
  { c: 'BO', n: 'Bolivia',         lat: -16.5, lng: -64.7, l: ['Departamento', 'Provincia', 'Municipio'] },
  { c: 'VE', n: 'Venezuela',       lat: 7.1,   lng: -66.2, l: ['Estado', 'Municipio', 'Parroquia'] },
  { c: 'PY', n: 'Paraguay',        lat: -23.4, lng: -58.4, l: ['Departamento', 'Distrito', 'Barrio o compañía'] },
  { c: 'UY', n: 'Uruguay',         lat: -32.8, lng: -56.0, l: ['Departamento', 'Localidad', 'Barrio'] },
  { c: 'BR', n: 'Brasil',          lat: -14.2, lng: -51.9, l: ['Estado', 'Municipio', 'Bairro'] },
  { c: 'GT', n: 'Guatemala',       lat: 15.5,  lng: -90.3, l: ['Departamento', 'Municipio', 'Aldea o zona'] },
  { c: 'SV', n: 'El Salvador',     lat: 13.8,  lng: -88.9, l: ['Departamento', 'Municipio', 'Cantón o colonia'] },
  { c: 'HN', n: 'Honduras',        lat: 14.8,  lng: -86.6, l: ['Departamento', 'Municipio', 'Aldea o colonia'] },
  { c: 'NI', n: 'Nicaragua',       lat: 12.9,  lng: -85.0, l: ['Departamento', 'Municipio', 'Barrio o comarca'] },
  { c: 'CR', n: 'Costa Rica',      lat: 9.9,   lng: -84.1, l: ['Provincia', 'Cantón', 'Distrito'] },
  { c: 'PA', n: 'Panamá',          lat: 8.5,   lng: -80.8, l: ['Provincia', 'Distrito', 'Corregimiento'] },
  { c: 'CU', n: 'Cuba',            lat: 21.5,  lng: -79.0, l: ['Provincia', 'Municipio', 'Reparto'] },
  { c: 'DO', n: 'República Dominicana', lat: 18.7, lng: -70.2, l: ['Provincia', 'Municipio', 'Sector'] },
  { c: 'PR', n: 'Puerto Rico',     lat: 18.2,  lng: -66.5, l: ['Región', 'Municipio', 'Barrio'] },
  { c: 'ES', n: 'España',          lat: 40.4,  lng: -3.7,  l: ['Comunidad autónoma', 'Provincia', 'Municipio'] },
  { c: 'US', n: 'Estados Unidos',  lat: 39.8,  lng: -98.6, l: ['Estado', 'Condado', 'Ciudad'] },
  { c: 'IT', n: 'Italia',          lat: 42.5,  lng: 12.5,  l: ['Región', 'Provincia', 'Comune'] },
  { c: 'FR', n: 'Francia',         lat: 46.6,  lng: 2.4,   l: ['Región', 'Departamento', 'Comuna'] },
  { c: 'PT', n: 'Portugal',        lat: 39.6,  lng: -8.0,  l: ['Distrito', 'Concelho', 'Freguesia'] },
  { c: 'CA', n: 'Canadá',          lat: 56.1,  lng: -106.3, l: ['Provincia o territorio', 'Condado', 'Ciudad'] },
  { c: 'GQ', n: 'Guinea Ecuatorial', lat: 1.6, lng: 10.3,  l: ['Provincia', 'Distrito', 'Localidad'] },
  { c: 'XX', n: 'Otro país',       lat: 20,    lng: 0,     l: ['Región o estado', 'Provincia', 'Localidad'] }
];
CAI.country = (c) => CAI.COUNTRIES.find((x) => x.c === c) || CAI.COUNTRIES[CAI.COUNTRIES.length - 1];

CAI.SECURITY_QUESTIONS = [
  '¿Cómo se llamaba tu primera mascota?',
  '¿En qué pueblo o ciudad nació tu madre?',
  '¿Cuál es el nombre de tu parroquia de bautismo?',
  '¿Cómo se llamaba tu primer colegio?',
  '¿Cuál es tu santo patrono favorito?'
];

CAI.REACTIONS = { like: { icon: 'thumb', label: 'Me gusta' }, amen: { icon: 'cross', label: 'Amén' }, wow: { icon: 'star', label: 'Asombro' } };

/* Fichas de apologética (pie de página y #/recursos). Son un punto de partida: cada una remite a la Biblia y al Catecismo. */
CAI.CCC = 'https://www.vatican.va/archive/catechism_sp/index_sp.html';
CAI.TOPICS = [
  { id: 'primado', t: 'El primado de Pedro', s: 'Cristo confió a Simón Pedro las llaves del Reino y el encargo de confirmar a sus hermanos. La Iglesia reconoce en el obispo de Roma, sucesor de Pedro, el principio visible de la unidad.', b: 'Mt 16,13-19 · Lc 22,31-32 · Jn 21,15-17', c: 'CIC 880-882, 936-937' },
  { id: 'escritura-tradicion', t: 'Escritura y Tradición', s: 'La Palabra de Dios llega a nosotros por la Sagrada Escritura y la Sagrada Tradición, que brotan de la misma fuente. El Magisterio las interpreta con la autoridad recibida de Cristo.', b: '2 Ts 2,15 · 2 Tm 3,14-17 · 1 Tm 3,15', c: 'CIC 80-83, 85-87' },
  { id: 'eucaristia', t: 'La Eucaristía', s: 'Creemos que bajo las apariencias de pan y de vino están verdadera, real y sustancialmente el Cuerpo y la Sangre de Cristo, con su alma y su divinidad.', b: 'Jn 6,48-58 · Lc 22,19-20 · 1 Co 11,23-29', c: 'CIC 1322-1419, 1373-1381' },
  { id: 'maria', t: 'María, Madre de Dios y de la Iglesia', s: 'Honramos a María porque es la Madre del Señor. Su veneración no se confunde con la adoración, que se debe solo a Dios.', b: 'Lc 1,28.42-43 · Jn 2,1-11 · Jn 19,25-27', c: 'CIC 484-511, 963-975' },
  { id: 'santos', t: 'Los santos y la intercesión', s: 'La comunión de los santos une a la Iglesia del cielo y de la tierra. Pedimos su oración como nos pedimos oraciones unos a otros.', b: 'Hb 12,1 · Ap 5,8 · St 5,16', c: 'CIC 946-962' },
  { id: 'salvacion', t: 'Fe, gracia y obras', s: 'Somos salvados por la gracia mediante la fe. Esa fe viva se expresa en obras de caridad, que también son don de Dios.', b: 'Ef 2,8-10 · St 2,14-26 · Ga 5,6', c: 'CIC 1987-2029' },
  { id: 'dialogo', t: 'Cómo dialogar', s: 'Se refuta una idea, nunca se humilla a una persona. Escucha primero, cita con exactitud, responde con mansedumbre y termina siempre en caridad.', b: '1 P 3,15-16 · Col 4,5-6', c: 'CIC 2465-2474' }
];
