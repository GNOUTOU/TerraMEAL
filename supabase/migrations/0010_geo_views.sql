-- TerraMEAL — 0010: vues GeoJSON pour la carte (MapLibre consomme du GeoJSON, pas du WKB).
-- security_invoker=true : ces vues respectent les RLS des tables sous-jacentes pour l'utilisateur
-- qui exécute la requête (et non les droits du propriétaire de la vue).

create or replace view interventions_geo
with (security_invoker = true) as
select
  i.*,
  ST_AsGeoJSON(i.geom)::json as geom_json,
  s.name as sector_name,
  s.color as sector_color,
  p.name as project_name,
  az.name as admin_zone_name
from interventions i
left join sectors s on s.id = i.sector_id
left join projects p on p.id = i.project_id
left join admin_zones az on az.id = i.admin_zone_id;

create or replace view admin_zones_geo
with (security_invoker = true) as
select
  az.*,
  ST_AsGeoJSON(az.geom)::json as geom_json,
  ST_AsGeoJSON(az.centroid)::json as centroid_json
from admin_zones az;
