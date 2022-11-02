const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
} = require("firebase/firestore");
const {
  getDatabase,
  ref,
  set,
  runTransaction: rtRunTransaction,
} = require("firebase/database");
const {
  getAuth,
  createUserWithEmailAndPassword,
  createUser,
  signOut,
  signInWithEmailAndPassword,
} = require("firebase/auth");
var admin = require("firebase-admin");

var serviceAccount = require("../../thebigjokerprod-firebase-adminsdk-7o9u8-ab68508be0.json");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://thebigjokerprod-default-rtdb.firebaseio.com",
});
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
const firebase = getDatabase(app);
const db = admin.database();

async function createNewUser(userData, phoneNumber) {
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
    console.log("newuser", newUser);
    let token = await admin.auth().createCustomToken(newUser.uid);
    let { uid, email } = newUser;
    const user = {
      uid,
      token,
      email,
      phoneNumber,
      username: userData.username,
      ...initUser,
    };
    await setDoc(doc(firestore, "users", user.username), user);
    return { userCreated: true };
  } catch (e) {
    return { e: e.message, message: "Error creating user" };
  }
}
async function createTeam(user, partner) {
  // const matchmakingRef = db.ref('partners_matchmaking');
  // await matchmakingRef.child(user).remove()
  // await matchmakingRef.child(partner).remove()
  try {
    //const partnersQuery = query(collection(firestore,"partners_matchmaking"));
    await runTransaction(firestore, async (transaction) => {
      const userRef = doc(firestore, "users", user);
      const partnerRef = doc(firestore, "users", partner);
      let userDoc = await transaction.get(userRef);
      let partnerDoc = await transaction.get(partnerRef);

      userDoc = userDoc.data();
      partnerDoc = partnerDoc.data();
      console.log(userDoc.partner);
      console.log(partnerDoc.partner);

      if (!userDoc.partner && !partnerDoc.partner) {
        console.log(userDoc.friends);
        userDoc.friends = userDoc.friends ? userDoc.friends : [];
        partnerDoc.friends = partnerDoc.friends ? partnerDoc.friends : [];
        let profilePics = [];
        let phones = [];
        let colorIndexes = [];
        let players = [user, partner].sort();
        let network = [...new Set([...userDoc.friends, ...partnerDoc.friends])];

        if (players[0] == user) {
          profilePics = [userDoc.photoUrl, partnerDoc.photoUrl];
          phones = [userDoc.phoneNumber, partnerDoc.phoneNumber];
          colorIndexes = [
            userDoc.avatarColorIndex,
            partnerDoc.avatarColorIndex,
          ];
        } else {
          profilePics = [partnerDoc.photoUrl, userDoc.photoUrl];
          phones = [partnerDoc.phoneNumber, userDoc.phoneNumber];
          colorIndexes = [
            partnerDoc.avatarColorIndex,
            userDoc.avatarColorIndex,
          ];
        }

        const teamsRef = doc(firestore, "teams", `${players[0]}+${players[1]}`);
        transaction.set(teamsRef, {
          id: `${players[0]}+${players[1]}`,
          players,
          phones,
          profilePics,
          colorIndexes,
          matchmakingAvailable: true,
          isMatchmaking: false,
          leader: user,
          isOnline: true,
          network,
          wins: 0,
          inMatch: false,
          matchmakingWith: null,
          playersReady: [],
        });

        transaction.update(userRef, { partner: partner });
        transaction.update(partnerRef, { partner: user });
        await deleteDoc(doc(firestore, "partners_matchmaking", user));
        await deleteDoc(doc(firestore, "partners_matchmaking", partner));
      } else {
        return { error: "Partner no longer available" };
      }
    });
  } catch (e) {
    return { e: e.message, message: "Error with partner request" };
  }
}
async function joinPartnerQueue(username) {
  try {
    const result = await setDoc(
      doc(firestore, "partners_matchmaking", username),
      {
        player: username,
        timestamp: serverTimestamp(),
      }
    );

    /*const matchmakingRef = db.ref('partners_matchmaking');
    matchmakingRef.child(username).set({
        player: username,
        timestamp: serverTimestamp(),
    })*/

    return { addedToQueue: true, result };
  } catch (e) {
    return { e: e.message, message: "Error joining partner queue" };
  }
}

