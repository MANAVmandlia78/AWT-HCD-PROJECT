// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1Jr1f3IAcjILfCACNgOze4V64E3YSzZo",
  authDomain: "class-connect-storage-af2ef.firebaseapp.com",
  projectId: "class-connect-storage-af2ef",
  storageBucket: "class-connect-storage-af2ef.firebasestorage.app",
  messagingSenderId: "133641432775",
  appId: "1:133641432775:web:aa7e94e15eab14da78d8e2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);