/**
 * Defines the router for Firebase Cloud Functions for The Big Joker app
 *
 * @type {Router}
 */

 const router = require("express").Router();
 const controller = require("./cloudFunctions.controller");
 const notAllowed = require('../errors/methodNotAllowed')
 
router.route("/addFriend").get(controller.addFriend).all(notAllowed);
router.route("/endRound").get(controller.endRound).all(notAllowed);
router.route("/gameLobbyQuit").get(controller.gameLobbyQuit).all(notAllowed);
router.route("/getRtcToken").get(controller.getRtcToken).all(notAllowed);
router.route("/handlePartnersTransaction").get(controller.handlePartnersTransaction).all(notAllowed)
router.route("/onPartnerMatchmaking").get(controller.onPartnerMatchmaking).all(notAllowed)
router.route("/onSelectedTeamMatchmaking").get(controller.onSelectedTeamMatchmaking).all(notAllowed)
router.route("/onTeamMatchmaking").get(controller.onTeamMatchmaking).all(notAllowed)
router.route("/playCard").post(controller.playCard).all(notAllowed);
router.route("/registerUser").post(controller.registerUser).all(notAllowed);
router.route("/removeExpiredMatches").get(controller.removeExpiredMatches).all(notAllowed)
router.route("/removeExpiredPartnerMatches").get(controller.removeExpiredPartnerMatches).all(notAllowed)
router.route("/sendFriendsRequest").get(controller.sendFriendsRequest).all(notAllowed)
router.route("/sendPartnersRequest").get(controller.sendPartnersRequest).all(notAllowed)
router.route("/signUp").get(controller.signUp).all(notAllowed)
router.route("/teamMatchmakingRedirect").get(controller.teamMatchmakingRedirect).all(notAllowed)
router.route("/updateGameReadyCount").get(controller.updateGameReadyCount).all(notAllowed)
router.route("/updateLobbyReadyCount").get(controller.updateLobbyReadyCount).all(notAllowed)

 module.exports = router;