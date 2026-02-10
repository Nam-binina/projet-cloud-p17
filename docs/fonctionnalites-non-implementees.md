# Fonctionnalites non implementees (etat du code)

Ce document liste les ecarts observes entre le cahier des charges (docs/projet.md) et le code present dans le depot.

## Module Authentification
- Modification des informations utilisateur: aucun endpoint ou service d update profile n est present (seulement register/login/logout/reset).
- Duree de vie des sessions: pas de mecanisme clair d expiration/refresh pour les tokens PostgreSQL (token base64 sans verification/expiration cote middleware).
- Limite de tentatives de connexion: logique appliquee sur le flux PostgreSQL, mais pas sur le flux Firebase (pas de verification blocage avant login Firebase).
- Documentation Swagger/OpenAPI: aucun fichier ou route Swagger detecte.

## Module Web (visiteur)
- Tableau de recap (nb points, surface totale, avancement %, budget total) non calcule dynamiquement; la page carte affiche des valeurs statiques et pas d avancement en %.
- Affichage des infos au survol des points: les details sont affiches au clic (popup/panneau), pas au survol.

## Module Web (manager)
- Creation de compte manager par defaut: aucun seed ou script de creation automatique detecte.
- Creation de comptes uniquement par le manager: pas de restriction cote UI, le formulaire d inscription est accessible a tous.
- Gestion des infos sur chaque signalement (surface, budget, entreprise, dates): edition complete absente; seule la modification du statut est proposee.
- Dates par etape (date debut/fin) non saisies dans le formulaire, donc calcul de traitement moyen incomplet.

## Module Mobile
- Ajout de 1 ou plusieurs photos lors de la creation d un signalement: pas de capture ou upload implemente, seulement l affichage des photos existantes.
