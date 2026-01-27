const signalementService = require("../services/signalements.service");

class SignalementController {

  async list(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const startAfterId = req.query.startAfterId || null;
      const signalements = await signalementService.listSignalements(limit, startAfterId);
      res.status(200).json({ success: true, signalements });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async get(req, res) {
    try {
      const signalement = await signalementService.getSignalementById(req.params.id);
      res.status(200).json({ success: true, signalement });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async create(req, res) {
    try {
      const signalement = await signalementService.createSignalement(req.body);
      res.status(201).json({ success: true, signalement });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async update(req, res) {
    try {
      const signalement = await signalementService.updateSignalement(req.params.id, req.body);
      res.status(200).json({ success: true, signalement });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await signalementService.deleteSignalement(req.params.id);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  }
}

module.exports = new SignalementController();
