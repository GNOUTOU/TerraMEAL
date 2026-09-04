-- TerraMEAL — 0018 : masquage et corbeille (suppression réversible) des projets.
-- Purement additif : aucune colonne/table existante n'est modifiée ou supprimée.
-- Répond au besoin de la page « Projets » : action « masquer » (retire le projet de la liste
-- sans le supprimer) et action « supprimer » (envoie le projet dans une corbeille d'où il peut
-- être restauré, ou supprimé définitivement par un administrateur).

alter table projects add column if not exists is_hidden boolean not null default false;
alter table projects add column if not exists deleted_at timestamptz;
alter table projects add column if not exists deleted_by uuid references profiles(id) on delete set null;

create index if not exists projects_deleted_at_idx on projects (deleted_at);
create index if not exists projects_is_hidden_idx on projects (is_hidden);

-- Le portail public ne doit jamais exposer un projet masqué ou mis à la corbeille.
drop policy if exists anon_read on projects;
create policy anon_read on projects for select to anon using (
  (select (value#>>'{}')::boolean from app_settings where key = 'public_portal_enabled') is true
  and status in ('active','closed')
  and deleted_at is null
  and is_hidden = false
);
