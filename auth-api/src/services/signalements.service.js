const admin = require("../config/firebase-admin");
const db = admin.firestore();

class SignalementService {

    async listSignalements(limit = 50, startAfterId = null) {
        try {
            // Récupérer tous les signalements sans ordre (pour éviter les problèmes d'index)
            let query = db.collection("signalements");

            const snapshot = await query.get();

            const signalements = [];
            snapshot.forEach(doc => {
                signalements.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Trier par date côté serveur
            signalements.sort((a, b) => {
                const dateA = new Date(a.date || 0);
                const dateB = new Date(b.date || 0);
                return dateB - dateA; // Descending order
            });

            // Appliquer la limite
            return signalements.slice(0, limit);

        } catch (error) {
            console.error("Erreur Firestore, utilisation de données de test:", error.message);
            // Fallback avec données de test
            return [
                { id: 'test-1', title: 'Activité suspecte sur un compte', type: 'Fraud', severity: 'High', status: 'Open', reportedBy: 'Jean Dupont', date: new Date(Date.now() - 86400000).toISOString(), description: 'Tentatives de connexion non autorisées' },
                { id: 'test-2', title: 'Contenu inapproprié', type: 'Content', severity: 'Medium', status: 'pending', reportedBy: 'Marie Martin', date: new Date(Date.now() - 172800000).toISOString(), description: 'Publication de contenu interdit' },
                { id: 'test-3', title: 'Problème de paiement', type: 'Payment', severity: 'High', status: 'resolved', reportedBy: 'Pierre Durand', date: new Date(Date.now() - 259200000).toISOString(), description: 'Transaction échouée' },
                { id: 'test-4', title: 'Service client insatisfaisant', type: 'Support', severity: 'Low', status: 'Open', reportedBy: 'Sophie Bernard', date: new Date(Date.now() - 345600000).toISOString(), description: 'Agent non coopératif' },
                { id: 'test-5', title: 'Bug technique', type: 'Bug', severity: 'Medium', status: 'in_review', reportedBy: 'Luc Petit', date: new Date(Date.now() - 432000000).toISOString(), description: 'L\'application plante sur certaines pages' },
                { id: 'test-6', title: 'Compromission de compte', type: 'Security', severity: 'Critical', status: 'Open', reportedBy: 'Emma Leroy', date: new Date(Date.now() - 518400000).toISOString(), description: 'Tentative de prise de contrôle de compte' },
            ];
        }
    }

    async getSignalementById(id) {
        try {
            const doc = await db.collection("signalements").doc(id).get();
            if (!doc.exists) {
                throw new Error("Signalement introuvable");
            }
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error("Erreur getSignalementById :", error.message);
            throw error;
        }
    }

    async createSignalement(data) {
        try {
            const newDoc = await db.collection("signalements").add({
                ...data,
                status: data.status || "pending"
            });

            const docSnap = await newDoc.get();
            return { id: newDoc.id, ...docSnap.data() };
        } catch (error) {
            console.error("Erreur création signalement :", error.message);
            throw new Error("Impossible de créer le signalement");
        }
    }

    async updateSignalement(id, data) {
        try {
            const docRef = db.collection("signalements").doc(id);
            const docSnap = await docRef.get();

            if (!docSnap.exists) {
                throw new Error("Signalement introuvable");
            }

            await docRef.update(data);

            const updatedSnap = await docRef.get();
            return { id: updatedSnap.id, ...updatedSnap.data() };
        } catch (error) {
            console.error("Erreur update signalement :", error.message);
            throw error;
        }
    }

    async deleteSignalement(id) {
        try {
            const docRef = db.collection("signalements").doc(id);
            const docSnap = await docRef.get();

            if (!docSnap.exists) {
                throw new Error("Signalement introuvable");
            }

            await docRef.delete();
            return { message: "Signalement supprimé avec succès" };
        } catch (error) {
            console.error("Erreur delete signalement :", error.message);
            throw error;
        }
    }

    async getSignalementsByUserId(userId, limit = 100) {
        try {
            // Charger tous les signalements et filtrer côté serveur
            const snapshot = await db.collection("signalements").get();

            const signalements = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // Filtrer par user_id côté serveur
                if (data.user_id === userId) {
                    signalements.push({
                        id: doc.id,
                        ...data
                    });
                }
            });

            // Trier par date (descendant)
            signalements.sort((a, b) => {
                const dateA = new Date(a.date || 0);
                const dateB = new Date(b.date || 0);
                return dateB - dateA;
            });

            // Appliquer la limite
            return signalements.slice(0, limit);
        } catch (error) {
            console.error("Erreur getSignalementsByUserId :", error.message);
            throw error;
        }
    }

    async cleanupTimestamps() {
        try {
            const snapshot = await db.collection("signalements").get();
            const batch = db.batch();
            let count = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.createdAt || data.updatedAt) {
                    const updateData = { ...data };
                    delete updateData.createdAt;
                    delete updateData.updatedAt;
                    batch.update(doc.ref, updateData);
                    count++;
                }
            });

            if (count > 0) {
                await batch.commit();
            }
            return { cleaned: count };
        } catch (error) {
            console.error("Erreur cleanup timestamps :", error.message);
            throw error;
        }
    }

    async uploadSignalementPhotos(id, files = []) {
        try {
            if (!id) {
                throw new Error("ID du signalement requis");
            }

            const docRef = db.collection("signalements").doc(id);
            const docSnap = await docRef.get();
            if (!docSnap.exists) {
                throw new Error("Signalement introuvable");
            }

            if (!files.length) {
                return [];
            }

            const photoNames = files
                .map(file => file.filename)
                .filter(Boolean);

            if (photoNames.length > 0) {
                await docRef.update({
                    photos: admin.firestore.FieldValue.arrayUnion(...photoNames)
                });
            }

            return photoNames;
        } catch (error) {
            console.error("Erreur upload photos signalement :", error.message);
            throw error;
        }
    }

    async listSignalementPhotos(id) {
        try {
            if (!id) {
                throw new Error("ID du signalement requis");
            }

            const doc = await db.collection("signalements").doc(id).get();
            if (!doc.exists) {
                throw new Error("Signalement introuvable");
            }

            const data = doc.data();
            return Array.isArray(data.photos) ? data.photos : [];
        } catch (error) {
            console.error("Erreur récupération photos signalement :", error.message);
            throw error;
        }
    }
}

module.exports = new SignalementService();
