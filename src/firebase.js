import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyAXHnvNZkb00PXbG5JidbD4PbRgf7l6Lgg",
    authDomain: "v2v-communication-d46c6.firebaseapp.com",
    databaseURL: "https://v2v-communication-d46c6-default-rtdb.firebaseio.com",
    projectId: "v2v-communication-d46c6",
    storageBucket: "v2v-communication-d46c6.firebasestorage.app",
    messagingSenderId: "638336881134",
    appId: "1:638336881134:web:e6e91a4c7596e57f3fae38"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);