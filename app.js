// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAefwWwlc0kqDRPXmDNYrxPuKOUf3t8Va8",
    authDomain: "tutors-valley-6ddb0.firebaseapp.com",
    projectId: "tutors-valley-6ddb0",
    storageBucket: "tutors-valley-6ddb0.firebasestorage.app",
    messagingSenderId: "377815974425",
    appId: "1:377815974425:web:3d1254d14640f43516a088"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Global Variables
let currentUser = null;
let currentUserRole = null;
let currentZoneCards = [];
const OWNER_EMAIL = "kabirhasanat7@gmail.com";

// Default Fonts (Bangla + English)
const fonts = [
    { name: 'Hind Siliguri (Bangla)', value: "'Hind Siliguri', sans-serif", lang: 'bn' },
    { name: 'Poppins (English)', value: "'Poppins', sans-serif", lang: 'en' },
    { name: 'Roboto', value: "'Roboto', sans-serif", lang: 'en' },
    { name: 'Open Sans', value: "'Open Sans', sans-serif", lang: 'en' },
    { name: 'Lato', value: "'Lato', sans-serif", lang: 'en' },
    { name: 'Montserrat', value: "'Montserrat', sans-serif", lang: 'en' },
    { name: 'Noto Sans Bengali', value: "'Noto Sans Bengali', sans-serif", lang: 'bn' },
    { name: 'SolaimanLipi', value: "'SolaimanLipi', sans-serif", lang: 'bn' },
    { name: 'Arial', value: "Arial, sans-serif", lang: 'en' },
    { name: 'Times New Roman', value: "'Times New Roman', serif", lang: 'en' },
    { name: 'Calibri', value: "Calibri, sans-serif", lang: 'en' },
    { name: 'Georgia', value: "Georgia, serif", lang: 'en' },
    { name: 'Verdana', value: "Verdana, sans-serif", lang: 'en' },
    { name: 'Tahoma', value: "Tahoma, sans-serif", lang: 'en' },
    { name: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif", lang: 'en' },
    { name: 'Impact', value: "Impact, sans-serif", lang: 'en' },
    { name: 'Comic Sans MS', value: "'Comic Sans MS', cursive", lang: 'en' },
    { name: 'Courier New', value: "'Courier New', monospace", lang: 'en' },
    { name: 'Palatino', value: "'Palatino Linotype', serif", lang: 'en' },
    { name: 'Garamond', value: "'Garamond', serif", lang: 'en' }
];

// Default Zone Cards
const defaultZoneCards = [
    {
        id: 1,
        zoneTitle: "উত্তর ঢাকা",
        areas: ["উত্তরা", "মিরপুর", "পল্লবী", "রূপনগর"],
        maleLink: "",
        femaleLink: "",
        mixedLink: ""
    },
    {
        id: 2,
        zoneTitle: "দক্ষিণ ঢাকা",
        areas: ["ধানমন্ডি", "মোহাম্মদপুর", "আদাবর", "শ্যামলী"],
        maleLink: "",
        femaleLink: "",
        mixedLink: ""
    },
    {
        id: 3,
        zoneTitle: "পূর্ব ঢাকা",
        areas: ["বনানী", "গুলশান", "বারিধারা", "নিকেতন"],
        maleLink: "",
        femaleLink: "",
        mixedLink: ""
    },
    {
        id: 4,
        zoneTitle: "পশ্চিম ঢাকা",
        areas: ["দোহাই", "সাভার", "আশুলিয়া", "গাজীপুর"],
        maleLink: "",
        femaleLink: "",
        mixedLink: ""
    },
    {
        id: 5,
        zoneTitle: "কেন্দ্রীয় ঢাকা",
        areas: ["পল্টন", "মতিঝিল", "শাহবাগ", "রমনা"],
        maleLink: "",
        femaleLink: "",
        mixedLink: ""
    },
    {
        id: 6,
        zoneTitle: "আশেপাশের এলাকা",
        areas: ["নারায়ণগঞ্জ", "গাজীপুর", "টঙ্গী", "সাভার"],
        maleLink: "",
        femaleLink: "",
        mixedLink: ""
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
    loadDefaultSettings();
});

// Auth State Observer
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

// Determine User Role
function determineUserRole(user) {
    db.collection('users').doc(user.uid).get().then((doc) => {
        if (doc.exists) {
            currentUserRole = doc.data().role;
            initializeApp();
        } else {
            // New user - should not happen with our flow
            logout();
        }
    }).catch((error) => {
        console.error("Error:", error);
    });
}

// Show Google Login Modal
function showGoogleLogin(role) {
    currentUserRole = role;
    document.getElementById('googleLoginTitle').innerText = 
        role === 'tutor' ? 'টিউটর লগইন' : 'অভিভাবক লগইন';
    document.getElementById('googleLoginModal').style.display = 'block';
    
    document.getElementById('googleSignInBtn').onclick = function() {
        signInWithGoogle(role);
    };
}

// Google Sign In
function signInWithGoogle(role) {
    auth.signInWithPopup(googleProvider)
        .then((result) => {
            const user = result.user;
            // Save user data
            db.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        })
        .catch((error) => {
            alert("লগইন ব্যর্থ: " + error.message);
        });
}

// Guest Login
function loginAsGuest() {
    currentUserRole = 'guest';
    const guestId = 'guest_' + Date.now();
    db.collection('users').doc(guestId).set({
        role: 'guest',
        displayName: 'Guest User',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Create anonymous auth
    auth.signInAnonymously().then(() => {
        initializeApp();
    });
}

// Show Admin Login
function showAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'block';
}

// Admin Login
function adminLogin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    if (email !== OWNER_EMAIL) {
        alert("শুধুমাত্র মালিক এইমেইল দিয়ে লগইন করতে পারবেন");
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            db.collection('users').doc(user.uid).set({
                email: email,
                role: 'admin',
                displayName: 'Admin',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        })
        .catch((error) => {
            alert("লগইন ব্যর্থ: " + error.message);
        });
    
    closeModal('adminLoginModal');
}

// Initialize App
function initializeApp() {
    showPage('homePage');
    document.getElementById('userName').innerText = currentUser.displayName || currentUser.email;
    
    // Show control panel icon for admin
    if (currentUserRole === 'admin' || currentUserRole === 'subadmin') {
        document.getElementById('controlPanelIcon').style.display = 'flex';
    }
    
    // Show review form for tutor and guardian
    if (currentUserRole === 'tutor' || currentUserRole === 'guardian') {
        document.getElementById('reviewFormContainer').style.display = 'block';
    }
    
    loadSettings();
    loadZoneCards();
    loadReviews();
}

// Show Page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';
}

// Close Modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Logout
function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        currentUserRole = null;
        document.getElementById('controlPanelIcon').style.display = 'none';
        showPage('loginPage');
    });
}

