-- Vyla social data schema for Supabase.
-- Run in the Supabase SQL editor. Auth email-confirmation settings are managed
-- separately in the Supabase dashboard (Authentication > Providers > Email).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (username ~ '^[a-zA-Z0-9_]{3,24}$'),
  display_name text not null default '' check (length(display_name) <= 60),
  bio text not null default '' check (length(bio) <= 500),
  avatar_path text constraint profiles_avatar_path_format_check check (
    avatar_path is null
    or avatar_path ~ ('^' || id::text || '/avatar-[0-9]+[.](jpg|png|webp|gif)$')
  ),
  role text not null default 'user' check (role in ('user', 'admin')),
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists is_suspended boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'profiles'
      and constraint_name = 'profiles_avatar_path_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_avatar_path_format_check
      check (
        avatar_path is null
        or avatar_path ~ ('^' || id::text || '/avatar-[0-9]+[.](jpg|png|webp|gif)$')
      );
  end if;
end;
$$;

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create or replace function public.reject_follow_when_blocked()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.blocks
    where (blocker_id = new.follower_id and blocked_id = new.following_id)
       or (blocker_id = new.following_id and blocked_id = new.follower_id)
  ) then
    raise exception 'A blocked relationship cannot be followed';
  end if;
  return new;
end;
$$;

drop trigger if exists follows_reject_blocked on public.follows;
create trigger follows_reject_blocked
  before insert on public.follows
  for each row execute function public.reject_follow_when_blocked();

create or replace function public.remove_follows_when_blocked()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and following_id = new.blocked_id)
     or (follower_id = new.blocked_id and following_id = new.blocker_id);
  return new;
end;
$$;

drop trigger if exists blocks_remove_existing_follows on public.blocks;
create trigger blocks_remove_existing_follows
  after insert on public.blocks
  for each row execute function public.remove_follows_when_blocked();

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 120),
  description text not null default '',
  visibility text not null default 'public'
    check (visibility in ('public', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists playlists_owner_updated_idx
  on public.playlists (owner_id, updated_at desc);

create table if not exists public.playlist_tracks (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  position integer not null check (position >= 0),
  track_data jsonb not null check (jsonb_typeof(track_data) = 'object'),
  added_at timestamptz not null default now(),
  unique (playlist_id, position)
);

create index if not exists playlist_tracks_playlist_position_idx
  on public.playlist_tracks (playlist_id, position);

create table if not exists public.saved_tracks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id text not null,
  track_data jsonb not null check (jsonb_typeof(track_data) = 'object'),
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create table if not exists public.user_settings (
  user_id uuid not null references public.profiles (id) on delete cascade,
  key text not null check (length(trim(key)) between 1 and 100),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

create table if not exists public.app_settings (
  key text primary key check (length(trim(key)) between 1 and 100),
  value jsonb not null,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null check (length(trim(message)) between 1 and 2000),
  enabled boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists playlists_set_updated_at on public.playlists;
create trigger playlists_set_updated_at
  before update on public.playlists
  for each row execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and not is_suspended
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and not is_suspended
  );
$$;

revoke all on function public.is_active_user() from public;
grant execute on function public.is_active_user() to anon, authenticated;

create or replace function public.is_blocked_between(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.blocks
    where (blocker_id = (select auth.uid()) and blocked_id = other_user_id)
       or (blocker_id = other_user_id and blocked_id = (select auth.uid()))
  );
$$;

revoke all on function public.is_blocked_between(uuid) from public;
grant execute on function public.is_blocked_between(uuid) to anon, authenticated;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_username text;
begin
  profile_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', ''),
    '[^a-zA-Z0-9_]', '', 'g'
  ));
  profile_username := left(profile_username, 24);

  if length(profile_username) < 3 then
    profile_username := 'user_' || replace(left(new.id::text, 8), '-', '');
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    profile_username,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 60)
  )
  on conflict do nothing;

  if not exists (select 1 from public.profiles where id = new.id) then
    insert into public.profiles (id, username, display_name)
    values (
      new.id,
      'user_' || replace(left(new.id::text, 12), '-', ''),
      left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 60)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.saved_tracks enable row level security;
