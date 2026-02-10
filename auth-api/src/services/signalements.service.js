const { executeQuery } = require("../config/postgresql");

class SignalementService {
  async listSignalements(limit = 50, startAfterId = null) {
    return this.list(limit, startAfterId);
  }

  async list(limit = 50, startAfterId = null) {
    const q = `SELECT * FROM signalements WHERE deleted_at IS NULL ORDER BY date DESC LIMIT $1`;
    const res = await executeQuery(q, [limit]);
    return res.rows;
  }

  async getSignalementById(id) {
    const res = await executeQuery(`SELECT * FROM signalements WHERE id = $1 AND deleted_at IS NULL`, [id]);
    if (res.rows.length === 0) throw new Error('Signalement introuvable');
    return res.rows[0];
  }

  async createSignalement(data) {
    const q = `INSERT INTO signalements (description, entreprise, position, status, surface, budget, user_id, date, date_debut, date_fin, photos, sync_status, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PENDING',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING *`;
    const params = [
      data.descriptiotn || data.description,
      data.entreprise || null,
      data.position ? JSON.stringify(data.position) : null,
      data.status || 'Nouveau',
      data.surface || 0,
      data.budget || 0,
      data.user_id,
      data.date || new Date().toISOString(),
      data.date_debut || null,
      data.date_fin || null,
      data.photos ? JSON.stringify(data.photos) : '[]'
    ];

    const res = await executeQuery(q, params);
    const created = res.rows[0];

    try {
      await executeQuery(`INSERT INTO sync_queue (entity, entity_id, action, payload, status, created_at) VALUES ($1,$2,$3,$4,'PENDING',CURRENT_TIMESTAMP)`, [
        'signalements', String(created.id), 'CREATE', JSON.stringify(created)
      ]);
    } catch (e) {
      console.warn('Failed to enqueue signalement sync:', e.message);
    }

    return created;
  }

  async updateSignalement(id, data) {
    const allowed = ['description','entreprise','position','status','surface','budget','date','date_debut','date_fin','photos'];
    const sets = [];
    const params = [];
    let idx = 1;
    for (const key of Object.keys(data)) {
      if (!allowed.includes(key)) continue;
      sets.push(`${key} = $${idx}`);
      if (key === 'position' || key === 'photos') params.push(JSON.stringify(data[key])); else params.push(data[key]);
      idx++;
    }
    if (sets.length === 0) throw new Error('Aucun champ autorisé à mettre à jour');
    params.push(id);
    const q = `UPDATE signalements SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`;
    const res = await executeQuery(q, params);
    if (res.rows.length === 0) throw new Error('Signalement introuvable');
    const updated = res.rows[0];

    try {
      await executeQuery(`INSERT INTO sync_queue (entity, entity_id, action, payload, status, created_at) VALUES ($1,$2,$3,$4,'PENDING',CURRENT_TIMESTAMP)`, [
        'signalements', String(updated.id), 'UPDATE', JSON.stringify(updated)
      ]);
    } catch (e) {
      console.warn('Failed to enqueue signalement update sync:', e.message);
    }

    return updated;
  }

  async deleteSignalement(id) {
    const res = await executeQuery(`UPDATE signalements SET deleted_at = CURRENT_TIMESTAMP, sync_status = 'PENDING' WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) throw new Error('Signalement introuvable');

    try {
      await executeQuery(`INSERT INTO sync_queue (entity, entity_id, action, payload, status, created_at) VALUES ($1,$2,$3,$4,'PENDING',CURRENT_TIMESTAMP)`, [
        'signalements', String(id), 'DELETE', JSON.stringify({ id })
      ]);
    } catch (e) {
      console.warn('Failed to enqueue signalement delete sync:', e.message);
    }

    return { message: 'Signalement supprimé (soft delete)' };
  }

  async getSignalementsByUserId(userId, limit = 100) {
    const res = await executeQuery(`SELECT * FROM signalements WHERE user_id = $1 AND deleted_at IS NULL ORDER BY date DESC LIMIT $2`, [userId, limit]);
    return res.rows;
  }

  async cleanupTimestamps() {
    return { cleaned: 0 };
  }

  async uploadSignalementPhotos(id, files = []) {
    if (!id) throw new Error('ID du signalement requis');
    if (!files || files.length === 0) return [];

    const photoNames = files.map(f => f.filename).filter(Boolean);
    if (photoNames.length === 0) return [];

    const q = `UPDATE signalements SET photos = COALESCE(photos, '[]'::jsonb) || $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING photos`;
    const res = await executeQuery(q, [JSON.stringify(photoNames), id]);
    const photos = (res.rows[0] && res.rows[0].photos) ? res.rows[0].photos : [];
    return photoNames;
  }

  async listSignalementPhotos(id) {
    const res = await executeQuery(`SELECT photos FROM signalements WHERE id = $1`, [id]);
    if (res.rows.length === 0) throw new Error('Signalement introuvable');
    return Array.isArray(res.rows[0].photos) ? res.rows[0].photos : [];
  }
}

module.exports = new SignalementService();
