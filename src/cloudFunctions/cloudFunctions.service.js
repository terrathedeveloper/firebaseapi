const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
} = require("firebase/firestore");
const {
  getAuth,
  createUserWithEmailAndPassword,
  createUser,
  signInWithEmailAndPassword,
} = require("firebase/auth");
var admin = require("firebase-admin");

var serviceAccount = require("../../thebigjokerprod-firebase-adminsdk-7o9u8-ab68508be0.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://thebigjokerprod-default-rtdb.firebaseio.com",
});
const { getDatabase, ref, set } = require("firebase/database");
const firebaseConfig = {
  apiKey: "AIzaSyDxiEUWmZjUkdS4W00OTmX2w6_ZDQJH9M4",
  authDomain: "thebigjokerprod.firebaseapp.com",
  databaseURL: "https://thebigjokerprod-default-rtdb.firebaseio.com",
  projectId: "thebigjokerprod",
  storageBucket: "thebigjokerprod.appspot.com",
  messagingSenderId: "734279685963",
  appId: "1:734279685963:web:ec14a6a33c24c412fdface",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const database = getDatabase(app);

async function createNewUser(userData) {
  let initUser = {
    avatarColorIndex: 0,
    awaitingPartner: false,
    friendRequests: [],
    friends: [],
    gamesPlayed: 0,
    gamesWon: 0,
    hasPlayed: false,
    isMatchmaking: false,
    isOnline: true,
    muteMic: false,
    partner: null,
    photoUrl: null,
    searchCases: userData.searchCases,
  };
  try {
    let newUser = await admin.auth().createUser(userData);
    let token = await admin.auth().createCustomToken(newUser.uid);
    let { uid, email } = newUser;
    const user = {
      uid,
      token,
      email,
      username: userData.username,
      ...initUser,
    };
    await setDoc(doc(firestore, "users", user.username), user);
    return { userCreated: true };
  } catch (e) {
    return { e: e.message, message: "Error creating user" };
  }
}

async function signInUser(email, password){
  const auth = getAuth();
  try{
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    return {user:userCred}
  } catch(e){
    return {e:e.message, message: "Error with signing in user"}
  }
}

module.exports = {
  createNewUser,
  signInUser
};