async function exitPartnerQueue(username) {
  console.log(username);
  try {
    //const partnersQuery = query(collection(firestore,"partners_matchmaking"));
    await runTransaction(firestore, async (transaction) => {
      const userRef = doc(firestore, "users", username);
      const partnerMatchRef = doc(firestore, "partners_matchmaking", username);
      let userDoc = await transaction.get(userRef);
      let userData = userDoc.data();

      await transaction.delete(partnerMatchRef);
      transaction.update(userRef, {
        awaitingPartner: false,
        isMatchmaking: false,
      });
    });
    return { addedToQueue: true, username };
  } catch (e) {
    return { e: e.message, message: "Error joining partner queue" };
  }
}

async function signInUser(email, password) {
  const auth = getAuth();
  let user = null;

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    if (userCred) {
      const allUsersQuery = query(
        collection(firestore, "users"),
        where("email", "==", email)
      );

      const snapshots = await getDocs(allUsersQuery);
      user = snapshots.docs[0].data();
      console.log(user);
      if (user.partner) {
        let teamsList = [user.username, user.partner].sort();
        const myTeamRef = doc(
          firestore,
          "teams",
          `${teamsList[0]}+${teamsList[1]}`
        );
        await deleteDoc(myTeamRef);
        const myTeamMatchRef = doc(
          firestore,
          "teams_matchmaking",
          `${teamsList[0]}+${teamsList[1]}`
        );
        await deleteDoc(myTeamMatchRef);
        console.log("username", user.username);
        const userRef = doc(firestore, "users", user.username);
        const partnerRef = doc(firestore, "users", user.partner);
        user.partner = null;
        await updateDoc(userRef, {
          partner: null,
          isMatchmaking: false,
          isOnline: true,
        });
        await updateDoc(partnerRef, {
          partner: null,
          isMatchmaking: false,
          isOnline: true,
        });
      }
    }
    return user;
  } catch (e) {
    return { e: e.message, message: "Error with signing in user" };
  }
}
async function signOutUser() {
  const auth = getAuth();
  console.log("auth", auth);
  try {
    await signOut(auth);
  } catch (error) {
    console.log("SIGN OUT ERRIR", error);
  }
}

async function sendPartnerInvite(token, username, type) {
  const payload = {
    data: {
      click_action: "FLUTTER_NOTIFICATION_CLICK",
      notificationType: "partnersRequest",
      fromUsername: username,
      //fromProfilePic: fromProfilePic,
      // fromColorIndex: fromColorIndex,
      type: type,
    },
    notification: {
      title: "Partners Invite",
      body: `${username} wants to partner up with you!`,
    },
  };
  var options = {
    priority: "high",
    timeToLive: 60 * 60 * 24,
  };
  try {
    let result = await admin.messaging().sendToDevice(token, payload, options);
    return result;
  } catch (e) {
    return { e: e.message, message: "Error with partner request" };
  }
}

async function setFriendship(requestor, requested) {
  try {
    const userRef = doc(firestore, "users", requestor);
    const friendRef = doc(firestore, "users", requested);
    let userDoc = await getDoc(userRef);
    let friendDoc = await getDoc(friendRef);
    let userData = userDoc.data();
    let friendData = friendDoc.data();

    userData.friends = userData.friends ? userData.friends : [];
    friendData.friends = friendData.friends ? friendData.friends : [];
    userData.friendRequests = userData.friendRequests
      ? userData.friendRequests
      : [];
    friendData.friendRequests = friendData.friendRequests
      ? friendData.friendRequests
      : [];

    if (
      !userData.friends.find((friend) => friend === requested) &&
      !friendData.friends.find((friend) => friend === requestor)
    ) {
      console.log("not friends!");
      userData.friends.push(requested);
      friendData.friends.push(requestor);
      userData.friendRequests.splice(
        userData.friendRequests.indexOf(requested),
        1
      );
      friendData.friendRequests.splice(
        friendData.friendRequests.indexOf(requestor),
        1
      );
      console.log("userData", userData);
      console.log("friendData", friendData);
      let userResult = await updateDoc(userRef, {
        friends: userData.friends,
        friendRequests: userData.friendRequests,
      });
      let friendResult = await updateDoc(friendRef, {
        friends: friendData.friends,
        friendRequests: friendData.friendRequests,
      });
      return { success: true, userResult, friendResult };
    }
  } catch (e) {
    return { e: e.message, message: "Error with adding friend" };
  }
}

