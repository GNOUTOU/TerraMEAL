-- TerraMEAL — données de démonstration (pilote : 1 pays, 2 projets, 4 secteurs, ~12 indicateurs)
-- Zones fictives ("Pays Pilote") pour ne pas prétendre représenter un pays réel avec exactitude.
-- À exécuter après les migrations. Ne crée AUCUN utilisateur (géré par Supabase Auth, voir README).

-- ---------- Secteurs ----------
insert into sectors (id, code, name, color) values
  ('10000000-0000-0000-0000-000000000001', 'SAN', 'Santé', '#dc2626'),
  ('10000000-0000-0000-0000-000000000002', 'NUT', 'Nutrition', '#f97316'),
  ('10000000-0000-0000-0000-000000000003', 'SECAL', 'Sécurité alimentaire', '#16a34a'),
  ('10000000-0000-0000-0000-000000000004', 'EHA', 'Eau, Hygiène, Assainissement', '#2563eb')
on conflict (id) do nothing;

insert into subsectors (sector_id, code, name) values
  ('10000000-0000-0000-0000-000000000001', 'SAN-PRIM', 'Santé primaire'),
  ('10000000-0000-0000-0000-000000000004', 'EHA-EAU', 'Point d''eau'),
  ('10000000-0000-0000-0000-000000000004', 'EHA-ASS', 'Assainissement')
on conflict do nothing;

-- ---------- Zones administratives (hiérarchie fictive) ----------
insert into admin_zones (id, level, code, name, parent_id, country_iso3, geom, centroid) values
  ('20000000-0000-0000-0000-000000000001', 'country', 'PP', 'Pays Pilote', null, 'PPT',
    ST_Multi(ST_MakeEnvelope(-2.5, 10.5, 1.5, 14.5, 4326)), ST_SetSRID(ST_MakePoint(-0.5, 12.5), 4326))
on conflict (id) do nothing;

insert into admin_zones (id, level, code, name, parent_id, country_iso3, geom, centroid) values
  ('20000000-0000-0000-0000-000000000010', 'region', 'PP-N', 'Région Nord', '20000000-0000-0000-0000-000000000001', 'PPT',
    ST_Multi(ST_MakeEnvelope(-2.5, 12.5, 1.5, 14.5, 4326)), ST_SetSRID(ST_MakePoint(-0.5, 13.5), 4326)),
  ('20000000-0000-0000-0000-000000000011', 'region', 'PP-S', 'Région Sud', '20000000-0000-0000-0000-000000000001', 'PPT',
    ST_Multi(ST_MakeEnvelope(-2.5, 10.5, 1.5, 12.5, 4326)), ST_SetSRID(ST_MakePoint(-0.5, 11.5), 4326))
on conflict (id) do nothing;

insert into admin_zones (id, level, code, name, parent_id, geom, centroid) values
  ('20000000-0000-0000-0000-000000000100', 'province', 'PP-N-A', 'Province Alpha', '20000000-0000-0000-0000-000000000010',
    ST_Multi(ST_MakeEnvelope(-2.5, 13.0, -0.5, 14.5, 4326)), ST_SetSRID(ST_MakePoint(-1.5, 13.75), 4326)),
  ('20000000-0000-0000-0000-000000000101', 'province', 'PP-S-B', 'Province Beta', '20000000-0000-0000-0000-000000000011',
    ST_Multi(ST_MakeEnvelope(-0.5, 10.5, 1.5, 12.5, 4326)), ST_SetSRID(ST_MakePoint(0.5, 11.5), 4326))
on conflict (id) do nothing;

insert into admin_zones (id, level, code, name, parent_id, geom, centroid) values
  ('20000000-0000-0000-0000-000000001000', 'commune', 'PP-N-A-1', 'Commune Alpha-1', '20000000-0000-0000-0000-000000000100',
    ST_Multi(ST_MakeEnvelope(-2.2, 13.2, -1.7, 13.7, 4326)), ST_SetSRID(ST_MakePoint(-1.95, 13.45), 4326)),
  ('20000000-0000-0000-0000-000000001001', 'commune', 'PP-N-A-2', 'Commune Alpha-2', '20000000-0000-0000-0000-000000000100',
    ST_Multi(ST_MakeEnvelope(-1.6, 13.2, -1.0, 13.9, 4326)), ST_SetSRID(ST_MakePoint(-1.3, 13.55), 4326)),
  ('20000000-0000-0000-0000-000000001010', 'commune', 'PP-S-B-1', 'Commune Beta-1', '20000000-0000-0000-0000-000000000101',
    ST_Multi(ST_MakeEnvelope(-0.3, 10.7, 0.4, 11.4, 4326)), ST_SetSRID(ST_MakePoint(0.05, 11.05), 4326))
on conflict (id) do nothing;

