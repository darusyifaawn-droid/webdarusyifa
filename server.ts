import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Firebase Admin
  let adminApp: App;
  try {
    const apps = getApps();
    if (apps.length === 0) {
      console.log(`[FirebaseInit] Initializing with ProjectID: ${firebaseConfig.projectId}`);
      adminApp = initializeApp({
        projectId: firebaseConfig.projectId,
      });
    } else {
      adminApp = apps[0];
    }
  } catch (error) {
    console.error("[FirebaseInit] Error:", error);
    // Fallback to default initialization
    adminApp = initializeApp();
  }

  app.use(express.json());

  // API Routes
  app.post("/api/admin/reset-password", async (req, res) => {
    const { email, newPassword } = req.body;

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log(`[ResetPW] Request for email: ${email}`);
    
    try {
      const auth = getAuth(adminApp);
      const decodedToken = await auth.verifyIdToken(idToken);
      console.log(`[ResetPW] Admin verified: ${decodedToken.email} (UID: ${decodedToken.uid})`);
      
      // Use the database ID from config if available
      const dbId = (firebaseConfig as any).firestoreDatabaseId || "(default)";
      const db = getFirestore(adminApp, dbId);
      
      console.log(`[ResetPW] Checking admin status for UID: ${decodedToken.uid} on database: ${dbId}`);
      
      try {
        const adminDoc = await db.collection('admins').doc(decodedToken.uid).get();
        
        let isAdmin = adminDoc.exists;
        
        if (!isAdmin) {
          console.log(`[ResetPW] UID ${decodedToken.uid} not in 'admins' collection, checking 'users' collection...`);
          const userDoc = await db.collection('users').doc(decodedToken.uid).get();
          isAdmin = userDoc.exists && userDoc.data()?.role === 'admin';
        }

        if (!isAdmin) {
          console.warn(`[ResetPW] Access denied for UID: ${decodedToken.uid}`);
          return res.status(403).json({ error: "Forbidden: Not an admin" });
        }
      } catch (fsError: any) {
        console.error(`[ResetPW] Firestore error during admin check:`, fsError);
        // If Firestore fails with permission denied, it might be a DB ID issue or IAM issue
        // We'll proceed with caution if the token itself contains admin claims (if implemented)
        // For now, let's just log and rethrow to see the exact error
        throw fsError;
      }

      console.log(`[ResetPW] Admin status confirmed. Looking up user by email: ${email}`);
      
      // Perform the password reset
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(email);
      } catch (authError: any) {
        if (authError.code === 'auth/user-not-found') {
          console.error(`[ResetPW] User not found in Firebase Auth: ${email}`);
          return res.status(404).json({ error: "User tidak ditemukan di Firebase Authentication." });
        }
        throw authError;
      }

      console.log(`[ResetPW] User found (UID: ${userRecord.uid}). Updating password...`);
      await auth.updateUser(userRecord.uid, {
        password: newPassword,
      });

      console.log(`[ResetPW] Password successfully updated for ${email}`);
      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      console.error("[ResetPW] Critical Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
