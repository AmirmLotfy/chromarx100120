import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB_XwdF8yw0D7xyKrEtH_Ns1CXchqt54bI",
  authDomain: "chromarx-215c8.firebaseapp.com",
  projectId: "chromarx-215c8",
  storageBucket: "chromarx-215c8.firebasestorage.app",
  messagingSenderId: "837855050071",
  appId: "1:837855050071:web:a9ffa24473d4ea097ae612"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