async function removePartner(user) {
  try {
    //const partnersQuery = query(collection(firestore,"partners_matchmaking"));
    await runTransaction(firestore, async (transaction) => {
      const userRef = doc(firestore, "users", user);
      let userDoc = await transaction.get(userRef);
      let userData = userDoc.data();
      const partnerRef = doc(firestore, "users", userData.partner);
      let partnerDoc = await transaction.get(partnerRef);
      let partnerData = partnerDoc.data();
      let orderedPartner = [user, userData.partner].sort();
      let partnerStr = `${orderedPartner[0]}+${orderedPartner[1]}`;
      const teamRef = doc(firestore, "teams", partnerStr);
      transaction.delete(teamRef);
      console.log(partnerData);
      transaction.update(userRef, { partner: null });
      transaction.update(partnerRef, { partner: null });
    });
    return { success: true };
  } catch (e) {
    return { e: e.message, message: "Error with removing partner" };
  }
}

async function onMatchStart(team1Id, team2Id, currentUser) {
  let teamsList = [team1Id, team2Id].sort();
  try {
    await runTransaction(firestore, async (transaction) => {
      const myTeam = team1Id.includes(currentUser) ? team1Id : team2Id;
      const otherTeam = !team1Id.includes(currentUser) ? team1Id : team2Id;
      const myTeamRef = doc(firestore, "teams", myTeam);
      const otherTeamRef = doc(firestore, "teams", otherTeam);
      const myTeamMatchRef = doc(firestore, "teams_matchmaking", myTeam);
      const otherTeamMatchRef = doc(firestore, "teams_matchmaking", otherTeam);

      const myTeamJson = (await transaction.get(myTeamRef)).data();
      const otherTeamJson = (await transaction.get(otherTeamRef)).data();
      const myTeamMatchJson = (await transaction.get(myTeamMatchRef)).data();
      const otherTeamMatchJson = (
        await transaction.get(otherTeamMatchRef)
      ).data();

      //console.log(myTeamJson)
      //console.log(otherTeamJson)
      await transaction.update(myTeamRef, {
        matchmakingAvailable: false,
        isMatchmaking: false,
        playersReady:[]
      });
      await transaction.update(otherTeamRef, {
        matchmakingAvailable: false,
        isMatchmaking: false,
        playersReady:[]
      });

      await transaction.delete(myTeamMatchRef);
      await transaction.delete(otherTeamMatchRef);
      transaction.set(
        doc(firestore, "games_lobby", `${teamsList[0]}+${teamsList[1]}`),
        {
          randomFirstPlayer: 0,
          randomSecondPlayer: 0,
          randomFirstTeam: 0,
          gameReadyCount: [],
          lobbyReadyCount: [],
          id: `${teamsList[0]}+${teamsList[1]}`,
          teams: teamsList,
          players: [],
          dateCreated: serverTimestamp(),
        }
      );
     
    });
    return { success: true };
  } catch (e) {
    console.log(e.message);
    return { e: e.message, message: "Error with removing partner" };
  }
}

async function onRandomTeamMatchmaking(user, userTeam, otherTeam) {
  try {
    await runTransaction(firestore, async (transaction) => {
      const matchmakingRef = doc(firestore, "teams_matchmaking", userTeam);
      let matchmakingDoc = await transaction.get(matchmakingRef);
      let matchData = matchmakingDoc.data();
      if (matchData) {
        transaction.update(doc(firestore, "teams_matchmaking", userTeam), {
          players: arrayUnion(user),
          timestamp: serverTimestamp(),
        });
      } else {
        transaction.set(doc(firestore, "teams_matchmaking", userTeam), {
          players: [user],
          timestamp: serverTimestamp(),
          teamId: userTeam,
          matchingWith: otherTeam != null ? otherTeam : "random",
        });
      }
      const teamRef = doc(firestore, "teams", userTeam);
      transaction.update(teamRef, {
        playersReady: arrayUnion(user),
        isMatchmaking: true,
        matchmakingWith: otherTeam != null ? otherTeam : "random",
      });
    });
    return { success: true };
  } catch (e) {
    console.log(e.message);
    return { e: e.message, message: "Error with removing partner" };
  }
}

async function onCancelTeamMatchmaking(user, partner) {
  let userTeam = [user, partner].sort();
  const userTeamId = `${userTeam[0]}+${userTeam[1]}`;
  console.log(userTeamId);
  try {
    await runTransaction(firestore, async (transaction) => {
      const matchmakingRef = doc(firestore, "teams_matchmaking", userTeamId);
      transaction.delete(matchmakingRef);
      const teamRef = doc(firestore, "teams", userTeamId);
      const userRef = doc(firestore, "users", user);
      const partnerRef = doc(firestore, "users", partner);
      transaction.update(teamRef, {
        playersReady: arrayRemove(user),
        isMatchmaking: false,
        matchmakingWith: null,
        inMatch: null,
      });
      transaction.update(userRef, { isMatchmaking: false });
      transaction.update(partnerRef, { isMatchmaking: false });
    });
    return { success: true };
  } catch (e) {
    console.log(e.message);
    return { e: e.message, message: "Error with cancelling team matchmaking" };
  }
}

