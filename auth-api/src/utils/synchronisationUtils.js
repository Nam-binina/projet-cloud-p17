const bcrypt = require("bcrypt");
// const { getFirebaseAdmin } = require("../config/firebase");
const admin = require("../config/firebase-admin");

const { executeQuery } = require("../config/postgresql");

async function getAllFirebaseUsers() {
    const listUsersResult = await admin.auth().listUsers();
  
  return listUsersResult.users.map(user => ({
    firebase_uid: user.uid,
    email: user.email,
    email_verified: user.emailVerified,
    disabled: user.disabled,
    created_at: new Date(user.metadata.creationTime),
    last_login: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null
  }));
}


async function getAllPostgreSQLUsers() {
  const result = await executeQuery(
    "SELECT id, email, firebase_uid, email_verified, created_at, last_login, blocked_until FROM users"
  );
  return result.rows;
}

async function syncFirebaseToPostgreSQL() {
  console.log("Synchronisation Firebase → PostgreSQL...");
  
  const firebaseUsers = await getAllFirebaseUsers();
  let created = 0, updated = 0;

  for (const fbUser of firebaseUsers) {
    const existing = await executeQuery(
      "SELECT id FROM users WHERE firebase_uid = $1 OR email = $2",
      [fbUser.firebase_uid, fbUser.email]
    );

    if (existing.rows.length > 0) {
      const blockedUntil = fbUser.disabled ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;
      await executeQuery(
        `UPDATE users SET firebase_uid = $1, email = $2, email_verified = $3, 
         last_login = $4, blocked_until = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6`,
        [fbUser.firebase_uid, fbUser.email, fbUser.email_verified, fbUser.last_login, blockedUntil, existing.rows[0].id]
      );
      updated++;
    } else {
      const blockedUntil = fbUser.disabled ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;
      const password = await bcrypt.hash("firebase_" + fbUser.firebase_uid, 10);
      await executeQuery(
        `INSERT INTO users (email, password, firebase_uid, email_verified, last_login, blocked_until, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [fbUser.email, password, fbUser.firebase_uid, fbUser.email_verified, fbUser.last_login, blockedUntil, fbUser.created_at]
      );
      created++;
    }
  }

  console.log(`Terminé: ${created} créés, ${updated} mis à jour`);
  return { created, updated, total: firebaseUsers.length };
}

async function syncPostgreSQLToFirebase() {
  console.log("Synchronisation PostgreSQL → Firebase...");
  const pgUsers = await getAllPostgreSQLUsers();
  let created = 0, updated = 0;

  for (const pgUser of pgUsers) {
    const isBlocked = Boolean(pgUser.blocked_until && new Date(pgUser.blocked_until) > new Date());
    try {
      if (pgUser.firebase_uid) {
        await admin.auth().updateUser(pgUser.firebase_uid, {
          email: pgUser.email,
          emailVerified: pgUser.email_verified,
          disabled: isBlocked
        });
        updated++;
      } else {
        const password = `Temp${Math.random().toString(36).slice(-8)}!`;
        const userRecord = await admin.auth().createUser({
          email: pgUser.email,
          password: password,
          emailVerified: pgUser.email_verified || false,
          disabled: isBlocked
        });
        
        await executeQuery(
          "UPDATE users SET firebase_uid = $1 WHERE id = $2",
          [userRecord.uid, pgUser.id]
        );
        created++;
      }
    } catch (error) {
      console.error(`Erreur pour ${pgUser.email}:`, error.message);
    }
  }

  console.log(`Terminé: ${created} créés, ${updated} mis à jour`);
  return { created, updated, total: pgUsers.length };
}

async function syncBidirectional() {
  console.log("Synchronisation bidirectionnelle...\n");
  
  const fb2pg = await syncFirebaseToPostgreSQL();
  console.log("");
  const pg2fb = await syncPostgreSQLToFirebase();
  
  return { firebase_to_pg: fb2pg, pg_to_firebase: pg2fb };
}

module.exports = {
  getAllFirebaseUsers,
  getAllPostgreSQLUsers,
  syncFirebaseToPostgreSQL,
  syncPostgreSQLToFirebase,
  syncBidirectional
};
