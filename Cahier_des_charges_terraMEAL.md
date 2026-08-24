CAHIER DES CHARGES FONCTIONNEL
Plateforme WebSIG TerraMEAL
Version adaptée — Next.js + Supabase
________________________________________
1. Présentation du projet
1.1 Nom du projet
TerraMEAL
Slogan
« La donnée spatiale au service de la redevabilité »
1.2 Nature du projet
TerraMEAL est une application web de type WebSIG destinée aux organisations humanitaires et de développement.
Elle doit permettre de centraliser, organiser, contrôler, cartographier, analyser et valoriser les données provenant des différents projets et programmes de l’organisation.
L’application ne remplace pas les outils de collecte terrain existants tels que KoboToolbox ou mWater.
Elle intervient principalement après la collecte afin de transformer les données provenant de plusieurs sources en une base de données institutionnelle unique, structurée, géographique, contrôlée et exploitable.
Le système doit servir simultanément :
•	au suivi des projets ;
•	au suivi des réalisations ;
•	à la cartographie des interventions ;
•	au suivi des indicateurs ;
•	au contrôle de la qualité des données ;
•	à la production de tableaux de bord ;
•	au reporting ;
•	à la redevabilité envers les bailleurs ;
•	à la conservation de la mémoire institutionnelle ;
•	à l’aide à la décision.
Source fonctionnelle :
________________________________________
2. Problèmes à résoudre
L’application doit répondre principalement aux problèmes suivants :
2.1 Dispersion des données
Les informations relatives aux projets sont actuellement susceptibles d’être réparties entre :
•	KoboToolbox ;
•	mWater ;
•	fichiers Excel ;
•	fichiers CSV ;
•	bases de données ;
•	rapports ;
•	fichiers SIG ;
•	différentes équipes ou différents projets.
TerraMEAL doit fournir un référentiel centralisé.
2.2 Difficulté de visualisation géographique
L’organisation doit pouvoir savoir rapidement :
•	où elle intervient ;
•	quels projets sont présents dans une zone ;
•	quelles réalisations ont été effectuées ;
•	quelles zones sont peu couvertes ;
•	quelles zones présentent plusieurs interventions.
2.3 Manque de traçabilité
Chaque donnée importante doit pouvoir être associée à :
•	sa source ;
•	sa date d’importation ;
•	sa dernière mise à jour ;
•	son statut de validation ;
•	l’utilisateur ayant effectué certaines modifications.
2.4 Qualité variable des données
Le système doit contribuer à identifier :
•	coordonnées GPS incorrectes ;
•	doublons ;
•	données incomplètes ;
•	références inconnues ;
•	incohérences géographiques ;
•	données obsolètes ;
•	dates incohérentes.
2.5 Difficulté de reporting
TerraMEAL doit réduire les traitements manuels nécessaires pour produire :
•	cartes ;
•	statistiques ;
•	rapports ;
•	données destinées aux bailleurs ;
•	synthèses de projets.
Source :
________________________________________
3. Objectif général
Concevoir et mettre en ligne une plateforme WebSIG permettant de :
•	centraliser les données des projets ;
•	géolocaliser les interventions ;
•	suivre les réalisations ;
•	suivre les bénéficiaires agrégés ;
•	gérer les indicateurs ;
•	contrôler la qualité des données ;
•	analyser les interventions ;
•	visualiser les informations sur une carte ;
•	produire des tableaux de bord ;
•	gérer les accès aux informations ;
•	assurer la traçabilité ;
•	produire des exports et rapports.
________________________________________
4. Objectifs spécifiques
TerraMEAL doit permettre de :
4.1 Centraliser les données
Créer une base institutionnelle unique regroupant :
•	projets ;
•	bailleurs ;
•	partenaires ;
•	secteurs ;
•	zones ;
•	interventions ;
•	infrastructures ;
•	activités ;
•	bénéficiaires agrégés ;
•	indicateurs ;
•	résultats ;
•	documents ;
•	données géographiques.
4.2 Géolocaliser les interventions
Chaque réalisation compatible avec une représentation géographique doit pouvoir être associée à une localisation.
4.3 Améliorer le suivi
Les utilisateurs doivent pouvoir suivre :
•	projets actifs ;
•	interventions réalisées ;
•	infrastructures ;
•	activités ;
•	indicateurs ;
•	populations atteintes ;
•	état des données.
4.4 Renforcer la redevabilité
Le système doit produire des informations vérifiables à destination :
•	de la direction ;
•	des équipes internes ;
•	des partenaires ;
•	des bailleurs.
4.5 Améliorer la qualité des données
Des règles automatiques et un workflow de validation doivent empêcher la publication directe de données incorrectes.
4.6 Faciliter la prise de décision
Les utilisateurs doivent pouvoir comparer les interventions par :
•	zone ;
•	projet ;
•	secteur ;
•	bailleur ;
•	période ;
•	indicateur.
4.7 Garantir la mémoire institutionnelle
Les données doivent rester disponibles même après la fin d’un projet ou le départ d’un collaborateur.
Source :
________________________________________
5. Utilisateurs et rôles
Le système comprend plusieurs profils.
5.1 Administrateur TerraMEAL
L’administrateur dispose du niveau d’accès le plus élevé.
Il peut notamment :
•	créer des utilisateurs ;
•	modifier des utilisateurs ;
•	désactiver des comptes ;
•	attribuer des rôles ;
•	gérer les permissions ;
•	gérer les référentiels ;
•	gérer les sources de données ;
•	consulter les journaux d’activité ;
•	consulter les données ;
•	administrer les paramètres généraux.
________________________________________
5.2 Utilisateur MEAL / SIG
Il peut :
•	consulter les projets ;
•	consulter les interventions ;
•	importer des données ;
•	lancer ou suivre les synchronisations ;
•	contrôler la qualité des données ;
•	traiter les anomalies ;
•	valider certaines données ;
•	exploiter les cartes ;
•	réaliser des analyses ;
•	utiliser les tableaux de bord ;
•	exporter des données autorisées.
________________________________________
5.3 Responsable Programme / Projet
Il peut principalement :
•	consulter ses projets ;
•	consulter les interventions associées ;
•	mettre à jour les données autorisées ;
•	vérifier les réalisations ;
•	participer à la validation ;
•	consulter les indicateurs ;
•	consulter les cartes ;
•	consulter les tableaux de bord.
Son accès doit pouvoir être limité aux projets qui lui sont attribués.
________________________________________
5.4 Direction
La direction dispose principalement d’un accès de consultation stratégique.
Elle peut consulter :
•	portefeuille de projets ;
•	indicateurs consolidés ;
•	principales réalisations ;
•	zones couvertes ;
•	bénéficiaires agrégés ;
•	performances ;
•	cartes institutionnelles ;
•	synthèses.
________________________________________
5.5 Bailleur / Partenaire
Un bailleur ne doit consulter que les informations explicitement autorisées.
L’accès peut être limité par :
•	bailleur ;
•	projet ;
•	zone ;
•	indicateur ;
•	type de données ;
•	sensibilité.
________________________________________
5.6 Public / Communication
Lorsque le portail public est activé, le public ne doit accéder qu’aux données :
•	validées ;
•	publiables ;
•	agrégées ;
•	anonymisées ;
•	non sensibles.
Les coordonnées précises sensibles ne doivent pas être exposées.
Source :
________________________________________
6. Gestion de l’authentification
Le système doit permettre :
•	connexion par compte utilisateur ;
•	déconnexion ;
•	récupération de compte ;
•	changement de mot de passe ;
•	gestion des sessions ;
•	activation ou désactivation d’un utilisateur ;
•	attribution de rôles ;
•	gestion des autorisations.
Les fonctions accessibles doivent dépendre du rôle connecté.
________________________________________
7. Gestion des projets
Chaque projet dispose d’une fiche dédiée.
7.1 Informations générales
La fiche projet peut contenir :
•	code projet ;
•	nom du projet ;
•	description ;
•	responsable ;
•	statut ;
•	date de début ;
•	date de fin ;
•	année ;
•	période de reporting.
7.2 Financement
Possibilité d’associer :
•	bailleur principal ;
•	cofinancements ;
•	budget lorsque cette information est autorisée ;
•	devise.
7.3 Informations géographiques
Possibilité d’associer le projet à :
•	pays ;
•	régions ;
•	provinces ;
•	communes ;
•	localités ;
•	zones d’intervention.
7.4 Informations programmatiques
Possibilité d’associer :
•	secteurs ;
•	sous-secteurs ;
•	groupes cibles ;
•	objectifs ;
•	indicateurs.
7.5 Ressources
Selon les permissions :
•	documents ;
•	photos ;
•	preuves ;
•	liens ;
•	rapports.
7.6 Statuts
Un projet peut notamment être :
•	en préparation ;
•	actif ;
•	suspendu ;
•	clôturé ;
•	archivé.
Source :
________________________________________
8. Gestion des bailleurs
Le système doit permettre :
•	création d’un bailleur ;
•	modification ;
•	désactivation ;
•	consultation ;
•	association avec un ou plusieurs projets ;
•	visualisation des projets financés ;
•	consultation des indicateurs correspondants.
________________________________________
9. Gestion des partenaires
Le système doit permettre :
•	création d’un partenaire ;
•	modification ;
•	association aux projets ;
•	association aux interventions ;
•	filtrage des résultats par partenaire.
________________________________________
10. Gestion des secteurs
Le système doit disposer d’un référentiel de secteurs.
Exemples mentionnés dans le projet :
•	santé ;
•	nutrition ;
•	sécurité alimentaire ;
•	moyens d’existence ;
•	éducation ;
•	eau ;
•	hygiène ;
•	assainissement ;
•	protection.
Le système doit permettre d’ajouter et administrer les secteurs.
________________________________________
11. Gestion des zones géographiques
La plateforme doit gérer différents niveaux administratifs.
Exemples :
•	pays ;
•	région ;
•	province ;
•	commune ;
•	localité.
Les zones doivent pouvoir être utilisées pour :
•	géolocalisation ;
•	filtrage ;
•	statistiques ;
•	agrégation ;
•	contrôle GPS ;
•	visualisation cartographique.
________________________________________
12. Gestion des interventions et réalisations
L’intervention constitue une entité centrale de TerraMEAL.
Une intervention doit pouvoir contenir :
•	identifiant unique ;
•	identifiant provenant de la source ;
•	projet ;
•	secteur ;
•	catégorie ;
•	type ;
•	localisation ;
•	zone administrative ;
•	coordonnées ;
•	géométrie ;
•	date ;
•	statut ;
•	bénéficiaires agrégés ;
•	indicateurs ;
•	preuves ;
•	source ;
•	statut de validation ;
•	date de dernière mise à jour.
Source :
________________________________________
13. Gestion des infrastructures
Le système doit pouvoir représenter différentes infrastructures.
Exemples :
•	forage ;
•	point d’eau ;
•	latrine ;
•	école ;
•	salle de classe ;
•	centre de santé ;
•	infrastructure réhabilitée ;
•	périmètre maraîcher ;
•	ouvrage hydraulique ;
•	infrastructure productive.
Une infrastructure peut notamment disposer de :
•	type ;
•	capacité ;
•	statut fonctionnel ;
•	date ;
•	projet associé ;
•	localisation ;
•	preuves.
________________________________________
14. Gestion des activités
Le système doit également gérer les interventions non physiques telles que :
•	formations ;
•	distributions ;
•	activités communautaires ;
•	sessions ;
•	sites de prise en charge ;
•	espaces sécurisés.
Une activité peut notamment contenir :
•	type ;
•	projet ;
•	lieu ;
•	date ;
•	nombre de participants ;
•	nombre de sessions ;
•	statut.
________________________________________
15. WebSIG — carte interactive
Le système doit proposer une carte interactive centrale.
15.1 Navigation
L’utilisateur doit pouvoir :
•	zoomer ;
•	dézoomer ;
•	déplacer la carte ;
•	recentrer la carte ;
•	utiliser sa position lorsque cela est autorisé.
15.2 Couches
L’utilisateur doit pouvoir :
•	afficher des couches ;
•	masquer des couches ;
•	sélectionner différentes informations ;
•	consulter une légende.
15.3 Recherche cartographique
Recherche possible par :
•	projet ;
•	localité ;
•	commune ;
•	infrastructure ;
•	intervention ;
•	réalisation.
15.4 Fiches contextuelles
En cliquant sur un élément de la carte, l’utilisateur doit pouvoir afficher une fiche synthétique.
15.5 Géométries
TerraMEAL doit prendre en charge :
•	points ;
•	lignes ;
•	polygones.
15.6 Analyses simples
Selon les besoins, le système doit permettre :
•	analyse de couverture ;
•	densité ;
•	proximité ;
•	distance ;
•	chevauchement ;
•	sélection spatiale.
Source :
________________________________________
16. Fonds cartographiques
La plateforme peut utiliser notamment :
•	OpenStreetMap ;
•	imagerie satellite autorisée ;
•	fonds administratifs ;
•	fonds cartographiques adaptés aux rapports et dashboards.
________________________________________
17. Filtres
Les filtres doivent pouvoir être combinés.
Ils doivent notamment porter sur :
Géographie
•	pays ;
•	région ;
•	province ;
•	commune ;
•	localité.
Projet
•	projet ;
•	programme ;
•	bailleur ;
•	partenaire.
Intervention
•	secteur ;
•	sous-secteur ;
•	type ;
•	statut.
Temps
•	année ;
•	période.
Données
•	population cible ;
•	source ;
•	statut de validation ;
•	fraîcheur de la donnée.
Lorsqu’un filtre est appliqué, les éléments correspondants doivent être actualisés simultanément :
•	carte ;
•	KPI ;
•	graphiques ;
•	tableaux.
Source :
________________________________________
18. Tableau de bord
Après connexion, l’utilisateur doit disposer d’un dashboard adapté à son rôle.
18.1 KPI principaux
Exemples :
•	nombre de projets actifs ;
•	nombre total de projets ;
•	nombre de communes couvertes ;
•	nombre de localités couvertes ;
•	nombre de réalisations ;
•	bénéficiaires agrégés ;
•	nombre de partenaires ;
•	nombre de bailleurs.
18.2 Analyses
Possibilité de visualiser les interventions par :
•	secteur ;
•	zone ;
•	bailleur ;
•	projet ;
•	année ;
•	statut.
18.3 Performance
Possibilité d’afficher :
•	cible ;
•	réalisé ;
•	taux d’atteinte ;
•	évolution.
18.4 Qualité
Le dashboard doit pouvoir afficher des alertes concernant :
•	données incomplètes ;
•	anomalies GPS ;
•	doublons ;
•	données anciennes ;
•	erreurs de synchronisation.
Source :
________________________________________
19. Gestion des bénéficiaires
Le système privilégie les données agrégées.
Il doit être possible de gérer :
•	total des bénéficiaires ;
•	sexe ;
•	tranche d’âge ;
•	zone ;
•	projet ;
•	activité ;
•	période ;
•	autres désagrégations autorisées.
Les données individuelles nominatives ne doivent pas être exposées dans le WebSIG public ou les vues externes.
Source :
________________________________________
20. Gestion des indicateurs
TerraMEAL doit disposer d’un référentiel d’indicateurs.
Chaque indicateur peut contenir :
•	code ;
•	libellé ;
•	définition ;
•	unité ;
•	secteur ;
•	source ;
•	méthode de calcul ;
•	numérateur ;
•	dénominateur ;
•	fréquence ;
•	période ;
•	désagrégations ;
•	référence ;
•	cible ;
•	réalisé ;
•	taux d’atteinte ;
•	statut de validation.
________________________________________
21. Intégration KoboToolbox
TerraMEAL doit récupérer les données provenant de KoboToolbox.
Le système doit :
•	identifier les formulaires concernés ;
•	récupérer les données autorisées ;
•	conserver l’identifiant Kobo d’origine ;
•	faire correspondre les champs Kobo avec ceux de TerraMEAL ;
•	gérer l’évolution des formulaires ;
•	récupérer les informations géographiques ;
•	gérer les médias autorisés ;
•	détecter les anomalies ;
•	éviter les doublons ;
•	enregistrer les synchronisations.
Les données Kobo ne doivent pas être publiées directement sans contrôle.
Source :
________________________________________
22. Intégration mWater
Le système doit pouvoir récupérer des données provenant de mWater.
Il doit notamment :
•	conserver les identifiants mWater ;
•	faire correspondre les données avec TerraMEAL ;
•	éviter les doublons ;
•	harmoniser les unités ;
•	harmoniser les statuts ;
•	contrôler les positions géographiques ;
•	appliquer les règles de validation.
Source :
________________________________________
23. Import manuel de fichiers
L’application doit permettre d’importer des fichiers.
Formats prévus notamment :
•	CSV ;
•	Excel ;
•	GeoJSON ;
•	KML ;
•	GeoPackage.
Processus d’import
1.	Sélection du fichier.
2.	Lecture des colonnes.
3.	Correspondance entre colonnes et champs TerraMEAL.
4.	Contrôle du fichier.
5.	Identification des anomalies.
6.	Prévisualisation.
7.	Confirmation.
8.	Import des données.
9.	Validation.
10.	Publication après contrôle.
Source :
________________________________________
24. Pipeline de traitement des données
Les données externes doivent suivre le processus :
SOURCE → RAW → STAGING → VALIDATION → PRODUCTION
RAW
Conservation des données telles qu’elles proviennent de la source.
STAGING
Zone permettant :
•	transformation ;
•	nettoyage ;
•	normalisation ;
•	contrôle ;
•	détection des anomalies.
PRODUCTION
Contient uniquement les données validées et utilisables par l’application.
Source :
________________________________________
25. Contrôle de qualité
Le système doit appliquer des contrôles automatiques.
25.1 Géographie
Détecter notamment :
•	coordonnées absentes ;
•	coordonnées égales à 0,0 ;
•	point hors du pays ;
•	point incohérent avec la commune ;
•	coordonnées identiques en quantité anormale.
25.2 Référentiels
Détecter notamment :
•	projet inconnu ;
•	bailleur incohérent ;
•	secteur inconnu ;
•	zone inconnue.
25.3 Dates
Identifier les dates incohérentes, notamment certaines dates futures injustifiées.
25.4 Doublons
Identifier les doublons potentiels selon :
•	source ;
•	site ;
•	date ;
•	type ;
•	identifiant source.
25.5 Complétude
Identifier les champs obligatoires manquants.
25.6 Fraîcheur
Identifier les données n’ayant pas été revues ou mises à jour dans le délai défini.
Source :
________________________________________
26. Workflow de validation
Une donnée peut passer par plusieurs états.
Exemple de processus :
Importé → À vérifier → Validé → Publié → Archivé
Une donnée rejetée doit rester traçable avec son motif.
Aucune donnée provenant d’une source externe ne doit être supprimée automatiquement uniquement parce qu’elle contient une erreur.
Source :
________________________________________
27. Module Qualité
Une page dédiée doit permettre aux utilisateurs autorisés de consulter :
•	anomalies ;
•	type d’anomalie ;
•	niveau de gravité ;
•	données concernées ;
•	date de détection ;
•	source ;
•	responsable du traitement ;
•	statut ;
•	historique de résolution.
L’utilisateur doit pouvoir :
•	ouvrir une anomalie ;
•	analyser la donnée ;
•	corriger lorsque son rôle le permet ;
•	rejeter ;
•	valider ;
•	ajouter un commentaire ;
•	clôturer l’anomalie.
________________________________________
28. Recherche globale
Une barre de recherche globale doit permettre de rechercher notamment :
•	projet ;
•	localité ;
•	commune ;
•	réalisation ;
•	partenaire ;
•	bailleur.
Lorsqu’un résultat est sélectionné, l’utilisateur doit pouvoir :
•	accéder à sa fiche ;
•	ou localiser l’élément sur la carte.
Source :
________________________________________
29. Fiche Projet
Une fiche projet doit présenter au minimum :
•	titre ;
•	description ;
•	bailleur ;
•	partenaires ;
•	période ;
•	statut ;
•	secteurs ;
•	zone de couverture ;
•	bénéficiaires ;
•	réalisations ;
•	communes ;
•	localités ;
•	indicateurs ;
•	carte ;
•	progression ;
•	documents autorisés.
________________________________________
30. Fiche Intervention
La fiche d’une intervention doit présenter :
•	nom ;
•	type ;
•	projet ;
•	bailleur ;
•	localité ;
•	commune ;
•	date ;
•	statut ;
•	bénéficiaires ;
•	indicateurs ;
•	preuve ou photographie autorisée ;
•	description ;
•	coordonnées ;
•	source ;
•	identifiant source ;
•	statut de validation ;
•	date de dernière mise à jour.
Source :
________________________________________
31. Vue Bailleur
Un utilisateur Bailleur doit disposer d’une vue spécifiquement filtrée.
Elle peut présenter :
•	projets financés ;
•	KPI ;
•	interventions ;
•	secteurs ;
•	zones ;
•	réalisations ;
•	indicateurs ;
•	cartes ;
•	preuves autorisées ;
•	exports autorisés.
Il ne doit jamais avoir accès aux données d’un autre bailleur sans autorisation.
________________________________________
32. Portail public
Le portail public est facultatif.
Lorsqu’il est activé, seules des informations :
•	validées ;
•	anonymisées ;
•	agrégées ;
•	non sensibles ;
•	explicitement autorisées
peuvent être diffusées.
Source :
________________________________________
33. Exports
Les utilisateurs autorisés doivent pouvoir exporter certaines informations.
Formats prévus :
•	CSV ;
•	Excel ;
•	GeoJSON ;
•	GeoPackage ;
•	PDF ;
•	PNG.
Les exports doivent respecter :
•	rôle ;
•	permissions ;
•	projet ;
•	bailleur ;
•	zone ;
•	sensibilité des données.
Source :
________________________________________
34. Gestion des preuves et documents
Une intervention peut être associée à :
•	photographie ;
•	document ;
•	preuve ;
•	ressource.
Chaque élément doit disposer d’un niveau de visibilité.
Exemples :
•	public ;
•	restreint ;
•	sensible ;
•	interdit à la diffusion.
________________________________________
35. Journal d’activité
Les actions importantes doivent être enregistrées.
Le journal doit pouvoir contenir :
•	utilisateur ;
•	action ;
•	date ;
•	heure ;
•	objet concerné ;
•	ancienne valeur lorsque nécessaire ;
•	nouvelle valeur lorsque nécessaire ;
•	source ;
•	statut de validation.
Les opérations sensibles telles que certains exports ou publications doivent être traçables.
________________________________________
36. Notifications et alertes internes
Le système pourra afficher des alertes concernant notamment :
•	anomalie de données ;
•	synchronisation échouée ;
•	donnée nécessitant une validation ;
•	donnée obsolète ;
•	champ obligatoire manquant ;
•	erreur d’import.
Les notifications automatiques avancées peuvent être progressivement enrichies après le MVP.
________________________________________
37. Sécurité fonctionnelle
Le système doit garantir notamment :
•	authentification obligatoire pour les espaces privés ;
•	gestion des rôles ;
•	contrôle d’accès aux données ;
•	limitation des permissions ;
•	séparation des données publiques et privées ;
•	protection des informations sensibles ;
•	journalisation ;
•	sauvegardes ;
•	gestion sécurisée des documents.
Source :
________________________________________
38. Classification des données
Le système doit pouvoir distinguer plusieurs niveaux.
Niveau 1 — Public
Exemples :
•	KPI agrégés ;
•	informations publiables ;
•	grandes zones géographiques.
Niveau 2 — Restreint
Accessible uniquement aux utilisateurs autorisés.
Niveau 3 — Sensible
Exemples :
•	coordonnées précises sensibles ;
•	certaines photographies ;
•	informations opérationnelles.
Accès interne fortement contrôlé.
Niveau 4 — Très sensible
Exemples :
•	données personnelles ;
•	cas individuels ;
•	localisations présentant des risques.
Ces informations sont hors du périmètre normal du MVP sauf dispositif spécifique.
Source :
________________________________________
39. Sauvegarde et restauration
Le système doit prévoir :
•	sauvegardes automatiques ;
•	conservation de plusieurs sauvegardes ;
•	restauration des données ;
•	tests réguliers de restauration ;
•	procédure documentée.
________________________________________
40. Responsive Design
L’application doit fonctionner sur :
•	ordinateur ;
•	tablette ;
•	smartphone.
Les fonctions WebSIG complexes seront principalement optimisées pour les écrans d’ordinateur.
La consultation mobile doit néanmoins rester fluide et lisible.
________________________________________
41. Interface utilisateur
L’interface doit être :
•	professionnelle ;
•	simple ;
•	claire ;
•	cohérente ;
•	responsive ;
•	accessible aux utilisateurs non spécialistes SIG.
Les fonctions affichées doivent dépendre du rôle de l’utilisateur.
________________________________________
42. Principaux écrans
L’application doit au minimum disposer des écrans suivants :
Connexion
•	identification ;
•	mot de passe ;
•	récupération du compte.
Dashboard
•	KPI ;
•	graphiques ;
•	carte ;
•	filtres ;
•	alertes.
WebGIS
•	carte plein écran ;
•	couches ;
•	légende ;
•	filtres ;
•	recherche ;
•	popup ;
•	sélection ;
•	exports.
Projets
•	liste ;
•	recherche ;
•	filtres ;
•	fiche.
Interventions
•	liste ;
•	carte ;
•	filtres ;
•	recherche.
Indicateurs
•	cibles ;
•	réalisations ;
•	taux d’atteinte ;
•	évolution.
Import / Synchronisation
•	KoboToolbox ;
•	mWater ;
•	fichiers ;
•	historique.
Qualité
•	anomalies ;
•	contrôles ;
•	corrections ;
•	historique.
Vue Bailleur
•	KPI ;
•	carte ;
•	projets ;
•	indicateurs ;
•	exports.
Administration
•	utilisateurs ;
•	rôles ;
•	référentiels ;
•	sources ;
•	paramètres ;
•	logs.
Source :
________________________________________
43. Données principales à gérer
Le système doit notamment gérer les entités suivantes :
•	utilisateurs ;
•	rôles ;
•	bailleurs ;
•	partenaires ;
•	projets ;
•	secteurs ;
•	zones administratives ;
•	localisations ;
•	interventions ;
•	infrastructures ;
•	activités ;
•	bénéficiaires agrégés ;
•	indicateurs ;
•	résultats d’indicateurs ;
•	preuves ;
•	documents ;
•	anomalies ;
•	synchronisations ;
•	imports ;
•	journaux d’activité.
________________________________________
44. Règles de gestion principales
RG01
Chaque projet doit disposer d’un identifiant unique.
RG02
Chaque intervention doit appartenir à un projet.
RG03
Chaque donnée importée doit conserver son identifiant source lorsque celui-ci existe.
RG04
Une donnée provenant de KoboToolbox ou mWater ne doit pas être publiée directement sans contrôle.
RG05
Une donnée comportant une anomalie bloquante ne doit pas passer automatiquement en production.
RG06
Les utilisateurs ne peuvent accéder qu’aux données autorisées par leur rôle.
RG07
Un bailleur ne doit pas accéder aux données d’un autre bailleur sauf autorisation explicite.
RG08
Les données sensibles ne doivent pas être visibles publiquement.
RG09
Les modifications importantes doivent être traçables.
RG10
Les bénéficiaires doivent être principalement gérés sous forme agrégée.
RG11
Chaque intervention publiée doit disposer :
•	d’une source ;
•	d’un statut de validation ;
•	d’une date de mise à jour.
RG12
Les données rejetées doivent rester traçables.
________________________________________
45. Parcours principal d’une donnée
Collecte terrain
      ↓
