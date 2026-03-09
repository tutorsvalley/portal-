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

// Google Provider
const provider = new firebase.auth.GoogleAuthProvider();

// Global Variables
let currentUser = null;
let currentUserType = null;
let isAdmin = false;
const ADMIN_EMAIL = "kabirhasanat7@gmail.com";

// --- EXTERNAL BROWSER DETECTION LOGIC ---
function checkEmbeddedBrowser() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const warningDiv = document.getElementById('externalBrowserWarning');
    
    const isFacebook = /FBAN|FBAV/i.test(userAgent);
    const isInstagram = /Instagram/i.test(userAgent);
    const isMessenger = /Messenger/i.test(userAgent);
    const isTwitter = /Twitter/i.test(userAgent);
    const isLinkedIn = /LinkedIn/i.test(userAgent);
    const isWhatsApp = /WhatsApp/i.test(userAgent);
    
    // Check if running inside any social app webview
    if (isFacebook || isInstagram || isMessenger || isTwitter || isLinkedIn || isWhatsApp) {
        if (warningDiv) {
            warningDiv.style.display = 'flex';
            warningDiv.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
        return true;
    } else {
        if (warningDiv) {
            warningDiv.style.display = 'none';
            warningDiv.classList.remove('active');
        }
        document.body.style.overflow = 'auto';
        return false;
    }
}

function forceOpenBrowser() {
    const currentUrl = window.location.href;
    window.open(currentUrl, '_blank');
    
    setTimeout(() => {
        alert("If it didn't open automatically, please tap the menu (⋮ or ) at the top corner and select 'Open in Browser' or 'Open in Chrome'.");
    }, 1000);
}

// Run detection immediately on page load
document.addEventListener('DOMContentLoaded', function() {
    checkEmbeddedBrowser();
    console.log('Tutors Valley initialized');
});

// Default Zone Cards Data
let zoneCards = [
    {
        id: 1,
        zone: "মিরপুর",
        areas: ["মিরপুর ১", "মিরপুর ২", "মিরপুর ১০", "মিরপুর ১১"],
        maleGroup: "https://chat.whatsapp.com/yourmalelink1",
        femaleGroup: "https://chat.whatsapp.com/yourfemalelink1"
    },
    {
        id: 2,
        zone: "উত্তরা",
        areas: ["উত্তরা সেক্টর ১", "উত্তরা সেক্টর ৪", "উত্তরা সেক্টর ৭"],
        maleGroup: "https://chat.whatsapp.com/yourmalelink2",
        femaleGroup: "https://chat.whatsapp.com/yourfemalelink2"
    },
    {
        id: 3,
        zone: "ধানমন্ডি",
        areas: ["ধানমন্ডি ৩", "ধানমন্ডি ৮", "ধানমন্ডি ২৭"],
        maleGroup: "https://chat.whatsapp.com/yourmalelink3",
        femaleGroup: "https://chat.whatsapp.com/yourfemalelink3"
    },
    {
        id: 4,
        zone: "গুলশান",
        areas: ["গুলশান ১", "গুলশান ২", "বনানী"],
        maleGroup: "https://chat.whatsapp.com/yourmalelink4",
        femaleGroup: "https://chat.whatsapp.com/yourfemalelink4"
    },
    {
        id: 5,
        zone: "মোহাম্মদপুর",
        areas: ["মোহাম্মদপুর ১", "মোহাম্মদপুর ২", "আদাবর"],
        maleGroup: "https://chat.whatsapp.com/yourmalelink5",
        femaleGroup: "https://chat.whatsapp.com/yourfemalelink5"
    },
    {
        id: 6,
        zone: "বনশ্রী",
        areas: ["বনশ্রী এ", "বনশ্রী বি", "রামপুরা"],
        maleGroup: "https://chat.whatsapp.com/yourmalelink6",
        femaleGroup: "https://chat.whatsapp.com/yourfemalelink6"
    }
];

