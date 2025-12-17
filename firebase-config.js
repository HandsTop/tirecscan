// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDBrQ-DDu9qbeteJQ804VIJ_r8XQ-2RjdA",
  authDomain: "tire-shop-52e54.firebaseapp.com",
  projectId: "tire-shop-52e54",
  storageBucket: "tire-shop-52e54.firebasestorage.app",
  messagingSenderId: "66109894982",
  appId: "1:66109894982:web:bb7241c0c22bb6b8857547"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function ensureAuth() {
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}
