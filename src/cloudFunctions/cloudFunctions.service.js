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

async function joinPartnerQueue(username) {
  try {
    const result = await setDoc(
      doc(firestore, "partners_matchmaking", username),
      {
        player: username,
        timestamp: serverTimestamp(),
      }
    );
    return { addedToQueue: true };
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

async function createTeam(user, partner) {
  console.log(`${user}+${partner}`);

  try {
    //const partnersQuery = query(collection(firestore,"partners_matchmaking"));
    await runTransaction(firestore, async (transaction) => {
      await deleteDoc(doc(firestore, "partners_matchmaking", user));
      await deleteDoc(doc(firestore, "partners_matchmaking", partner));
      const userRef = doc(firestore, "users", user);
      const partnerRef = doc(firestore, "users", partner);
      let userDoc = await getDoc(doc(firestore, "users", user));
      let partnerDoc = await getDoc(doc(firestore, "users", partner));

      userDoc = userDoc.data();
      partnerDoc = partnerDoc.data();
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
        colorIndexes = [userDoc.avatarColorIndex, partnerDoc.avatarColorIndex];
      } else {
        profilePics = [partnerDoc.photoUrl, userDoc.photoUrl];
        phones = [partnerDoc.phoneNumber, userDoc.phoneNumber];
        colorIndexes = [partnerDoc.avatarColorIndex, userDoc.avatarColorIndex];
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
        playersReady:[]
      });
      transaction.update(userRef, { partner: partner });
      transaction.update(partnerRef, { partner: user });
    });
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
          matchingWith: otherTeam != null ? otherTeam : 'random',
        });
      }
      const teamRef = doc(firestore, "teams", userTeam);
      transaction.update(teamRef,{playersReady:arrayUnion(user),isMatchmaking:true, matchmakingWith:otherTeam != null ? otherTeam : 'random'})
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
  console.log(userTeamId)
  try {
    await runTransaction(firestore, async (transaction) => {
      const matchmakingRef = doc(firestore, "teams_matchmaking", userTeamId);
      transaction.delete(matchmakingRef);     
      const teamRef = doc(firestore, "teams", userTeamId); 
      const userRef = doc(firestore, "users", user); 
      const partnerRef = doc(firestore, "users", partner); 
      transaction.update(teamRef,{playersReady:arrayRemove(user),isMatchmaking:false, matchmakingWith:null, inMatch:null})
      transaction.update(userRef,{'isMatchmaking':false})
      transaction.update(partnerRef,{'isMatchmaking':false})
    });
    return { success: true };
  } catch (e) {
    console.log(e.message);
    return { e: e.message, message: "Error with cancelling team matchmaking" };
  }
}

module.exports = {
  createNewUser,
  signInUser,
  signOutUser,
  joinPartnerQueue,
  sendPartnerInvite,
  createTeam,
  setFriendship,
  removePartner,
  onRandomTeamMatchmaking,
  onCancelTeamMatchmaking,
};
