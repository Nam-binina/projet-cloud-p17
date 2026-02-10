const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
    // const firebaseAvailable = await this.checkFirebaseAvailability();
    console.log("Firebase non disponible, utilisation de PostgreSQL");
    return await this.registerUserPostgreSQL(email, password);

    // if (firebaseAvailable) {
    //   try {
    //     return await this.registerUserFirebase(email, password);
    //   } catch (error) {
    //     console.log("Échec Firebase, tentative avec PostgreSQL...");
    //     return await this.registerUserPostgreSQL(email, password);
    //   }
    // } else {
    // }
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

    const user = result.rows[0];

    // enqueue sync for users
    try {
      await executeQuery(`INSERT INTO sync_queue (entity, entity_id, action, payload, status, created_at) VALUES ($1,$2,$3,$4,'PENDING',CURRENT_TIMESTAMP)`, [
        'users', String(user.id), 'CREATE', JSON.stringify({ email: user.email, email_verified: user.email_verified, role: user.role || 'user' })
      ]);
    } catch (e) {
      console.warn('Failed to enqueue user sync:', e.message);
    }

    return {
      success: true,
      provider: "postgresql",
      message: "Utilisateur créé avec succès sur PostgreSQL",
      user: user
    };
  }

  async loginUser(email, password) {
    console.log("Firebase non disponible, utilisation de PostgreSQL");
    return await this.loginUserPostgreSQL(email, password);
    // const firebaseAvailable = await this.checkFirebaseAvailability();

    // if (firebaseAvailable) {
    //   try {
    //     return await this.loginUserFirebase(email, password);
    //   } catch (error) {
    //     console.log("Échec Firebase, tentative avec PostgreSQL...");
    //     return await this.loginUserPostgreSQL(email, password);
    //   }
    // } else {
    // }
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
      "SELECT id, email, password, email_verified, firebase_uid, role, COALESCE(failed_attempts,0) AS failed_attempts, blocked_until FROM users WHERE email = $1",
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

    const jwtSecret = process.env.JWT_SECRET || 'change-this-secret';
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role || 'user' }, jwtSecret, { expiresIn: '24h' });

    // create refresh token session
    const refreshToken = await this.createSession(user.id);

    return {
      success: true,
      provider: "postgresql",
      message: "Connexion réussie via PostgreSQL",
      idToken: token,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified,
        firebase_uid: user.firebase_uid,
        role: user.role || 'user'
      }
    }; 
  }



  async listUsers(maxResults = 1000) {
    const pgAvailable = await this.checkPostgreSQLAvailability();
    if (!pgAvailable) {
      throw new Error("Aucun service disponible pour lister les utilisateurs");
    }

    const result = await executeQuery(
      `SELECT id, email, email_verified, firebase_uid, created_at, last_login, blocked_until
       FROM users
       ORDER BY created_at DESC
       LIMIT $1`,
      [maxResults]
    );

    return result.rows.map(user => ({
      uid: user.firebase_uid || `pg_${user.id}`,
      email: user.email,
      displayName: null,
      disabled: Boolean(user.blocked_until && new Date(user.blocked_until) > new Date()),
      provider: user.firebase_uid ? 'firebase' : 'postgresql',
      lastSignInTime: user.last_login,
      creationTime: user.created_at
    }));
  }

  async blockUser(email, durationMinutes = 1440) {
    const pgAvailable = await this.checkPostgreSQLAvailability();
    if (!pgAvailable) {
      throw new Error("Aucun service disponible pour bloquer l'utilisateur");
    }

    const blockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

    try {
      await executeQuery(
        `UPDATE users
         SET blocked_until = $1, failed_attempts = COALESCE(failed_attempts, 0) + 1, updated_at = CURRENT_TIMESTAMP
         WHERE email = $2`,
        [blockedUntil, email]
      );
      console.log(`Utilisateur ${email} bloqué`);
    } catch (error) {
      console.error(`Erreur lors du blocage de ${email}:`, error.message);
      throw new Error("Impossible de bloquer l'utilisateur");
    }

    return {
      message: "Utilisateur bloqué avec succès",
      blockedUntil: blockedUntil.toISOString()
    };
  }

  async unblockUser(email) {
    const pgAvailable = await this.checkPostgreSQLAvailability();
    if (!pgAvailable) {
      throw new Error("Aucun service disponible pour débloquer l'utilisateur");
    }

    try {
      await executeQuery(
        `UPDATE users
         SET blocked_until = NULL, failed_attempts = 0, updated_at = CURRENT_TIMESTAMP
         WHERE email = $1`,
        [email]
      );
      console.log(`Utilisateur ${email} débloqué`);
    } catch (error) {
      console.error(`Erreur lors du déblocage de ${email}:`, error.message);
      throw new Error("Impossible de débloquer l'utilisateur");
    }

    return {
      message: "Utilisateur débloqué avec succès"
    };
  }

  async logoutUser() {
    // For PostgreSQL-only mode, logout is client-side cookie clear + optional session revoke.
    return {
      success: true,
      provider: "postgresql",
      message: "Déconnexion réussie"
    };
  }

  // Sessions / Refresh token management
  async createSession(userId, ttlDays = 30) {
    const crypto = require('crypto');
    const tokenId = crypto.randomBytes(16).toString('hex');
    const tokenValue = crypto.randomBytes(64).toString('hex');
    const hashed = await bcrypt.hash(tokenValue, 10);
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await executeQuery(
      `INSERT INTO sessions (user_id, token_id, refresh_token_hash, expires_at, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [userId, tokenId, hashed, expiresAt]
    );

    return `${tokenId}:${tokenValue}`;
  }

  async verifyAndRotateRefreshToken(rawToken) {
    if (!rawToken) throw new Error('Refresh token manquant');
    const parts = String(rawToken).split(':');
    if (parts.length !== 2) throw new Error('Refresh token invalide');
    const [tokenId, tokenValue] = parts;

    const result = await executeQuery(
      `SELECT id, user_id, refresh_token_hash, expires_at, revoked_at FROM sessions WHERE token_id = $1`,
      [tokenId]
    );

    if (result.rows.length === 0) throw new Error('Session introuvable');
    const session = result.rows[0];

    if (session.revoked_at) throw new Error('Session révoquée');
    if (new Date(session.expires_at) < new Date()) throw new Error('Refresh token expiré');

    const match = await bcrypt.compare(tokenValue, session.refresh_token_hash);
    if (!match) {
      // possible theft - revoke session
      await executeQuery(`UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1`, [session.id]);
      throw new Error('Refresh token invalide');
    }

    // rotate token value (keep same tokenId)
    const newTokenValue = require('crypto').randomBytes(64).toString('hex');
    const newHashed = await bcrypt.hash(newTokenValue, 10);
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await executeQuery(
      `UPDATE sessions SET refresh_token_hash = $1, expires_at = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [newHashed, newExpiresAt, session.id]
    );

    return { userId: session.user_id, newRefreshToken: `${tokenId}:${newTokenValue}` };
  }

  async revokeSessionByTokenId(tokenId) {
    if (!tokenId) return;
    await executeQuery(`UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_id = $1`, [tokenId]);
  }

  async revokeAllSessionsForUser(userId) {
    if (!userId) return;
    await executeQuery(`UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1`, [userId]);
  }

  async getUserRoleById(userId) {
    const result = await executeQuery("SELECT role FROM users WHERE id = $1", [userId]);
    if (result.rows.length === 0) {
      return 'user';
    }
    return result.rows[0].role || 'user';
  }

  async resetPassword(email) {
    // const firebaseAvailable = await this.checkFirebaseAvailability();
    console.log("Firebase non disponible, utilisation de PostgreSQL");
    return await this.resetPasswordPostgreSQL(email);

    // if (firebaseAvailable) {
    //   try {
    //     return await this.resetPasswordFirebase(email);
    //   } catch (error) {
    //     console.log("Échec Firebase, tentative avec PostgreSQL...");
    //     return await this.resetPasswordPostgreSQL(email);
    //   }
    // } else {
    // }
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

  async changePassword(userId, oldPassword, newPassword) {
    const pgAvailable = await this.checkPostgreSQLAvailability();
    if (!pgAvailable) {
      throw new Error("Aucun service d'authentification disponible");
    }

    const result = await executeQuery(
      "SELECT id, password FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error("Utilisateur introuvable");
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new Error("Ancien mot de passe incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await executeQuery(
      "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [hashedPassword, user.id]
    );

    return {
      success: true,
      provider: "postgresql",
      message: "Mot de passe modifie avec succes"
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
