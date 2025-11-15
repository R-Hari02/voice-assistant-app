// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCqA_0JD7iUdffCjEmQBT1P5UDMBy39z0A",
  authDomain: "prohari-webai.firebaseapp.com",
  projectId: "prohari-webai",
  storageBucket: "prohari-webai.firebasestorage.app",
  messagingSenderId: "1093489980531",
  appId: "1:1093489980531:web:80639e1bd08714f7a42606",
  measurementId: "G-2R4GQ8TW4K"
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
