-- TerraMEAL — 0016: expose le nom du partenaire de mise en œuvre dans la vue carte.
-- "i.*" a changé de forme (nouvelle colonne implementing_partner_id insérée au milieu de la
-- table interventions) : CREATE OR REPLACE VIEW refuse ce cas (réordonnancement de colonnes),
-- on droppe donc et recrée la vue. Rien d'autre ne dépend de cet objet.
drop view if exists interventions_geo;

create view interventions_geo
with (security_invoker = true) as
select
  i.*,
  ST_AsGeoJSON(i.geom)::json as geom_json,
  s.name as sector_name,
  s.color as sector_color,
  p.name as project_name,
  az.name as admin_zone_name,
  pt.name as implementing_partner_name
from interventions i
left join sectors s on s.id = i.sector_id
left join projects p on p.id = i.project_id
left join admin_zones az on az.id = i.admin_zone_id
left join partners pt on pt.id = i.implementing_partner_id;