// Toggle Control Panel
function toggleControlPanel() {
    const panel = document.getElementById('controlPanel');
    panel.classList.toggle('active');
    if (panel.classList.contains('active')) {
        loadControlPanelSettings();
    }
}

// Load Default Settings
function loadDefaultSettings() {
    currentZoneCards = [...defaultZoneCards];
}

// Load Settings from Firestore
function loadSettings() {
    db.collection('settings').doc('main').get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            applySettings(data);
        } else {
            // Create default settings
            createDefaultSettings();
        }
    });
}

// Create Default Settings
function createDefaultSettings() {
    const defaultSettings = {
        branding: "Tutors Valley",
        motto: "ঢাকার শহরে আমরাই দিচ্ছি সেরা টিউটর",
        bannerColor: "#001f3f",
        logoUrl: "https://via.placeholder.com/100",
        logoSize: 100,
        watermarkUrl: "",
        watermarkOpacity: 20,
        fbPageLink: "#",
        fbButtonText: "আমাদের ফেসবুক পেজ",
        ceoName: "CEO Name",
        ceoTitle: "Founder & CEO",
        ceoDesc: "CEO description here...",
        ceoImageUrl: "https://via.placeholder.com/100",
        ceoImageSize: 100,
        zoneSectionTitle: "আমাদের এলাকা সমূহ",
        reviewsSectionTitle: "রিভিউ সমূহ",
        bannerTitle: "আমাদের শিক্ষা ব্যবস্থা",
        bannerSubtitle: "সেরা টিউটর খুঁজছেন? আমরা আছি আপনার পাশে",
        copyrightText: "© 2026 Tutors Valley. সর্বস্বত্ব সংরক্ষিত।"
    };
    
    db.collection('settings').doc('main').set(defaultSettings);
    applySettings(defaultSettings);
}

