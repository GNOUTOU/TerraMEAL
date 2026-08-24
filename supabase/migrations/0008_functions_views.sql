-- TerraMEAL — 0008: fonctions utilitaires (RBAC, audit, dashboard) et vues de reporting

-- current_user_role(): lit le rôle du profil connecté. SECURITY DEFINER pour éviter la récursion RLS
-- lorsque cette fonction est elle-même appelée depuis une policy sur "profiles".
create or replace function current_user_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function current_profile()
returns profiles
language sql
security definer
stable
set search_path = public
as $$
  select * from profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

create or replace function is_meal_or_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select role in ('admin','meal_sig') from profiles where id = auth.uid()), false);
$$;

create or replace function has_project_access(p_project_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select
    coalesce((select role in ('admin','meal_sig','direction') from profiles where id = auth.uid()), false)
    or exists (select 1 from user_projects up where up.user_id = auth.uid() and up.project_id = p_project_id)
    or exists (select 1 from projects p where p.id = p_project_id and p.manager_id = auth.uid())
    or exists (
      select 1 from project_donors pd
      join profiles pr on pr.donor_id = pd.donor_id
      where pd.project_id = p_project_id and pr.id = auth.uid()
    )
    or exists (
      select 1 from project_partners pp
      join profiles pr on pr.partner_id = pp.partner_id
      where pp.project_id = p_project_id and pr.id = auth.uid()
    );
$$;

-- Auto-crée un profil TerraMEAL (rôle par défaut meal_sig) à la création d'un compte Supabase Auth.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'meal_sig'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Journal d'activité générique (35/52) : capture create/update/delete sur les tables sensibles.
create or replace function log_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_action text;
  v_old jsonb;
  v_new jsonb;
begin
  if tg_op = 'INSERT' then
    v_action := 'create'; v_old := null; v_new := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    v_action := 'update'; v_old := to_jsonb(old); v_new := to_jsonb(new);
  else
    v_action := 'delete'; v_old := to_jsonb(old); v_new := null;
  end if;

  insert into activity_log (user_id, action, entity_table, entity_id, old_value, new_value)
  values (
    auth.uid(),
    v_action,
    tg_table_name,
    coalesce((v_new->>'id')::uuid, (v_old->>'id')::uuid),
    v_old,
    v_new
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_log_projects on projects;
create trigger trg_log_projects after insert or update or delete on projects for each row execute function log_activity();

drop trigger if exists trg_log_interventions on interventions;
create trigger trg_log_interventions after insert or update or delete on interventions for each row execute function log_activity();

drop trigger if exists trg_log_indicator_results on indicator_results;
create trigger trg_log_indicator_results after insert or update or delete on indicator_results for each row execute function log_activity();

drop trigger if exists trg_log_profiles on profiles;
create trigger trg_log_profiles after update on profiles for each row execute function log_activity();

-- Dashboard KPIs (18.1) — un seul aller-retour, filtrable côté appelant via des CTE si besoin.
create or replace function dashboard_kpis(
  p_project_id uuid default null,
  p_sector_id uuid default null,
  p_donor_id uuid default null,
  p_year int default null,
  p_admin_zone_id uuid default null
)
returns table (
  projects_active bigint,
  projects_total bigint,
  communes_covered bigint,
  localities_covered bigint,
  interventions_count bigint,
  beneficiaries_total bigint,
  partners_count bigint,
  donors_count bigint
)
language sql stable security invoker set search_path = public as $$
  with scoped as (
    select i.* from interventions i
    join projects p on p.id = i.project_id
    where i.validation_status in ('validated','published')
      and (p_project_id is null or i.project_id = p_project_id)
      and (p_sector_id is null or i.sector_id = p_sector_id)
      and (p_year is null or extract(year from i.date) = p_year)
      and (p_admin_zone_id is null or i.admin_zone_id = p_admin_zone_id)
      and (p_donor_id is null or exists (
        select 1 from project_donors pd where pd.project_id = i.project_id and pd.donor_id = p_donor_id
      ))
  )
  select
    (select count(*) from projects where status = 'active') as projects_active,
    (select count(*) from projects) as projects_total,
    (select count(distinct az.id) from scoped s
      join admin_zones az on az.id = s.admin_zone_id and az.level = 'commune') as communes_covered,
    (select count(distinct az.id) from scoped s
      join admin_zones az on az.id = s.admin_zone_id and az.level = 'locality') as localities_covered,
    (select count(*) from scoped) as interventions_count,
    (select coalesce(sum(beneficiaries_total),0) from scoped) as beneficiaries_total,
    (select count(*) from partners where active) as partners_count,
    (select count(*) from donors where active) as donors_count;
$$;

-- Recherche globale (28) sur projets, interventions, zones, partenaires, bailleurs.
create or replace function global_search(q text)
returns table (entity_type text, id uuid, label text, subtitle text)
language sql stable security invoker set search_path = public as $$
  select 'project', p.id, p.name, p.code from projects p
    where p.name ilike '%'||q||'%' or p.code ilike '%'||q||'%'
  union all
  select 'intervention', i.id, i.name, i.type from interventions i
    where i.name ilike '%'||q||'%' or i.source_id ilike '%'||q||'%'
  union all
  select 'admin_zone', z.id, z.name, z.level::text from admin_zones z
    where z.name ilike '%'||q||'%'
  union all
  select 'partner', pt.id, pt.name, 'Partenaire' from partners pt where pt.name ilike '%'||q||'%'
  union all
  select 'donor', d.id, d.name, 'Bailleur' from donors d where d.name ilike '%'||q||'%'
  limit 50;
$$;

-- Vue "fraîcheur" utilisée par le module Qualité et le dashboard (18.4 / 25.6).
create or replace view stale_interventions as
select i.*
from interventions i
where i.validation_status in ('validated','published')
  and i.last_updated_at < now() - ((select (value#>>'{}')::int from app_settings where key = 'data_freshness_days') || ' days')::interval;
