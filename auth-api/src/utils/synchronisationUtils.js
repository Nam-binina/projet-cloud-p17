const bcrypt = require("bcrypt");
const { getFirebaseAdmin } = require("../config/firebase");
const { executeQuery } = require("../config/postgresql");

async function getAllFirebaseUsers() {
  const admin = getFirebaseAdmin();
  const listUsersResult = await admin.auth().listUsers();
  
  return listUsersResult.users.map(user => ({
    firebase_uid: user.uid,
    email: user.email,
    email_verified: user.emailVerified,
    created_at: new Date(user.metadata.creationTime),
    last_login: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null
  }));
}


async function getAllPostgreSQLUsers() {
  const result = await executeQuery(
    "SELECT id, email, firebase_uid, email_verified, created_at, last_login FROM users"
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
      await executeQuery(
        `UPDATE users SET firebase_uid = $1, email = $2, email_verified = $3, 
         last_login = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5`,
        [fbUser.firebase_uid, fbUser.email, fbUser.email_verified, fbUser.last_login, existing.rows[0].id]
      );
      updated++;
    } else {
      const password = await bcrypt.hash("firebase_" + fbUser.firebase_uid, 10);
      await executeQuery(
        `INSERT INTO users (email, password, firebase_uid, email_verified, last_login, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [fbUser.email, password, fbUser.firebase_uid, fbUser.email_verified, fbUser.last_login, fbUser.created_at]
      );
      created++;
    }
  }

  console.log(`Terminé: ${created} créés, ${updated} mis à jour`);
  return { created, updated, total: firebaseUsers.length };
}

async function syncPostgreSQLToFirebase() {
  console.log("Synchronisation PostgreSQL → Firebase...");
  
  const admin = getFirebaseAdmin();
  const pgUsers = await getAllPostgreSQLUsers();
  let created = 0, updated = 0;

  for (const pgUser of pgUsers) {
    try {
      if (pgUser.firebase_uid) {
        await admin.auth().updateUser(pgUser.firebase_uid, {
          email: pgUser.email,
          emailVerified: pgUser.email_verified
        });
        updated++;
      } else {
        const password = `Temp${Math.random().toString(36).slice(-8)}!`;
        const userRecord = await admin.auth().createUser({
          email: pgUser.email,
          password: password,
          emailVerified: pgUser.email_verified || false
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
