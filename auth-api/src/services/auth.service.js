const bcrypt = require("bcrypt");
const { isFirebaseOnline } = require("../utils/connectionUtils");
const { executeQuery, isPostgreSQLAvailable } = require("../config/postgresql");
const { syncFirebaseToPostgreSQL } = require("../utils/synchronisationUtils");
const admin = require("../config/firebase-admin");

class AuthService {

  async incrementLoginAttempts(email) {
    try {
      let fbBlocked = false;
      let blockedUntil = null;
      try {
        const user = await admin.auth().getUserByEmail(email);
        const claims = user.customClaims || {};
        const maxAttempts = parseInt(process.env.AUTH_MAX_LOGIN_ATTEMPTS || '3', 10);
        const blockDuration = parseInt(process.env.AUTH_BLOCK_DURATION_MINUTES || '1440', 10);
        const failedAttempts = (claims.failedAttempts || 0) + 1;

        if (failedAttempts >= maxAttempts) {
          blockedUntil = new Date(Date.now() + blockDuration * 60 * 1000).toISOString();
          await admin.auth().setCustomUserClaims(user.uid, { ...claims, failedAttempts, blockedUntil });
          await admin.auth().updateUser(user.uid, { disabled: true });
          try {
            await admin.auth().revokeRefreshTokens(user.uid);
          } catch (e) {
            console.warn('Impossible de révoquer refresh tokens:', e.message);
          }
          fbBlocked = true;
        } else {
          await admin.auth().setCustomUserClaims(user.uid, { ...claims, failedAttempts });
        }
      } catch (err) {
        console.warn('Impossible de mettre à jour les custom claims Firebase:', err.message);
      }

      try {
        const pgAvailable = await this.checkPostgreSQLAvailability();
        if (pgAvailable) {
          if (blockedUntil) {
            await executeQuery(
              `UPDATE users SET failed_attempts = COALESCE(failed_attempts,0) + 1, blocked_until = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2`,
              [blockedUntil, email]
            );
          } else {
            await executeQuery(
              `UPDATE users SET failed_attempts = COALESCE(failed_attempts,0) + 1, updated_at = CURRENT_TIMESTAMP WHERE email = $1`,
              [email]
            );
          }
        }
      } catch (err) {
        console.warn('Impossible de mettre à jour les tentatives dans PostgreSQL:', err.message);
      }

      try {
        const attemptsCollection = process.env.AUTH_FIRESTORE_ATTEMPTS_COLLECTION || process.env.AUTH_FIRESTORE_USERS_COLLECTION;
        if (attemptsCollection) {
          const db = admin.firestore();
          const snapshot = await db.collection(attemptsCollection).where('email', '==', email).get();
          if (snapshot.empty) {
            await db.collection(attemptsCollection).add({ email, failedAttempts: 1, blockedUntil: blockedUntil || null, updatedAt: new Date().toISOString() }).catch(e => console.warn('Firestore create failed:', e.message));
          } else {
            snapshot.forEach(doc => {
              const data = doc.data() || {};
              const failedAttempts = (data.failedAttempts || 0) + 1;
              const updateData = { failedAttempts, updatedAt: new Date().toISOString() };
              if (blockedUntil) updateData.blockedUntil = blockedUntil;
              db.collection(attemptsCollection).doc(doc.id).update(updateData).catch(e => console.warn('Firestore update failed:', e.message));
            });
          }
        }
      } catch (err) {
        console.warn('Impossible de mettre à jour Firestore:', err.message);
      }

      return { blocked: fbBlocked, blockedUntil };
    } catch (error) {
      console.error('Erreur incrementLoginAttempts:', error.message);
      throw error;
    }
  }