insert into admin_zones (id, level, code, name, parent_id, centroid) values
  ('20000000-0000-0000-0000-000000010001', 'locality', 'PP-N-A-1-a', 'Localité Alpha-1-a', '20000000-0000-0000-0000-000000001000', ST_SetSRID(ST_MakePoint(-2.05, 13.4), 4326)),
  ('20000000-0000-0000-0000-000000010002', 'locality', 'PP-N-A-1-b', 'Localité Alpha-1-b', '20000000-0000-0000-0000-000000001000', ST_SetSRID(ST_MakePoint(-1.85, 13.5), 4326)),
  ('20000000-0000-0000-0000-000000010003', 'locality', 'PP-N-A-2-a', 'Localité Alpha-2-a', '20000000-0000-0000-0000-000000001001', ST_SetSRID(ST_MakePoint(-1.35, 13.6), 4326)),
  ('20000000-0000-0000-0000-000000010004', 'locality', 'PP-S-B-1-a', 'Localité Beta-1-a', '20000000-0000-0000-0000-000000001010', ST_SetSRID(ST_MakePoint(0.1, 11.0), 4326))
on conflict (id) do nothing;

-- ---------- Bailleurs / partenaires ----------
insert into donors (id, code, name, type, country) values
  ('30000000-0000-0000-0000-000000000001', 'ECHO', 'ECHO', 'Institutionnel', 'Belgique'),
  ('30000000-0000-0000-0000-000000000002', 'UNICEF', 'UNICEF', 'Agence UN', 'États-Unis')
on conflict (id) do nothing;

insert into partners (id, code, name, type) values
  ('40000000-0000-0000-0000-000000000001', 'CROIX-R', 'Croix-Rouge locale', 'ONG nationale'),
  ('40000000-0000-0000-0000-000000000002', 'ASSO-EAU', 'Association Eau pour Tous', 'ONG locale')
on conflict (id) do nothing;

-- ---------- Sources de données (config vide — à renseigner par un admin) ----------
insert into data_sources (id, type, name, description, config, active) values
  ('50000000-0000-0000-0000-000000000001', 'kobo', 'KoboToolbox — Suivi WASH', 'Formulaire de suivi des points d''eau', '{}'::jsonb, false),
  ('50000000-0000-0000-0000-000000000002', 'mwater', 'mWater — Qualité de l''eau', 'Export mWater des tests de qualité', '{}'::jsonb, false)
on conflict (id) do nothing;

