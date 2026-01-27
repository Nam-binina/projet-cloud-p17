// src/services/auth.service.js
const bcrypt = require("bcrypt");
const { isFirebaseOnline } = require("../utils/connectionUtils");
const { executeQuery, isPostgreSQLAvailable } = require("../config/postgresql");
const { syncFirebaseToPostgreSQL } = require("../utils/synchronisationUtils");
const admin = require("../config/firebase-admin");

class AuthService {

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
      "SELECT id, email, password, email_verified, firebase_uid FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error("Email ou mot de passe incorrect");
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error("Email ou mot de passe incorrect");
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

    // Essayer d'abord Firebase Admin
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

    // Fallback PostgreSQL
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

    // Bloquer dans Firebase si disponible
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

    // Bloquer dans PostgreSQL si disponible
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

    // Débloquer dans PostgreSQL si disponible
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