async function setPlayerReady(gameLobbyId, user) {
  try {
    await runTransaction(firestore, async (transaction) => {
      const gameLobbyRef = doc(firestore, "games_lobby", gameLobbyId);
      const game = await transaction.get(gameLobbyRef);
      const team1Ref = doc(firestore, "teams", game.data().teams[0]);
      const team2Ref = doc(firestore, "teams", game.data().teams[1]);

      console.log(game.data().teams);
      transaction.update(gameLobbyRef, {
        lobbyReadyCount: arrayUnion(user),
      });
      transaction.update(team1Ref, {
        inMatch: true,
        playersReady:[]
      });
      transaction.update(team2Ref, {
        inMatch: true,
        playersReady:[]
      });
    });
    return { success: true };
  } catch (e) {
    console.log(e.message);
    return {
      e: e.message,
      message: "Error with setting player to lobby ready",
    };
  }
}
async function setGameReady(gameLobbyId, user) {
  console.log("set game ready!");
  try {
    await runTransaction(firestore, async (transaction) => {
      const gameLobbyRef = doc(firestore, "games_lobby", gameLobbyId);
      const game = await transaction.get(gameLobbyRef);
      const team1Ref = doc(firestore, "teams", game.data().teams[0]);
      const team2Ref = doc(firestore, "teams", game.data().teams[1]);

      console.log(game.data().teams);
      transaction.update(gameLobbyRef, {
        gameReadyCount: arrayUnion(user),
      });
      transaction.update(team1Ref, {
        inMatch: true,
      });
      transaction.update(team2Ref, {
        inMatch: true,
      });
    });
    return { success: true };
  } catch (e) {
    console.log(e.message);
    return {
      e: e.message,
      message: "Error with setting player to lobby ready",
    };
  }
}
async function buildGameObj(gameId, user) {
  const gameRef = ref(db, `/games/money`);
  console.log(gameId, user);
  //console.log(gameRef)
  let list = [];
  try {
    await set(gameRef, { list: false });
  } catch (e) {
    console.log(e);
  }

  return { gameId };
}
async function handleCardPlay(gameId, user, card) {
  const cardsHeirarchy = [
    "spade_two",
    "a",
    "k",
    "q",
    "j",
    "ten",
    "nine",
    "eight",
    "seven",
    "six",
    "five",
    "four",
    "three",
    "two",
  ];
  console.log(gameId, user, card);
  //const db = getDatabase(app)

  const db = getDatabase();
  const gameRef = ref(db, `/games/${gameId}`);

  

  try {
    await rtRunTransaction(gameRef, (game) => {
      //console.log(game)
      if (game) {
        if (game.cardData) {
          game.cardData.push({ [user]: card });
        } else {
          game.cardData = [{ [user]: card }];
        }
        if (game.cardsOnField) {
          game.cardsOnField.push(card);
        } else {
          game.cardsOnField = [card];
        }
        if (game.cardsPlayed) {
          game.cardsPlayed.push(card);
        } else {
          game.cardsPlayed = [card];
        }
        if(game.teams[0].player1==user){
          let idx = game.teams[0].player1Cards.indexOf(card);
          game.teams[0].player1Cards.splice(idx,1);
        }
        if(game.teams[0].player2==user){
          let idx = game.teams[0].player2Cards.indexOf(card);
          game.teams[0].player2Cards.splice(idx,1);
        }
        if(game.teams[1].player1==user){
          let idx = game.teams[1].player1Cards.indexOf(card);
          game.teams[1].player1Cards.splice(idx,1);
        }
        if(game.teams[1].player2==user){
          let idx = game.teams[1].player2Cards.indexOf(card);
          game.teams[1].player2Cards.splice(idx,1);
        }
        game.currentSuit = _getCardSuit(game.cardsOnField[0]);
        let cardPlayedSuit = _getCardSuit(card);
        game.jokerSuit = game.cardsOnField.some(
          (card) => card.indexOf("joker") !== -1
        );
        console.log(game.currentSuit);
        if (game.currentSuit) {
          console.log('currentsuit',game.currentSuit);
          console.log('cardPlayedsuit', cardPlayedSuit);
     

          let spadesAndJokersSame =  (game.currentSuit === "joker" && cardPlayedSuit === "spade") ||
          (cardPlayedSuit === "joker" && game.currentSuit === "spade")
          console.log(game.currentSuit != cardPlayedSuit && !spadesAndJokersSame);
          //if currentSuit != cardPlayedSuit excluding jokers and spades
          if(game.currentSuit != cardPlayedSuit && !spadesAndJokersSame)
         {
            switch (user) {
              case game.teams[0].player1: {
                let handContainsSuit = _containsSuit(
                  game.teams[0].player1Cards,
                  game.currentSuit
                );
                if (handContainsSuit) {
                  game.teams[0].booksCount = game.teams[0].booksCount - 4;
                  game.teams[1].booksCount = game.teams[1].booksCount + 4;
                  game.renegeText = `${user} has reneged and\n lost 4 books for their team!`;
                }
                console.log(
                  "this is it",
                  game.teams[0].player1,
                  game.renegeText
                );
                break;
              }
              case game.teams[0].player2: {
                let handContainsSuit = _containsSuit(
                  game.teams[0].player2Cards,
                  game.currentSuit
                );
                if (handContainsSuit) {
                  game.teams[0].booksCount = game.teams[0].booksCount - 4;
                  game.teams[1].booksCount = game.teams[1].booksCount + 4;
                  game.renegeText = `${user} has reneged and\n lost 4 books for their team!`;
                }
                console.log("this is it", game.teams[0].player2);
                break;
              }
              case game.teams[1].player1: {
                let handContainsSuit = _containsSuit(
                  game.teams[1].player1Cards,
                  game.currentSuit
                );
                if (handContainsSuit) {
                  game.teams[1].booksCount = game.teams[1].booksCount - 4;
                  game.teams[0].booksCount = game.teams[0].booksCount + 4;
                  game.renegeText = `${user} has reneged and\n lost 4 books for their team!`;
                }
                console.log(
                  "this is it",
                  game.teams[1].player1,
                  game.renegeText
                );
                break;
              }
              case game.teams[1].player2: {
                let handContainsSuit = _containsSuit(
                  game.teams[1].player2Cards,
                  game.currentSuit
                );
                if (handContainsSuit) {
                  console.log();
                  game.teams[1].booksCount = game.teams[1].booksCount - 4;
                  game.teams[0].booksCount = game.teams[0].booksCount + 4;
                  game.renegeText = `${user} has reneged and\n lost 4 books for their team!`;
                }
                console.log(
                  "this is it",
                  handContainsSuit,
                  game.teams[1].player2,
                  game.teams[0].booksCount
                );
                break;
              }
              default:
                break;
            }
          }
          const idx = game.turnOrder.indexOf(user);
          game.currentTurn = game.turnOrder[idx === 3 ? 0 : idx + 1];
          if (game.cardsOnField.length === 4) {
            let currentSuit = game.currentSuit;
            let index = 0;
            if (!game.jokerSuit) {
              currentSuit = _containsSuit(game.cardsOnField, "spade")
                ? "spade"
                : currentSuit;

              const sameSuitCards = game.cardsOnField.filter(
                (card) => _getCardSuit(card) == currentSuit
              );
              const cardsValues = sameSuitCards.map((card) => _cardValue(card));

              let highestCard = "";
              for (let cardHeir of cardsHeirarchy) {
                if (cardsValues.includes(cardHeir)) {
                  highestCard = cardHeir;
                  break;
                }
              }
              console.log("winning card", highestCard);
              if (highestCard !== "spade_two") {
                index = game.cardsOnField.indexOf(
                  `assets/images/cards/${currentSuit}_${highestCard}.png`
                );
              } else {
                index = game.cardsOnField.indexOf(
                  `assets/images/cards/spade_two.png`
                );
              }
              //console.log('high card shuffle')
              //console.log(game.cardsOnField);
              //console.log(index)
            } else {
              const cardsNamed = game.cardsOnField.map(
                (card) => card.split("/")[3].split(".")[0]
              );
              console.log("jokes", cardsNamed);
              let isBigJoker = cardsNamed.includes("joker_big");
              console.log(isBigJoker);
              index = game.cardsOnField.indexOf(
                isBigJoker
                  ? `assets/images/cards/joker_big.png`
                  : `assets/images/cards/joker_little.png`
              );
            }
            const winner = game.turnOrder[index];
            console.log(`${winner} wins! with ${game.cardsOnField[index]}`);
            switch (winner) {
              case game.teams[0].player1:
              case game.teams[0].player2: {
                game.teams[0].booksCount++;
                break;
              }
              case game.teams[1].player1:
              case game.teams[1].player2: {
                game.teams[1].booksCount++;
                break;
              }
              default:
                break;
            }
            game.roundWinner = winner;
            game.turnWinner = winner;
            game.jokerSuit = false;
            //game.currentTurn = null;
            game.currentSuit = "";
            game.turnsCount++;
          }
        }
      }
      return game;
    });
  } catch (e) {
    console.log(`error: ${e.message}`);
    return { error: e.message };
  }
  return { success: true };
}
function _cardValue(card) {
  if (card === "assets/images/cards/spade_two.png") {
    return "spade_two";
  }
  let splitCardStr = card.split("/")[3].split("_")[1].split(".")[0];
  return splitCardStr;
}
function _getCardSuit(card) {
  console.log(card);
  let splitCard = card.split("/");
  let cardSuitSplit = splitCard[3].split("_");
  return cardSuitSplit[0];
}
function _containsSuit(hand, suit) {
  let hasSuit = false;
  console.log("hands an dsuits");
  console.log(hand);
  console.log(suit);
  if (suit === "spade" || suit === "joker") {
    hasSuit = hand.some(
      (card) => card.indexOf("spade") !== -1 || card.indexOf("joker") !== -1
    );
  } else {
    hasSuit = hand.some((card) => card.indexOf(suit) !== -1);
  }
  console.log(hasSuit);
  return hasSuit;
}