alter table public.user_settings enable row level security;
alter table public.app_settings enable row level security;
alter table public.announcements enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.follows to authenticated;
grant select, insert, update, delete on public.blocks to authenticated;
grant select, insert, update, delete on public.playlists to authenticated;
grant select, insert, update, delete on public.playlist_tracks to authenticated;
grant select, insert, update, delete on public.saved_tracks to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;
grant select, insert, update, delete on public.app_settings to authenticated;
grant select, insert, update, delete on public.announcements to authenticated;
grant select on public.playlists, public.playlist_tracks,
  public.app_settings, public.announcements to anon;

drop policy if exists "Profiles are discoverable by signed-in users" on public.profiles;
create policy "Profiles are discoverable by signed-in users"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.is_admin())
    or (
      (select public.is_active_user())
      and not (select public.is_blocked_between(id))
    )
  );

drop policy if exists "Users create their own profile" on public.profiles;
create policy "Users create their own profile"
  on public.profiles for insert to authenticated
  with check (
    id = (select auth.uid())
    and role = 'user'
    and not is_suspended
  );

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (
    (id = (select auth.uid()) and role = 'user' and not is_suspended)
    or (select public.is_admin())
  );

drop policy if exists "Follow relationships are visible to signed-in users" on public.follows;
create policy "Follow relationships are visible to signed-in users"
  on public.follows for select to authenticated
  using ((select public.is_active_user()) or (select public.is_admin()));

drop policy if exists "Users follow from their own account" on public.follows;
create policy "Users follow from their own account"
  on public.follows for insert to authenticated
  with check (
    follower_id = (select auth.uid())
    and (select public.is_active_user())
  );

drop policy if exists "Users unfollow from their own account" on public.follows;
create policy "Users unfollow from their own account"
  on public.follows for delete to authenticated
  using (
    (follower_id = (select auth.uid()) and (select public.is_active_user()))
    or (select public.is_admin())
  );

drop policy if exists "Users read their own blocks" on public.blocks;
create policy "Users read their own blocks"
  on public.blocks for select to authenticated
  using (
    (blocker_id = (select auth.uid()) and (select public.is_active_user()))
    or (select public.is_admin())
  );

drop policy if exists "Users block from their own account" on public.blocks;
create policy "Users block from their own account"
  on public.blocks for insert to authenticated
  with check (
    blocker_id = (select auth.uid())
    and (select public.is_active_user())
  );

drop policy if exists "Users unblock from their own account" on public.blocks;
create policy "Users unblock from their own account"
  on public.blocks for delete to authenticated
  using (
    (blocker_id = (select auth.uid()) and (select public.is_active_user()))
    or (select public.is_admin())
  );

drop policy if exists "Public playlists are visible" on public.playlists;
create policy "Public playlists are visible"
  on public.playlists for select to anon, authenticated
  using (
    (
      (
        (
          visibility = 'public'
          and ((select auth.uid()) is null or (select public.is_active_user()))
        )
        or (
          owner_id = (select auth.uid())
          and (select public.is_active_user())
        )
      )
      and (
        (select public.is_admin())
        or not (select public.is_blocked_between(owner_id))
      )
    )
    or (select public.is_admin())
  );

drop policy if exists "Users create their own playlists" on public.playlists;
create policy "Users create their own playlists"
  on public.playlists for insert to authenticated
  with check (
    (owner_id = (select auth.uid()) and (select public.is_active_user()))
    or (select public.is_admin())
  );

drop policy if exists "Users update their own playlists" on public.playlists;
create policy "Users update their own playlists"
  on public.playlists for update to authenticated
  using (
    (owner_id = (select auth.uid()) and (select public.is_active_user()))
    or (select public.is_admin())
  )
  with check (
    (owner_id = (select auth.uid()) and (select public.is_active_user()))
    or (select public.is_admin())
  );

