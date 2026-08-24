-- TerraMEAL — 0009: Row Level Security (37/38/RG06/RG07/RG08)
-- Modèle : admin/meal_sig = accès opérationnel complet. direction = lecture large.
-- program_manager = scope via has_project_access(). donor/partner = scope + validé/publié + sensibilité<=2.
-- anon (portail public, 32) = accès étroit, gardé par app_settings.public_portal_enabled.

alter table donors enable row level security;
alter table partners enable row level security;
alter table sectors enable row level security;
alter table subsectors enable row level security;
alter table admin_zones enable row level security;
alter table data_sources enable row level security;
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_donors enable row level security;
alter table project_partners enable row level security;
alter table project_sectors enable row level security;
alter table project_zones enable row level security;
alter table user_projects enable row level security;
alter table project_documents enable row level security;
alter table interventions enable row level security;
alter table infrastructures enable row level security;
alter table activities enable row level security;
alter table beneficiaries_breakdown enable row level security;
alter table indicators enable row level security;
alter table indicator_results enable row level security;
alter table import_batches enable row level security;
alter table raw_records enable row level security;
alter table staging_records enable row level security;
alter table anomalies enable row level security;
alter table documents enable row level security;
alter table activity_log enable row level security;
alter table notifications enable row level security;
alter table app_settings enable row level security;

-- ---------- Référentiels : lecture pour tout utilisateur authentifié, écriture admin/meal_sig ----------
create policy ref_read on donors for select to authenticated using (true);
create policy ref_write on donors for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());

create policy ref_read on partners for select to authenticated using (true);
create policy ref_write on partners for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());

create policy ref_read on sectors for select to authenticated using (true);
create policy ref_write on sectors for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());

create policy ref_read on subsectors for select to authenticated using (true);
create policy ref_write on subsectors for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());

create policy ref_read on admin_zones for select to authenticated using (true);
create policy ref_write on admin_zones for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());
create policy anon_read on admin_zones for select to anon using (true);
create policy anon_read on sectors for select to anon using (true);

-- data_sources contient des identifiants d'API : admin uniquement.
create policy admin_only on data_sources for all to authenticated using (is_admin()) with check (is_admin());

-- ---------- profiles ----------
create policy self_read on profiles for select to authenticated using (id = auth.uid() or is_admin() or current_user_role() in ('direction'));
create policy self_update on profiles for update to authenticated using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());
create policy admin_insert on profiles for insert to authenticated with check (is_admin());
create policy admin_delete on profiles for delete to authenticated using (is_admin());

-- ---------- projects ----------
create policy projects_read on projects for select to authenticated using (
  current_user_role() in ('admin','meal_sig','direction') or has_project_access(id)
);
create policy projects_write on projects for insert to authenticated with check (is_meal_or_admin());
create policy projects_update on projects for update to authenticated using (
  is_meal_or_admin() or manager_id = auth.uid()
) with check (is_meal_or_admin() or manager_id = auth.uid());
create policy projects_delete on projects for delete to authenticated using (is_admin());
create policy anon_read on projects for select to anon using (
  (select (value#>>'{}')::boolean from app_settings where key = 'public_portal_enabled') is true
  and status in ('active','closed')
);

-- ---------- project_* join tables ----------
create policy join_read on project_donors for select to authenticated using (has_project_access(project_id));
create policy join_write on project_donors for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());

create policy join_read on project_partners for select to authenticated using (has_project_access(project_id));
create policy join_write on project_partners for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());

create policy join_read on project_sectors for select to authenticated using (has_project_access(project_id));
create policy join_write on project_sectors for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());

create policy join_read on project_zones for select to authenticated using (has_project_access(project_id));
create policy join_write on project_zones for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());

create policy self_read on user_projects for select to authenticated using (user_id = auth.uid() or is_meal_or_admin());
create policy admin_write on user_projects for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());

create policy doc_read on project_documents for select to authenticated using (
  has_project_access(project_id) and (
    current_user_role() in ('admin','meal_sig','direction','program_manager')
    or visibility_level = 'public'
  )
);
create policy doc_write on project_documents for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());

