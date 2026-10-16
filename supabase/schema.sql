-- =====================================================================
--  CAI · Cruzada Apologética Itinerante  ·  Esquema Supabase
--  Pégalo completo en: Supabase > SQL Editor > New query > Run
-- =====================================================================

-- ---------- Perfiles públicos (lo que se ve en mapa, feed y perfil) ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  full_name    text not null,
  age          int  check (age between 18 and 120),
  bio          text default '',
  avatar_url   text,
  section      text not null default 'apologeta' check (section in ('apologeta','caridad')),
  role         text not null default 'miembro'   check (role in ('miembro','moderador','admin')),
  points       int  not null default 0,
  rank         text not null default 'cadete',
  country_code text, country_name text,
  region text, province text, district text, town text,
  lat double precision, lng double precision,           -- aproximadas (2 decimales ≈ 1 km)
  socials      jsonb not null default '{}'::jsonb,       -- redes que el usuario decide mostrar
  created_at   timestamptz not null default now()
);

-- ---------- Datos privados (solo dueño y admin) ----------
create table if not exists public.profiles_private (
  id uuid primary key references public.profiles(id) on delete cascade,
  email text, phone text,
  security_question text, security_answer_hash text
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('base','reto','debate','especial','caridad','testimonio')),
  body text not null check (char_length(body) between 1 and 3000),
  place text, media_url text, video_url text,
  status text not null default 'pendiente' check (status in ('pendiente','revisada','aprobada','rechazada')),
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts(created_at desc);

create table if not exists public.reactions (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('like','amen','wow')),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id   uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_pair_idx on public.messages(from_id, to_id, created_at desc);

-- ---------- Rangos (mismos umbrales que js/data.js) ----------
create or replace function public.rank_for(p int, s text) returns text
language sql immutable as $$
  select case
    when s = 'caridad' then 'voluntaria'
    when p >= 1200 then 'general'  when p >= 800 then 'comandante'
    when p >= 500  then 'capitan'  when p >= 300 then 'teniente'
    when p >= 160  then 'sargento' when p >= 80  then 'cabo'
    when p >= 30   then 'soldado'  else 'cadete' end
$$;

-- ---------- Alta automática de perfil al registrarse ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := new.raw_user_meta_data; sec text := coalesce(m->>'section','apologeta');
begin
  insert into public.profiles(id, username, full_name, age, section, rank, country_code, country_name,
                              region, province, district, town, lat, lng, socials)
  values (new.id, lower(m->>'username'), m->>'full_name', nullif(m->>'age','')::int, sec,
          public.rank_for(0, sec), m->>'country_code', m->>'country_name',
          m->>'region', m->>'province', m->>'district', m->>'town',
          nullif(m->>'lat','')::float, nullif(m->>'lng','')::float,
          coalesce(m->'socials','{}'::jsonb));
  insert into public.profiles_private(id, email, phone, security_question, security_answer_hash)
  values (new.id, new.email, m->>'phone', m->>'security_question', m->>'security_answer_hash');
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Funciones auxiliares ----------
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

-- Login con usuario o correo: devuelve el correo de un usuario
create or replace function public.email_for_username(u text) returns text
language sql stable security definer set search_path = public as
$$ select pr.email from public.profiles_private pr join public.profiles p on p.id = pr.id
   where p.username = lower(u) $$;

-- Validación de evidencias: moderador marca "revisada"; solo admin aprueba/rechaza y sube de rango
create or replace function public.review_post(p_post uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare r text := public.my_role(); po public.posts; pts int;
begin
  select * into po from public.posts where id = p_post;
  if po.id is null then raise exception 'Publicación no existe'; end if;
  if p_status = 'revisada' and r in ('moderador','admin') then
    update public.posts set status = 'revisada' where id = p_post;
  elsif p_status in ('aprobada','rechazada') and r = 'admin' then
    update public.posts set status = p_status where id = p_post;
    if p_status = 'aprobada' and po.status <> 'aprobada' then
      pts := case po.type when 'base' then 10 when 'reto' then 25 when 'debate' then 50
                          when 'especial' then 100 when 'caridad' then 15 else 0 end;
      update public.profiles set points = points + pts,
        rank = public.rank_for(points + pts, section) where id = po.user_id;
    end if;
  else raise exception 'Sin permisos';
  end if;
end $$;

-- Solo el admin cambia roles
create or replace function public.set_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() <> 'admin' then raise exception 'Sin permisos'; end if;
  update public.profiles set role = p_role where id = p_user;
end $$;

-- Impide que un usuario se edite rol/puntos/rango por su cuenta
create or replace function public.protect_profile() returns trigger
language plpgsql as $$
begin
  -- Dentro de las funciones security definer current_user es el dueño (postgres), así que ellas sí pueden cambiar estos campos
  if current_user in ('authenticated','anon') then
    new.role := old.role; new.points := old.points; new.rank := old.rank;
    new.username := old.username; new.section := old.section;
  end if;
  return new;
end $$;
drop trigger if exists protect_profile_t on public.profiles;
create trigger protect_profile_t before update on public.profiles
  for each row execute function public.protect_profile();

-- ---------- Seguridad (RLS) ----------
alter table public.profiles enable row level security;
alter table public.profiles_private enable row level security;
alter table public.posts enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.messages enable row level security;

create policy "perfiles visibles" on public.profiles for select using (true);
create policy "edito mi perfil" on public.profiles for update using (auth.uid() = id);

create policy "privado: dueño o admin" on public.profiles_private for select
  using (auth.uid() = id or public.my_role() = 'admin');
create policy "privado: edito el mío" on public.profiles_private for update using (auth.uid() = id);

create policy "posts visibles" on public.posts for select using (true);
create policy "publico como yo" on public.posts for insert with check (auth.uid() = user_id and status = 'pendiente');
create policy "borro lo mío" on public.posts for delete using (auth.uid() = user_id or public.my_role() = 'admin');

create policy "reacciones visibles" on public.reactions for select using (true);
create policy "reacciono yo" on public.reactions for insert with check (auth.uid() = user_id);
create policy "cambio mi reacción" on public.reactions for update using (auth.uid() = user_id);
create policy "quito mi reacción" on public.reactions for delete using (auth.uid() = user_id);

create policy "comentarios visibles" on public.comments for select using (true);
create policy "comento yo" on public.comments for insert with check (auth.uid() = user_id);
create policy "borro mi comentario" on public.comments for delete using (auth.uid() = user_id or public.my_role() in ('moderador','admin'));

create policy "leo mis mensajes" on public.messages for select using (auth.uid() in (from_id, to_id));
create policy "envío como yo" on public.messages for insert with check (auth.uid() = from_id);

-- Chat en tiempo real
alter publication supabase_realtime add table public.messages;

-- ---------- Almacenamiento de archivos (1 GB gratis: las imágenes se comprimen en el navegador) ----------
insert into storage.buckets (id, name, public) values ('avatars','avatars',true), ('evidence','evidence',true)
  on conflict (id) do nothing;
create policy "ver archivos" on storage.objects for select using (bucket_id in ('avatars','evidence'));
create policy "subo en mi carpeta" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars','evidence') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "reemplazo lo mío" on storage.objects for update to authenticated
  using (bucket_id in ('avatars','evidence') and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Primer administrador (cambia 'tu_usuario' y ejecuta DESPUÉS de registrarte) ----------
-- update public.profiles set role = 'admin' where username = 'tu_usuario';