// Apply Settings
function applySettings(data) {
    if (data.branding) document.getElementById('brandingText').innerText = data.branding;
    if (data.motto) document.getElementById('mottoText').innerText = data.motto;
    if (data.bannerColor) document.getElementById('bannerSection').style.backgroundColor = data.bannerColor;
    if (data.logoUrl) document.getElementById('siteLogo').src = data.logoUrl;
    if (data.logoSize) document.getElementById('siteLogo').style.width = data.logoSize + 'px';
    if (data.watermarkUrl) {
        document.getElementById('watermark').style.backgroundImage = `url(${data.watermarkUrl})`;
        document.getElementById('watermark').style.opacity = data.watermarkOpacity / 100;
    }
    if (data.fbPageLink) document.getElementById('fbLink').href = data.fbPageLink;
    if (data.fbButtonText) document.getElementById('fbButtonText').innerText = data.fbButtonText;
    if (data.ceoName) document.getElementById('ceoNameText').innerText = data.ceoName;
    if (data.ceoTitle) document.getElementById('ceoTitleText').innerText = data.ceoTitle;
    if (data.ceoDesc) document.getElementById('ceoDescText').innerText = data.ceoDesc;
    if (data.ceoImageUrl) document.getElementById('ceoImage').src = data.ceoImageUrl;
    if (data.ceoImageSize) document.getElementById('ceoImage').style.width = data.ceoImageSize + 'px';
    if (data.zoneSectionTitle) document.getElementById('zoneSectionTitle').innerText = data.zoneSectionTitle;
    if (data.reviewsSectionTitle) document.getElementById('reviewsSectionTitle').innerText = data.reviewsSectionTitle;
    if (data.bannerTitle) document.getElementById('bannerTitle').innerText = data.bannerTitle;
    if (data.bannerSubtitle) document.getElementById('bannerSubtitle').innerText = data.bannerSubtitle;
    if (data.copyrightText) document.getElementById('copyrightText').innerText = data.copyrightText;
}

// Load Zone Cards
function loadZoneCards() {
    db.collection('zoneCards').get().then((snapshot) => {
        if (snapshot.empty) {
            // Create default cards
            defaultZoneCards.forEach(card => {
                db.collection('zoneCards').doc(card.id.toString()).set(card);
            });
            renderZoneCards(defaultZoneCards);
        } else {
            const cards = [];
            snapshot.forEach(doc => {
                cards.push(doc.data());
            });
            renderZoneCards(cards);
        }
    });
}

// Render Zone Cards
function renderZoneCards(cards) {
    const container = document.getElementById('zoneCardsContainer');
    container.innerHTML = '';
    
    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'zone-card';
        
        let areasHtml = '';
        if (card.areas) {
            card.areas.forEach(area => {
                areasHtml += `<span class="area-tag">${area}</span>`;
            });
        }
        
        let buttonsHtml = '';
        if (currentUserRole === 'tutor') {
            if (card.maleLink) {
                buttonsHtml += `<a href="#" onclick="goToGroupPage('${card.maleLink}', 'পুরুষ')" class="group-btn male-btn"><i class="fab fa-whatsapp"></i> পুরুষ গ্রুপ</a>`;
            }
            if (card.femaleLink) {
                buttonsHtml += `<a href="#" onclick="goToGroupPage('${card.femaleLink}', 'মহিলা')" class="group-btn female-btn"><i class="fab fa-whatsapp"></i> মহিলা গ্রুপ</a>`;
            }
            if (card.mixedLink) {
                buttonsHtml += `<a href="#" onclick="goToGroupPage('${card.mixedLink}', 'মিক্সড')" class="group-btn mixed-btn"><i class="fab fa-whatsapp"></i> মিক্সড গ্রুপ</a>`;
            }
        }
        
        cardDiv.innerHTML = `
            <h3 class="zone-title">${card.zoneTitle}</h3>
            <div class="area-tags">${areasHtml}</div>
            <div class="group-buttons">${buttonsHtml}</div>
        `;
        
        container.appendChild(cardDiv);
    });
}

// Go to Group Join Page
function goToGroupPage(link, gender) {
    document.getElementById('groupInfo').innerText = `${gender} গ্রুপে যোগদান করুন`;
    document.getElementById('groupJoinLink').href = link;
    showPage('groupJoinPage');
}

