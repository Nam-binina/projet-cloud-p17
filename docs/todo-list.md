# TODO - CLOUD-REQ-001 Fonctionnalites manquantes

|partie|categorie|a faire|contenu|but|responsable|branche|
|---|---|---|---|---|---|---|
|auth|swagger|ajouter Swagger UI|npm: swagger-ui-express + swagger-jsdoc, route GET /docs|documenter l API d auth|a definir|feature-swagger|
|auth|swagger|decrire endpoints auth|OpenAPI: /api/register, /api/login, /api/logout, /api/reset-password|referencer auth hybride|a definir|feature-swagger|
|auth|swagger|decrire endpoints users|OpenAPI: /api/users, /api/firebase/block-user, /api/firebase/unblock-user|documenter gestion utilisateurs|a definir|feature-swagger|
|auth|swagger|decrire endpoints signalements|OpenAPI: /api/signalements, /api/signalements/:id, /photos|documenter module travaux|a definir|feature-swagger|
|auth|sessions|ajouter expiration token PG|signer JWT (exp 24h) au lieu de base64|securiser sessions offline|a definir|feature-sessions|
|auth|sessions|verifier JWT middleware|verifier signature/exp sur token PG dans middleware|refuser tokens perimes|a definir|feature-sessions|
|auth|sessions|ajouter refresh optionnel|endpoint /api/token/refresh (PG)|prolonger session proprement|a definir|feature-sessions|
|auth|auth|bloquer login Firebase si bloque|avant login Firebase: lire customClaims blockedUntil|respecter limite tentatives|a definir|feature-auth-lock|
|auth|auth|aligner blocage PG|mettre a jour blocked_until en DB lors blockUser|coherence blocage PG|a definir|feature-auth-lock|
|auth|auth|endpoint update user info|PUT /api/users/:id (email, displayName, etc.)|permettre modification infos|a definir|feature-user-update|
|auth|auth|ui gestion profil web|page profil + formulaire update (email, nom)|exposer modification infos|a definir|feature-user-update|
|web|visiteur|calcul recap dynamique|calculer nb points, surface totale, budget total, avancement % depuis API|recap conforme spec|a definir|feature-web-recap|
|web|visiteur|affichage au survol|ajouter hover popup sur marqueur (leaflet mouseover)|afficher infos au survol|a definir|feature-web-hover|
|web|manager|seed manager par defaut|script SQL ou Firebase Admin createUser avec role manager|compte manager initial|a definir|feature-manager-seed|
|web|manager|restreindre creation comptes|cote UI: inscription reservee manager; cote API: verif role|respecter regle spec|a definir|feature-manager-auth|
|web|manager|edition signalement complete|UI: editer surface, budget, entreprise, dates debut/fin|gerer infos signalement|a definir|feature-signalement-edit|
|web|manager|stocker dates par etape|API: accepter date_debut, date_fin, date_creation|calculs stats fiables|a definir|feature-signalement-dates|
|web|manager|stats traitement moyen|calcule avg jours entre date et date_fin|statistiques conformes|a definir|feature-stats|
|web|manager|synchronisation bouton|UI: confirmer sync + afficher resultat detaille|visibilite sync|a definir|feature-sync-ui|
|mobile|signalement|ajouter prise de photos|integration Capacitor Camera + selection multiple|ajouter photos au signalement|a definir|feature-mobile-photos|
|mobile|signalement|uploader photos|stockage Firestore ou API /signalements/:id/photos|rattacher photos au signalement|a definir|feature-mobile-photos|
|mobile|signalement|afficher photos apres creation|UI detail + rafraichissement apres upload|retour utilisateur|a definir|feature-mobile-photos|
|mobile|recap|calcul recap depuis firestore|total, surface, budget, avancement %|coherence avec web|a definir|feature-mobile-recap|
|tests|auth|tests limites tentatives|scenarios: 3 echec, blocage, debloquer|valider securite|a definir|test-auth|
|tests|auth|tests sessions PG|token expire, refresh, middleware reject|valider expiration|a definir|test-auth|
|tests|web|tests UI recap|verifier valeurs dynamiques sur Map|valider visiteurs|a definir|test-web|
|tests|mobile|tests photos|creation + upload + affichage|valider mobile|a definir|test-mobile|
