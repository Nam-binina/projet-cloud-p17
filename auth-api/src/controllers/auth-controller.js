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
          maxAge: 24 * 60 * 60 * 1000,
          sameSite: 'Strict',
          path: '/'
        });
      }

      // create and set refresh token cookie if service provided one
      if (result.refreshToken) {
        res.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000,
          sameSite: 'Strict',
          path: '/'
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
      // revoke session if refresh cookie present
      const refreshCookie = req.cookies?.refresh_token;
      if (refreshCookie) {
        const tokenId = String(refreshCookie).split(':')[0];
        try {
          await authService.revokeSessionByTokenId(tokenId);
        } catch (e) {
          console.warn('Impossible de révoquer la session:', e.message);
        }
      }

      const result = await authService.logoutUser();

      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

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

  async changePassword(req, res) {
    try {
      const { id } = req.params;
      const { old_password, new_password } = req.body;

      if (!id) {
        return res.status(422).json({
          error: "ID utilisateur requis"
        });
      }

      if (!old_password || !new_password) {
        return res.status(422).json({
          error: "Ancien et nouveau mot de passe requis",
          old_password: !old_password ? "Ancien mot de passe requis" : undefined,
          new_password: !new_password ? "Nouveau mot de passe requis" : undefined
        });
      }

      if (String(new_password).length < 8) {
        return res.status(422).json({
          error: "Le nouveau mot de passe doit contenir au moins 8 caracteres",
          new_password: "Mot de passe trop court"
        });
      }

      const result = await authService.changePassword(id, old_password, new_password);

      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      return res.status(500).json({
        error: error.message || "Une erreur est survenue lors du changement de mot de passe"
      });
    }
  }
  async syncDatabases(req, res) {
    try {
      const syncService = require('../services/sync.service');
      const { syncBidirectional } = require('../utils/synchronisationUtils');

      const processed = await syncService.processQueue(100);

      const result = await syncBidirectional();

      const signalementsSync = await syncService.syncSignalementsFromFirebase(200);

      const photoSync = await syncService.syncPhotosFromFirebase(200);

      const photoSyncToFirebase = await syncService.syncPhotosToFirebase(200);

      return res.status(200).json({
        success: true,
        message: 'Synchronisation terminée',
        data: {
          queue: processed,
          bidirectional: result,
          signalements: signalementsSync,
          photos: {
            from_firebase: photoSync,
            to_firebase: photoSyncToFirebase
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      return res.status(500).json({
        error: error.message || 'Une erreur est survenue lors de la synchronisation'
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const raw = req.cookies?.refresh_token;
      const result = await authService.verifyAndRotateRefreshToken(raw);

      const role = await authService.getUserRoleById(result.userId);

      const jwtSecret = process.env.JWT_SECRET || 'change-this-secret';
      const token = require('jsonwebtoken').sign({ sub: result.userId, role }, jwtSecret, { expiresIn: '24h' });

      res.cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'Strict',
        path: '/'
      });

      res.cookie('refresh_token', result.newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'Strict',
        path: '/'
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erreur refresh token:', error);
      return res.status(401).json({ error: error.message || 'Invalid refresh token' });
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