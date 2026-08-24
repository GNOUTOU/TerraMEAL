-- TerraMEAL — 0014: aligne les policies d'écriture des documents avec canWriteOperationalData()
-- (admin, meal_sig, program_manager) côté application. Sans ce correctif, un program_manager
-- voit le formulaire de téléversement (34) mais son upload échoue silencieusement en RLS.

drop policy if exists doc_write on project_documents;
create policy doc_write on project_documents for all to authenticated using (
  is_meal_or_admin() or (current_user_role() = 'program_manager' and has_project_access(project_id))
) with check (
  is_meal_or_admin() or (current_user_role() = 'program_manager' and has_project_access(project_id))
);

drop policy if exists documents_write on documents;
create policy documents_write on documents for all to authenticated using (
  is_meal_or_admin() or current_user_role() = 'program_manager'
) with check (
  is_meal_or_admin() or current_user_role() = 'program_manager'
);

drop policy if exists documents_bucket_write on storage.objects;
create policy documents_bucket_write on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (is_meal_or_admin() or current_user_role() = 'program_manager'));

drop policy if exists documents_bucket_delete on storage.objects;
create policy documents_bucket_delete on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (is_meal_or_admin() or current_user_role() = 'program_manager'));
