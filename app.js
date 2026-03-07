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
// Storage দরকার নেই এখন

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Global Variables
let currentUser = null;
let currentUserRole = null;
let currentZoneCards = [];
const OWNER_EMAIL = "kabirhasanat7@gmail.com";

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
            logout();
        }
    }).catch((error) => {
        console.error("Error:", error);
    });
}

// Show Google Login Modal
function showGoogleLogin(role) {
    currentUserRole = role;
    const titles = {
        'tutor': 'টিউটর লগইন',
        'guardian': 'অভিভাবক লগইন',
        'admin': 'এডমিন লগইন'
    };
    const descs = {
        'tutor': 'আপনার Google অ্যাকাউন্ট দিয়ে টিউটর হিসেবে লগইন করুন',
        'guardian': 'আপনার Google অ্যাকাউন্ট দিয়ে অভিভাবক হিসেবে লগইন করুন',
        'admin': 'শুধুমাত্র মালিক এইমেইল দিয়ে এডমিন হিসেবে লগইন করতে পারবেন'
    };
    
    document.getElementById('googleLoginTitle').innerText = titles[role] || 'লগইন';
    document.getElementById('googleLoginDesc').innerText = descs[role] || '';
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
            
            if (role === 'admin') {
                if (user.email !== OWNER_EMAIL) {
                    alert("শুধুমাত্র মালিক এইমেইল দিয়ে admin লগইন করতে পারবেন!");
                    auth.signOut();
                    closeModal('googleLoginModal');
                    return;
                }
            }
            
            db.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: role === 'admin' ? 'admin' : role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).then(() => {
                closeModal('googleLoginModal');
            });
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
    
    auth.signInAnonymously().then(() => {
        initializeApp();
    });
}

// Initialize App
function initializeApp() {
    showPage('homePage');
    document.getElementById('userName').innerText = currentUser.displayName || currentUser.email;
    document.getElementById('userRole').innerText = currentUserRole === 'admin' ? 'এডমিন' : 
                                                    currentUserRole === 'tutor' ? 'টিউটর' :
                                                    currentUserRole === 'guardian' ? 'অভিভাবক' : 'গেস্ট';
    
    if (currentUserRole === 'admin' || currentUserRole === 'subadmin') {
        document.getElementById('controlPanelIcon').style.display = 'flex';
    }
    
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

// Image to Base64 Converter
function convertToBase64(file, maxWidth = 400, maxHeight = 400) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Resize logic
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG with 0.7 quality
                const base64 = canvas.toDataURL('image/jpeg', 0.7);
                resolve(base64);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}

// Upload Logo Image
async function uploadImage(type) {
    const fileInput = document.getElementById(type + 'Upload');
    const file = fileInput.files[0];
    
    if (!file) {
        alert("অনুগ্রহ করে একটি ফাইল সিলেক্ট করুন");
        return;
    }
    
    if (file.size > 1024 * 1024) {
        alert("ফাইল সাইজ 1MB এর কম হতে হবে");
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        alert("শুধুমাত্র ইমেজ ফাইল আপলোড করা যাবে");
        return;
    }
    
    try {
        // Resize and compress image
        const base64 = await convertToBase64(file, 300, 300);
        
        if (type === 'logo') {
            const logoSize = document.getElementById('logoSize').value;
            document.getElementById('siteLogo').src = base64;
            document.getElementById('siteLogo').style.width = logoSize + 'px';
            
            db.collection('settings').doc('main').update({ 
                logoUrl: base64,
                logoSize: parseInt(logoSize)
            });
            alert("লোগো সফলভাবে আপলোড হয়েছে!");
        } else if (type === 'ceo') {
            const ceoSize = document.getElementById('ceoSize').value;
            document.getElementById('ceoImage').src = base64;
            document.getElementById('ceoImage').style.width = ceoSize + 'px';
            
            db.collection('settings').doc('main').update({ 
                ceoImageUrl: base64,
                ceoImageSize: parseInt(ceoSize)
            });
            alert("CEO ইমেজ সফলভাবে আপলোড হয়েছে!");
        }
        
        fileInput.value = '';
    } catch (error) {
        console.error("Upload error:", error);
        alert("ইমেজ আপলোড ব্যর্থ: " + error.message);
    }
}