-- ---------- Projets ----------
insert into projects (id, code, name, description, status, start_date, end_date, year, reporting_period, budget, currency, donor_principal_id) values
  ('60000000-0000-0000-0000-000000000001', 'PRJ-2026-001', 'Renforcement de la résilience WASH', 'Accès à l''eau potable et assainissement en zone Nord.', 'active', '2026-01-01', '2026-12-31', 2026, 'Annuel', 1200000, 'USD', '30000000-0000-0000-0000-000000000001'),
  ('60000000-0000-0000-0000-000000000002', 'PRJ-2026-002', 'Appui à la sécurité alimentaire et nutrition', 'Distribution et suivi nutritionnel en zone Sud.', 'active', '2026-02-01', '2027-01-31', 2026, 'Annuel', 850000, 'USD', '30000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;

insert into project_donors (project_id, donor_id, amount, currency, is_principal) values
  ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 1200000, 'USD', true),
  ('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 850000, 'USD', true)
on conflict do nothing;

insert into project_partners (project_id, partner_id, role) values
  ('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'Mise en œuvre'),
  ('60000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Mise en œuvre')
on conflict do nothing;

insert into project_sectors (project_id, sector_id) values
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004'),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003')
on conflict do nothing;

insert into project_zones (project_id, admin_zone_id) values
  ('60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000010'),
  ('60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000011')
on conflict do nothing;

-- ---------- Indicateurs (référentiel) ----------
insert into indicators (id, code, label, unit, sector_id, frequency, baseline_value) values
  ('70000000-0000-0000-0000-000000000001', 'EHA-01', 'Nombre de points d''eau fonctionnels', 'points', '10000000-0000-0000-0000-000000000004', 'Trimestriel', 12),
  ('70000000-0000-0000-0000-000000000002', 'EHA-02', 'Taux de population avec accès à l''eau potable', '%', '10000000-0000-0000-0000-000000000004', 'Annuel', 45),
  ('70000000-0000-0000-0000-000000000003', 'EHA-03', 'Nombre de latrines construites', 'latrines', '10000000-0000-0000-0000-000000000004', 'Trimestriel', 0),
  ('70000000-0000-0000-0000-000000000004', 'NUT-01', 'Enfants dépistés pour malnutrition aiguë', 'enfants', '10000000-0000-0000-0000-000000000002', 'Mensuel', 0),
  ('70000000-0000-0000-0000-000000000005', 'NUT-02', 'Taux de guérison MAS', '%', '10000000-0000-0000-0000-000000000002', 'Trimestriel', 70),
  ('70000000-0000-0000-0000-000000000006', 'SECAL-01', 'Ménages bénéficiaires de transferts monétaires', 'ménages', '10000000-0000-0000-0000-000000000003', 'Mensuel', 0),
  ('70000000-0000-0000-0000-000000000007', 'SECAL-02', 'Tonnes de vivres distribuées', 'tonnes', '10000000-0000-0000-0000-000000000003', 'Trimestriel', 0),
  ('70000000-0000-0000-0000-000000000008', 'SAN-01', 'Consultations de santé primaire réalisées', 'consultations', '10000000-0000-0000-0000-000000000001', 'Mensuel', 0),
  ('70000000-0000-0000-0000-000000000009', 'SAN-02', 'Femmes enceintes ayant reçu des CPN', 'femmes', '10000000-0000-0000-0000-000000000001', 'Mensuel', 0),
  ('70000000-0000-0000-0000-000000000010', 'EHA-04', 'Personnes formées à l''hygiène', 'personnes', '10000000-0000-0000-0000-000000000004', 'Trimestriel', 0),
  ('70000000-0000-0000-0000-000000000011', 'NUT-03', 'Séances de sensibilisation nutritionnelle', 'séances', '10000000-0000-0000-0000-000000000002', 'Mensuel', 0),
  ('70000000-0000-0000-0000-000000000012', 'SECAL-03', 'Périmètres maraîchers réhabilités', 'périmètres', '10000000-0000-0000-0000-000000000003', 'Annuel', 0)
on conflict (id) do nothing;

insert into indicator_results (indicator_id, project_id, period, year, target_value, actual_value, validation_status) values
  ('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '2026-T1', 2026, 20, 14, 'validated'),
  ('70000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', '2026', 2026, 70, 52, 'validated'),
  ('70000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000001', '2026-T1', 2026, 100, 38, 'validated'),
  ('70000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000002', '2026-01', 2026, 500, 410, 'validated'),
  ('70000000-0000-0000-0000-000000000006', '60000000-0000-0000-0000-000000000002', '2026-01', 2026, 300, 300, 'validated')
on conflict do nothing;

-- ---------- Interventions (réalisations géolocalisées) ----------
insert into interventions (id, source, project_id, sector_id, subsector_id, category, type, name, admin_zone_id, geom, date, status, beneficiaries_total, validation_status, sensitivity_level, last_updated_at) values
  ('80000000-0000-0000-0000-000000000001', 'manual', '60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004',
    (select id from subsectors where code='EHA-EAU'), 'infrastructure', 'Forage', 'Forage — Localité Alpha-1-a',
    '20000000-0000-0000-0000-000000010001', ST_SetSRID(ST_MakePoint(-2.06, 13.41), 4326), '2026-03-10', 'termine', 850, 'published', 1, now()),
  ('80000000-0000-0000-0000-000000000002', 'manual', '60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004',
    (select id from subsectors where code='EHA-ASS'), 'infrastructure', 'Latrine familiale', 'Bloc de latrines — Localité Alpha-1-b',
    '20000000-0000-0000-0000-000000010002', ST_SetSRID(ST_MakePoint(-1.84, 13.49), 4326), '2026-04-02', 'termine', 210, 'validated', 1, now()),
  ('80000000-0000-0000-0000-000000000003', 'kobo', '60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004',
    (select id from subsectors where code='EHA-EAU'), 'infrastructure', 'Point d''eau', 'Point d''eau — Localité Alpha-2-a',
    '20000000-0000-0000-0000-000000010003', ST_SetSRID(ST_MakePoint(-1.36, 13.61), 4326), '2026-05-15', 'termine', 600, 'to_verify', 1, now()),
  ('80000000-0000-0000-0000-000000000004', 'manual', '60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
    null, 'activity', 'Dépistage nutritionnel', 'Session de dépistage — Localité Beta-1-a',
    '20000000-0000-0000-0000-000000010004', ST_SetSRID(ST_MakePoint(0.1, 11.0), 4326), '2026-02-20', 'termine', 410, 'published', 1, now())
on conflict (id) do nothing;

insert into infrastructures (intervention_id, infra_type, capacity, functional_status) values
  ('80000000-0000-0000-0000-000000000001', 'Forage', 850, 'functional'),
  ('80000000-0000-0000-0000-000000000002', 'Latrine familiale', 210, 'functional'),
  ('80000000-0000-0000-0000-000000000003', 'Point d''eau', 600, 'functional')
on conflict do nothing;

insert into activities (intervention_id, activity_type, participants_count, sessions_count, location_text) values
  ('80000000-0000-0000-0000-000000000004', 'Dépistage nutritionnel', 410, 3, 'Localité Beta-1-a')
on conflict do nothing;

insert into beneficiaries_breakdown (intervention_id, sex, age_bracket, count) values
  ('80000000-0000-0000-0000-000000000001', 'male', 'adulte', 400),
  ('80000000-0000-0000-0000-000000000001', 'female', 'adulte', 450),
  ('80000000-0000-0000-0000-000000000004', 'female', '0-5', 220),
  ('80000000-0000-0000-0000-000000000004', 'male', '0-5', 190)
on conflict do nothing;

-- ---------- Anomalies de démonstration (module Qualité) ----------
insert into anomalies (entity_table, entity_id, anomaly_type, severity, description, source, status) values
  ('interventions', '80000000-0000-0000-0000-000000000003', 'stale_data', 'warning', 'Donnée importée de Kobo en attente de vérification depuis plus de 30 jours.', 'kobo', 'open');
