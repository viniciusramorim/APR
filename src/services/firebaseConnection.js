import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCNLDlGGnF5aWOuqCs3DvvP0Z718VeAh5A",
  authDomain: "seguranca-patrimonial-385514.firebaseapp.com",
  projectId: "seguranca-patrimonial-385514",
  storageBucket: "seguranca-patrimonial-385514.appspot.com",
  messagingSenderId: "554015247688",
  appId: "1:554015247688:web:223c68558f479130bdf77d",
  measurementId: "G-JCR33ML658"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;