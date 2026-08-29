-- TerraMEAL — 0015: comble des écarts identifiés à la relecture du cahier des charges.
-- Purement additif : aucune colonne/table existante n'est modifiée ou supprimée.

-- 7.4 : la fiche projet doit pouvoir présenter des objectifs et des groupes cibles.
alter table projects add column if not exists objectives text;
alter table projects add column if not exists target_groups text;

-- 9 : un partenaire doit pouvoir être associé à une intervention (pas seulement au projet) —
-- utile quand plusieurs partenaires mettent en œuvre des réalisations différentes d'un même
-- projet. Nullable : n'impose rien sur les données existantes.
alter table interventions add column if not exists implementing_partner_id uuid references partners(id) on delete set null;
create index if not exists interventions_partner_idx on interventions (implementing_partner_id);

-- RLS : les partenaires peuvent lire les interventions qui leur sont explicitement rattachées,
-- même si le projet parent ne leur est pas autrement accessible (cas d'un partenaire ponctuel).
-- Reste soumis aux mêmes garde-fous que la policy externe existante (validé/publié, sensibilité <= 2).
drop policy if exists interventions_external_partner on interventions;
create policy interventions_external_partner on interventions for select to authenticated using (
  current_user_role() = 'partner'
  and implementing_partner_id in (select partner_id from profiles where id = auth.uid())
  and validation_status in ('validated','published')
  and sensitivity_level <= 2
);
