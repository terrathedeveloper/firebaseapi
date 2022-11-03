/**
 * Defines the router for Firebase Cloud Functions for The Big Joker app
 *
 * @type {Router}
 */

 const router = require("express").Router();
 const controller = require("./cloudFunctions.controller");
 const notAllowed = require('../errors/methodNotAllowed')
 
router.route("/addFriend").get(controller.addFriend).all(notAllowed);
router.route("/endRound").post(controller.endRound).all(notAllowed);
router.route("/endTrick").post(controller.endTrick).all(notAllowed);
router.route("/endGame").post(controller.endGame).all(notAllowed);
router.route("/gameLobbyQuit").get(controller.gameLobbyQuit).all(notAllowed);
router.route("/getRtcToken").get(controller.getRtcToken).all(notAllowed);
router.route("/handlePartnersTransaction").post(controller.handlePartnersTransaction).all(notAllowed)
router.route("/initGame").post(controller.initGame).all(notAllowed)
router.route("/onPartnerMatchmaking").get(controller.onPartnerMatchmaking).all(notAllowed)
router.route("/onCancelPartnerMatchmaking").get(controller.onCancelPartnerMatchmaking).all(notAllowed)
router.route("/onSelectedTeamMatchmaking").get(controller.onSelectedTeamMatchmaking).all(notAllowed)
router.route("/onTeamMatchmaking").post(controller.onTeamMatchmaking).all(notAllowed)
router.route("/onCancelMatchmaking").post(controller.onCancelMatchmaking).all(notAllowed)
router.route("/playCard").post(controller.playCard).all(notAllowed);
router.route("/registerUser").post(controller.registerUser).all(notAllowed);
router.route("/removeExpiredMatches").get(controller.removeExpiredMatches).all(notAllowed)
router.route("/removeExpiredPartnerMatches").get(controller.removeExpiredPartnerMatches).all(notAllowed)
router.route("/removePartner").get(controller.removePartner).all(notAllowed)
router.route("/sendFriendsRequest").get(controller.sendFriendsRequest).all(notAllowed)
router.route("/sendPartnersRequest").get(controller.sendPartnersRequest).all(notAllowed)
router.route("/signInUser").post(controller.signInUser).all(notAllowed)
router.route("/signOutUser").post(controller.signOutUser).all(notAllowed)
router.route("/startGame").post(controller.startMatch).all(notAllowed)
router.route("/teamMatchmakingRedirect").get(controller.teamMatchmakingRedirect).all(notAllowed)
router.route("/updateGameReadyCount").post(controller.updateGameReadyCount).all(notAllowed)
router.route("/updateLobbyReadyCount").post(controller.updateLobbyReadyCount).all(notAllowed)

 module.exports = router;