const authService = require("../services/auth.service");

class AuthController {
  async registerUser(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(422).json({
          error: "Email et mot de passe requis",
          email: !email ? "Email requis" : undefined,
          password: !password ? "Mot de passe requis" : undefined,
        });
      }

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

  async loginUser(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(422).json({
          error: "Email et mot de passe requis",
          email: !email ? "Email requis" : undefined,
          password: !password ? "Mot de passe requis" : undefined,
        });
      }

      const result = await authService.loginUser(email, password);

      if (result.idToken) {
        res.cookie('access_token', result.idToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000
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

  async logoutUser(req, res) {
    try {
      const result = await authService.logoutUser();

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

  async getAllUsers(req, res) {
    try {
      const users = await authService.listUsers();

      return res.status(200).json({
        success: true,
        users
      });

    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs :", error);
      return res.status(500).json({
        error: error.message || "Impossible de récupérer les utilisateurs"
      });
    }
  }

  async blockUser(req, res) {
    try {
      const { email, durationMinutes } = req.body;

      if (!email) {
        return res.status(422).json({
          error: "Email requis",
          email: "Email requis"
        });
      }

      const result = await authService.blockUser(email, durationMinutes);

      return res.status(200).json({
        success: true,
        message: result.message,
        blockedUntil: result.blockedUntil
      });

    } catch (error) {
      console.error("Erreur lors du blocage:", error);
      return res.status(500).json({
        error: error.message || "Une erreur est survenue lors du blocage"
      });
    }
  }


  async unblockUser(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(422).json({
          error: "Email requis",
          email: "Email requis"
        });
      }

      const result = await authService.unblockUser(email);

      return res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error("Erreur lors du déblocage:", error);
      return res.status(500).json({
        error: error.message || "Une erreur est survenue lors du déblocage"
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(422).json({
          error: "Email requis",
          email: "Email requis"
        });
      }

      const result = await authService.resetPassword(email);

      return res.status(200).json({
        success: true,
        message: result.message,
        provider: result.provider,
        tempPassword: result.tempPassword
      });

    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
      return res.status(500).json({
        error: error.message || "Une erreur est survenue lors de la réinitialisation"
      });
    }
  }
  async syncDatabases(req, res) {
    try {
      const { syncBidirectional } = require('../utils/synchronisationUtils');
      const result = await syncBidirectional();

      return res.status(200).json({
        success: true,
        message: 'Synchronisation terminée',
        data: result
      });

    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      return res.status(500).json({
        error: error.message || 'Une erreur est survenue lors de la synchronisation'
      });
    }
  }

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