// Go Back Home
function goBackHome() {
    showPage('homePage');
}

// Load Reviews
function loadReviews() {
    db.collection('reviews').orderBy('createdAt', 'desc').get().then((snapshot) => {
        const container = document.getElementById('reviewsContainer');
        container.innerHTML = '';
        
        snapshot.forEach(doc => {
            const review = doc.data();
            const reviewDiv = document.createElement('div');
            reviewDiv.className = 'review-card';
            
            const date = review.createdAt ? new Date(review.createdAt.toDate()).toLocaleDateString('bn-BD') : '';
            
            reviewDiv.innerHTML = `
                <div class="review-header">
                    <span class="reviewer-name">${review.userName || 'Anonymous'}</span>
                    <span class="review-date">${date}</span>
                </div>
                <p class="review-text">${review.text}</p>
            `;
            
            container.appendChild(reviewDiv);
        });
    });
}

// Submit Review
function submitReview() {
    const text = document.getElementById('reviewText').value;
    if (!text.trim()) {
        alert("অনুগ্রহ করে রিভিউ লিখুন");
        return;
    }
    
    db.collection('reviews').add({
        text: text,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        userRole: currentUserRole,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('reviewText').value = '';
        loadReviews();
        alert("রিভিউ জমা দেওয়া হয়েছে");
    });
}

// Upload Image
function uploadImage(type) {
    const fileInput = document.getElementById(type + 'Upload');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    const storageRef = storage.ref();
    const imageRef = storageRef.child(`images/${type}_${Date.now()}.${file.name.split('.').pop()}`);
    
    imageRef.put(file).then((snapshot) => {
        return snapshot.ref.getDownloadURL();
    }).then((url) => {
        if (type === 'logo') {
            document.getElementById('siteLogo').src = url;
            db.collection('settings').doc('main').update({ logoUrl: url });
        } else if (type === 'ceo') {
            document.getElementById('ceoImage').src = url;
            db.collection('settings').doc('main').update({ ceoImageUrl: url });
        }
    });
}

// Upload Watermark
function uploadWatermark() {
    const fileInput = document.getElementById('watermarkUpload');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    const storageRef = storage.ref();
    const imageRef = storageRef.child(`watermarks/watermark_${Date.now()}.${file.name.split('.').pop()}`);
    
    imageRef.put(file).then((snapshot) => {
        return snapshot.ref.getDownloadURL();
    }).then((url) => {
        document.getElementById('watermark').style.backgroundImage = `url(${url})`;
        db.collection('settings').doc('main').update({ watermarkUrl: url });
    });
}

// Update Watermark Opacity
function updateWatermarkOpacity(value) {
    document.getElementById('watermark').style.opacity = value / 100;
}

// Update Text
function updateText(elementId, value) {
    document.getElementById(elementId).innerText = value;
}

// Update Element Style
function updateElementStyle(elementId, property, value) {
    document.getElementById(elementId).style[property] = value;
}

// Load Control Panel Settings
function loadControlPanelSettings() {
    db.collection('settings').doc('main').get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            
            // Populate form fields
            document.getElementById('brandingText').value = data.branding || '';
            document.getElementById('mottoText').value = data.motto || '';
            document.getElementById('bannerColor').value = data.bannerColor || '#001f3f';
            document.getElementById('logoSize').value = data.logoSize || 100;
            document.getElementById('logoSizeVal').innerText = data.logoSize || 100;
            document.getElementById('ceoSize').value = data.ceoImageSize || 100;
            document.getElementById('ceoName').value = data.ceoName || '';
            document.getElementById('ceoTitle').value = data.ceoTitle || '';
            document.getElementById('ceoDesc').value = data.ceoDesc || '';
            document.getElementById('fbPageLink').value = data.fbPageLink || '';
            document.getElementById('fbButtonText').value = data.fbButtonText || '';
            document.getElementById('watermarkOpacity').value = data.watermarkOpacity || 20;
            
            // Load zone cards settings
            loadZoneCardsSettings();
        }
    });
}

