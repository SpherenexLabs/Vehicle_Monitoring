import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, get, set, remove } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyAXHnvNZkb00PXbG5JidbD4PbRgf7l6Lgg",
    authDomain: "v2v-communication-d46c6.firebaseapp.com",
    databaseURL: "https://v2v-communication-d46c6-default-rtdb.firebaseio.com",
    projectId: "v2v-communication-d46c6",
    storageBucket: "v2v-communication-d46c6.firebasestorage.app",
    messagingSenderId: "536888356116",
    appId: "1:536888356116:web:c6bbab9c6faae7c84e2601",
    measurementId: "G-FXLP4KQXWM"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getDatabase(app);

// Initialize default admin credentials in Firebase if not already set
const adminRef = ref(db, 'admins/admin');
get(adminRef).then((snapshot) => {
    if (!snapshot.exists()) {
        set(adminRef, {
            email: 'admin@gmail.com',
            password: 'admin@123',
            role: 'admin'
        });
    }
});

// One-time cleanup: remove the bad 'users' artifact inside Engine_Health (caused by old broken signup path)
const badUsersRef = ref(db, 'Engine_Health/users');
get(badUsersRef).then((snap) => {
    if (snap.exists() && typeof snap.val() === 'string') {
        remove(badUsersRef);
    }
});