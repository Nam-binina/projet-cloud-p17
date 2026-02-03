const axios = require("axios");

async function isOnline(timeout = 3000) {
  try {
    await axios.get("https://www.google.com", { 
      timeout,
      validateStatus: () => true 
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function isFirebaseOnline(timeout = 5000) {
  try {
    const firebaseUrl = "https://identitytoolkit.googleapis.com/";
    await axios.get(firebaseUrl, { 
      timeout,
      validateStatus: () => true
    });
    return true;
  } catch (error) {
    console.warn("Firebase n'est pas accessible:", error.message);
    return false;
  }
}

async function isFirebaseProjectOnline(projectId, timeout = 5000) {
  if (!projectId) {
    console.warn("Project ID non fourni pour la vérification Firebase");
    return false;
  }

  try {
    const firebaseAuthDomain = `https://${projectId}.firebaseapp.com`;
    await axios.get(firebaseAuthDomain, { 
      timeout,
      validateStatus: () => true
    });
    return true;
  } catch (error) {
    console.warn(`Projet Firebase ${projectId} n'est pas accessible:`, error.message);
    return false;
  }
}

async function checkConnectivityStatus(projectId = null) {
  const status = {
    internet: false,
    firebase: false,
    project: false,
    mode: "offline",
    timestamp: new Date().toISOString()
  };

  status.internet = await isOnline();
  
  if (!status.internet) {
    return status;
  }

  status.firebase = await isFirebaseOnline();
  
  if (projectId) {
    status.project = await isFirebaseProjectOnline(projectId);
  }

  if (status.internet && status.firebase) {
    status.mode = "online";
  } else if (status.internet && !status.firebase) {
    status.mode = "degraded"; 
  } else {
    status.mode = "offline";
  }

  return status;
}

function monitorFirebaseConnection(callback, interval = 30000, projectId = null) {
  let isMonitoring = true;

  const check = async () => {
    if (!isMonitoring) return;
    
    const status = await checkConnectivityStatus(projectId);
    callback(status);
    
    if (isMonitoring) {
      setTimeout(check, interval);
    }
  };

  check();

  return () => {
    isMonitoring = false;
  };
}

async function testWithRetry(testFn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await testFn();
      if (result) return true;
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

module.exports = {
  isOnline,
  isFirebaseOnline,
  isFirebaseProjectOnline,
  checkConnectivityStatus,
  monitorFirebaseConnection,
  testWithRetry
};