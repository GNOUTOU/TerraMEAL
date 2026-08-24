# TerraMEAL — Guide de mise en route

## 1. Base de données Supabase

Le projet Supabase est déjà référencé dans `.env.local` (URL + clés). Il reste à appliquer le
schéma : les migrations SQL n'ont **pas encore été exécutées** sur ce projet.

### Option A — Supabase SQL Editor (le plus simple, aucun outil supplémentaire)

Dans le dashboard Supabase du projet → **SQL Editor**, exécutez, **dans l'ordre**, le contenu de
chaque fichier de `supabase/migrations/` (0001 → 0012), puis `supabase/seed.sql` (données de
démonstration, optionnel mais recommandé pour explorer l'application).

### Option B — Supabase CLI

```bash
npx supabase login                      # jeton d'accès personnel (supabase.com/dashboard/account/tokens)
npx supabase link --project-ref mtyqmvxovzttbehziftw
npx supabase db push                    # applique supabase/migrations/*.sql
psql "$(npx supabase db url)" -f supabase/seed.sql   # ou coller seed.sql dans le SQL Editor
```

`db push` demandera le mot de passe de la base (Project Settings → Database).

## 2. Premier utilisateur administrateur

L'application ne propose pas d'auto-inscription (section 6 du cahier des charges — les comptes
sont créés par un administrateur). Le tout premier admin doit donc être créé manuellement :

1. Dashboard Supabase → **Authentication → Users → Add user** (email + mot de passe, cochez
   "Auto Confirm User").
2. Le trigger `handle_new_user` crée automatiquement un profil TerraMEAL avec le rôle `meal_sig`.
3. Dans le **SQL Editor**, promouvez ce compte en administrateur :
   ```sql
   update profiles set role = 'admin' where email = 'votre-email@organisation.org';
   ```
4. Connectez-vous sur `/login` : vous avez maintenant accès à **Administration → Utilisateurs**
   pour créer les comptes suivants directement depuis l'interface.

## 3. Lancer l'application

```bash
npm run dev
```

Ouvrez `http://localhost:3000` → redirection vers `/login`.

## 4. KoboToolbox / mWater

Les connecteurs (sections 21/22) nécessitent un jeton d'API personnel, configuré par un
administrateur dans **Administration → Sources de données** :

- **KoboToolbox** : `{"base_url":"https://kf.kobotoolbox.org","api_token":"...","asset_uid":"...","default_project_id":"...","default_sector_id":"..."}`
- **mWater** : `{"base_url":"https://api.mwater.co","api_token":"...","dataset_id":"...","default_project_id":"..."}`

Le champ **mapping des champs** associe les noms de colonnes source aux champs TerraMEAL (`name`,
`type`, `date`, `beneficiaries_total`, `sector_name`, `admin_zone_name`...). Chaque synchronisation
place les nouvelles soumissions en `STAGING` — rien n'est publié directement (RG04) : un
utilisateur MEAL/Admin doit les relire dans **Import → Revue STAGING** avant publication.

## 5. Portail public (optionnel)

Désactivé par défaut. Pour l'activer : **Administration → Paramètres →
`public_portal_enabled`** → valeur `true`. La page publique est accessible sans connexion sur
`/public` et n'affiche que des données publiées, agrégées et non sensibles (niveau 1).

## 6. Stockage des documents/preuves

Le bucket Supabase Storage `documents` (privé) est créé par la migration `0011_storage.sql`. Les
téléversements se font depuis les fiches Projet/Intervention.

## 7. Ce qui est structurellement prêt mais nécessite un test en conditions réelles

- **Connecteurs Kobo/mWater** : implémentés contre les API REST documentées publiquement, mais non
  testés contre un compte réel (aucun accès fourni). Vérifiez le mapping des champs sur un petit
  échantillon avant une synchronisation complète.
- **Export GeoPackage** : non implémenté (nécessite des bindings GDAL non disponibles en fonction
  serverless) — CSV, Excel et GeoJSON sont disponibles à la place.
- **Export PDF avancé** : non implémenté en tant que tel ; les rapports peuvent être produits via
  impression navigateur (mise en page à soigner si besoin).
- **Synchronisation automatique planifiée** (Supabase Cron) : la synchronisation se déclenche pour
  l'instant manuellement, depuis **Import → KoboToolbox/mWater** (bouton "Synchroniser"). Pour
  l'automatiser, exposer `syncKoboSource`/`syncMwaterSource` (`lib/actions/import.ts`) via une
  route handler protégée par un secret, puis la planifier avec `pg_cron` ou une Supabase Edge
  Function planifiée.
