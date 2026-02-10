const admin = require('../config/firebase-admin');
const { executeQuery } = require('../config/postgresql');
const fs = require('fs');
const path = require('path');
const signalementService = require('./signalements.service');

const uploadRoot = process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads');

class SyncService {
  constructor() {
    this.firestore = admin.firestore();
    this.auth = admin.auth();
    this.maxRetries = 3;
  }

  async processQueue(limit = 50) {
    const rows = await executeQuery(
      `SELECT * FROM sync_queue WHERE status = 'PENDING' ORDER BY created_at LIMIT $1`,
      [limit]
    );

    const processed = { success: 0, failed: 0 };

    for (const row of rows.rows) {
      try {
        const payload = row.payload || {};
        if (row.entity === 'users') {
          await this._syncUser(row, payload);
        } else if (row.entity === 'signalements') {
          await this._syncSignalement(row, payload);
        } else {
          console.warn('Unknown sync entity:', row.entity);
        }

        await executeQuery(`UPDATE sync_queue SET status = 'DONE', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [row.id]);
        await executeQuery(`INSERT INTO sync_log (direction, entity, status, error, created_at) VALUES ($1,$2,$3,$4,CURRENT_TIMESTAMP)`, ['push', row.entity, 'SUCCESS', null]);
        processed.success++;
      } catch (err) {
        console.error('Error processing queue id', row.id, err.message);
        await executeQuery(`UPDATE sync_queue SET status = 'FAILED', retries = retries + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [row.id]);
        await executeQuery(`INSERT INTO sync_log (direction, entity, status, error, created_at) VALUES ($1,$2,$3,$4,CURRENT_TIMESTAMP)`, ['push', row.entity, 'FAILED', err.message]);
        processed.failed++;
      }
    }

    return processed;
  }