KoboToolbox / mWater
      ↓
Récupération TerraMEAL
      ↓
RAW
      ↓
Nettoyage / Normalisation
      ↓
Contrôle qualité
      ↓
STAGING
      ↓
Validation
      ↓
PRODUCTION
      ↓
Carte / Dashboard / Fiches / Exports
________________________________________
46. Parcours utilisateur principal
Connexion
   ↓
Dashboard
   ↓
Sélection d'un projet / filtre
   ↓
Consultation carte
   ↓
Sélection d'une intervention
   ↓
Consultation de la fiche
   ↓
Analyse des indicateurs
   ↓
Export si autorisé
________________________________________
47. MVP — Version minimale à développer
La première version doit prioritairement comprendre :
1.	Authentification.
2.	Gestion des utilisateurs.
3.	Gestion des rôles.
4.	Gestion des projets.
5.	Gestion des bailleurs.
6.	Gestion des secteurs.
7.	Gestion des zones administratives.
8.	Base géospatiale.
9.	Connecteur KoboToolbox.
10.	Connecteur mWater.
11.	Import CSV/Excel.
12.	Carte interactive.
13.	Filtres.
14.	Recherche.
15.	Fiche Projet.
16.	Fiche Intervention.
17.	Dashboard KPI.
18.	Gestion des indicateurs.
19.	Contrôle qualité.
20.	Workflow de validation.
21.	Module des anomalies.
22.	Exports CSV.
23.	Exports GeoJSON.
24.	Gestion des permissions.
25.	Journalisation.
26.	Sauvegarde.
27.	Vue bailleur filtrée.
28.	Documentation minimale.
Le document original recommande pour le pilote : 1 pays, 2 projets, KoboToolbox + mWater, jusqu’à 4 secteurs et 10 à 15 indicateurs prioritaires.
________________________________________
48. Éléments hors MVP
Ne font pas partie du périmètre prioritaire :
•	suivi nominatif individuel des bénéficiaires ;
•	publication de localisations sensibles ;
•	portail public multi-pays complet ;
•	intelligence artificielle prédictive ;
•	recommandations automatisées ;
•	comptabilité complète ;
•	remplacement de KoboToolbox ;
•	remplacement de mWater ;
•	gestion documentaire complète.
Source :
________________________________________
49. Évolutions futures
Après validation du MVP, TerraMEAL pourra évoluer vers :
•	application mobile ;
•	fonctionnement hors connexion ;
•	notifications automatiques ;
•	analyses spatiales avancées ;
•	gap analysis ;
•	exploitation d’imagerie satellite ;
•	Story Maps ;
•	portail Open Data ;
•	génération automatisée de rapports ;
•	détection avancée d’anomalies ;
•	prévisions ;
•	intégration Power BI ;
•	intégration DHIS2 ;
•	intégration de systèmes nationaux ;
•	intégration d’autres API institutionnelles ;
•	support multi-pays ;
•	support de plusieurs langues.
Source :
________________________________________
50. Critères d’acceptation principaux du MVP
Le MVP pourra être considéré comme fonctionnel lorsque :
CA01
KoboToolbox et mWater peuvent être intégrés sans créer de doublons non contrôlés.
CA02
Les données conformes peuvent être traitées automatiquement.
CA03
Les points GPS sont correctement localisés ou signalés lorsqu’ils présentent une anomalie.
CA04
Les filtres fonctionnent simultanément sur :
•	carte ;
•	KPI ;
•	graphiques ;
•	tableaux.
CA05
Chaque intervention dispose d’une source et d’un statut de validation.
CA06
Les données sensibles ne sont pas exposées dans les vues externes.
CA07
Les utilisateurs ne voient que les données autorisées.
CA08
Le module Qualité affiche :
•	anomalies GPS ;
•	doublons ;
•	champs obligatoires manquants.
CA09
Les utilisateurs autorisés peuvent exporter les données.
CA10
Une sauvegarde peut être restaurée avec succès.
CA11
La documentation utilisateur et administrateur est disponible.
Source :
________________________________________
51. Exigences de performance
Le système doit viser :
•	dashboard initial rapidement accessible ;
•	chargement progressif des cartes ;
•	pagination des longues listes ;
•	optimisation des recherches ;
•	optimisation des données géographiques ;
•	fonctionnement avec plusieurs centaines de milliers d’enregistrements à terme.
Le document source fixe notamment comme cible MVP un chargement initial du dashboard inférieur à 5 secondes sur une connexion standard.
________________________________________
52. Exigences de traçabilité
Pour les opérations sensibles, le système doit permettre de déterminer :
•	qui a effectué l’action ;
•	quand ;
•	sur quelle donnée ;
•	quelle modification a été réalisée ;
•	quel était le statut de la donnée ;
•	quelle était sa source.
________________________________________
53. Exigences d’interopérabilité
Le système doit pouvoir communiquer avec d’autres services via API ou fichiers.
Les données doivent pouvoir être importées ou exportées dans des formats ouverts lorsque cela est pertinent.
TerraMEAL doit éviter une dépendance technique empêchant la récupération future de ses données.
________________________________________
54. Exigences de sécurité
La plateforme doit prévoir :
•	HTTPS ;
•	authentification ;
•	contrôle d’accès ;
•	gestion des rôles ;
•	protection des données sensibles ;
•	validation des entrées ;
•	protection des secrets ;
•	séparation des environnements ;
•	journalisation ;
•	sauvegardes ;
•	restauration.
________________________________________
55. Technologies à utiliser
•	Next.js
•	TypeScript
•	Supabase
•	PostgreSQL
•	PostGIS
•	Supabase Auth
•	Supabase Storage
•	Supabase Edge Functions
•	Supabase Cron
•	MapLibre GL JS
•	Apache ECharts
•	Vercel
•	Git
•	GitHub
Sources de données externes
•	KoboToolbox
•	mWater
•	OpenStreetMap
________________________________________
56. Architecture simplifiée retenue
KoboToolbox / mWater
          │
          ▼
       TerraMEAL
          │
          ▼
      Next.js
          │
          ▼
       Supabase
   PostgreSQL + PostGIS
          │
          ├── Auth
          ├── Storage
          ├── RAW
          ├── STAGING
          └── PRODUCTION
          │
          ▼
  MapLibre + ECharts
          │
          ▼
Carte / Dashboard / Rapports
________________________________________
57. Résultat attendu
À terme, TerraMEAL doit permettre à l’organisation de répondre rapidement à des questions telles que :
•	Où intervenons-nous ?
•	Quels projets sont actuellement actifs ?
•	Quels bailleurs financent quels projets ?
•	Quelles réalisations ont été effectuées ?
•	Où sont situées les réalisations ?
•	Combien de personnes ont été atteintes ?
•	Quels résultats ont été obtenus ?
•	Quels indicateurs progressent correctement ?
•	Quelles zones sont insuffisamment couvertes ?
•	Où existe-t-il des chevauchements d’intervention ?
•	Quelles infrastructures ont été construites ?
•	Quel est leur état ?
•	Quelles données sont récentes ?
•	Quelles données doivent être corrigées ?
•	Quelles données ont été validées ?
•	Quelle est la source d’une information donnée ?
TerraMEAL doit ainsi constituer à la fois :
un outil WebSIG + un outil MEAL + un système de suivi des projets + un outil de reporting + un référentiel institutionnel + un outil d’aide à la décision.
Cette finalité correspond directement à la vision cible définie dans le cahier des charges d’origine.
