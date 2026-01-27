// src/config/postgresql.js
require("dotenv").config();
const { Pool } = require("pg");
const { testWithRetry } = require("../utils/connectionUtils");

// Configuration de la connexion PostgreSQL
const poolConfig = {
  host: process.env.PG_HOST || "localhost",
  port: parseInt(process.env.PG_PORT || "5432"),
  database: process.env.PG_DATABASE || "auth_db",
  user: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "postgres",
  max: parseInt(process.env.PG_POOL_MAX || "20"), // Nombre max de connexions dans le pool
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || "30000"),
  connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || "5000"),
};

// Création du pool de connexions
const pool = new Pool(poolConfig);

// État de la connexion
let isConnected = false;
let lastConnectionAttempt = null;
let connectionError = null;

// Gestion des événements du pool
pool.on("connect", (client) => {
  console.log("Nouvelle connexion PostgreSQL établie");
  isConnected = true;
  connectionError = null;
});

pool.on("error", (err, client) => {
  console.error("Erreur PostgreSQL inattendue:", err);
  connectionError = err;
  isConnected = false;
});

pool.on("remove", (client) => {
  console.log("Client PostgreSQL retiré du pool");
});

/**
 * Teste la connexion à PostgreSQL
 * @returns {Promise<boolean>} - true si connexion OK, false sinon
 */
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    
    isConnected = true;
    lastConnectionAttempt = new Date();
    connectionError = null;
    
    console.log("Connexion PostgreSQL testée avec succès");
    return true;
  } catch (error) {
    isConnected = false;
    lastConnectionAttempt = new Date();
    connectionError = error;
    
    console.error("Échec du test de connexion PostgreSQL:", error.message);
    return false;
  }
}

/**
 * Initialise la base de données (crée les tables si nécessaire)
 * @returns {Promise<boolean>} - true si succès, false sinon
 */
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Créer la table users si elle n'existe pas
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        firebase_uid VARCHAR(255),
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);
    
    // Créer un index sur l'email pour les recherches rapides
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
    
    // Créer un index sur firebase_uid
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid)
    `);
    
    client.release();
    
    console.log("Base de données PostgreSQL initialisée");
    return true;
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base:", error.message);
    return false;
  }
}

/**
 * Obtient une connexion du pool avec retry
 * @param {number} maxRetries - Nombre maximum de tentatives
 * @returns {Promise<Client>} - Client PostgreSQL
 */
async function getConnection(maxRetries = 3) {
  return testWithRetry(async () => {
    try {
      const client = await pool.connect();
      return client;
    } catch (error) {
      console.error("Tentative de connexion PostgreSQL échouée:", error.message);
      throw error;
    }
  }, maxRetries, 1000);
}

/**
 * Exécute une requête avec gestion d'erreur
 * @param {string} query - Requête SQL
 * @param {Array} params - Paramètres de la requête
 * @returns {Promise<Object>} - Résultat de la requête
 */
async function executeQuery(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result;
  } catch (error) {
    console.error("Erreur lors de l'exécution de la requête:", error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Exécute une transaction
 * @param {Function} callback - Fonction contenant les requêtes de la transaction
 * @returns {Promise<any>} - Résultat de la transaction
 */
async function executeTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Transaction annulée:", error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Vérifie l'état de la connexion PostgreSQL
 * @returns {Object} - Informations sur la connexion
 */
function getConnectionStatus() {
  return {
    isConnected,
    lastConnectionAttempt,
    error: connectionError ? connectionError.message : null,
    poolStats: {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    },
    config: {
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
      user: poolConfig.user,
    }
  };
}

/**
 * Ferme proprement le pool de connexions
 * @returns {Promise<void>}
 */
async function closePool() {
  try {
    await pool.end();
    console.log("Pool PostgreSQL fermé proprement");
  } catch (error) {
    console.error("Erreur lors de la fermeture du pool:", error.message);
    throw error;
  }
}

/**
 * Vérifie si PostgreSQL est disponible
 * @returns {Promise<boolean>}
 */
async function isPostgreSQLAvailable() {
  try {
    await testConnection();
    return true;
  } catch (error) {
    return false;
  }
}

// Initialiser la base au démarrage (tentative)
(async () => {
  const connected = await testConnection();
  if (connected) {
    await initializeDatabase();
  } else {
    console.warn("PostgreSQL non disponible au démarrage - mode offline");
  }
})();

// Gestion de la fermeture propre
process.on("SIGINT", async () => {
  console.log("\nFermeture des connexions PostgreSQL...");
  await closePool();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nFermeture des connexions PostgreSQL...");
  await closePool();
  process.exit(0);
});

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
  getConnection,
  executeQuery,
  executeTransaction,
  getConnectionStatus,
  closePool,
  isPostgreSQLAvailable,
};