  async _syncUser(row, payload) {
    const email = payload.email;
    if (!email) throw new Error('User payload missing email');

    try {
      // Try to find user in Firebase
      let userRecord;
      try {
        userRecord = await this.auth.getUserByEmail(email);
      } catch (e) {
        userRecord = null;
      }

      if (row.action === 'DELETE') {
        if (userRecord) {
          await this.auth.deleteUser(userRecord.uid);
        }
        // mark user.sync_status in PG if needed
        await executeQuery(`UPDATE users SET sync_status = 'SYNCED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [row.entity_id]);
        return;
      }

      if (userRecord) {
        // update
        const updateParams = {};
        if (payload.email_verified !== undefined) updateParams.emailVerified = Boolean(payload.email_verified);
        if (payload.displayName) updateParams.displayName = payload.displayName;
        await this.auth.updateUser(userRecord.uid, updateParams);
        await executeQuery(`UPDATE users SET firebase_uid = $1, sync_status = 'SYNCED', updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [userRecord.uid, row.entity_id]);
      } else {
        // create
        const created = await this.auth.createUser({ email, emailVerified: Boolean(payload.email_verified), password: payload.password || 'TempPass123!' });
        await executeQuery(`UPDATE users SET firebase_uid = $1, sync_status = 'SYNCED', updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [created.uid, row.entity_id]);
      }
    } catch (err) {
      throw new Error('Firebase user sync failed: ' + err.message);
    }
  }

  async _syncSignalement(row, payload) {
    try {
      // For signalements we use Firestore documents
      if (row.action === 'DELETE') {
        if (payload.firebase_id) {
          await this.firestore.collection('signalements').doc(payload.firebase_id).delete();
        }
        await executeQuery(`UPDATE signalements SET sync_status = 'SYNCED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [row.entity_id]);
        return;
      }

      if (payload.firebase_id) {
        // update
        await this.firestore.collection('signalements').doc(payload.firebase_id).set(payload, { merge: true });
        await executeQuery(`UPDATE signalements SET sync_status = 'SYNCED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [row.entity_id]);
      } else {
        // create
        const docRef = await this.firestore.collection('signalements').add(payload);
        await executeQuery(`UPDATE signalements SET firebase_id = $1, sync_status = 'SYNCED', updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [docRef.id, row.entity_id]);
      }
    } catch (err) {
      throw new Error('Firebase signalement sync failed: ' + err.message);
    }
  }

  async syncSignalementsFromFirebase(limit = 200) {
    const stats = {
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };

    const snapshot = await this.firestore.collection('signalements').limit(limit).get();
    stats.total = snapshot.size;

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data() || {};
        const firebaseId = doc.id;
        const description = data.description || data.descriptiotn || '';
        const entreprise = data.entreprise || null;
        const position = data.position || null;
        const status = data.status || 'nouveau';
        const surface = Number.isFinite(Number(data.surface)) ? Number(data.surface) : 0;
        const budget = Number.isFinite(Number(data.budget)) ? Number(data.budget) : 0;
        const userId = data.user_id || null;
        const dateValue = data.date ? new Date(data.date) : new Date();

        if (!description || !userId) {
          stats.skipped++;
          continue;
        }

        const existing = await executeQuery(
          'SELECT id FROM signalements WHERE firebase_id = $1 AND deleted_at IS NULL',
          [firebaseId]
        );

        if (existing.rows.length > 0) {
          await executeQuery(
            `UPDATE signalements
             SET description = $1, entreprise = $2, position = $3, status = $4,
                 surface = $5, budget = $6, user_id = $7, date = $8,
                 sync_status = 'SYNCED', updated_at = CURRENT_TIMESTAMP
             WHERE firebase_id = $9`,
            [
              description,
              entreprise,
              position ? JSON.stringify(position) : null,
              status,
              surface,
              budget,
              userId,
              dateValue,
              firebaseId
            ]
          );
          stats.updated++;
        } else {
          await executeQuery(
            `INSERT INTO signalements
             (firebase_id, description, entreprise, position, status, surface, budget, user_id, date, photos, sync_status, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'[]'::jsonb,'SYNCED',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
            [
              firebaseId,
              description,
              entreprise,
              position ? JSON.stringify(position) : null,
              status,
              surface,
              budget,
              userId,
              dateValue
            ]
          );
          stats.created++;
        }
      } catch (err) {
        console.error('Signalement sync error:', err.message);
        stats.errors++;
      }
    }

    return stats;
  }

  async syncPhotosFromFirebase(limit = 200) {
    const stats = {
      total: 0,
      synced: 0,
      skipped: 0,
      missingSignalement: 0,
      missingBlob: 0,
      missingStoragePath: 0,
      errors: 0
    };

    const snapshot = await this.firestore.collection('photos').limit(limit).get();
    stats.total = snapshot.size;

    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || null;
    const bucket = storageBucket ? admin.storage().bucket(storageBucket) : null;

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data() || {};
        const firebaseSignalementId = data.signalement_id;
        if (!firebaseSignalementId) {
          stats.missingSignalement++;
          continue;
        }

        const pgRes = await executeQuery(
          'SELECT id, photos FROM signalements WHERE firebase_id = $1 AND deleted_at IS NULL',
          [firebaseSignalementId]
        );

        if (pgRes.rows.length === 0) {
          stats.missingSignalement++;
          continue;
        }

        const pgSignalement = pgRes.rows[0];
        const existingPhotos = Array.isArray(pgSignalement.photos) ? pgSignalement.photos : [];

        const rawName = String(data.filename || doc.id || 'photo').replace(/\s+/g, '_');
        const safeName = rawName.length > 0 ? rawName : `${doc.id}.jpg`;

        if (existingPhotos.includes(safeName)) {
          stats.skipped++;
          continue;
        }

        let buffer = null;
        const blobValue = data.photo_blob;
        if (blobValue) {
          if (Buffer.isBuffer(blobValue)) {
            buffer = blobValue;
          } else if (typeof blobValue.toBuffer === 'function') {
            buffer = blobValue.toBuffer();
          } else if (blobValue instanceof Uint8Array) {
            buffer = Buffer.from(blobValue);
          } else if (blobValue?.buffer) {
            buffer = Buffer.from(blobValue.buffer);
          }
        }

        if (!buffer) {
          const storagePath = data.storage_path;
          if (!storagePath) {
            stats.missingBlob++;
            stats.missingStoragePath++;
            continue;
          }
          if (!bucket) {
            stats.missingBlob++;
            continue;
          }
          const [downloaded] = await bucket.file(storagePath).download();
          buffer = downloaded;
        }

        const targetDir = path.join(uploadRoot, 'signalements', String(pgSignalement.id));
        fs.mkdirSync(targetDir, { recursive: true });
        const targetPath = path.join(targetDir, safeName);

        if (!fs.existsSync(targetPath)) {
          fs.writeFileSync(targetPath, buffer);
        }

        await signalementService.uploadSignalementPhotos(pgSignalement.id, [{ filename: safeName }]);
        stats.synced++;
      } catch (err) {
        console.error('Photo sync error:', err.message);
        stats.errors++;
      }
    }

    return stats;
  }

  async syncPhotosToFirebase(limit = 200) {
    const stats = {
      total: 0,
      synced: 0,
      skipped: 0,
      missingFirebaseId: 0,
      missingFile: 0,
      tooLarge: 0,
      errors: 0
    };

    const maxBytes = parseInt(process.env.MAX_FIRESTORE_PHOTO_BYTES || '900000', 10);

    const pgRes = await executeQuery(
      `SELECT id, firebase_id, photos
       FROM signalements
       WHERE deleted_at IS NULL AND photos IS NOT NULL AND photos <> '[]'::jsonb
       ORDER BY id DESC
       LIMIT $1`,
      [limit]
    );

    for (const row of pgRes.rows) {
      const firebaseId = row.firebase_id;
      if (!firebaseId) {
        stats.missingFirebaseId++;
        continue;
      }

      const photoNames = Array.isArray(row.photos) ? row.photos : [];
      for (const name of photoNames) {
        stats.total++;
        try {
          const safeName = String(name || '').trim();
          if (!safeName) {
            stats.skipped++;
            continue;
          }

          const existing = await this.firestore.collection('photos')
            .where('signalement_id', '==', firebaseId)
            .where('filename', '==', safeName)
            .limit(1)
            .get();

          if (!existing.empty) {
            stats.skipped++;
            continue;
          }

          const sourcePath = path.join(uploadRoot, 'signalements', String(row.id), safeName);
          if (!fs.existsSync(sourcePath)) {
            stats.missingFile++;
            continue;
          }

          const fileBuffer = fs.readFileSync(sourcePath);
          if (fileBuffer.length > maxBytes) {
            stats.tooLarge++;
            continue;
          }

          const blob = admin.firestore.Blob.fromBuffer(fileBuffer);

          await this.firestore.collection('photos').add({
            signalement_id: firebaseId,
            filename: safeName,
            content_type: 'image/jpeg',
            photo_blob: blob,
            created_at: new Date().toISOString(),
            source: 'postgresql'
          });

          stats.synced++;
        } catch (err) {
          console.error('Photo sync to Firebase error:', err.message);
          stats.errors++;
        }
      }
    }

    return stats;
  }
}

module.exports = new SyncService();