drop policy if exists "Users delete their own playlists" on public.playlists;
create policy "Users delete their own playlists"
  on public.playlists for delete to authenticated
  using (
    (owner_id = (select auth.uid()) and (select public.is_active_user()))
    or (select public.is_admin())
  );

drop policy if exists "Tracks follow playlist visibility" on public.playlist_tracks;
create policy "Tracks follow playlist visibility"
  on public.playlist_tracks for select to anon, authenticated
  using (
    exists (
      select 1 from public.playlists
      where playlists.id = playlist_tracks.playlist_id
        and (
          playlists.visibility = 'public'
          or (
            playlists.owner_id = (select auth.uid())
            and (select public.is_active_user())
          )
          or (select public.is_admin())
        )
        and (
          (select auth.uid()) is null
          or (select public.is_admin())
          or (
            (select public.is_active_user())
            and not (select public.is_blocked_between(playlists.owner_id))
          )
        )
    )
  );

drop policy if exists "Playlist owners manage tracks" on public.playlist_tracks;
create policy "Playlist owners manage tracks"
  on public.playlist_tracks for all to authenticated
  using (
    exists (
      select 1 from public.playlists
      where playlists.id = playlist_tracks.playlist_id
        and (
          (
            playlists.owner_id = (select auth.uid())
            and (select public.is_active_user())
          )
          or (select public.is_admin())
        )
    )
  )
  with check (
    exists (
      select 1 from public.playlists
      where playlists.id = playlist_tracks.playlist_id
        and (
          (
            playlists.owner_id = (select auth.uid())
            and (select public.is_active_user())
          )
          or (select public.is_admin())
        )
    )
  );

drop policy if exists "Users manage their saved tracks" on public.saved_tracks;
create policy "Users manage their saved tracks"
  on public.saved_tracks for all to authenticated
  using (
    (user_id = (select auth.uid()) and (select public.is_active_user()))
    or (select public.is_admin())
  )
  with check (
    (user_id = (select auth.uid()) and (select public.is_active_user()))
    or (select public.is_admin())
  );

drop policy if exists "Users manage their settings" on public.user_settings;
create policy "Users manage their settings"
  on public.user_settings for all to authenticated
  using (
    (user_id = (select auth.uid()) and (select public.is_active_user()))
    or (select public.is_admin())
  )
  with check (
    (user_id = (select auth.uid()) and (select public.is_active_user()))
    or (select public.is_admin())
  );

drop policy if exists "Public app settings are readable" on public.app_settings;
create policy "Public app settings are readable"
  on public.app_settings for select to anon, authenticated
  using (
    (
      is_public
      and (
        (select auth.uid()) is null
        or (select public.is_active_user())
      )
    )
    or (select public.is_admin())
  );

drop policy if exists "Admins manage app settings" on public.app_settings;
create policy "Admins manage app settings"
  on public.app_settings for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Active announcements are readable" on public.announcements;
create policy "Active announcements are readable"
  on public.announcements for select to anon, authenticated
  using (
    (
      enabled
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at > now())
      and (
        (select auth.uid()) is null
        or (select public.is_active_user())
      )
    )
    or (select public.is_admin())
  );

drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements"
  on public.announcements for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are publicly viewable" on storage.objects;
create policy "Avatar images are publicly viewable"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'avatars'
    and (
      (select auth.uid()) is null
      or (select public.is_active_user())
      or (select public.is_admin())
    )
  );

drop policy if exists "Users upload their own avatar images" on storage.objects;
create policy "Users upload their own avatar images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_active_user())
  );

drop policy if exists "Users update their own avatar images" on storage.objects;
create policy "Users update their own avatar images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_active_user())
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_active_user())
  );

drop policy if exists "Users delete their own avatar images" on storage.objects;
create policy "Users delete their own avatar images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_active_user())
  );

-- After the first owner account is created, promote it from the SQL editor:
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'owner@example.com');