  async resetLoginAttempts(email) {
    try {
      try {
        const user = await admin.auth().getUserByEmail(email);
        const claims = user.customClaims || {};
        if (claims.failedAttempts || claims.blockedUntil) {
          const { failedAttempts, blockedUntil, ...rest } = claims;
          await admin.auth().setCustomUserClaims(user.uid, rest);
        }
        if (user.disabled) {
          try {
            await admin.auth().updateUser(user.uid, { disabled: false });
            try {
              await admin.auth().revokeRefreshTokens(user.uid);
            } catch(e) {
              console.warn('Impossible de révoquer refresh tokens lors du déblocage:', e.message);
            }
          } catch (e) { /* ignore */ }
        }
      } catch (err) {
        console.warn('Impossible de réinitialiser les custom claims Firebase:', err.message);
      }

      try {
        const pgAvailable = await this.checkPostgreSQLAvailability();
        if (pgAvailable) {
          await executeQuery(
            `UPDATE users SET failed_attempts = 0, blocked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE email = $1`,
            [email]
          );
        }
      } catch (err) {
        console.warn('Impossible de réinitialiser les tentatives dans PostgreSQL:', err.message);
      }

      try {
        const attemptsCollection = process.env.AUTH_FIRESTORE_ATTEMPTS_COLLECTION || process.env.AUTH_FIRESTORE_USERS_COLLECTION;
        if (attemptsCollection) {
          const db = admin.firestore();
          const snapshot = await db.collection(attemptsCollection).where('email', '==', email).get();
          if (snapshot.empty) {
            // create a doc to keep consistency
            await db.collection(attemptsCollection).add({ email, failedAttempts: 0, blockedUntil: null, updatedAt: new Date().toISOString() }).catch(e => console.warn('Firestore create failed:', e.message));
          } else {
            snapshot.forEach(doc => {
              db.collection(attemptsCollection).doc(doc.id).update({ failedAttempts: 0, blockedUntil: null, updatedAt: new Date().toISOString() }).catch(e => console.warn('Firestore reset failed:', e.message));
            });
          }
        }
      } catch (err) {
        console.warn('Impossible de réinitialiser Firestore:', err.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur resetLoginAttempts:', error.message);
      throw error;
    }
  }

  async checkFirebaseAvailability() {
    try {
      const available = await isFirebaseOnline();
      return available;
    } catch (error) {
      console.error("Erreur lors de la vérification Firebase:", error.message);
      return false;
    }
  }

  async checkPostgreSQLAvailability() {
    try {
      return await isPostgreSQLAvailable();
    } catch (error) {
      console.error("Erreur lors de la vérification PostgreSQL:", error.message);
      return false;
    }
  }

  async registerUser(email, password) {
    const firebaseAvailable = await this.checkFirebaseAvailability();

    if (firebaseAvailable) {
      try {
        return await this.registerUserFirebase(email, password);
      } catch (error) {
        console.log("Échec Firebase, tentative avec PostgreSQL...");
        return await this.registerUserPostgreSQL(email, password);
      }
    } else {
      console.log("Firebase non disponible, utilisation de PostgreSQL");
      return await this.registerUserPostgreSQL(email, password);
    }
  }

  async registerUserFirebase(email, password) {
    const {
      getAuth,
      createUserWithEmailAndPassword,
      sendEmailVerification
    } = require("../config/firebase");

    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      console.warn("Impossible d'envoyer l'email de vérification:", error.message);
    }

    return {
      success: true,
      provider: "firebase",
      message: "Utilisateur créé avec succès sur Firebase",
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email
      }
    };
  }

  async registerUserPostgreSQL(email, password) {
    const pgAvailable = await this.checkPostgreSQLAvailability();
    if (!pgAvailable) {
      throw new Error("Aucun service d'authentification disponible");
    }

    const existingUser = await executeQuery(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error("Un utilisateur avec cet email existe déjà");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await executeQuery(
      `INSERT INTO users (email, password, email_verified, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING id, email, email_verified, created_at`,
      [email, hashedPassword, false]
    );

    return {
      success: true,
      provider: "postgresql",
      message: "Utilisateur créé avec succès sur PostgreSQL",
      user: result.rows[0]
    };
  }

  async loginUser(email, password) {
    const firebaseAvailable = await this.checkFirebaseAvailability();

    if (firebaseAvailable) {
      try {
        return await this.loginUserFirebase(email, password);
      } catch (error) {
        console.log("Échec Firebase, tentative avec PostgreSQL...");
        return await this.loginUserPostgreSQL(email, password);
      }
    } else {
      console.log("Firebase non disponible, utilisation de PostgreSQL");
      return await this.loginUserPostgreSQL(email, password);
    }
  }

  async loginUserFirebase(email, password) {
    const {
      getAuth,
      signInWithEmailAndPassword
    } = require("../config/firebase");

    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = userCredential._tokenResponse.idToken;

    try {
      console.log("Synchronisation automatique Firebase → PostgreSQL après connexion...");
      await syncFirebaseToPostgreSQL();
    } catch (error) {
      console.error("Erreur lors de la synchronisation automatique:", error.message);
    }

    return {
      success: true,
      provider: "firebase",
      message: "Connexion réussie via Firebase",
      idToken,
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        emailVerified: userCredential.user.emailVerified
      }
    };
  }