// Default Settings
let appSettings = {
    bannerColor: "#001f3f",
    watermarkOpacity: 30,
    logoSize: 150,
    ceoSize: 150,
    fbLink: "https://facebook.com/tutorsvalley",
    texts: {
        brandingText: { content: "Tutors Valley", font: "'Hind Siliguri', sans-serif", size: 32, color: "#ffffff" },
        mottoText: { content: "ঢাকার শহরে আমরাই দিচ্ছি সেরা টিউটর", font: "'Hind Siliguri', sans-serif", size: 18, color: "#ffffff" },
        zoneTitle: { content: "Our Zones & Areas", font: "'Hind Siliguri', sans-serif", size: 32, color: "#001f3f" },
        reviewsTitle: { content: "Reviews", font: "'Hind Siliguri', sans-serif", size: 32, color: "#001f3f" },
        ceoName: { content: "CEO Name", font: "'Hind Siliguri', sans-serif", size: 28, color: "#001f3f" },
        ceoDescription: { content: "CEO Description", font: "'Hind Siliguri', sans-serif", size: 16, color: "#555555" },
        copyrightText: { content: "© 2026 Tutors Valley. All rights reserved.", font: "'Hind Siliguri', sans-serif", size: 14, color: "#ffffff" },
        fbButtonText: { content: "Facebook", font: "'Hind Siliguri', sans-serif", size: 14, color: "#ffffff" }
    }
};

