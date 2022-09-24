/**
 * List handler for reservation resources
 */
 const service = require("./cloudFunctions.service");
 
const {initializeApp} = require('firebase/app');
const {getFirestore, collection, query, where, getDocs, setDoc,doc} = require('firebase/firestore');
const {getDatabase, ref, set} = require("firebase/database");
const firebaseConfig = {
  apiKey: "AIzaSyDxiEUWmZjUkdS4W00OTmX2w6_ZDQJH9M4",
  authDomain: "thebigjokerprod.firebaseapp.com",
  databaseURL: "https://thebigjokerprod-default-rtdb.firebaseio.com",
  projectId: "thebigjokerprod",
  storageBucket: "thebigjokerprod.appspot.com",
  messagingSenderId: "734279685963",
  appId: "1:734279685963:web:ec14a6a33c24c412fdface"
};


const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const database = getDatabase(app)


 // Helper fxns ==============================================================
 
 const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
 
 // Validation fxns ==========================================================
 
 // Middleware fxns ==========================================================
 
async function addFriend(req, res) {
  let userId = 'terra';

  await set(ref(database, 'users/' + userId), {
    username: 'terrat',
    email: 'terra@taylor.com',
    profile_picture : 'http://www/gppg;e/cp,'
  });

  await setDoc(doc(firestore, "cities", "LA"), {
    name: "Los Angeles",
    state: "CA",
    country: "USA"
  });

  return res.status(200).send('Template successful')
}
async function endRound(req, res) {
  res.status(200).send('Template successful')
}
async function gameLobbyQuit(req, res) {
  res.status(200).send('Template successful')
}
async function getRtcToken(req, res) {
  res.status(200).send('Template successful')
}
async function handlePartnersTransaction(req, res) {
  res.status(200).send('Template successful')
}
async function onPartnerMatchmaking(req, res) {
  res.status(200).send('Template successful')
}
async function onSelectedTeamMatchmaking(req, res) {
  res.status(200).send('Template successful')
}
async function onTeamMatchmaking(req, res) {
  res.status(200).send('Template successful')
}
async function playCard(req, res) {
  res.status(200).send('Template successful')
}
async function registerUser(req, res) {
  res.status(200).send('Template successful')
}
async function removeExpiredMatches(req, res) {
  res.status(200).send('Template successful')
}
async function removeExpiredPartnerMatches(req, res) {
  res.status(200).send('Template successful')
}
async function sendFriendsRequest(req, res) {
  res.status(200).send('Template successful')
}
async function sendPartnersRequest(req, res) {
  res.status(200).send('Template successful')
}
async function signUp(req, res) {
  res.status(200).send('Template successful')
}
async function teamMatchmakingRedirect(req, res) {
  res.status(200).send('Template successful')
}
async function updateGameReadyCount(req, res) {
  res.status(200).send('Template successful')
}
async function updateLobbyReadyCount(req, res) {
  res.status(200).send('Template successful')
}

module.exports = {
  addFriend,
  endRound,
  gameLobbyQuit,
  getRtcToken,
  handlePartnersTransaction,
  onPartnerMatchmaking,
  onSelectedTeamMatchmaking,
  onTeamMatchmaking,
  playCard,
  registerUser,
  removeExpiredMatches,
  removeExpiredPartnerMatches,
  sendFriendsRequest,
  sendPartnersRequest,
  signUp,
  teamMatchmakingRedirect,
  updateGameReadyCount,
  updateLobbyReadyCount
};