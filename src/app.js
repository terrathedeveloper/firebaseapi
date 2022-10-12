const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
// const cors = require("cors");
const logger = require("./config/logger");

const errorHandler = require("./errors/errorHandler");
const notFound = require("./errors/notFound");
const cloudFunctionsRouter = require("./cloudFunctions/cloudFunctions.router")
// const specialRouter = require("./special/special.router")

const app = express();

//app.use(logger);
// app.use(cors());
app.use(express.json());


app.use(cloudFunctionsRouter);
// app.use("/special", specialRouter)

// app.get('/', (req, res) => {
//   res.status(200).send('Card game server root!')
// })
// app.get('/addFriend', (req, res) => {
//   res.status(200).send('Add friend endpoint')
// })
// app.get('/endRound', (req, res) => {
//   res.status(200).send('End round endpoint')
// })
// app.get('/gameLobbyQuit', (req, res) => {
//   res.status(200).send('Game lobby quit endpoint')
// })
// app.get('/getRtcToken', (req, res) => {
//   res.status(200).send('Get RTC Token endpoint')
// })
// app.get('/handlePartnersTransaction', (req, res) => {
//   res.status(200).send('Handle partners transaction endpoint')
// })
// app.get('/onPartnerMatchmaking', (req, res) => {
//   res.status(200).send('Partner matchmaking endpoint')
// })
// app.get('/onSelectedTeamMatchmaking', (req, res) => {
//   res.status(200).send('Selected team matchmaking endpoint')
// })
// app.get('/onTeamMatchmaking', (req, res) => {
//   res.status(200).send('Team matchmaking endpoint')
// })
// app.get('/removeExpiredMatches', (req, res) => {
//   res.status(200).send('Remove expired matches endpoint')
// })
// app.get('/removeExpiredPartnerMatches', (req, res) => {
//   res.status(200).send('Remove expired partner matches endpoint')
// })
// app.get('/sendFriendsRequest', (req, res) => {
//   res.status(200).send('Send friend request endpoint')
// })
// app.get('/sendPartnersRequest', (req, res) => {
//   res.status(200).send('Send partner request endpoint')
// })
// app.get('/signUp', (req, res) => {
//   res.status(200).send('Sign up endpoint')
// })
// app.get('/teamMatchmakingRedirect', (req, res) => {
//   res.status(200).send('Team matchmaking endpoint')
// })
// app.get('/updateGameReadyCount', (req, res) => {
//   res.status(200).send('Update game ready count endpoint')
// })
// app.get('/updateLobbyReadyCount', (req, res) => {
//   res.status(200).send('Update lobby ready count endpoint')
// })
// app.post('/playCard', (req, res) => {
//   res.status(200).send('Update lobby ready count endpoint')
// })
// app.post('/registerUser', (req, res) => {
//   res.status(200).send('Update lobby ready count endpoint')
// })

app.use(notFound);
app.use(errorHandler);


module.exports = app;
