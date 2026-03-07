// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAefwWwlc0kqDRPXmDNYrxPuKOUf3t8Va8",
    authDomain: "tutors-valley-6ddb0.firebaseapp.com",
    projectId: "tutors-valley-6ddb0",
    storageBucket: "tutors-valley-6ddb0.firebasestorage.app",
    messagingSenderId: "377815974425",
    appId: "1:377815974425:web:3d1254d14640f43516a088"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

let currentUser = null;
let currentUserRole = null;
const OWNER_EMAIL = "kabirhasanat7@gmail.com";

const defaultZoneCards = [
    { id: 1, zoneTitle: "উত্তর ঢাকা", areas: ["উত্তরা", "মিরপুর", "পল্লবী"] },
    { id: 2, zoneTitle: "দক্ষিণ ঢাকা", areas: ["ধানমন্ডি", "মোহাম্মদপুর", "আদাবর"] },
    { id: 3, zoneTitle: "পূর্ব ঢাকা", areas: ["বনানী", "গুলশান", "বারিধারা"] },
    { id: 4, zoneTitle: "পশ্চিম ঢাকা", areas: ["সাভার", "আশুলিয়া", "গাজীপুর"] },
    { id: 5, zoneTitle: "কেন্দ্রীয় ঢাকা", areas: ["পল্টন", "মতিঝিল", "শাহবাগ"] },
    { id: 6, zoneTitle: "আশেপাশের এলাকা", areas: ["নারায়ণগঞ্জ", "টঙ্গী", "কেরানীগঞ্জ"] }
];

document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
});

function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            determineUserRole(user);
        } else {
            showPage('loginPage');
        }
    });
}

function determineUserRole(user) {
    db.collection('users').doc(user.uid).get().then((doc) => {
        if (doc.exists) {
            currentUserRole = doc.data().role;
            initializeApp();
        }
    });}

function showGoogleLogin(role) {
    currentUserRole = role;
    document.getElementById('googleLoginTitle').innerText = 
        role === 'admin' ? 'এডমিন লগইন' : role === 'tutor' ? 'টিউটর লগইন' : 'অভিভাবক লগইন';
    document.getElementById('googleLoginModal').style.display = 'block';
    document.getElementById('googleSignInBtn').onclick = () => signInWithGoogle(role);
}

function signInWithGoogle(role) {
    auth.signInWithPopup(googleProvider).then((result) => {
        const user = result.user;
        if (role === 'admin' && user.email !== OWNER_EMAIL) {
            alert("শুধুমাত্র মালিক এইমেইল দিয়ে admin লগইন করতে পারবেন!");
            auth.signOut();
            closeModal('googleLoginModal');
            return;
        }
        db.collection('users').doc(user.uid).set({
            email: user.email,
            displayName: user.displayName,
            role: role === 'admin' ? 'admin' : role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => {
            closeModal('googleLoginModal');
        });
    }).catch((error) => {
        alert("লগইন ব্যর্থ: " + error.message);
    });
}

function loginAsGuest() {
    currentUserRole = 'guest';
    auth.signInAnonymously().then(() => initializeApp());
}

function initializeApp() {
    showPage('homePage');
    if (currentUserRole === 'admin') {
        document.getElementById('controlPanelIcon').style.display = 'flex';
    }
    if (currentUserRole === 'tutor' || currentUserRole === 'guardian') {
        document.getElementById('reviewFormContainer').style.display = 'block';
    }
    loadSettings();
    loadZoneCards();
    loadReviews();
}
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        currentUserRole = null;
        document.getElementById('controlPanelIcon').style.display = 'none';
        showPage('loginPage');
    });
}

function toggleControlPanel() {
    document.getElementById('controlPanel').classList.toggle('active');
}

function updateLogoSize(value) {
    document.getElementById('siteLogo').style.width = value + 'px';
    document.getElementById('siteLogo').style.height = value + 'px';
}

function updateText(elementId, value) {
    document.getElementById(elementId).innerText = value;
}

function uploadImage(type) {
    const fileInput = document.getElementById(type + 'Upload');
    const file = fileInput.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target.result;
        if (type === 'logo') {
            document.getElementById('siteLogo').src = base64;
        } else if (type === 'ceo') {
            document.getElementById('ceoImage').src = base64;
        }
        db.collection('settings').doc('main').update({ [type + 'Url']: base64 });
    };
    reader.readAsDataURL(file);
}

function loadSettings() {    db.collection('settings').doc('main').get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            if (data.branding) document.getElementById('brandingText').innerText = data.branding;
            if (data.motto) document.getElementById('mottoText').innerText = data.motto;
            if (data.logoUrl) document.getElementById('siteLogo').src = data.logoUrl;
            if (data.logoSize) {
                document.getElementById('siteLogo').style.width = data.logoSize + 'px';
                document.getElementById('siteLogo').style.height = data.logoSize + 'px';
            }
        } else {