-- ---------- interventions / infrastructures / activities / bénéficiaires ----------
-- Policy A : rôles opérationnels internes, toute donnée quel que soit son statut.
create policy interventions_internal on interventions for select to authenticated using (
  current_user_role() in ('admin','meal_sig','direction')
  or (current_user_role() = 'program_manager' and has_project_access(project_id))
);
-- Policy B : bailleurs/partenaires, uniquement donnée validée/publiée et non sensible (RG07/RG08/38).
create policy interventions_external on interventions for select to authenticated using (
  current_user_role() in ('donor','partner')
  and has_project_access(project_id)
  and validation_status in ('validated','published')
  and sensitivity_level <= 2
);
create policy interventions_write on interventions for all to authenticated using (
  is_meal_or_admin() or (current_user_role() = 'program_manager' and has_project_access(project_id))
) with check (
  is_meal_or_admin() or (current_user_role() = 'program_manager' and has_project_access(project_id))
);
create policy anon_read on interventions for select to anon using (
  (select (value#>>'{}')::boolean from app_settings where key = 'public_portal_enabled') is true
  and validation_status = 'published' and sensitivity_level = 1
);

create policy infra_read on infrastructures for select to authenticated using (
  exists (select 1 from interventions i where i.id = intervention_id)
);
create policy infra_write on infrastructures for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());

create policy act_read on activities for select to authenticated using (
  exists (select 1 from interventions i where i.id = intervention_id)
);
create policy act_write on activities for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());

create policy benef_read on beneficiaries_breakdown for select to authenticated using (
  current_user_role() in ('admin','meal_sig','direction')
  or (project_id is not null and has_project_access(project_id))
  or (intervention_id is not null and exists (
       select 1 from interventions i where i.id = intervention_id and (
         current_user_role() = 'program_manager' and has_project_access(i.project_id)
       )))
);
create policy benef_write on beneficiaries_breakdown for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());

-- ---------- indicateurs ----------
create policy ind_read on indicators for select to authenticated using (true);
create policy ind_write on indicators for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());
create policy anon_read on indicators for select to anon using (
  (select (value#>>'{}')::boolean from app_settings where key = 'public_portal_enabled') is true
);

create policy ind_res_internal on indicator_results for select to authenticated using (
  current_user_role() in ('admin','meal_sig','direction')
  or (project_id is null)
  or (current_user_role() = 'program_manager' and has_project_access(project_id))
);
create policy ind_res_external on indicator_results for select to authenticated using (
  current_user_role() in ('donor','partner') and project_id is not null and has_project_access(project_id)
  and validation_status in ('validated','published')
);
create policy ind_res_write on indicator_results for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());
create policy anon_read on indicator_results for select to anon using (
  (select (value#>>'{}')::boolean from app_settings where key = 'public_portal_enabled') is true
  and validation_status = 'published'
);

-- ---------- pipeline (RAW/STAGING/anomalies/imports) : réservé aux profils autorisés ----------
create policy pipeline_all on import_batches for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());
create policy pipeline_all on raw_records for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());
create policy pipeline_all on staging_records for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());
create policy pipeline_all on anomalies for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());

-- ---------- documents génériques ----------
create policy documents_read on documents for select to authenticated using (
  current_user_role() in ('admin','meal_sig','direction','program_manager')
  or visibility_level = 'public'
);
create policy documents_write on documents for all to authenticated using (is_meal_or_admin()) with check (is_meal_or_admin());

-- ---------- journal d'activité (35/52) : admin + meal_sig ----------
create policy log_read on activity_log for select to authenticated using (is_meal_or_admin());

-- ---------- notifications : uniquement les siennes ----------
create policy notif_read on notifications for select to authenticated using (user_id = auth.uid());
create policy notif_update on notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notif_insert on notifications for insert to authenticated with check (is_meal_or_admin() or user_id = auth.uid());

-- ---------- paramètres applicatifs ----------
create policy settings_read on app_settings for select to authenticated using (true);
create policy settings_write on app_settings for all to authenticated using (is_admin()) with check (is_admin());
create policy anon_read on app_settings for select to anon using (key = 'public_portal_enabled' or key = 'org_name');
