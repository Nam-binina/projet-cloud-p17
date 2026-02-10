# TODO - AUTH-SYNC-001 Postgres source unique + sync Firebase (tres technique)

Objectif: API publique = PostgreSQL uniquement. Firebase = replica synchro uniquement par service interne.

## ✅ Fait
|partie|categorie|tâche|fichier|note|
|---|---|---|---|---|
|api|auth|register PG only|auth-api/src/services/auth.service.js|`registerUser()` utilise PostgreSQL uniquement|
|api|auth|login PG only|auth-api/src/services/auth.service.js|`loginUser()` utilise PostgreSQL uniquement et renvoie JWT (24h)|
|api|auth|reset PG only|auth-api/src/services/auth.service.js|`resetPassword()` utilise PostgreSQL uniquement|
|api|routes|retirer routes firebase|auth-api/src/routes/index.js|routes /api/firebase/register|login|logout|reset commentées|
|api|auth|change password|auth-api/src/controllers/auth-controller.js + auth-api/src/services/auth.service.js|`PUT /api/users/:id/password` implémentée (PG)|
|api|auth|JWT access token|auth-api/src/services/auth.service.js + auth-api/src/middleware/index.js|JWT 24h signé et vérifié; token stocké en cookie httpOnly|
|api|auth|JWT refresh token|auth-api/src/controllers/auth-controller.js + auth-api/src/services/auth.service.js|`/api/token/refresh` + rotation cookie refresh|
|api|auth|logout revoke sessions|auth-api/src/controllers/auth-controller.js|`logout` révoque la session si `refresh_token` présent|
|api|auth|gerer roles|auth-api/src/services/auth.service.js + auth-api/src/controllers/auth-controller.js|role charge en DB et ajoute au JWT (login + refresh)|
|api|security|role manager|auth-api/src/routes/index.js + auth-api/src/middleware/requireRole.js|`/api/sync` protege par role manager|
|tests|unit|tests auth PG only|auth-api/tests/auth.test.js|tests login/register/reset/refresh via PostgreSQL|
|doc|tech|guide deploiement|docs/auth-sync-deployment.md|env vars et demarrage|
|bdd|schema|mise à jour initializeDatabase|auth-api/src/config/postgresql.js|table `users` enrichie (role, sync fields, indexes)|
|bdd|schema|signalements schema|auth-api/src/config/postgresql.js|table `signalements` créée en DB init|
|bdd|schema|sync_queue table|auth-api/src/config/postgresql.js + scripts/03-auth-sync.sql|table `sync_queue` créée|
|bdd|schema|sync_log table|auth-api/src/config/postgresql.js + scripts/03-auth-sync.sql|table `sync_log` créée|
|api|services|refactor SyncService|auth-api/src/services/sync.service.js|processeur `sync_queue` (push users/signalements)|
|api|services|queue write hook|auth-api/src/services/auth.service.js + auth-api/src/services/signalements.service.js|insert `sync_queue` après CREATE/UPDATE/DELETE|
|api|jobs|endpoint sync manual|auth-api/src/controllers/auth-controller.js|`POST /api/sync` traite queue puis sync|
|api|jobs|cron sync|auth-api/src/app.js|interval `SYNC_INTERVAL_MS` + checkConnectivityStatus + sync queue + sync bidirectionnel|

## ⏳ Restant (prioritaire)
|partie|categorie|a faire|contenu|but|responsable|branche|
|---|---|---|---|---|---|---|
|none|none|aucune tache restante|toutes les taches du lot sont terminees|ok|a definir|feature-sync-core|

Notes
- Toutes les ecritures passent par PostgreSQL, meme en ligne.
- Firebase ne doit etre touche que par SyncService interne.
- Chaque update doit mettre a jour updated_at.

