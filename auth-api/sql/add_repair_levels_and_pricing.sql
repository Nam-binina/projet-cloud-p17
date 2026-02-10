-- Migration: Ajouter les niveaux de réparation et le prix au m2
-- Pour le Manager - Catégorisation des réparations niveau 1-10
-- Le prix au m2 est DÉNORMALISÉ dans chaque intervention pour conserver
-- le prix appliqué au moment de la création (historique fidèle).

-- Table de configuration pour le prix au m2 actuel (backoffice)
CREATE TABLE IF NOT EXISTS repair_pricing_config (
    id SERIAL PRIMARY KEY,
    price_per_m2 DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insérer la configuration par défaut si elle n'existe pas
INSERT INTO repair_pricing_config (price_per_m2) 
SELECT 50.00 
WHERE NOT EXISTS (SELECT 1 FROM repair_pricing_config);

-- Table des interventions avec niveaux de réparation
-- price_per_m2 est stocké ici pour conserver le prix au moment de la création
CREATE TABLE IF NOT EXISTS interventions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    repair_level INTEGER CHECK (repair_level >= 1 AND repair_level <= 10),
    surface_m2 DECIMAL(10, 2),
    price_per_m2 DECIMAL(10, 2),
    calculated_budget DECIMAL(12, 2),
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    assigned_to INTEGER,
    created_by INTEGER,
    signalement_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ajouter la colonne price_per_m2 si la table existe déjà (migration incrémentale)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'interventions' AND column_name = 'price_per_m2'
    ) THEN
        ALTER TABLE interventions ADD COLUMN price_per_m2 DECIMAL(10, 2);
    END IF;
END $$;

-- Fonction pour calculer automatiquement le budget
-- Utilise le price_per_m2 dénormalisé stocké dans la ligne de l'intervention
CREATE OR REPLACE FUNCTION calculate_repair_budget()
RETURNS TRIGGER AS $$
BEGIN
    -- Si price_per_m2 n'est pas fourni lors de l'INSERT, on prélève le prix actuel de la config
    IF TG_OP = 'INSERT' AND NEW.price_per_m2 IS NULL THEN
        SELECT price_per_m2 INTO NEW.price_per_m2 FROM repair_pricing_config LIMIT 1;
    END IF;

    -- Calculer le budget à partir du prix stocké dans l'intervention
    IF NEW.repair_level IS NOT NULL AND NEW.surface_m2 IS NOT NULL AND NEW.price_per_m2 IS NOT NULL THEN
        NEW.calculated_budget := NEW.price_per_m2 * NEW.repair_level * NEW.surface_m2;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement le budget
DROP TRIGGER IF EXISTS trigger_calculate_budget ON interventions;
CREATE TRIGGER trigger_calculate_budget
    BEFORE INSERT OR UPDATE ON interventions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_repair_budget();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);
CREATE INDEX IF NOT EXISTS idx_interventions_repair_level ON interventions(repair_level);
CREATE INDEX IF NOT EXISTS idx_interventions_created_at ON interventions(created_at);
