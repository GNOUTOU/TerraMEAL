-- TerraMEAL — 0013: verrouillage colonne par colonne de "profiles"
-- RLS est ligne par ligne : la policy self_update (id = auth.uid()) autoriserait sinon un
-- utilisateur à s'auto-promouvoir admin en modifiant sa propre ligne. On complète donc RLS par
-- un contrôle au niveau colonne (REVOKE ciblé) : seules les colonnes non sensibles restent
-- éditables par un utilisateur sur sa propre ligne. role/is_active/donor_id/partner_id ne sont
-- modifiables que via le client admin (service_role, qui contourne les GRANT comme les RLS).
revoke update (role, is_active, donor_id, partner_id) on profiles from authenticated;
