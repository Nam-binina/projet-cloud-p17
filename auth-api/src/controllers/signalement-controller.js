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
      const { budget, date, description, descriptiotn, entreprise, position, status, surface, user_id } = req.body;
      const descriptionValue = descriptiotn || description;

      // Validation des champs requis
      const isMissingNumber = (value) => value === null || value === undefined || Number.isNaN(value);
      const isMissingString = (value) => !value || String(value).trim().length === 0;

      if (isMissingNumber(budget) || isMissingString(descriptionValue) || isMissingString(entreprise) || !position || isMissingNumber(surface) || isMissingString(user_id)) {
        return res.status(422).json({
          error: "Champs requis manquants",
          budget: isMissingNumber(budget) ? "Budget requis" : undefined,
          descriptiotn: isMissingString(descriptionValue) ? "Description requise" : undefined,
          entreprise: isMissingString(entreprise) ? "Entreprise requise" : undefined,
          position: !position ? "Position requise" : undefined,
          surface: isMissingNumber(surface) ? "Surface requise" : undefined,
          user_id: isMissingString(user_id) ? "User ID requis" : undefined
        });
      }

      const signalement = await signalementService.createSignalement({
        budget,
        date: date || new Date().toISOString(),
        descriptiotn: descriptionValue,
        entreprise,
        position,
        status: status || 'Nouveau',
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

  async uploadPhotos(req, res) {
    try {
      const { id } = req.params;
      const files = req.files || [];

      if (!id) {
        return res.status(422).json({
          error: "ID du signalement requis"
        });
      }

      const photos = await signalementService.uploadSignalementPhotos(id, files);

      return res.status(200).json({
        success: true,
        photos
      });
    } catch (error) {
      console.error("Erreur upload photos signalement :", error);
      return res.status(500).json({
        error: error.message || "Impossible d'uploader les photos"
      });
    }
  }

  async listPhotos(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(422).json({
          error: "ID du signalement requis"
        });
      }

      const photos = await signalementService.listSignalementPhotos(id);

      return res.status(200).json({
        success: true,
        photos
      });
    } catch (error) {
      console.error("Erreur récupération photos signalement :", error);
      return res.status(500).json({
        error: error.message || "Impossible de récupérer les photos"
      });
    }
  }
}

module.exports = new SignalementController();
