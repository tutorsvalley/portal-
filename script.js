const firebaseConfig = {
    apiKey: "AIzaSyAefwWwlc0kqDRPXmDNYrxPuKOUf3t8Va8",
    authDomain: "tutors-valley-6ddb0.firebaseapp.com",
    projectId: "tutors-valley-6ddb0",
    storageBucket: "tutors-valley-6ddb0.firebasestorage.app",
    messagingSenderId: "377815974425",
    appId: "1:377815974425:web:3d1254d14640f43516a088"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let siteData = {};
let currentRole = 'guest';

// --- Role Selection ---
function setRole(role) {
    currentRole = role;
    document.querySelectorAll('.role-selector button').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + role).classList.add('active');
    
    document.getElementById('tutor-controls').style.display = (role === 'tutor') ? 'block' : 'none';
    renderCards();
}

// --- Admin Auth (Simple Password) ---
function adminAuth() {
    const pass = prompt("Enter Admin Password:");
    if (pass === "admin123") { // আপনি এখানে পাসওয়ার্ড পরিবর্তন করতে পারেন
        document.getElementById('admin-gear').style.display = 'block';
        alert("Admin Mode Activated!");
    } else {
        alert("Wrong Password!");
    }
}

function toggleSettings() {
    document.getElementById('settings-panel').classList.toggle('active');
    if (document.getElementById('settings-panel').classList.contains('active')) {
        populateSettings();
    }
}

// --- Load Data ---
async function loadSiteData() {
    const doc = await db.collection('settings').doc('homepage').get();
    if (doc.exists) {
        siteData = doc.data();
        applySettings();
    }
}

function applySettings() {
    const d = siteData;
    document.getElementById('header-banner').style.backgroundColor = d.bannerBg || '#000080';
    document.getElementById('main-logo').src = d.logoUrl || '';
    document.getElementById('brand-name').innerText = d.brandName || 'Tutors Valley';
    document.getElementById('motto-text').innerText = d.mottoText || '';
    document.getElementById('fb-link-ui').href = d.fbLink || '#';
    
    const wm = document.getElementById('watermark-layer');
    wm.style.backgroundImage = `url(${d.watermarkUrl})`;
    wm.style.opacity = d.watermarkOp || 0.1;

    document.getElementById('ceo-image').src = d.ceoImg || '';
    document.getElementById('ceo-name-ui').innerText = d.ceoName || '';
    document.getElementById('ceo-bio-ui').innerText = d.ceoBio || '';

    renderCards();
    loadReviews();
}

function renderCards() {
    const container = document.getElementById('cards-grid');
    container.innerHTML = '';
    const gender = document.getElementById('gender-filter').value;
    const cards = siteData.cards || [];

    cards.forEach((card, index) => {
        const div = document.createElement('div');
        div.className = 'card';
        const tags = card.areas.split(',').map(a => `<span class="tag">${a.trim()}</span>`).join('');
        
        let linkBtn = '';
        if (currentRole === 'tutor' && gender) {
            const link = (gender === 'male') ? card.maleLink : card.femaleLink;
            if (link) linkBtn = `<a href="${link}" target="_blank" class="join-btn">Join ${gender} Group</a>`;
        }

        div.innerHTML = `<h3>${card.title}</h3><div>${tags}</div>${linkBtn}`;
        container.appendChild(div);
    });
}

// --- Admin Actions ---
function populateSettings() {
    const d = siteData;
    document.getElementById('cfg-banner-bg').value = d.bannerBg || '#000080';
    document.getElementById('cfg-logo-url').value = d.logoUrl || '';
    document.getElementById('cfg-brand-name').value = d.brandName || '';
    document.getElementById('cfg-motto-text').value = d.mottoText || '';
    document.getElementById('cfg-fb-link').value = d.fbLink || '';
    document.getElementById('cfg-watermark-url').value = d.watermarkUrl || '';
    document.getElementById('cfg-watermark-op').value = d.watermarkOp || 0.1;
    document.getElementById('cfg-ceo-img').value = d.ceoImg || '';
    document.getElementById('cfg-ceo-name').value = d.ceoName || '';
    document.getElementById('cfg-ceo-bio').value = d.ceoBio || '';

    const list = document.getElementById('cfg-cards-list');
    list.innerHTML = '';
    (d.cards || []).forEach((c, i) => {
        const item = document.createElement('div');
        item.style.border = "1px solid #ddd"; item.style.padding = "5px"; item.style.marginBottom = "5px";
        item.innerHTML = `
            <input type="text" placeholder="Title" value="${c.title}" onchange="siteData.cards[${i}].title=this.value">
            <input type="text" placeholder="Areas" value="${c.areas}" onchange="siteData.cards[${i}].areas=this.value">
            <input type="text" placeholder="Male Link" value="${c.maleLink}" onchange="siteData.cards[${i}].maleLink=this.value">
            <input type="text" placeholder="Female Link" value="${c.femaleLink}" onchange="siteData.cards[${i}].femaleLink=this.value">
            <button onclick="siteData.cards.splice(${i},1);populateSettings()">Delete</button>
        `;
        list.appendChild(item);
    });
}

function addNewCardConfig() {
    if(!siteData.cards) siteData.cards = [];
    siteData.cards.push({title: '', areas: '', maleLink: '', femaleLink: ''});
    populateSettings();
}

async function saveAllSettings() {
    siteData.bannerBg = document.getElementById('cfg-banner-bg').value;
    siteData.logoUrl = document.getElementById('cfg-logo-url').value;
    siteData.brandName = document.getElementById('cfg-brand-name').value;
    siteData.mottoText = document.getElementById('cfg-motto-text').value;
    siteData.fbLink = document.getElementById('cfg-fb-link').value;
    siteData.watermarkUrl = document.getElementById('cfg-watermark-url').value;
    siteData.watermarkOp = document.getElementById('cfg-watermark-op').value;
    siteData.ceoImg = document.getElementById('cfg-ceo-img').value;
    siteData.ceoName = document.getElementById('cfg-ceo-name').value;
    siteData.ceoBio = document.getElementById('cfg-ceo-bio').value;

    await db.collection('settings').doc('homepage').set(siteData);
    alert("Saved!");
    location.reload();
}

// --- Reviews ---
async function submitReview() {
    const name = document.getElementById('reviewer-name').value;
    const text = document.getElementById('user-review').value;
    if(!name || !text) return alert("Fill all fields");
    await db.collection('reviews').add({ name, text, date: new Date() });
    alert("Review Posted!");
    location.reload();
}

async function loadReviews() {
    const snap = await db.collection('reviews').orderBy('date', 'desc').get();
    const list = document.getElementById('reviews-list');
    list.innerHTML = '';
    snap.forEach(doc => {
        const r = doc.data();
        list.innerHTML += `<div class="review-item"><strong>${r.name}:</strong> <p>${r.text}</p></div>`;
    });
}

loadSiteData();
setRole('guest');
