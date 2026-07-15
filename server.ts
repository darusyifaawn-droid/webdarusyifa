import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { fileURLToPath } from "url";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Firebase Admin
  let adminApp: App;
  try {
    const apps = getApps();
    if (apps.length === 0) {
      adminApp = initializeApp({
        projectId: firebaseConfig.projectId,
      });
      console.log("Firebase Admin initialized");
    } else {
      adminApp = apps[0];
    }
  } catch (error) {
    console.error("Firebase Admin init error:", error);
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
    try {
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(idToken);
      
      // Check if user is admin in Firestore
      const db = getFirestore();
      const adminDoc = await db.collection('admins').doc(decodedToken.uid).get();
      
      if (!adminDoc.exists) {
        // Also check if they are in the users collection with role 'admin'
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
          return res.status(403).json({ error: "Forbidden: Not an admin" });
        }
      }

      // Perform the password reset
      const userRecord = await auth.getUserByEmail(email);
      await auth.updateUser(userRecord.uid, {
        password: newPassword,
      });

      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      console.error("Reset password error:", error);
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