// Upload Watermark
async function uploadWatermark() {
    const fileInput = document.getElementById('watermarkUpload');
    const file = fileInput.files[0];
    
    if (!file) {
        alert("অনুগ্রহ করে একটি ফাইল সিলেক্ট করুন");
        return;
    }
    
    if (file.size > 512 * 1024) {
        alert("ফাইল সাইজ 500KB এর কম হতে হবে");
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        alert("শুধুমাত্র ইমেজ ফাইল আপলোড করা যাবে");
        return;
    }
    
    try {
        const base64 = await convertToBase64(file, 200, 200);
        
        document.getElementById('watermark').style.backgroundImage = `url(${base64})`;
        document.getElementById('watermark').style.opacity = document.getElementById('watermarkOpacity').value / 100;
        
        db.collection('settings').doc('main').update({ 
            watermarkUrl: base64,
            watermarkOpacity: parseInt(document.getElementById('watermarkOpacity').value)
        });
        
        alert("ওয়াটারমার্ক সফলভাবে আপলোড হয়েছে!");
        fileInput.value = '';
    } catch (error) {
        console.error("Watermark error:", error);
        alert("ওয়াটারমার্ক আপলোড ব্যর্থ: " + error.message);
    }
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

// Update Font
function updateFont(fontValue) {
    document.body.style.fontFamily = fontValue;
}

// Update Page Color
function updatePageColor(color) {
    document.body.style.background = color;
}

// Load Settings from Firestore
function loadSettings() {
    db.collection('settings').doc('main').get().then((doc) => {
        if (doc.exists) {
            applySettings(doc.data());
        } else {
            createDefaultSettings();
        }
    }).catch((error) => {
        console.error("Load settings error:", error);
        createDefaultSettings();
    });
}

// Create Default Settings
function createDefaultSettings() {
    const defaultSettings = {
        branding: "Tutors Valley",
        motto: "ঢাকার শহরে আমরাই দিচ্ছি সেরা টিউটর",
        bannerColor: "#001f3f",
        logoUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%230074D9'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.3em' fill='white'%3ETV%3C/text%3E%3C/svg%3E",
        logoSize: 100,
        watermarkUrl: "",
        watermarkOpacity: 20,
        fbPageLink: "#",
        fbButtonText: "আমাদের ফেসবুক পেজ",
        ceoName: "CEO Name",
        ceoTitle: "Founder & CEO",
        ceoDesc: "CEO description here...",
        ceoImageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%230074D9'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.3em' fill='white'%3E👤%3C/text%3E%3C/svg%3E",
        ceoImageSize: 100,
        zoneSectionTitle: "আমাদের এলাকা সমূহ",
        reviewsSectionTitle: "রিভিউ সমূহ",
        bannerTitle: "আমাদের শিক্ষা ব্যবস্থা",
        bannerSubtitle: "সেরা টিউটর খুঁজছেন? আমরা আছি আপনার পাশে",
        copyrightText: "© 2026 Tutors Valley. সর্বস্বত্ব সংরক্ষিত।",
        pageBgColor: "#ffffff"
    };
    
    db.collection('settings').doc('main').set(defaultSettings)
        .then(() => {
            applySettings(defaultSettings);
        });
}

// Apply Settings
function applySettings(data) {
    if (data.branding) document.getElementById('brandingText').innerText = data.branding;
    if (data.motto) document.getElementById('mottoText').innerText = data.motto;
    if (data.bannerColor) {
        document.getElementById('bannerSection').style.backgroundColor = data.bannerColor;
        if(document.getElementById('bannerColor')) document.getElementById('bannerColor').value = data.bannerColor;
    }
    if (data.logoUrl) {
        document.getElementById('siteLogo').src = data.logoUrl;
    }
    if (data.logoSize) {
        document.getElementById('siteLogo').style.width = data.logoSize + 'px';
        if(document.getElementById('logoSize')) {
            document.getElementById('logoSize').value = data.logoSize;
            document.getElementById('logoSizeVal').innerText = data.logoSize;
        }
    }
    if (data.watermarkUrl) {
        document.getElementById('watermark').style.backgroundImage = `url(${data.watermarkUrl})`;
        document.getElementById('watermark').style.opacity = (data.watermarkOpacity || 20) / 100;
        if(document.getElementById('watermarkOpacity')) {
            document.getElementById('watermarkOpacity').value = data.watermarkOpacity || 20;
        }
    }
    if (data.fbPageLink) document.getElementById('fbLink').href = data.fbPageLink;
    if (data.fbButtonText) {
        document.getElementById('fbButtonText').innerText = data.fbButtonText;
        if(document.getElementById('fbButtonTextInput')) document.getElementById('fbButtonTextInput').value = data.fbButtonText;
    }
    if (data.ceoName) {
        document.getElementById('ceoNameText').innerText = data.ceoName;
        if(document.getElementById('ceoNameInput')) document.getElementById('ceoNameInput').value = data.ceoName;
    }
    if (data.ceoTitle) {
        document.getElementById('ceoTitleText').innerText = data.ceoTitle;
        if(document.getElementById('ceoTitleInput')) document.getElementById('ceoTitleInput').value = data.ceoTitle;
    }
    if (data.ceoDesc) {
        document.getElementById('ceoDescText').innerText = data.ceoDesc;
        if(document.getElementById('ceoDescInput')) document.getElementById('ceoDescInput').value = data.ceoDesc;
    }
    if (data.ceoImageUrl) {
        document.getElementById('ceoImage').src = data.ceoImageUrl;
    }
    if (data.ceoImageSize) {
        document.getElementById('ceoImage').style.width = data.ceoImageSize + 'px';
        if(document.getElementById('ceoSize')) document.getElementById('ceoSize').value = data.ceoImageSize;
    }
    if (data.zoneSectionTitle) {
        document.getElementById('zoneSectionTitle').innerText = data.zoneSectionTitle;
        if(document.getElementById('zoneSectionTitleInput')) document.getElementById('zoneSectionTitleInput').value = data.zoneSectionTitle;
    }
    if (data.reviewsSectionTitle) document.getElementById('reviewsSectionTitle').innerText = data.reviewsSectionTitle;
    if (data.bannerTitle) {
        document.getElementById('bannerTitle').innerText = data.bannerTitle;
        if(document.getElementById('bannerTitleInput')) document.getElementById('bannerTitleInput').value = data.bannerTitle;
    }
    if (data.bannerSubtitle) {
        document.getElementById('bannerSubtitle').innerText = data.bannerSubtitle;
        if(document.getElementById('bannerSubtitleInput')) document.getElementById('bannerSubtitleInput').value = data.bannerSubtitle;
    }
    if (data.copyrightText) document.getElementById('copyrightText').innerText = data.copyrightText;
    if (data.pageBgColor) {
        document.body.style.background = data.pageBgColor;
        if(document.getElementById('pageBgColor')) document.getElementById('pageBgColor').value = data.pageBgColor;
    }
}

// Load Zone Cards
function loadZoneCards() {
    db.collection('zoneCards').get().then((snapshot) => {
        if (snapshot.empty) {
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
                buttonsHtml += `<a href="#" onclick="goToGroupPage('${card.maleLink}', 'পুরুষ'); return false;" class="group-btn male-btn"><i class="fab fa-whatsapp"></i> পুরুষ গ্রুপ</a>`;
            }
            if (card.femaleLink) {
                buttonsHtml += `<a href="#" onclick="goToGroupPage('${card.femaleLink}', 'মহিলা'); return false;" class="group-btn female-btn"><i class="fab fa-whatsapp"></i> মহিলা গ্রুপ</a>`;
            }
            if (card.mixedLink) {
                buttonsHtml += `<a href="#" onclick="goToGroupPage('${card.mixedLink}', 'মিক্সড'); return false;" class="group-btn mixed-btn"><i class="fab fa-whatsapp"></i> মিক্সড গ্রুপ</a>`;
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
                    <span class="reviewer-name">${review.userName || 'Anonymous'} ${review.userRole ? '(' + review.userRole + ')' : ''}</span>
                    <span class="review-date">${date}</span>
                </div>
                <p class="review-text">${review.text}</p>
            `;
            
            container.appendChild(reviewDiv);
        });
    }).catch((error) => {
        console.error("Load reviews error:", error);
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
    }).catch((error) => {
        alert("রিভিউ জমা ব্যর্থ: " + error.message);
    });
}

// Load Control Panel Settings
function loadControlPanelSettings() {
    db.collection('settings').doc('main').get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            
            if(document.getElementById('brandingTextInput')) document.getElementById('brandingTextInput').value = data.branding || '';
            if(document.getElementById('mottoTextInput')) document.getElementById('mottoTextInput').value = data.motto || '';
            if(document.getElementById('bannerColor')) document.getElementById('bannerColor').value = data.bannerColor || '#001f3f';
            if(document.getElementById('logoSize')) {
                document.getElementById('logoSize').value = data.logoSize || 100;
                document.getElementById('logoSizeVal').innerText = data.logoSize || 100;
            }
            if(document.getElementById('ceoSize')) document.getElementById('ceoSize').value = data.ceoImageSize || 100;
            if(document.getElementById('ceoNameInput')) document.getElementById('ceoNameInput').value = data.ceoName || '';
            if(document.getElementById('ceoTitleInput')) document.getElementById('ceoTitleInput').value = data.ceoTitle || '';
            if(document.getElementById('ceoDescInput')) document.getElementById('ceoDescInput').value = data.ceoDesc || '';
            if(document.getElementById('fbPageLink')) document.getElementById('fbPageLink').value = data.fbPageLink || '';
            if(document.getElementById('fbButtonTextInput')) document.getElementById('fbButtonTextInput').value = data.fbButtonText || '';
            if(document.getElementById('watermarkOpacity')) document.getElementById('watermarkOpacity').value = data.watermarkOpacity || 20;
            if(document.getElementById('bannerTitleInput')) document.getElementById('bannerTitleInput').value = data.bannerTitle || '';
            if(document.getElementById('bannerSubtitleInput')) document.getElementById('bannerSubtitleInput').value = data.bannerSubtitle || '';
            if(document.getElementById('zoneSectionTitleInput')) document.getElementById('zoneSectionTitleInput').value = data.zoneSectionTitle || '';
            if(document.getElementById('pageBgColor')) document.getElementById('pageBgColor').value = data.pageBgColor || '#ffffff';
            
            loadZoneCardsSettings();
            loadSubAdminList();
        }
    });
}

// Load Zone Cards Settings
function loadZoneCardsSettings() {
    const container = document.getElementById('zoneCardsSettings');
    if (!container) return;
    
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
        loadSubAdminList();
    });
}

// Load Sub-admin List
function loadSubAdminList() {
    const container = document.getElementById('subAdminList');
    if (!container) return;
    
    container.innerHTML = '';
    
    db.collection('subadmins').get().then((snapshot) => {
        snapshot.forEach((doc) => {
            const subadmin = doc.data();
            const div = document.createElement('div');
            div.style.padding = '10px';
            div.style.borderBottom = '1px solid #ddd';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            
            div.innerHTML = `
                <span>${subadmin.email} - ${subadmin.status}</span>
                ${subadmin.status === 'pending' ? 
                    `<button onclick="approveSubAdmin('${subadmin.email}')" style="background: #2ECC40; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Approve</button>` : 
                    ''}
            `;
            
            container.appendChild(div);
        });
    });
}

// Approve Sub-admin
function approveSubAdmin(email) {
    db.collection('subadmins').doc(email).update({
        status: 'approved'
    }).then(() => {
        alert("Sub-admin approved");
        loadSubAdminList();
    });
}

// Save All Settings
function saveAllSettings() {
    const settings = {
        branding: document.getElementById('brandingTextInput').value,
        motto: document.getElementById('mottoTextInput').value,
        bannerColor: document.getElementById('bannerColor').value,
        logoSize: parseInt(document.getElementById('logoSize').value),
        ceoImageSize: parseInt(document.getElementById('ceoSize').value),
        ceoName: document.getElementById('ceoNameInput').value,
        ceoTitle: document.getElementById('ceoTitleInput').value,
        ceoDesc: document.getElementById('ceoDescInput').value,
        fbPageLink: document.getElementById('fbPageLink').value,
        fbButtonText: document.getElementById('fbButtonTextInput').value,
        watermarkOpacity: parseInt(document.getElementById('watermarkOpacity').value),
        bannerTitle: document.getElementById('bannerTitleInput').value,
        bannerSubtitle: document.getElementById('bannerSubtitleInput').value,
        zoneSectionTitle: document.getElementById('zoneSectionTitleInput').value,
        pageBgColor: document.getElementById('pageBgColor').value
    };
    
    db.collection('settings').doc('main').update(settings)
        .then(() => {
            alert("সেটিংস সংরক্ষিত হয়েছে");
            toggleControlPanel();
        })
        .catch((error) => {
            alert("সেটিংস সংরক্ষণ ব্যর্থ: " + error.message);
        });
}

// Check if user is sub-admin
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('subadmins').doc(user.email).get().then((doc) => {
            if (doc.exists && doc.data().status === 'approved') {
                currentUserRole = 'subadmin';
                if(document.getElementById('userRole')) {
                    document.getElementById('userRole').innerText = 'সাব-এডমিন';
                }
                if(document.getElementById('controlPanelIcon')) {
                    document.getElementById('controlPanelIcon').style.display = 'flex';
                }
            }
        });
    }
});