async function endTrick(gameId){
  const db = getDatabase();
  console.log(gameId)
  const gameRef = ref(db, `/games/${gameId}`);

  try {
    await rtRunTransaction(gameRef, (game) => {
      if(game){
        let winnerIndex = game.turnOrder.indexOf(game.roundWinner);
        let turnWinner = game.roundWinner;
        switch (winnerIndex) {
          case 1:
            game.turnOrder = [
              turnWinner,
              game.turnOrder[2],
              game.turnOrder[3],
              game.turnOrder[0],
            ];
            break;
          case 2:
            game.turnOrder = [
              turnWinner,
              game.turnOrder[3],
              game.turnOrder[0],
              game.turnOrder[1],
            ];
            break;
          case 3:
            game.turnOrder = [
              turnWinner,
              game.turnOrder[0],
              game.turnOrder[1],
              game.turnOrder[2],
            ];
            break;
          default:
            break;
        }
        game.cardsOnField = [];
        game.currentTurn = turnWinner;
        game.roundWinner="";
        game.turnWinner="";


      }
      return game
    })
  }catch(e){
    return {error:e.message};
  }
  return {success:true}
}

async function calculateScore(gameId){
  const db = getDatabase();
  console.log(gameId)
  const gameRef = ref(db, `/games/${gameId}`);

  try {
    await rtRunTransaction(gameRef, (game) => {
      if(game){
        _calculateTeamScore(game.teams[0]);
        _calculateTeamScore(game.teams[1]);
        game.newRoundAcceptCount = 0;
        game.roundFinished = true;
        game.currentTurn = '';
      }
      return game;
    });
  }catch(e){
    return {error: e.message}  
  }
  return {success:true}
}
function _calculateTeamScore(team){
  if (team.booksCount == team.combinedBid) {
    team.score = (team.booksCount * 10) + team.score;
  }
  if (team.booksCount > team.combinedBid) {
    let extraBooks = team.booksCount - team.combinedBid;
    let roundScore = (team.combinedBid * 10) + extraBooks;
    team.score = team.score + roundScore;
  }
  if (team.booksCount < team.combinedBid) {
    let roundScore = team.combinedBid * -10;
    team.score = team.score + roundScore;
  }

  if (team.combinedBid == 10 && team.booksCount >= 10) {
    let extraBooks = team.booksCount - team.combinedBid;
    team.score = team.score + 200 + extraBooks;
  }
}
module.exports = {
  buildGameObj,
  createNewUser,
  calculateScore,
  endTrick,
  signInUser,
  signOutUser,
  exitPartnerQueue,
  joinPartnerQueue,
  sendPartnerInvite,
  createTeam,
  setFriendship,
  removePartner,
  onRandomTeamMatchmaking,
  onCancelTeamMatchmaking,
  setPlayerReady,
  setGameReady,
  onMatchStart,
  handleCardPlay,
};