// Load Zone Cards Settings
function loadZoneCardsSettings() {
    const container = document.getElementById('zoneCardsSettings');
    container.innerHTML = '';
    
    db.collection('zoneCards').get().then((snapshot) => {
        snapshot.forEach((doc) => {
            const card = doc.data();
            const cardSettings = document.createElement('div');
            cardSettings.className = 'control-group';
            cardSettings.style.border = '1px solid #ddd';
            cardSettings.style.padding = '15px';
            cardSettings.style.marginBottom = '15px';
            cardSettings.style.borderRadius = '8px';
            
            cardSettings.innerHTML = `
                <h5>জোন #${card.id}</h5>
                <label>জোন শিরোনাম:</label>
                <input type="text" value="${card.zoneTitle}" onchange="updateZoneCard(${card.id}, 'zoneTitle', this.value)">
                
                <label>এলাকা সমূহ (কমা দিয়ে আলাদা করুন):</label>
                <input type="text" value="${card.areas ? card.areas.join(', ') : ''}" onchange="updateZoneCard(${card.id}, 'areas', this.value)">
                
                <label>পুরুষ গ্রুপ লিঙ্ক:</label>
                <input type="url" value="${card.maleLink || ''}" onchange="updateZoneCard(${card.id}, 'maleLink', this.value)">
                
                <label>মহিলা গ্রুপ লিঙ্ক:</label>
                <input type="url" value="${card.femaleLink || ''}" onchange="updateZoneCard(${card.id}, 'femaleLink', this.value)">
                
                <label>মিক্সড গ্রুপ লিঙ্ক:</label>
                <input type="url" value="${card.mixedLink || ''}" onchange="updateZoneCard(${card.id}, 'mixedLink', this.value)">
                
                <button onclick="deleteZoneCard(${card.id})" style="background: #ff4136; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-top: 10px;">মুছুন</button>
            `;
            
            container.appendChild(cardSettings);
        });
    });
}

// Update Zone Card
function updateZoneCard(id, field, value) {
    const updates = {};
    
    if (field === 'areas') {
        value = value.split(',').map(a => a.trim()).filter(a => a);
    }
    
    updates[field] = value;
    
    db.collection('zoneCards').doc(id.toString()).update(updates);
}

// Delete Zone Card
function deleteZoneCard(id) {
    if (confirm('আপনি কি এই জোন মুছতে চান?')) {
        db.collection('zoneCards').doc(id.toString()).delete();
        loadZoneCardsSettings();
    }
}

// Add New Zone Card
function addNewZoneCard() {
    const newId = Date.now();
    const newCard = {
        id: newId,
        zoneTitle: "নতুন জোন",
        areas: [],
        maleLink: "",
        femaleLink: "",
        mixedLink: ""
    };
    
    db.collection('zoneCards').doc(newId.toString()).set(newCard)
        .then(() => {
            loadZoneCardsSettings();
        });
}

// Invite Sub-admin
function inviteSubAdmin() {
    const email = document.getElementById('subAdminEmail').value;
    if (!email) {
        alert("ইমেইল দিন");
        return;
    }
    
    db.collection('subadmins').doc(email).set({
        email: email,
        invitedBy: currentUser.email,
        invitedAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
    }).then(() => {
        alert("আমন্ত্রণ পাঠানো হয়েছে");
        document.getElementById('subAdminEmail').value = '';
    });
}

// Save All Settings
function saveAllSettings() {
    const settings = {
        branding: document.getElementById('brandingText').value,
        motto: document.getElementById('mottoText').value,
        bannerColor: document.getElementById('bannerColor').value,
        logoSize: document.getElementById('logoSize').value,
        ceoImageSize: document.getElementById('ceoSize').value,
        ceoName: document.getElementById('ceoName').value,
        ceoTitle: document.getElementById('ceoTitle').value,
        ceoDesc: document.getElementById('ceoDesc').value,
        fbPageLink: document.getElementById('fbPageLink').value,
        fbButtonText: document.getElementById('fbButtonText').value,
        watermarkOpacity: document.getElementById('watermarkOpacity').value
    };
    
    db.collection('settings').doc('main').update(settings)
        .then(() => {
            alert("সেটিংস সংরক্ষিত হয়েছে");
            toggleControlPanel();
        });
}

// Check if user is sub-admin
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('subadmins').doc(user.email).get().then((doc) => {
            if (doc.exists && doc.data().status === 'approved') {
                currentUserRole = 'subadmin';
            }
        });
    }
});
