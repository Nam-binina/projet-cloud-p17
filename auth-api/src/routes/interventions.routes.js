const express = require('express');
const router = express.Router();
const pool = require('../config/postgresql');

// Niveaux de réparation avec descriptions
const REPAIR_LEVELS = {
    1: { name: 'Très mineur', description: 'Retouches cosmétiques mineures' },
    2: { name: 'Mineur', description: 'Petites réparations superficielles' },
    3: { name: 'Léger', description: 'Réparations légères' },
    4: { name: 'Modéré-Léger', description: 'Travaux modérés légers' },
    5: { name: 'Modéré', description: 'Réparations moyennes' },
    6: { name: 'Modéré-Important', description: 'Travaux moyennement importants' },
    7: { name: 'Important', description: 'Réparations importantes' },
    8: { name: 'Très important', description: 'Travaux très importants' },
    9: { name: 'Majeur', description: 'Rénovation majeure' },
    10: { name: 'Reconstruction', description: 'Reconstruction complète' }
};

// GET - Liste des interventions avec budgets calculés
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM interventions ORDER BY created_at DESC`
        );
        
        const interventions = result.rows.map(intervention => ({
            ...intervention,
            repair_level_info: intervention.repair_level ? REPAIR_LEVELS[intervention.repair_level] : null
        }));
        
        res.json(interventions);
    } catch (error) {
        console.error('Erreur liste interventions:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// GET - Une intervention par ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM interventions WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Intervention non trouvée' });
        }
        
        const intervention = result.rows[0];
        intervention.repair_level_info = intervention.repair_level ? REPAIR_LEVELS[intervention.repair_level] : null;
        
        res.json(intervention);
    } catch (error) {
        console.error('Erreur récupération intervention:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// POST - Créer une intervention avec calcul automatique du budget
router.post('/', async (req, res) => {
    try {
        const { 
            title, 
            description, 
            repair_level, 
            surface_m2, 
            location,
            assigned_to,
            signalement_id
        } = req.body;
        
        // Validations
        if (!title) {
            return res.status(400).json({ error: 'Titre requis' });
        }
        
        if (repair_level && (repair_level < 1 || repair_level > 10)) {
            return res.status(400).json({ error: 'Niveau de réparation doit être entre 1 et 10' });
        }
        
        const result = await pool.query(
            `INSERT INTO interventions 
             (title, description, repair_level, surface_m2, location, assigned_to, signalement_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [title, description, repair_level, surface_m2, location, assigned_to, signalement_id]
        );
        
        const intervention = result.rows[0];
        
        // Ajouter les infos du niveau de réparation
        if (intervention.repair_level) {
            intervention.repair_level_info = REPAIR_LEVELS[intervention.repair_level];
        }
        
        res.status(201).json({
            message: 'Intervention créée',
            data: intervention
        });
    } catch (error) {
        console.error('Erreur création intervention:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// PUT - Mettre à jour une intervention
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, repair_level, surface_m2, location, status, assigned_to } = req.body;
        
        if (repair_level && (repair_level < 1 || repair_level > 10)) {
            return res.status(400).json({ error: 'Niveau de réparation doit être entre 1 et 10' });
        }
        
        const result = await pool.query(
            `UPDATE interventions 
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 repair_level = COALESCE($3, repair_level),
                 surface_m2 = COALESCE($4, surface_m2),
                 location = COALESCE($5, location),
                 status = COALESCE($6, status),
                 assigned_to = COALESCE($7, assigned_to),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8
             RETURNING *`,
            [title, description, repair_level, surface_m2, location, status, assigned_to, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Intervention non trouvée' });
        }
        
        const intervention = result.rows[0];
        intervention.repair_level_info = intervention.repair_level ? REPAIR_LEVELS[intervention.repair_level] : null;
        
        res.json({
            message: 'Intervention mise à jour',
            data: intervention
        });
    } catch (error) {
        console.error('Erreur mise à jour intervention:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// DELETE - Supprimer une intervention
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM interventions WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Intervention non trouvée' });
        }
        
        res.json({
            message: 'Intervention supprimée',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Erreur suppression intervention:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// GET - Statistiques des interventions
router.get('/stats/summary', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_interventions,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
                COALESCE(SUM(calculated_budget), 0) as total_budget,
                COALESCE(AVG(repair_level), 0) as average_repair_level,
                COALESCE(AVG(surface_m2), 0) as average_surface
            FROM interventions
        `);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur statistiques:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

module.exports = router;
