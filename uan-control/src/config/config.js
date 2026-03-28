// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAu_bUtJnJq-0AKJzMs3qN0I2hF2l-SAuE",
  authDomain: "uan-control.firebaseapp.com",
  projectId: "uan-control",
  storageBucket: "uan-control.firebasestorage.app",
  messagingSenderId: "170988695544",
  appId: "1:170988695544:web:a57753d4c4f7dcabc1f00d",
  measurementId: "G-MBZ4RFE8MP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);