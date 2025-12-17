test
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
  import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

  const firebaseConfig = {
  apiKey: "AIzaSyDBrQ-DDu9qbeteJQ804VIJ_r8XQ-2RjdA",
  authDomain: "tire-shop-52e54.firebaseapp.com",
  projectId: "tire-shop-52e54",
  storageBucket: "tire-shop-52e54.firebasestorage.app",
  messagingSenderId: "66109894982",
  appId: "1:66109894982:web:bb7241c0c22bb6b8857547"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  await signInAnonymously(auth);

  console.log("🔥 Firebase подключён");

