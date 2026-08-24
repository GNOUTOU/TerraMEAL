-- TerraMEAL — 0012: fonctions géospatiales pour le moteur de contrôle qualité (25.1)

create or replace function quality_check_geo(p_intervention_id uuid)
returns table (
  has_geom boolean,
  is_zero boolean,
  out_of_country boolean,
  zone_mismatch boolean,
  duplicate_count integer
)
language sql stable security invoker set search_path = public as $$
  with target as (
    select i.geom, i.admin_zone_id from interventions i where i.id = p_intervention_id
  ),
  country as (
    select geom from admin_zones where level = 'country' limit 1
  ),
  zone as (
    select az.geom from admin_zones az join target t on az.id = t.admin_zone_id
  )
  select
    (select geom is not null from target) as has_geom,
    coalesce((select ST_Equals(geom, ST_SetSRID(ST_MakePoint(0,0),4326)) from target where geom is not null), false) as is_zero,
    coalesce((
      select not ST_Within(t.geom, c.geom) from target t, country c where t.geom is not null and c.geom is not null
    ), false) as out_of_country,
    coalesce((
      select not ST_Within(t.geom, z.geom) from target t, zone z where t.geom is not null and z.geom is not null
    ), false) as zone_mismatch,
    coalesce((
      select count(*)::int from interventions i2, target t
      where t.geom is not null and i2.id <> p_intervention_id and ST_Equals(i2.geom, t.geom)
    ), 0) as duplicate_count;
$$;
