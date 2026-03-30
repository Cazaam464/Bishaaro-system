import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase, ref, push, set, onValue, update, remove, get
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDLfnU38aXsI3dA7M2B8hXddCc5p5lIoD8",
  authDomain: "bishaaro-system.firebaseapp.com",
  projectId: "bishaaro-system",
  storageBucket: "bishaaro-system.firebasestorage.app",
  messagingSenderId: "742008985142",
  appId: "1:742008985142:web:71074312ea40bffef26a97",
  databaseURL: "https://bishaaro-system-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// ── Generic CRUD helpers ──────────────────────────────────────────────────────

export function dbPush(path, data) {
  return push(ref(db, path), data).catch(err => {
    console.error(`dbPush [${path}] error:`, err.code, err.message);
    throw err;
  });
}

export function dbSet(path, data) {
  return set(ref(db, path), data).catch(err => {
    console.error(`dbSet [${path}] error:`, err.code, err.message);
    throw err;
  });
}

export function dbUpdate(path, data) {
  return update(ref(db, path), data).catch(err => {
    console.error(`dbUpdate [${path}] error:`, err.code, err.message);
    throw err;
  });
}

export function dbRemove(path) {
  return remove(ref(db, path)).catch(err => {
    console.error(`dbRemove [${path}] error:`, err.code, err.message);
    throw err;
  });
}

export function dbListen(path, callback) {
  onValue(
    ref(db, path),
    (snapshot) => {
      const data = snapshot.val();
      callback(data);
    },
    (error) => {
      console.error(`Firebase listen error [${path}]:`, error.code, error.message);
      if (error.code === "PERMISSION_DENIED") {
        import("./utils.js").then(({ showToast }) =>
          showToast("Firebase: Access denied. Fix Database Rules in Firebase Console.", "error")
        );
      } else {
        import("./utils.js").then(({ showToast }) =>
          showToast("Firebase connection error: " + error.message, "error")
        );
      }
    }
  );
}

export function dbGet(path) {
  return get(ref(db, path));
}
