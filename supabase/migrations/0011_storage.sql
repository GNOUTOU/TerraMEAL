-- TerraMEAL — 0011: bucket de stockage pour les preuves/documents (34) et photos de profil.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Lecture : tout utilisateur authentifié (le filtrage fin par visibility_level se fait au niveau
-- applicatif via les tables documents/project_documents, qui contrôlent quelles URLs signées
-- sont émises). Écriture : rôles opérationnels uniquement.
create policy documents_bucket_read on storage.objects for select to authenticated
  using (bucket_id = 'documents');

create policy documents_bucket_write on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and is_meal_or_admin());

create policy documents_bucket_delete on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and is_meal_or_admin());
