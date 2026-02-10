# Guide de deploiement Auth + Sync

## Variables d'environnement
- `JWT_SECRET`: cle de signature JWT (obligatoire en prod)
- `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USER`, `PG_PASSWORD`: acces PostgreSQL
- `SYNC_INTERVAL_MS`: intervalle du job sync (ex: 300000 pour 5 min)
- `FIREBASE_SERVICE_ACCOUNT`: chemin vers le fichier de service account Firebase

## Points importants
- Le service ecrit toujours dans PostgreSQL.
- Firebase est uniquement utilise par `SyncService`.
- La route `/api/sync` est reservee au role `manager`.

## Demarrage
1) Verifier PostgreSQL (auth_db) et executer les migrations.
2) Configurer les variables d'environnement ci-dessus.
3) Lancer `npm start` dans `auth-api`.

## Tests
- Lancer `npm test` dans `auth-api` (necessite PostgreSQL accessible).
