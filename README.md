# TerraMEAL

**La donnée spatiale au service de la redevabilité.**

Plateforme WebSIG pour organisations humanitaires et de développement : centralisation des
données de projets, cartographie des interventions, suivi des indicateurs, contrôle qualité,
tableaux de bord et reporting. Voir `Cahier_des_charges_terraMEAL.md` pour la spécification
fonctionnelle complète.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (PostgreSQL + PostGIS + Auth +
Storage) · MapLibre GL JS · Apache ECharts.

## Démarrage

Voir [`SETUP.md`](./SETUP.md) pour la mise en route complète (schéma de base de données, premier
compte administrateur, connecteurs KoboToolbox/mWater).

```bash
npm install
npm run dev
```

## Structure

- `supabase/migrations/` — schéma complet de la base de données (référentiels, projets,
  interventions, indicateurs, pipeline RAW→STAGING→PRODUCTION, qualité, RLS).
- `supabase/seed.sql` — jeu de données de démonstration (pilote : 1 pays fictif, 2 projets, 4
  secteurs, 12 indicateurs).
- `app/(auth)/` — connexion, récupération de mot de passe.
- `app/(app)/` — application authentifiée (dashboard, carte, projets, interventions, indicateurs,
  import/synchronisation, qualité, vue bailleur, administration).
- `app/public/` — portail public (optionnel, désactivé par défaut).
- `lib/` — clients Supabase, actions serveur, règles de contrôle qualité, connecteurs Kobo/mWater.