// Loading Animation
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
    setTimeout(() => {
        hideLoading();
    }, 2000);
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Page Navigation
function showPage(pageId) {
    showLoading();
    setTimeout(() => {
        const pages = document.querySelectorAll('.page');
        pages.forEach(function(page) {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        hideLoading();
    }, 2000);
}

// Login Modal
function showLoginModal(type) {
    // Check if in embedded browser
    if (checkEmbeddedBrowser()) {
        alert("Please open this link in Chrome or Safari browser to login properly.");
        return;
    }
    
    currentUserType = type;
    const modal = document.getElementById('loginModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (modal && modalTitle) {
        modal.classList.add('active');
        modalTitle.textContent = type.charAt(0).toUpperCase() + type.slice(1) + ' Login';
    }
}

function closeModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Admin Login Trigger
function showAdminLogin() {
    if (checkEmbeddedBrowser()) {
        alert("Please open this link in Chrome or Safari browser to login properly.");
        return;
    }
    
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Google Login
function googleLogin() {
    showLoading();
    
    auth.signInWithPopup(provider)
        .then(function(result) {
            const user = result.user;
            currentUser = user;
            
            if (currentUserType === 'tutor') {
                saveUserData(user, 'tutor');
                showPage('homePage');
                setupHomePage('tutor');
            } else if (currentUserType === 'guardian') {
                saveUserData(user, 'guardian');
                showPage('homePage');
                setupHomePage('guardian');
            }
            
            closeModal();
            hideLoading();
        })
        .catch(function(error) {
            const loginStatus = document.getElementById('loginStatus');
            if (error.code === 'auth/popup-closed-by-user' || error.message.includes('popup')) {
                alert("Login popup blocked. Please open this link in Chrome or Safari browser.");
            } else if (loginStatus) {
                loginStatus.textContent = error.message;
            }
            hideLoading();
        });
}

// Guest Login
function guestLogin() {
    showLoading();
    setTimeout(function() {
        currentUserType = 'guest';
        showPage('homePage');
        setupHomePage('guest');
        hideLoading();
    }, 2000);
}

// Admin Login
function adminLogin() {
    const adminEmail = document.getElementById('adminEmail');
    const adminPassword = document.getElementById('adminPassword');
    const adminStatus = document.getElementById('adminStatus');
    
    const email = adminEmail ? adminEmail.value : '';
    const password = adminPassword ? adminPassword.value : '';
    
    showLoading();
    
    if (email === ADMIN_EMAIL) {
        auth.signInWithEmailAndPassword(email, password)
            .then(function(userCredential) {
                currentUser = userCredential.user;
                isAdmin = true;
                closeAdminModal();
                showPage('homePage');
                setupHomePage('admin');
                hideLoading();
            })
            .catch(function(error) {
                if (adminStatus) {
                    adminStatus.textContent = error.message;
                }
                hideLoading();
            });
    } else {
        if (adminStatus) {
            adminStatus.textContent = "Invalid admin email";
        }
        hideLoading();
    }
}

// Save User Data
function saveUserData(user, type) {
    db.collection('users').doc(user.uid).set({
        email: user.email,
        name: user.displayName,
        type: type,
        photoURL: user.photoURL,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

// Setup Home Page
function setupHomePage(userType) {
    currentUserType = userType;
    
    // Show gear icon for admin only
    const gearIcon = document.getElementById('gearIcon');
    if (gearIcon) {
        gearIcon.style.display = isAdmin ? 'block' : 'none';
    }
    
    // Show tutor controls ONLY for tutor
    const tutorControls = document.getElementById('tutorControls');
    if (tutorControls) {
        if (userType === 'tutor') {
            tutorControls.style.display = 'flex';
            const genderSelect = document.getElementById('genderSelect');
            if (genderSelect) {
                genderSelect.value = "";
            }
            const groupBtns = document.querySelectorAll('.group-btn');
            groupBtns.forEach(function(btn) {
                btn.classList.add('hidden');
            });
        } else {
            tutorControls.style.display = 'none';
            const groupBtns = document.querySelectorAll('.group-btn');
            groupBtns.forEach(function(btn) {
                btn.classList.remove('hidden');
            });
        }
    }
    
    // Show review form for tutor and guardian
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.style.display = (userType === 'tutor' || userType === 'guardian') ? 'block' : 'none';
    }
    
    loadSettings();
    renderZoneCards();
    loadReviews();
}

// Handle Gender Select (Tutor Only Logic)
function handleGenderSelect() {
    const genderSelect = document.getElementById('genderSelect');
    const gender = genderSelect ? genderSelect.value : '';
    
    showLoading();
    
    setTimeout(function() {
        const groupBtns = document.querySelectorAll('.group-btn');
        groupBtns.forEach(function(btn) {
            btn.classList.add('hidden');
        });
        
        if (gender === 'male') {
            const maleBtns = document.querySelectorAll('.male-group');
            maleBtns.forEach(function(btn) {
                btn.classList.remove('hidden');
            });
        } else if (gender === 'female') {
            const femaleBtns = document.querySelectorAll('.female-group');
            femaleBtns.forEach(function(btn) {
                btn.classList.remove('hidden');
            });
        }
        
        hideLoading();
    }, 2000);
}

// Render Zone Cards
function renderZoneCards() {
    const container = document.getElementById('cardsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    zoneCards.forEach(function(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'zone-card';
        cardDiv.id = 'card-' + card.id;
        
        let areaTags = '';
        card.areas.forEach(function(area) {
            areaTags += '<span class="area-tag">' + area + '</span>';
        });
        
        cardDiv.innerHTML = 
            '<h3 class="zone-title" data-cardid="' + card.id + '" data-field="zone">' + card.zone + '</h3>' +
            '<div class="area-tags" data-cardid="' + card.id + '" data-field="areas">' + areaTags + '</div>' +
            '<button class="group-btn male-group hidden" onclick="joinGroup(\'' + card.maleGroup + '\')">💬 Join our whatsapp group (Male)</button>' +
            '<button class="group-btn female-group hidden" onclick="joinGroup(\'' + card.femaleGroup + '\')">💬 Join our whatsapp group (Female)</button>';
        
        container.appendChild(cardDiv);
    });
}

// Join Group
function joinGroup(link) {
    showLoading();
    setTimeout(function() {
        window.open(link, '_blank');
        hideLoading();
    }, 2000);
}

// Submit Review
function submitReview() {
    const reviewText = document.getElementById('reviewText');
    const text = reviewText ? reviewText.value : '';
    
    if (!text.trim()) {
        alert('Please write a review');
        return;
    }
    
    showLoading();
    
    db.collection('reviews').add({
        text: text,
        userId: currentUser ? currentUser.uid : 'guest',
        userName: currentUser ? currentUser.displayName : 'Guest',
        userType: currentUserType,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
        if (reviewText) {
            reviewText.value = '';
        }
        loadReviews();
        hideLoading();
    }).catch(function(error) {
        alert('Error: ' + error.message);
        hideLoading();
    });
}

// Load Reviews
function loadReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;
    
    db.collection('reviews').orderBy('createdAt', 'desc').limit(20)
        .onSnapshot(function(snapshot) {
            container.innerHTML = '';
            
            snapshot.forEach(function(doc) {
                const review = doc.data();
                const reviewDiv = document.createElement('div');
                reviewDiv.className = 'review-card';
                reviewDiv.innerHTML = 
                    '<div class="reviewer">' + (review.userName || 'Anonymous') + ' (' + (review.userType || 'guest') + ')</div>' +
                    '<div class="review-text">' + (review.text || '') + '</div>';
                container.appendChild(reviewDiv);
            });
        });
}

// Control Panel
function openControlPanel() {
    if (!isAdmin) return;
    const controlPanel = document.getElementById('controlPanel');
    if (controlPanel) {
        controlPanel.classList.add('active');
    }
    loadControlSettings();
}

function closeControlPanel() {
    const controlPanel = document.getElementById('controlPanel');
    if (controlPanel) {
        controlPanel.classList.remove('active');
    }
}

// Load Control Settings
function loadControlSettings() {
    const bannerColor = document.getElementById('bannerColor');
    const watermarkOpacity = document.getElementById('watermarkOpacity');
    const logoSize = document.getElementById('logoSize');
    const ceoSize = document.getElementById('ceoSize');
    const fbLink = document.getElementById('fbLink');
    
    if (bannerColor) bannerColor.value = appSettings.bannerColor;
    if (watermarkOpacity) watermarkOpacity.value = appSettings.watermarkOpacity;
    if (logoSize) logoSize.value = appSettings.logoSize;
    if (ceoSize) ceoSize.value = appSettings.ceoSize;
    if (fbLink) fbLink.value = appSettings.fbLink;
}

// Update Banner Color
function updateBannerColor() {
    const bannerColor = document.getElementById('bannerColor');
    const bannerSection = document.getElementById('bannerSection');
    
    if (bannerColor && bannerSection) {
        const color = bannerColor.value;
        bannerSection.style.background = color;
        appSettings.bannerColor = color;
    }
}

// Upload Watermark
function uploadWatermark() {
    const watermarkUpload = document.getElementById('watermarkUpload');
    const file = watermarkUpload ? watermarkUpload.files[0] : null;
    
    if (!file) return;
    
    showLoading();
    
    const storageRef = storage.ref('watermarks/' + Date.now() + '.jpg');
    storageRef.put(file).then(function(snapshot) {
        snapshot.ref.getDownloadURL().then(function(url) {
            const watermarkImage = document.getElementById('watermarkImage');
            if (watermarkImage) {
                watermarkImage.src = url;
                watermarkImage.style.display = 'block';
            }
            appSettings.watermarkUrl = url;
            hideLoading();
        });
    }).catch(function(error) {
        alert('Error: ' + error.message);
        hideLoading();
    });
}

// Update Watermark Opacity
function updateWatermarkOpacity() {
    const watermarkOpacity = document.getElementById('watermarkOpacity');
    const watermarkImage = document.getElementById('watermarkImage');
    
    if (watermarkOpacity && watermarkImage) {
        const opacity = watermarkOpacity.value;
        watermarkImage.style.opacity = opacity / 100;
        appSettings.watermarkOpacity = opacity;
    }
}

// Upload Logo
function uploadLogo() {
    const logoUpload = document.getElementById('logoUpload');
    const file = logoUpload ? logoUpload.files[0] : null;
    
    if (!file) return;
    
    showLoading();
    
    const storageRef = storage.ref('logos/' + Date.now() + '.jpg');
    storageRef.put(file).then(function(snapshot) {
        snapshot.ref.getDownloadURL().then(function(url) {
            const logoImage = document.getElementById('logoImage');
            if (logoImage) {
                logoImage.src = url;
                logoImage.style.display = 'block';
            }
            appSettings.logoUrl = url;
            hideLoading();
        });
    }).catch(function(error) {
        alert('Error: ' + error.message);
        hideLoading();
    });
}

// Update Logo Size
function updateLogoSize() {
    const logoSize = document.getElementById('logoSize');
    const logoImage = document.getElementById('logoImage');
    
    if (logoSize && logoImage) {
        const size = logoSize.value;
        logoImage.style.maxWidth = size + 'px';
        appSettings.logoSize = size;
    }
}

// Upload CEO Image
function uploadCeoImage() {
    const ceoUpload = document.getElementById('ceoUpload');
    const file = ceoUpload ? ceoUpload.files[0] : null;
    
    if (!file) return;
    
    showLoading();
    
    const storageRef = storage.ref('ceo/' + Date.now() + '.jpg');
    storageRef.put(file).then(function(snapshot) {
        snapshot.ref.getDownloadURL().then(function(url) {
            const ceoImage = document.getElementById('ceoImage');
            if (ceoImage) {
                ceoImage.src = url;
                ceoImage.style.display = 'block';
            }
            appSettings.ceoUrl = url;
            hideLoading();
        });
    }).catch(function(error) {
        alert('Error: ' + error.message);
        hideLoading();
    });
}

// Update CEO Size
function updateCeoSize() {
    const ceoSize = document.getElementById('ceoSize');
    const ceoImage = document.getElementById('ceoImage');
    
    if (ceoSize && ceoImage) {
        const size = ceoSize.value;
        ceoImage.style.maxWidth = size + 'px';
        appSettings.ceoSize = size;
    }
}

// Load Text Settings
function loadTextSettings() {
    const textSection = document.getElementById('textSection');
    const section = textSection ? textSection.value : 'brandingText';
    const settings = appSettings.texts[section];
    
    const textContent = document.getElementById('textContent');
    const fontFamily = document.getElementById('fontFamily');
    const fontSize = document.getElementById('fontSize');
    const fontColor = document.getElementById('fontColor');
    
    if (textContent && settings) textContent.value = settings.content;
    if (fontFamily && settings) fontFamily.value = settings.font;
    if (fontSize && settings) fontSize.value = settings.size;
    if (fontColor && settings) fontColor.value = settings.color;
}

// Update Text Content
function updateTextContent() {
    const textSection = document.getElementById('textSection');
    const textContent = document.getElementById('textContent');
    
    if (textSection && textContent) {
        const section = textSection.value;
        const content = textContent.value;
        const element = document.getElementById(section);
        
        if (element) {
            element.textContent = content;
        }
        appSettings.texts[section].content = content;
    }
}

// Update Text Font
function updateTextFont() {
    const textSection = document.getElementById('textSection');
    const fontFamily = document.getElementById('fontFamily');
    
    if (textSection && fontFamily) {
        const section = textSection.value;
        const font = fontFamily.value;
        const element = document.getElementById(section);
        
        if (element) {
            element.style.fontFamily = font;
        }
        appSettings.texts[section].font = font;
    }
}

// Update Text Size
function updateTextSize() {
    const textSection = document.getElementById('textSection');
    const fontSize = document.getElementById('fontSize');
    
    if (textSection && fontSize) {
        const section = textSection.value;
        const size = fontSize.value;
        const element = document.getElementById(section);
        
        if (element) {
            element.style.fontSize = size + 'px';
        }
        appSettings.texts[section].size = size;
    }
}

// Update Text Color
function updateTextColor() {
    const textSection = document.getElementById('textSection');
    const fontColor = document.getElementById('fontColor');
    
    if (textSection && fontColor) {
        const section = textSection.value;
        const color = fontColor.value;
        const element = document.getElementById(section);
        
        if (element) {
            element.style.color = color;
        }
        appSettings.texts[section].color = color;
    }
}

// Update FB Link
function updateFbLink() {
    const fbLink = document.getElementById('fbLink');
    const fbButton = document.getElementById('fbButton');
    
    if (fbLink && fbButton) {
        const link = fbLink.value;
        fbButton.href = link;
        appSettings.fbLink = link;
    }
}

// Add New Card
function addNewCard() {
    const newId = zoneCards.length + 1;
    zoneCards.push({
        id: newId,
        zone: "New Zone",
        areas: ["Area 1", "Area 2"],
        maleGroup: "https://chat.whatsapp.com/newmalelink",
        femaleGroup: "https://chat.whatsapp.com/newfemalelink"
    });
    renderZoneCards();
    saveSettings();
}

// Save All Settings
function saveAllSettings() {
    showLoading();
    
    db.collection('settings').doc('main').set({
        bannerColor: appSettings.bannerColor,
        watermarkOpacity: appSettings.watermarkOpacity,
        logoSize: appSettings.logoSize,
        ceoSize: appSettings.ceoSize,
        fbLink: appSettings.fbLink,
        watermarkUrl: appSettings.watermarkUrl,
        logoUrl: appSettings.logoUrl,
        ceoUrl: appSettings.ceoUrl,
        texts: appSettings.texts,
        zoneCards: zoneCards,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
        alert('Settings saved successfully!');
        closeControlPanel();
        hideLoading();
    }).catch(function(error) {
        alert('Error: ' + error.message);
        hideLoading();
    });
}

// Load Settings
function loadSettings() {
    db.collection('settings').doc('main').get().then(function(doc) {
        if (doc.exists) {
            const data = doc.data();
            
            if (data.bannerColor) {
                const bannerSection = document.getElementById('bannerSection');
                if (bannerSection) {
                    bannerSection.style.background = data.bannerColor;
                }
                appSettings.bannerColor = data.bannerColor;
            }
            
            if (data.watermarkUrl) {
                const watermarkImage = document.getElementById('watermarkImage');
                if (watermarkImage) {
                    watermarkImage.src = data.watermarkUrl;
                    watermarkImage.style.display = 'block';
                }
                appSettings.watermarkUrl = data.watermarkUrl;
            }
            
            if (data.watermarkOpacity) {
                const watermarkImage = document.getElementById('watermarkImage');
                if (watermarkImage) {
                    watermarkImage.style.opacity = data.watermarkOpacity / 100;
                }
                appSettings.watermarkOpacity = data.watermarkOpacity;
            }
            
            if (data.logoUrl) {
                const logoImage = document.getElementById('logoImage');
                if (logoImage) {
                    logoImage.src = data.logoUrl;
                    logoImage.style.display = 'block';
                }
                appSettings.logoUrl = data.logoUrl;
            }
            
            if (data.logoSize) {
                const logoImage = document.getElementById('logoImage');
                if (logoImage) {
                    logoImage.style.maxWidth = data.logoSize + 'px';
                }
                appSettings.logoSize = data.logoSize;
            }
            
            if (data.ceoUrl) {
                const ceoImage = document.getElementById('ceoImage');
                if (ceoImage) {
                    ceoImage.src = data.ceoUrl;
                    ceoImage.style.display = 'block';
                }
                appSettings.ceoUrl = data.ceoUrl;
            }
            
            if (data.ceoSize) {
                const ceoImage = document.getElementById('ceoImage');
                if (ceoImage) {
                    ceoImage.style.maxWidth = data.ceoSize + 'px';
                }
                appSettings.ceoSize = data.ceoSize;
            }
            
            if (data.fbLink) {
                const fbButton = document.getElementById('fbButton');
                if (fbButton) {
                    fbButton.href = data.fbLink;
                }
                appSettings.fbLink = data.fbLink;
            }
            
            if (data.texts) {
                appSettings.texts = data.texts;
                Object.keys(data.texts).forEach(function(key) {
                    const el = document.getElementById(key);
                    if (el) {
                        el.textContent = data.texts[key].content;
                        el.style.fontFamily = data.texts[key].font;
                        el.style.fontSize = data.texts[key].size + 'px';
                        el.style.color = data.texts[key].color;
                    }
                });
            }
            
            if (data.zoneCards) {
                zoneCards = data.zoneCards;
                renderZoneCards();
            }
        }
    }).catch(function(error) {
        console.log('Error loading settings:', error);
    });
}

// Save Settings
function saveSettings() {
    db.collection('settings').doc('main').set({
        zoneCards: zoneCards,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

// Logout
function logout() {
    showLoading();
    
    auth.signOut().then(function() {
        currentUser = null;
        currentUserType = null;
        isAdmin = false;
        showPage('loginPage');
        hideLoading();
    }).catch(function(error) {
        alert('Error: ' + error.message);
        hideLoading();
    });
}

// Go Back
function goBack() {
    showPage('homePage');
}

// Auth State Observer
auth.onAuthStateChanged(function(user) {
    if (user) {
        console.log('User signed in:', user.email);
    } else {
        console.log('User signed out');
    }
});
