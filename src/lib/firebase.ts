import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth();

export const authReady = signInAnonymously(auth)
  .then((userCredential) => {
    console.log('Firebase anonymous sign-in successful:', userCredential.user.uid);
    return userCredential.user;
  })
  .catch((error) => {
    console.error('Firebase anonymous sign-in failed:', error);
    return Promise.reject(error);
  });

// To use Anonymous Auth, enable it in the Firebase Console:
// Authentication > Sign-in method > Anonymous
