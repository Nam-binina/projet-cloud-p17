const signalementService = require("../services/signalements.service");

class SignalementController {

  async list(req, res) {
    try {
      const { limit, startAfterId } = req.query;
      const signalements = await signalementService.listSignalements(
        limit ? parseInt(limit) : 50,
        startAfterId || null
      );

      return res.status(200).json({
        success: true,
        signalements
      });

    } catch (error) {
      console.error("Erreur lors de la récupération des signalements :", error);
      return res.status(500).json({
        error: error.message || "Impossible de récupérer les signalements"
      });
    }
  }

  async get(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(422).json({
          error: "ID du signalement requis"
        });
      }

      const signalement = await signalementService.getSignalementById(id);

      return res.status(200).json({
        success: true,
        signalement
      });

    } catch (error) {
      console.error("Erreur lors de la récupération du signalement :", error);
      return res.status(404).json({
        error: error.message || "Signalement introuvable"
      });
    }
  }

  async create(req, res) {
    try {
      const { budget, date, description, entreprise, position, status, surface, user_id } = req.body;

      // Validation des champs requis
      if (!budget || !description || !entreprise || !position || !status || !surface || !user_id) {
        return res.status(422).json({
          error: "Champs requis manquants",
          budget: !budget ? "Budget requis" : undefined,
          description: !description ? "Description requise" : undefined,
          entreprise: !entreprise ? "Entreprise requise" : undefined,
          position: !position ? "Position requise" : undefined,
          status: !status ? "Statut requis" : undefined,
          surface: !surface ? "Surface requise" : undefined,
          user_id: !user_id ? "User ID requis" : undefined
        });
      }

      const signalement = await signalementService.createSignalement({
        budget,
        date: date || new Date().toISOString(),
        description,
        entreprise,
        position,
        status,
        surface,
        user_id
      });

      return res.status(201).json({
        success: true,
        message: "Signalement créé avec succès",
        signalement
      });

    } catch (error) {
      console.error("Erreur lors de la création du signalement :", error);
      return res.status(500).json({
        error: error.message || "Impossible de créer le signalement"
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      if (!id) {
        return res.status(422).json({
          error: "ID du signalement requis"
        });
      }

      const signalement = await signalementService.updateSignalement(id, data);

      return res.status(200).json({
        success: true,
        message: "Signalement mis à jour avec succès",
        signalement
      });

    } catch (error) {
      console.error("Erreur lors de la mise à jour du signalement :", error);
      return res.status(500).json({
        error: error.message || "Impossible de mettre à jour le signalement"
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(422).json({
          error: "ID du signalement requis"
        });
      }

      const result = await signalementService.deleteSignalement(id);

      return res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error("Erreur lors de la suppression du signalement :", error);
      return res.status(500).json({
        error: error.message || "Impossible de supprimer le signalement"
      });
    }
  }

  async getByUserId(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(422).json({
          error: "User ID requis"
        });
      }

      const signalements = await signalementService.getSignalementsByUserId(userId);

      return res.status(200).json({
        success: true,
        signalements
      });

    } catch (error) {
      console.error("Erreur lors de la récupération des signalements utilisateur :", error);
      return res.status(500).json({
        error: error.message || "Impossible de récupérer les signalements"
      });
    }
  }

  async cleanupTimestamps(req, res) {
    try {
      const result = await signalementService.cleanupTimestamps();
      return res.status(200).json({
        success: true,
        message: `${result.cleaned} documents nettoyés`,
        result
      });
    } catch (error) {
      console.error("Erreur cleanup :", error);
      return res.status(500).json({
        error: error.message || "Erreur lors du nettoyage"
      });
    }
  }
}

module.exports = new SignalementController();