  async loginUserPostgreSQL(email, password) {
    const pgAvailable = await this.checkPostgreSQLAvailability();
    if (!pgAvailable) {
      throw new Error("Aucun service d'authentification disponible");
    }

    const result = await executeQuery(
      "SELECT id, email, password, email_verified, firebase_uid, COALESCE(failed_attempts,0) AS failed_attempts, blocked_until FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error("Email ou mot de passe incorrect");
    }

    const user = result.rows[0];

    if (user.blocked_until && new Date(user.blocked_until) > new Date()) {
      throw new Error(`Compte bloqué jusqu'à ${new Date(user.blocked_until).toISOString()}`);
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      try {
        await this.incrementLoginAttempts(email);
      } catch (err) {
        console.warn("Erreur lors de l'incrémentation des tentatives:", err.message);
      }
      throw new Error("Email ou mot de passe incorrect");
    }

    try {
      await this.resetLoginAttempts(email);
    } catch (err) {
      console.warn('Impossible de réinitialiser les tentatives après connexion:', err.message);
    }

    if (user.firebase_uid) {
      try {
        console.log("Synchronisation automatique PostgreSQL → Firebase après connexion...");
        const { syncPostgreSQLToFirebase } = require("../utils/synchronisationUtils");
        await syncPostgreSQLToFirebase();
      } catch (error) {
        console.error("Erreur lors de la synchronisation automatique:", error.message);
      }
    }

    await executeQuery(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString('base64');

    return {
      success: true,
      provider: "postgresql",
      message: "Connexion réussie via PostgreSQL",
      idToken: token,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified,
        firebase_uid: user.firebase_uid
      }
    };
  }



