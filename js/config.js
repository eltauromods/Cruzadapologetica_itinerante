/* Configuración de la web. Todo lo que quieras conectar se pone aquí.
   - Sin SUPABASE_URL y SUPABASE_ANON_KEY la web guarda todo en ESTE navegador (almacenamiento local) y funciona completa.
   - Cuando los pongas, pasa sola a la base de datos real sin tocar nada más (ver README). */
window.CAI_CONFIG = {
  SUPABASE_URL: "",        // ej. https://abcd1234.supabase.co
  SUPABASE_ANON_KEY: "",   // Project Settings > API > anon public (es pública por diseño; la seguridad la dan las reglas RLS)

  /* Tyrone AI. Ruta o URL completa de tu motor.php (debe estar en un hosting con PHP, p. ej. InfinityFree).
     Ejemplo: "https://tu-hosting.kesug.com/motor.php". Si queda así y tu hosting no ejecuta PHP, Tyrone avisa con un mensaje amable. */
  AI_ENDPOINT: "api/motor.php",
  DEV_EMAIL: "tauromodder@gmail.com",   // a quién escribir si Tyrone no responde

  /* Contacto y redes de la cruzada (deja vacío lo que no uses: no se muestra). */
  CONTACT_EMAIL: "",
  SOCIAL: { youtube: "", instagram: "", facebook: "", tiktok: "", x_social: "", whatsapp: "", telegram: "" }
};
