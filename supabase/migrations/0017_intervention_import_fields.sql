-- TerraMEAL — 0017: champs métier pour la correspondance des colonnes à l'import (15.x).
-- Purement additif : toutes les colonnes sont nullables / avec défaut, aucune donnée existante
-- n'est modifiée. Permet de conserver à l'import les informations géographiques brutes, la
-- ventilation des bénéficiaires H/F, l'auteur de la réalisation, les photos, et un bucket
-- « autres » pour les colonnes intéressantes non prévues au catalogue.

-- Libellés géographiques bruts issus de la source. La résolution fine vers admin_zones
-- (province/commune/localité) reste faite à la revue STAGING via admin_zone_id ; ces colonnes
-- gardent la valeur telle qu'écrite dans le fichier source pour traçabilité et recherche.
alter table interventions add column if not exists country text;
alter table interventions add column if not exists region text;
alter table interventions add column if not exists province text;
alter table interventions add column if not exists commune text;
alter table interventions add column if not exists village text;

-- Auteur de la réalisation : un prestataire (entreprise/individu mandaté) ou une organisation
-- (ONG, service technique…). Texte libre + qualificatif — pas de FK : la source ne référence pas
-- forcément un partenaire déjà connu. implementing_partner_id (0015) reste le lien structuré.
alter table interventions add column if not exists author_type text
  check (author_type is null or author_type in ('prestataire', 'organisation'));
alter table interventions add column if not exists author_name text;

-- Ventilation des bénéficiaires. beneficiaries_total existe déjà (0004).
alter table interventions add column if not exists beneficiaries_female integer
  check (beneficiaries_female is null or beneficiaries_female >= 0);
alter table interventions add column if not exists beneficiaries_male integer
  check (beneficiaries_male is null or beneficiaries_male >= 0);

-- Nature de la réalisation telle que décrite par la source (distincte de type/category qui sont
-- normalisés en interne).
alter table interventions add column if not exists realisation_nature text;

-- Photos de la réalisation : tableau d'URLs / références (Supabase Storage ou lien externe).
alter table interventions add column if not exists photos jsonb not null default '[]'::jsonb;

-- « Autres » : colonnes de la source jugées intéressantes mais hors catalogue, conservées en
-- l'état sous forme d'objet clé/valeur (nom de colonne source -> valeur).
alter table interventions add column if not exists import_extras jsonb not null default '{}'::jsonb;

create index if not exists interventions_import_extras_gin on interventions using gin (import_extras);

-- Recréation de la vue carte : "i.*" change de forme (nouvelles colonnes insérées avant les
-- colonnes calculées de la vue), donc CREATE OR REPLACE VIEW est refusé — on droppe et recrée,
-- comme en 0016. Aucun autre objet ne dépend de interventions_geo.
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