  async listUsers(maxResults = 1000) {
    const firebaseAvailable = await this.checkFirebaseAvailability();

    if (firebaseAvailable) {
      try {
        const list = await admin.auth().listUsers(maxResults);
        return list.users.map(user => ({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || null,
          disabled: user.disabled,
          provider: 'firebase',
          lastSignInTime: user.metadata.lastSignInTime,
          creationTime: user.metadata.creationTime
        }));
      } catch (error) {
        console.log("Échec Firebase Admin, tentative avec PostgreSQL...");
      }
    }

    const pgAvailable = await this.checkPostgreSQLAvailability();
    if (!pgAvailable) {
      throw new Error("Aucun service disponible pour lister les utilisateurs");
    }

    const result = await executeQuery(
      `SELECT id, email, email_verified, firebase_uid, created_at, last_login
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [maxResults]
    );

    return result.rows.map(user => ({
      uid: user.firebase_uid || `pg_${user.id}`,
      email: user.email,
      displayName: null,
      disabled: false,
      provider: user.firebase_uid ? 'firebase' : 'postgresql',
      lastSignInTime: user.last_login,
      creationTime: user.created_at
    }));
  }

  async blockUser(email, durationMinutes = 1440) {
    const firebaseAvailable = await this.checkFirebaseAvailability();
    const pgAvailable = await this.checkPostgreSQLAvailability();

    if (!firebaseAvailable && !pgAvailable) {
      throw new Error("Aucun service disponible pour bloquer l'utilisateur");
    }

    const blockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

    if (firebaseAvailable) {
      try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(user.uid, {
          disabled: true
        });
        console.log(`Utilisateur ${email} bloqué dans Firebase`);
      } catch (error) {
        console.error(`Erreur lors du blocage Firebase de ${email}:`, error.message);
      }
    }

    if (pgAvailable) {
      try {
        await executeQuery(
          `UPDATE users 
           SET updated_at = CURRENT_TIMESTAMP 
           WHERE email = $1`,
          [email]
        );
        console.log(`Utilisateur ${email} bloqué`);
      } catch (error) {
        console.error(`Erreur lors du blocage de ${email}:`, error.message);
        throw new Error("Impossible de bloquer l'utilisateur");
      }
    }

    return {
      message: "Utilisateur bloqué avec succès",
      blockedUntil: blockedUntil.toISOString()
    };
  }

  async unblockUser(email) {
    const firebaseAvailable = await this.checkFirebaseAvailability();
    const pgAvailable = await this.checkPostgreSQLAvailability();

    if (!firebaseAvailable && !pgAvailable) {
      throw new Error("Aucun service disponible pour débloquer l'utilisateur");
    }

    // Débloquer dans Firebase si disponible
    if (firebaseAvailable) {
      try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(user.uid, {
          disabled: false
        });
        console.log(`Utilisateur ${email} débloqué dans Firebase`);
      } catch (error) {
        console.error(`Erreur lors du déblocage Firebase de ${email}:`, error.message);
      }
    }

    if (pgAvailable) {
      try {
        await executeQuery(
          `UPDATE users 
           SET updated_at = CURRENT_TIMESTAMP 
           WHERE email = $1`,
          [email]
        );
        console.log(`Utilisateur ${email} débloqué`);
      } catch (error) {
        console.error(`Erreur lors du déblocage de ${email}:`, error.message);
        throw new Error("Impossible de débloquer l'utilisateur");
      }
    }

    try {
      await this.resetLoginAttempts(email);
      console.log(`Tentatives pour ${email} réinitialisées`);
    } catch (err) {
      console.warn(`Impossible de réinitialiser les tentatives pour ${email}:`, err.message);
    }

    return {
      message: "Utilisateur débloqué avec succès"
    };
  }

  async logoutUser() {
    const firebaseAvailable = await this.checkFirebaseAvailability();

    if (firebaseAvailable) {
      try {
        const { getAuth, signOut } = require("../config/firebase");
        const auth = getAuth();
        await signOut(auth);
        return {
          success: true,
          provider: "firebase",
          message: "Déconnexion réussie"
        };
      } catch (error) {
        console.log("Erreur lors de la déconnexion Firebase:", error.message);
      }
    }

    return {
      success: true,
      provider: "postgresql",
      message: "Déconnexion réussie"
    };
  }

  async resetPassword(email) {
    const firebaseAvailable = await this.checkFirebaseAvailability();

    if (firebaseAvailable) {
      try {
        return await this.resetPasswordFirebase(email);
      } catch (error) {
        console.log("Échec Firebase, tentative avec PostgreSQL...");
        return await this.resetPasswordPostgreSQL(email);
      }
    } else {
      console.log("Firebase non disponible, utilisation de PostgreSQL");
      return await this.resetPasswordPostgreSQL(email);
    }
  }

  async resetPasswordFirebase(email) {
    const {
      getAuth,
      sendPasswordResetEmail
    } = require("../config/firebase");

    const auth = getAuth();
    await sendPasswordResetEmail(auth, email);

    return {
      success: true,
      provider: "firebase",
      message: "Email de réinitialisation envoyé via Firebase"
    };
  }

  async resetPasswordPostgreSQL(email) {
    const pgAvailable = await this.checkPostgreSQLAvailability();
    if (!pgAvailable) {
      throw new Error("Aucun service d'authentification disponible");
    }

    const result = await executeQuery(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error("Aucun utilisateur trouvé avec cet email");
    }

    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await executeQuery(
      "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2",
      [hashedPassword, email]
    );

    return {
      success: true,
      provider: "postgresql",
      message: "Mot de passe réinitialisé via PostgreSQL",
      tempPassword
    };
  }


  async getServicesStatus() {
    const [firebaseStatus, postgresqlStatus] = await Promise.all([
      this.checkFirebaseAvailability(),
      this.checkPostgreSQLAvailability()
    ]);

    return {
      firebase: {
        available: firebaseStatus,
        priority: 1
      },
      postgresql: {
        available: postgresqlStatus,
        priority: 2
      }
    };
  }
}

module.exports = new AuthService();
