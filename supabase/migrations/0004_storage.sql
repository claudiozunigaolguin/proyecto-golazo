-- GOLAZO — Storage para escudos de equipo y fotos de jugador.
-- Bucket público único con rutas convencionales que codifican el
-- campeonato, para poder validar permisos de escritura con RLS:
--   team-logos/<championship_id>/<team_id>.<ext>
--   player-photos/<championship_id>/<player_id>.<ext>

insert into storage.buckets (id, name, public)
values ('golazo-media', 'golazo-media', true)
on conflict (id) do nothing;

-- Lectura pública (los escudos/fotos se muestran en el perfil público)
create policy "golazo_media_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'golazo-media');

-- Escritura solo para admin/organizer del campeonato que codifica la ruta
create policy "golazo_media_managers_write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'golazo-media'
    and public.is_championship_manager(((storage.foldername(name))[2])::uuid)
  );

create policy "golazo_media_managers_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'golazo-media'
    and public.is_championship_manager(((storage.foldername(name))[2])::uuid)
  );

create policy "golazo_media_managers_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'golazo-media'
    and public.is_championship_manager(((storage.foldername(name))[2])::uuid)
  );
