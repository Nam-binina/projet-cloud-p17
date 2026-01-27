// src/services/auth.service.js
const bcrypt = require("bcrypt");
const { isFirebaseOnline } = require("../utils/connectionUtils");
const { executeQuery, isPostgreSQLAvailable } = require("../config/postgresql");
const { syncFirebaseToPostgreSQL } = require("../utils/synchronisationUtils");

/**
 * Service d'authentification hybride
 * Essaie d'abord Firebase, puis PostgreSQL en cas d'échec
 */
class AuthService {
  
  /**
   * Vérifie la disponibilité de Firebase
   */
  async checkFirebaseAvailability() {
    try {
      const available = await isFirebaseOnline();
      return available;
    } catch (error) {
      console.error("Erreur lors de la vérification Firebase:", error.message);
      return false;
    }
  }

  /**
   * Vérifie la disponibilité de PostgreSQL
   */
  async checkPostgreSQLAvailability() {
    try {
      return await isPostgreSQLAvailable();
    } catch (error) {
      console.error("Erreur lors de la vérification PostgreSQL:", error.message);
      return false;
    }
  }

  /**
   * Enregistre un utilisateur
   */
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

  /**
   * Enregistre un utilisateur dans Firebase
   */
  async registerUserFirebase(email, password) {
    const { 
      getAuth,
      createUserWithEmailAndPassword,
      sendEmailVerification 
    } = require("../config/firebase");
    
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Envoyer email de vérification
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

  /**
   * Enregistre un utilisateur dans PostgreSQL
   */
  async registerUserPostgreSQL(email, password) {
    // Vérifier que PostgreSQL est disponible
    const pgAvailable = await this.checkPostgreSQLAvailability();
    if (!pgAvailable) {
      throw new Error("Aucun service d'authentification disponible");
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await executeQuery(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error("Un utilisateur avec cet email existe déjà");
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
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

  /**
   * Connecte un utilisateur
   */
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

  /**
   * Connecte un utilisateur via Firebase
   */
  async loginUserFirebase(email, password) {
    const { 
      getAuth,
      signInWithEmailAndPassword 
    } = require("../config/firebase");
    
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = userCredential._tokenResponse.idToken;

    // Synchronisation automatique après connexion réussie
    try {
      console.log("Synchronisation automatique Firebase → PostgreSQL après connexion...");
      await syncFirebaseToPostgreSQL();
    } catch (error) {
      console.error("Erreur lors de la synchronisation automatique:", error.message);
      // Ne pas bloquer la connexion si la sync échoue
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

  /**
   * Connecte un utilisateur via PostgreSQL
   */
  async loginUserPostgreSQL(email, password) {
    // Vérifier que PostgreSQL est disponible
    const pgAvailable = await this.checkPostgreSQLAvailability();
    if (!pgAvailable) {
      throw new Error("Aucun service d'authentification disponible");
    }

    // Récupérer l'utilisateur
    const result = await executeQuery(
      "SELECT id, email, password, email_verified, firebase_uid FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error("Email ou mot de passe incorrect");
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error("Email ou mot de passe incorrect");
    }

    // Synchronisation automatique après connexion réussie (PostgreSQL vers Firebase si user a firebase_uid)
    if (user.firebase_uid) {
      try {
        console.log("Synchronisation automatique PostgreSQL → Firebase après connexion...");
        const { syncPostgreSQLToFirebase } = require("../utils/synchronisationUtils");
        await syncPostgreSQLToFirebase();
      } catch (error) {
        console.error("Erreur lors de la synchronisation automatique:", error.message);
        // Ne pas bloquer la connexion si la sync échoue
      }
    }

    // Mettre à jour la date de dernière connexion
    await executeQuery(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    // Générer un token simple (à améliorer avec JWT)
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

  /**
   * Déconnecte un utilisateur
   */
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
    
    // Pour PostgreSQL, la déconnexion se fait côté client
    return {
      success: true,
      provider: "postgresql",
      message: "Déconnexion réussie"
    };
  }

  /**
   * Réinitialise le mot de passe
   */
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

  /**
   * Réinitialise le mot de passe via Firebase
   */
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

  /**
   * Réinitialise le mot de passe via PostgreSQL
   */
  async resetPasswordPostgreSQL(email) {
    // Vérifier que PostgreSQL est disponible
    const pgAvailable = await this.checkPostgreSQLAvailability();
    if (!pgAvailable) {
      throw new Error("Aucun service d'authentification disponible");
    }

    // Vérifier que l'utilisateur existe
    const result = await executeQuery(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error("Aucun utilisateur trouvé avec cet email");
    }

    // Générer un nouveau mot de passe temporaire
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Mettre à jour le mot de passe
    await executeQuery(
      "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2",
      [hashedPassword, email]
    );

    return {
      success: true,
      provider: "postgresql",
      message: "Mot de passe réinitialisé via PostgreSQL",
      tempPassword // En production, envoyer par email plutôt que retourner
    };
  }

  /**
   * Obtient le statut des services
   */
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
