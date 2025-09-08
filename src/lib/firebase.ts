import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyArPQVGOR1gMWOiGVHVd0XkKFKRVMdWEcU",
    authDomain: "advanced-pri-wol-f66.firebaseapp.com",
    databaseURL: "https://advanced-pri-wol-f66-default-rtdb.firebaseio.com",
    projectId: "advanced-pri-wol-f66",
    storageBucket: "advanced-pri-wol-f66.appspot.com",
    messagingSenderId: "323155912274",
    appId: "1:323155912274:web:3260266198ae14c6e0218b"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

export { app, db };
