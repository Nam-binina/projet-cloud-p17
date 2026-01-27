const admin = require("../config/firebase-admin");
const db = admin.firestore();

class SignalementService {

    async listSignalements(limit = 50, startAfterId = null) {
        try {
            let query = db.collection("signalements").orderBy("createdAt", "desc").limit(limit);

            if (startAfterId) {
                const lastDoc = await db.collection("signalements").doc(startAfterId).get();
                if (lastDoc.exists) {
                    query = query.startAfter(lastDoc);
                }
            }

            const snapshot = await query.get();

            const signalements = [];
            snapshot.forEach(doc => {
                signalements.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return signalements;

        } catch (error) {
            console.error("Erreur Firestore, utilisation de données de test:", error.message);
            // Fallback avec données de test
            return [
                { id: 'test-1', title: 'Activité suspecte sur un compte', type: 'Fraud', severity: 'High', status: 'Open', reportedBy: 'Jean Dupont', createdAt: Date.now() - 86400000, description: 'Tentatives de connexion non autorisées' },
                { id: 'test-2', title: 'Contenu inapproprié', type: 'Content', severity: 'Medium', status: 'pending', reportedBy: 'Marie Martin', createdAt: Date.now() - 172800000, description: 'Publication de contenu interdit' },
                { id: 'test-3', title: 'Problème de paiement', type: 'Payment', severity: 'High', status: 'resolved', reportedBy: 'Pierre Durand', createdAt: Date.now() - 259200000, description: 'Transaction échouée' },
                { id: 'test-4', title: 'Service client insatisfaisant', type: 'Support', severity: 'Low', status: 'Open', reportedBy: 'Sophie Bernard', createdAt: Date.now() - 345600000, description: 'Agent non coopératif' },
                { id: 'test-5', title: 'Bug technique', type: 'Bug', severity: 'Medium', status: 'in_review', reportedBy: 'Luc Petit', createdAt: Date.now() - 432000000, description: 'L\'application plante sur certaines pages' },
                { id: 'test-6', title: 'Compromission de compte', type: 'Security', severity: 'Critical', status: 'Open', reportedBy: 'Emma Leroy', createdAt: Date.now() - 518400000, description: 'Tentative de prise de contrôle de compte' },
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
            const now = Date.now();
            const newDoc = await db.collection("signalements").add({
                ...data,
                status: data.status || "pending",
                createdAt: now,
                updatedAt: now
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

            data.updatedAt = Date.now();
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
}

module.exports = new SignalementService();
