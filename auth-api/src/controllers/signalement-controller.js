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
      const { title, type, severity, description, reportedBy } = req.body;

      if (!title || !type) {
        return res.status(422).json({
          error: "Titre et type requis",
          title: !title ? "Titre requis" : undefined,
          type: !type ? "Type requis" : undefined
        });
      }

      const signalement = await signalementService.createSignalement({
        title,
        type,
        severity: severity || 'Medium',
        description: description || '',
        reportedBy: reportedBy || 'Anonymous',
        status: 'Open'
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
}

module.exports = new SignalementController();
