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
  let {user,requestor}=req.query;
  const result = await service.setFriendship(user, requestor)

  return res.status(200).json(result)
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
  const {user, partner } = req.body;
 // console.log('MESSAGE',partnerToken, username,type)
  const result = await service.createTeam(user,partner);
  //await service.sendPartnerInvite(partnerToken, username, type)
  res.status(200).send(result)
}
async function onPartnerMatchmaking(req, res) {
  let user = req.query.user;
  const result = await service.joinPartnerQueue(user);
  res.status(200).send(result)
}
async function onCancelPartnerMatchmaking(req, res) {
  let user = req.query.user;
  const result = await service.exitPartnerQueue(user);
  res.status(200).send(result)
}
async function onSelectedTeamMatchmaking(req, res) {
  res.status(200).send('Template successful')
}
async function onTeamMatchmaking(req, res) {
  const {user,userTeam,otherTeam}= req.body;
  console.log('on team matchmaking');
  const result = await service.onRandomTeamMatchmaking(user, userTeam, otherTeam)
  res.status(200).json(result)
}

async function onCancelMatchmaking(req, res) {
  const {user, partner}= req.body;
  console.log('on cancel matchmaking');
  const result = await service.onCancelTeamMatchmaking(user, partner)
  res.status(200).json(result)
}
async function playCard(req, res) {
  const {gameId, user, card}= req.body;
  console.log('input', gameId, user, card)
  const result = await service.handleCardPlay(gameId, user, card);
  res.status(200).json(result)
}
async function registerUser(req, res) {
  console.log('here we are');
  console.log(req.body)
  let user = {username: req.body.username,email: req.body.email, password: req.body.password.toString(), emailVerified: true,
    disabled: false, searchCases: req.body.searchCases}
    console.log(user);
  const result = await service.createNewUser(user,req.body.phoneNumber)

  res.status(200).json(result)
}
async function removeExpiredMatches(req, res) {
  res.status(200).send('Template successful')
}
async function removeExpiredPartnerMatches(req, res) {
  res.status(200).send('Template successful')
}


async function removePartner(req, res){
  const user = req.query.user;
  const result = await service.removePartner(user)

  res.status(200).json(result)
}
async function sendFriendsRequest(req, res) {
  res.status(200).send('Template successful')
}
async function sendPartnersRequest(req, res) {
  res.status(200).send('Template successful')
}
async function signInUser(req, res) {
  const {email, password}=req.body;
  const result = await service.signInUser(email, password);
  res.status(200).json(result)
}

async function signOutUser(req, res) {
  const result = await service.signOutUser();
  res.status(200).json(result)
}

async function startMatch(req, res){
  const {team1Id,team2Id, user} = req.body;
  let result = await service.onMatchStart(team1Id, team2Id, user)
  res.status(200).json(result)
}
async function teamMatchmakingRedirect(req, res) {
  res.status(200).send('Template successful')
}
async function updateGameReadyCount(req, res) {
  console.log('updatae tat game!');
  const {gameLobbyId,user} = req.body;
  const result = await service.setGameReady(gameLobbyId, user);
  res.status(200).json(result)
}
async function updateLobbyReadyCount(req, res) {
  const {gameLobbyId,user} = req.body;
  const result = await service.setPlayerReady(gameLobbyId, user);
  res.status(200).json(result)
}

async function initGame(req,res){
  const {gameId,user} = req.body;
  const result = await service.buildGameObj(gameId, user);
  res.status(200).json(result)
}

module.exports = {
  addFriend,
  endRound,
  gameLobbyQuit,
  getRtcToken,
  handlePartnersTransaction,
  initGame,
  onPartnerMatchmaking,
  onSelectedTeamMatchmaking,
  onTeamMatchmaking,
  onCancelMatchmaking,
  onCancelPartnerMatchmaking,
  playCard,
  registerUser,
  removeExpiredMatches,
  removeExpiredPartnerMatches,
  removePartner,
  sendFriendsRequest,
  sendPartnersRequest,
  signInUser,
  signOutUser,
  startMatch,
  teamMatchmakingRedirect,
  updateGameReadyCount,
  updateLobbyReadyCount
};