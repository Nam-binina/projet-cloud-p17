// src/controllers/auth-controller.js
const authService = require("../services/auth.service");

class AuthController {
  /**
   * Enregistre un nouvel utilisateur
   */
  async registerUser(req, res) {
    try {
      const { email, password } = req.body;
      
      // Validation
      if (!email || !password) {
        return res.status(422).json({
          error: "Email et mot de passe requis",
          email: !email ? "Email requis" : undefined,
          password: !password ? "Mot de passe requis" : undefined,
        });
      }

      // Enregistrer l'utilisateur
      const result = await authService.registerUser(email, password);

      return res.status(201).json({
        success: true,
        message: result.message,
        provider: result.provider,
        user: result.user
      });

    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      return res.status(500).json({
        error: error.message || "Une erreur est survenue lors de l'enregistrement"
      });
    }
  }

  /**
   * Connecte un utilisateur
   */
  async loginUser(req, res) {
    try {
      const { email, password } = req.body;
      
      // Validation
      if (!email || !password) {
        return res.status(422).json({
          error: "Email et mot de passe requis",
          email: !email ? "Email requis" : undefined,
          password: !password ? "Mot de passe requis" : undefined,
        });
      }

      // Connecter l'utilisateur
      const result = await authService.loginUser(email, password);

      // Définir le cookie avec le token
      if (result.idToken) {
        res.cookie('access_token', result.idToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000 // 24 heures
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        provider: result.provider,
        user: result.user
      });

    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      return res.status(401).json({
        error: error.message || "Une erreur est survenue lors de la connexion"
      });
    }
  }

  /**
   * Déconnecte un utilisateur
   */
  async logoutUser(req, res) {
    try {
      const result = await authService.logoutUser();

      // Effacer le cookie
      res.clearCookie('access_token');

      return res.status(200).json({
        success: true,
        message: result.message,
        provider: result.provider
      });

    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      return res.status(500).json({
        error: error.message || "Une erreur est survenue lors de la déconnexion"
      });
    }
  }

  /**
   * Réinitialise le mot de passe
   */
  async resetPassword(req, res) {
    try {
      const { email } = req.body;
      
      // Validation
      if (!email) {
        return res.status(422).json({
          error: "Email requis",
          email: "Email requis"
        });
      }

      // Réinitialiser le mot de passe
      const result = await authService.resetPassword(email);

      return res.status(200).json({
        success: true,
        message: result.message,
        provider: result.provider,
        tempPassword: result.tempPassword // Seulement pour PostgreSQL
      });

    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
      return res.status(500).json({
        error: error.message || "Une erreur est survenue lors de la réinitialisation"
      });
    }
  }

  /**
   * Obtient le statut des services d'authentification
   */
  async getStatus(req, res) {
    try {
      const status = await authService.getServicesStatus();
      
      return res.status(200).json({
        success: true,
        services: status
      });

    } catch (error) {
      console.error("Erreur lors de la récupération du statut:", error);
      return res.status(500).json({
        error: "Impossible de récupérer le statut des services"
      });
    }
  }
}

module.exports = new AuthController();
