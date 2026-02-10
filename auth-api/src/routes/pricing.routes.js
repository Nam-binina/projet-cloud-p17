const express = require('express');
const router = express.Router();
const pool = require('../config/postgresql');

// GET - Récupérer le prix au m2 actuel
router.get('/price-per-m2', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT price_per_m2, updated_at FROM repair_pricing_config LIMIT 1'
        );
        
        if (result.rows.length === 0) {
            // Créer la config par défaut si elle n'existe pas
            const insertResult = await pool.query(
                'INSERT INTO repair_pricing_config (price_per_m2) VALUES (50.00) RETURNING *'
            );
            return res.json(insertResult.rows[0]);
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur récupération prix m2:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// PUT - Modifier le prix au m2 (Manager uniquement)
router.put('/price-per-m2', async (req, res) => {
    try {
        const { price_per_m2 } = req.body;
        
        if (!price_per_m2 || price_per_m2 <= 0) {
            return res.status(400).json({ error: 'Prix au m2 invalide' });
        }
        
        // Vérifier si une config existe
        const checkResult = await pool.query('SELECT id FROM repair_pricing_config LIMIT 1');
        
        let result;
        if (checkResult.rows.length === 0) {
            // Créer la config
            result = await pool.query(
                'INSERT INTO repair_pricing_config (price_per_m2) VALUES ($1) RETURNING *',
                [price_per_m2]
            );
        } else {
            // Mettre à jour la config
            result = await pool.query(
                `UPDATE repair_pricing_config 
                 SET price_per_m2 = $1, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $2
                 RETURNING *`,
                [price_per_m2, checkResult.rows[0].id]
            );
        }
        
        res.json({
            message: 'Prix au m2 mis à jour',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Erreur mise à jour prix m2:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// POST - Calculer un budget estimé
router.post('/calculate-budget', async (req, res) => {
    try {
        const { repair_level, surface_m2 } = req.body;
        
        if (!repair_level || repair_level < 1 || repair_level > 10) {
            return res.status(400).json({ error: 'Niveau de réparation doit être entre 1 et 10' });
        }
        
        if (!surface_m2 || surface_m2 <= 0) {
            return res.status(400).json({ error: 'Surface invalide' });
        }
        
        const priceResult = await pool.query(
            'SELECT price_per_m2 FROM repair_pricing_config LIMIT 1'
        );
        
        const price_per_m2 = priceResult.rows[0]?.price_per_m2 || 50;
        const calculated_budget = price_per_m2 * repair_level * surface_m2;
        
        res.json({
            price_per_m2: parseFloat(price_per_m2),
            repair_level,
            surface_m2,
            calculated_budget,
            formula: `${price_per_m2} × ${repair_level} × ${surface_m2} = ${calculated_budget}`
        });
    } catch (error) {
        console.error('Erreur calcul budget:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// GET - Liste des niveaux de réparation avec descriptions
router.get('/repair-levels', (req, res) => {
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
    
    res.json(REPAIR_LEVELS);
});

module.exports = router;
