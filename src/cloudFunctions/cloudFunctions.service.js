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
  serverTimestamp
} = require("firebase/firestore");
const {
  getAuth,
  createUserWithEmailAndPassword,
  createUser,signOut,
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
      phone:userData.phoneNumber,
      ...initUser,
    };
    await setDoc(doc(firestore, "users", user.username), user);
    return { userCreated: true };
  } catch (e) {
    return { e: e.message, message: "Error creating user" };
  }
}

async function joinPartnerQueue(username){
  try{
   const result = await setDoc(doc(firestore, "partners_matchmaking", username), {
    player: username,
    timestamp: serverTimestamp(),
  });
   return {addedToQueue:true}
  }catch(e){
    return { e: e.message, message: "Error joining partner queue" };
  }
}

async function signInUser(email, password){
  const auth = getAuth();
  let user = null;
  try{
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    if(userCred){
      const allUsersQuery = query(collection(firestore,"users"), where("email","==",email));
      const snapshots = await getDocs(allUsersQuery);
      user = snapshots.docs[0].data();
    }
    return user
  } catch(e){
    return {e:e.message, message: "Error with signing in user"}
  }
}
async function signOutUser(){
  const auth = getAuth();
  console.log("auth",auth)
  try {
     await signOut(auth);
  } catch (error) {
   console.log("SIGN OUT ERRIR", error)
  }
}

async function sendPartnerInvite(token, username, type){
  const payload = {
    data: {
      click_action: "FLUTTER_NOTIFICATION_CLICK",
      notificationType: "partnersRequest",
      fromUsername: username,
      //fromProfilePic: fromProfilePic,
     // fromColorIndex: fromColorIndex,
      type: type,
    },
    notification:{
      title: "Partners Invite",
      body: `${username} wants to partner up with you!`,
    }
  }; 
  var options = {
    priority: "high",
    timeToLive: 60 * 60 * 24,
  };
  try{
    let result = await admin.messaging().sendToDevice(token, payload, options)
    return result;
  } catch(e){
    return {e:e.message, message: "Error with partner request"}
  }

}

async function createTeam(user,partner){
  console.log(`${user}+${partner}`)
  
  try {
    //const partnersQuery = query(collection(firestore,"partners_matchmaking"));
    await runTransaction(firestore, async (transaction)=>{
      await deleteDoc(doc(firestore,"partners_matchmaking",user))
      await deleteDoc(doc(firestore,"partners_matchmaking",partner))
      let userDoc = await getDoc(doc(firestore, "users", user))
      let partnerDoc = await getDoc(doc(firestore, "users", partner))
      userDoc =userDoc.data()
      partnerDoc =partnerDoc.data()
      console.log(userDoc.friends)
      userDoc.friends = userDoc.friends? userDoc.friends:[];
      partnerDoc.friends = partnerDoc.friends? partnerDoc.friends:[];
      let profilePics =[];
      let phones=[];
      let colorIndexes=[];
      let players = [user,partner].sort();
      let network = [...new Set([...userDoc.friends, ...partnerDoc.friends])]

      if (players[0] == user) {
        profilePics = [
          userDoc.photoUrl,
          partnerDoc.photoUrl
        ];
        phones = [
          userDoc.phoneNumber,
          partnerDoc.phoneNumber
        ];
        colorIndexes=[
          userDoc.avatarColorIndex,
          partnerDoc.avatarColorIndex
        ];
      } else {
        profilePics = [
          partnerDoc.photoUrl,
          userDoc.photoUrl
        ];
        phones = [
          partnerDoc.phoneNumber,
          userDoc.phoneNumber
        ];
        colorIndexes=[
          partnerDoc.avatarColorIndex,
          userDoc.avatarColorIndex        
        ];
      }

      const teamsRef= doc(firestore,"teams",`${players[0]}+${players[1]}`);
      transaction.set(teamsRef, {
        id:`${players[0]}+${players[1]}`,
        players,
        phones,
        profilePics,
        colorIndexes,
        matchmakingAvailable:true,
        isMatchmaking:false,
        leader:user,
        isOnline:true,
        network,
        wins:0,
        inMatch:false,
        matchmkingWith:null
      });
    })
  } catch (e) {
    return {e:e.message, message: "Error with partner request"}
  }
}
module.exports = {
  createNewUser,
  signInUser, 
  signOutUser, 
  joinPartnerQueue,
  sendPartnerInvite, 
  createTeam
};
