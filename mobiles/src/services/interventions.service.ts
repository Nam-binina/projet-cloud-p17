const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Intervention {
  id: number;
  title: string;
  description?: string;
  status: 'nouveau' | 'en_cours' | 'termine' | 'pending' | 'new' | 'in_progress' | 'completed';
  repair_level: number;
  surface_m2: number;
  calculated_budget: number;
  latitude: number;
  longitude: number;
  location?: string;
  entreprise?: string;
  photos?: Photo[];
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: number;
  url: string;
  thumbnail?: string;
}

export interface RepairLevel {
  name: string;
  description: string;
  color: string;
}

export const REPAIR_LEVELS: Record<number, RepairLevel> = {
  1: { name: 'Très mineur', description: 'Retouches cosmétiques mineures', color: '#4CAF50' },
  2: { name: 'Mineur', description: 'Petites réparations superficielles', color: '#8BC34A' },
  3: { name: 'Léger', description: 'Réparations légères', color: '#CDDC39' },
  4: { name: 'Modéré-Léger', description: 'Travaux modérés légers', color: '#FFEB3B' },
  5: { name: 'Modéré', description: 'Réparations moyennes', color: '#FFC107' },
  6: { name: 'Modéré-Important', description: 'Travaux moyennement importants', color: '#FF9800' },
  7: { name: 'Important', description: 'Réparations importantes', color: '#FF5722' },
  8: { name: 'Très important', description: 'Travaux très importants', color: '#F44336' },
  9: { name: 'Majeur', description: 'Rénovation majeure', color: '#E91E63' },
  10: { name: 'Reconstruction', description: 'Reconstruction complète', color: '#9C27B0' }
};

class InterventionsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api`;
  }

  async getAll(): Promise<Intervention[]> {
    const response = await fetch(`${this.baseUrl}/interventions`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des interventions');
    }
    return response.json();
  }

  async getById(id: number): Promise<Intervention> {
    const response = await fetch(`${this.baseUrl}/interventions/${id}`);
    if (!response.ok) {
      throw new Error('Intervention non trouvée');
    }
    return response.json();
  }

  async create(intervention: Partial<Intervention>): Promise<Intervention> {
    const response = await fetch(`${this.baseUrl}/interventions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(intervention)
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la création de l\'intervention');
    }
    const data = await response.json();
    return data.data;
  }

  async update(id: number, intervention: Partial<Intervention>): Promise<Intervention> {
    const response = await fetch(`${this.baseUrl}/interventions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(intervention)
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour de l\'intervention');
    }
    const data = await response.json();
    return data.data;
  }

  async delete(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/interventions/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la suppression de l\'intervention');
    }
  }

  async getPricePerM2(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/pricing/price-per-m2`);
    if (!response.ok) {
      return 50; // Valeur par défaut
    }
    const data = await response.json();
    return data.price_per_m2;
  }

  async updatePricePerM2(price: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/pricing/price-per-m2`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price_per_m2: price })
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour du prix');
    }
  }

  async calculateBudget(repairLevel: number, surfaceM2: number): Promise<{
    price_per_m2: number;
    repair_level: number;
    surface_m2: number;
    calculated_budget: number;
    formula: string;
  }> {
    const response = await fetch(`${this.baseUrl}/pricing/calculate-budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repair_level: repairLevel,
        surface_m2: surfaceM2
      })
    });
    if (!response.ok) {
      throw new Error('Erreur lors du calcul du budget');
    }
    return response.json();
  }

  getRepairLevelInfo(level: number): RepairLevel | undefined {
    return REPAIR_LEVELS[level];
  }

  getRepairLevelColor(level: number): string {
    return REPAIR_LEVELS[level]?.color || '#999';
  }

  getRepairLevelName(level: number): string {
    return REPAIR_LEVELS[level]?.name || 'Non défini';
  }

  getRepairLevelDescription(level: number): string {
    return REPAIR_LEVELS[level]?.description || '';
  }

  getAllRepairLevels(): Record<number, RepairLevel> {
    return REPAIR_LEVELS;
  }
}

export const interventionsService = new InterventionsService();
export default interventionsService;
