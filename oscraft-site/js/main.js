/* ============================================
 OSCRAFT - Main JavaScript
 ============================================ */

// Software database
const softwareDB = [
 // Antivirus & Security
 { name: 'Malwarebytes', desc: 'Advanced anti-malware protection and removal tool', category: 'Antivirus & Security', os: ['windows', 'mac'], version: 'v5.3', rating: 4.5, badge: null, color: 'linear-gradient(135deg, #FFD700, #FF8C00)' },
 { name: 'Bitdefender Total Security', desc: 'Comprehensive antivirus with VPN and parental controls', category: 'Antivirus & Security', os: ['windows', 'mac'], version: 'v27.0', rating: 4.6, badge: 'hot', color: 'linear-gradient(135deg, #0078D4, #005A9E)' },
 { name: 'Kaspersky Antivirus', desc: 'Real-time protection against viruses and cyber threats', category: 'Antivirus & Security', os: ['windows', 'mac', 'linux'], version: 'v21.0', rating: 4.4, badge: null, color: 'linear-gradient(135deg, #1A1A1A, #0065A4)' },
 { name: 'Norton 360', desc: 'All-in-one security with cloud backup and VPN', category: 'Antivirus & Security', os: ['windows', 'mac'], version: 'v13.0', rating: 4.3, badge: null, color: 'linear-gradient(135deg, #FFD700, #000)' },
 { name: 'ESET NOD32', desc: 'Lightweight antivirus with proactive threat detection', category: 'Antivirus & Security', os: ['windows', 'mac', 'linux'], version: 'v18.0', rating: 4.5, badge: null, color: 'linear-gradient(135deg, #00D084, #005F33)' },

 // Browsers
 { name: 'Mozilla Firefox', desc: 'Open-source browser focused on privacy and customization', category: 'Browsers', os: ['windows', 'mac', 'linux'], version: 'v138.0', rating: 4.4, badge: null, color: 'linear-gradient(135deg, #FF7139, #E66000)' },
 { name: 'Microsoft Edge', desc: 'Chromium-based browser with AI-powered features', category: 'Browsers', os: ['windows', 'mac', 'linux'], version: 'v137.0', rating: 4.4, badge: null, color: 'linear-gradient(135deg, #0078D4, #005A9E)' },
 { name: 'Brave Browser', desc: 'Privacy-focused browser with built-in ad blocker', category: 'Browsers', os: ['windows', 'mac', 'linux'], version: 'v1.70', rating: 4.5, badge: 'trending', color: 'linear-gradient(135deg, #FB542B, #C81D25)' },
 { name: 'Opera', desc: 'Feature-rich browser with built-in VPN and ad blocker', category: 'Browsers', os: ['windows', 'mac', 'linux'], version: 'v114.0', rating: 4.2, badge: null, color: 'linear-gradient(135deg, #FF1B2D, #C41E3A)' },
 { name: 'Vivaldi', desc: 'Customizable browser built for power users', category: 'Browsers', os: ['windows', 'mac', 'linux'], version: 'v7.0', rating: 4.3, badge: null, color: 'linear-gradient(135deg, #EF3939, #C41E3A)' },

 // Media & Players
 { name: 'KMPlayer', desc: 'Versatile media player supporting all file formats', category: 'Media & Players', os: ['windows', 'mac'], version: 'v2024.0', rating: 4.3, badge: null, color: 'linear-gradient(135deg, #119EF5, #0055AA)' },
 { name: 'Winamp', desc: 'Legendary media player with modern skins and plugins', category: 'Media & Players', os: ['windows'], version: 'v5.9', rating: 4.1, badge: null, color: 'linear-gradient(135deg, #332288, #F57722)' },
 { name: 'Spotify', desc: 'Stream millions of songs and podcasts for free', category: 'Media & Players', os: ['windows', 'mac', 'linux'], version: 'v1.2', rating: 4.5, badge: 'hot', color: 'linear-gradient(135deg, #1DB954, #169C46)' },
 { name: 'Audacity', desc: 'Free, open-source audio recording and editing software', category: 'Media & Players', os: ['windows', 'mac', 'linux'], version: 'v3.6', rating: 4.4, badge: null, color: 'linear-gradient(135deg, #0000CC, #00A2E8)' },
 { name: 'HandBrake', desc: 'Open-source video transcoder for all modern formats', category: 'Media & Players', os: ['windows', 'mac', 'linux'], version: 'v1.8', rating: 4.6, badge: null, color: 'linear-gradient(135deg, #1A1A1A, #5D8C5A)' },
 { name: 'GOM Player', desc: 'Free media player with built-in codecs and VR support', category: 'Media & Players', os: ['windows'], version: 'v2.4', rating: 4.0, badge: null, color: 'linear-gradient(135deg, #0088FF, #003A6E)' },

 // Utilities & Tools
 { name: '7-Zip', desc: 'Free file archiver with high compression ratio', category: 'Utilities & Tools', os: ['windows'], version: 'v24.0', rating: 4.7, badge: null, color: 'linear-gradient(135deg, #0078D4, #004E8C)' },
 { name: 'WinRAR', desc: 'Powerful archive manager and compression tool', category: 'Utilities & Tools', os: ['windows'], version: 'v7.0', rating: 4.4, badge: null, color: 'linear-gradient(135deg, #C84C18, #8B2500)' },
 { name: 'CCleaner', desc: 'System optimization, privacy protection and junk removal', category: 'Utilities & Tools', os: ['windows', 'mac'], version: 'v6.0', rating: 4.1, badge: null, color: 'linear-gradient(135deg, #0078D4, #003A6E)' },
 { name: 'Notepad++', desc: 'Free source code editor with syntax highlighting', category: 'Utilities & Tools', os: ['windows'], version: 'v8.7', rating: 4.6, badge: null, color: 'linear-gradient(135deg, #90EE90, #006400)' },
 { name: 'Everything', desc: 'Lightning-fast file search for Windows', category: 'Utilities & Tools', os: ['windows'], version: 'v1.4', rating: 4.8, badge: 'trending', color: 'linear-gradient(135deg, #2D8CFF, #0047AB)' },
 { name: 'PowerToys', desc: 'Microsoft power tools to supercharge Windows', category: 'Utilities & Tools', os: ['windows'], version: 'v0.87', rating: 4.5, badge: null, color: 'linear-gradient(135deg, #0078D4, #5C2D91)' },
 { name: 'PeaZip', desc: 'Free cross-platform file archiver and manager', category: 'Utilities & Tools', os: ['windows', 'linux'], version: 'v9.6', rating: 4.2, badge: null, color: 'linear-gradient(135deg, #0088FF, #004466)' },

 // Creative & Design
 { name: 'GIMP', desc: 'Free and open-source image manipulation program', category: 'Creative & Design', os: ['windows', 'mac', 'linux'], version: 'v2.10', rating: 4.4, badge: null, color: 'linear-gradient(135deg, #7B3F9F, #4A1D6E)' },
 { name: 'Inkscape', desc: 'Professional vector graphics editor', category: 'Creative & Design', os: ['windows', 'mac', 'linux'], version: 'v1.4', rating: 4.3, badge: null, color: 'linear-gradient(135deg, #000000, #4A4A4A)' },
 { name: 'Blender', desc: 'Free 3D creation suite for modeling, animation, and rendering', category: 'Creative & Design', os: ['windows', 'mac', 'linux'], version: 'v4.3', rating: 4.8, badge: 'hot', color: 'linear-gradient(135deg, #EA7600, #C45C10)' },
 { name: 'DaVinci Resolve', desc: 'Professional video editing, color correction, and audio post-production', category: 'Creative & Design', os: ['windows', 'mac', 'linux'], version: 'v19.0', rating: 4.7, badge: null, color: 'linear-gradient(135deg, #1A1A1A, #E63946)' },
 { name: 'Canva', desc: 'Graphic design tool for social media, presentations, and more', category: 'Creative & Design', os: ['windows', 'mac'], version: 'v1.0', rating: 4.3, badge: null, color: 'linear-gradient(135deg, #00C4CC, #7B2FF7)' },
 { name: 'Krita', desc: 'Professional free and open-source painting program', category: 'Creative & Design', os: ['windows', 'mac', 'linux'], version: 'v5.2', rating: 4.6, badge: null, color: 'linear-gradient(135deg, #2196F3, #1565C0)' },
 { name: 'Scribus', desc: 'Open-source desktop publishing software', category: 'Creative & Design', os: ['windows', 'mac', 'linux'], version: 'v1.6', rating: 4.0, badge: null, color: 'linear-gradient(135deg, #1A1A1A, #4A6FA5)' },
 { name: 'Darktable', desc: 'Open-source photography workflow and RAW developer', category: 'Creative & Design', os: ['windows', 'mac', 'linux'], version: 'v4.6', rating: 4.2, badge: null, color: 'linear-gradient(135deg, #333, #888)' },

 // Development
 { name: 'Visual Studio Code', desc: 'Lightweight but powerful source code editor', category: 'Development', os: ['windows', 'mac', 'linux'], version: 'v1.95', rating: 4.8, badge: 'hot', color: 'linear-gradient(135deg, #1B1464, #0D2137)' },
 { name: 'Sublime Text', desc: 'Sophisticated text editor for code and prose', category: 'Development', os: ['windows', 'mac', 'linux'], version: 'v4.0', rating: 4.5, badge: null, color: 'linear-gradient(135deg, #FF9800, #E65100)' },
 { name: 'Atom', desc: 'Hackable text editor for the 21st century', category: 'Development', os: ['windows', 'mac', 'linux'], version: 'v1.60', rating: 4.1, badge: null, color: 'linear-gradient(135deg, #3DDC84, #2B6B2E)' },
 { name: 'Postman', desc: 'Complete API development and testing platform', category: 'Development', os: ['windows', 'mac', 'linux'], version: 'v11.0', rating: 4.6, badge: null, color: 'linear-gradient(135deg, #FF6C37, #FF4500)' },
 { name: 'Docker Desktop', desc: 'Containerization platform for building and sharing apps', category: 'Development', os: ['windows', 'mac'], version: 'v4.35', rating: 4.4, badge: null, color: 'linear-gradient(135deg, #2496ED, #0DB7ED)' },
 { name: 'Git', desc: 'Distributed version control system for tracking changes', category: 'Development', os: ['windows', 'mac', 'linux'], version: 'v2.45', rating: 4.7, badge: null, color: 'linear-gradient(135deg, #F05032, #C1380C)' },
 { name: 'FileZilla', desc: 'Free FTP/SFTP client for transferring files', category: 'Development', os: ['windows', 'mac', 'linux'], version: 'v3.67', rating: 4.4, badge: null, color: 'linear-gradient(135deg, #FF0000, #B30000)' },
 { name: 'XAMPP', desc: 'Easy-to-install Apache distribution with MySQL and PHP', category: 'Development', os: ['windows', 'mac', 'linux'], version: 'v8.2', rating: 4.3, badge: null, color: 'linear-gradient(135deg, #FB7A30, #C75727)' },
 { name: 'Visual Studio 2022', desc: 'Full-featured IDE for .NET and C++ development', category: 'Development', os: ['windows'], version: 'v17.0', rating: 4.5, badge: null, color: 'linear-gradient(135deg, #68217A, #004880)' },

 // Productivity
 { name: 'Notion', desc: 'All-in-one workspace for notes, docs, and project management', category: 'Productivity', os: ['windows', 'mac'], version: 'v3.0', rating: 4.6, badge: 'hot', color: 'linear-gradient(135deg, #000000, #2D2D2D)' },
 { name: 'Obsidian', desc: 'Powerful knowledge base that works on local Markdown files', category: 'Productivity', os: ['windows', 'mac', 'linux'], version: 'v1.7', rating: 4.7, badge: null, color: 'linear-gradient(135deg, #7C3AED, #4C1D95)' },
 { name: 'Slack', desc: 'Team communication platform with channels and direct messaging', category: 'Productivity', os: ['windows', 'mac', 'linux'], version: 'v4.40', rating: 4.3, badge: null, color: 'linear-gradient(135deg, #4A154B, #611F69)' },
 { name: 'Trello', desc: 'Visual project management with boards, lists, and cards', category: 'Productivity', os: ['windows', 'mac'], version: 'v2.0', rating: 4.2, badge: null, color: 'linear-gradient(135deg, #0079BF, #00538C)' },
 { name: 'Evernote', desc: 'Note-taking app with web clipping and document scanning', category: 'Productivity', os: ['windows', 'mac'], version: 'v10.0', rating: 4.1, badge: null, color: 'linear-gradient(135deg, #00A82D, #00D058)' },
 { name: 'Teams', desc: 'Hub for teamwork with chat, calls, and file sharing', category: 'Productivity', os: ['windows', 'mac', 'linux'], version: 'v1.7', rating: 4.0, badge: null, color: 'linear-gradient(135deg, #5059C9, #6264A7)' },
 { name: 'Zoom', desc: 'Secure video conferencing and webinar platform', category: 'Productivity', os: ['windows', 'mac', 'linux'], version: 'v6.0', rating: 4.3, badge: null, color: 'linear-gradient(135deg, #2D8CFF, '#0A5EB5')' },
 { name: 'AnyDesk', desc: 'Fast remote desktop software for remote access and support', category: 'Productivity', os: ['windows', 'mac', 'linux'], version: 'v8.0', rating: 4.4, badge: null, color: 'linear-gradient(135deg, #EF4423, #C0392B)' },

 // VPN & Network
 { name: 'NordVPN', desc: 'Premium VPN with 6000+ servers in 111 countries', category: 'VPN & Network', os: ['windows', 'mac', 'linux'], version: 'v8.0', rating: 4.6, badge: 'hot', color: 'linear-gradient(135deg, #1888FF, #005A9E)' },
 { name: 'ExpressVPN', desc: 'Ultra-fast VPN with split tunneling and kill switch', category: 'VPN & Network', os: ['windows', 'mac', 'linux'], version: 'v12.0', rating: 4.5, badge: null, color: 'linear-gradient(135deg, #DA3940, #B02A30)' },
 { name: 'ProtonVPN', desc: 'Swiss-based VPN with strong privacy and no-logs policy', category: 'VPN & Network', os: ['windows', 'mac', 'linux'], version: 'v4.0', rating: 4.3, badge: null, color: 'linear-gradient(135deg, #6D4AFF, #4C2DC7)' },
 { name: 'Wireshark', desc: 'Worlds leading network protocol analyzer', category: 'VPN & Network', os: ['windows', 'mac', 'linux'], version: 'v4.2', rating: 4.5, badge: null, color: 'linear-gradient(135deg, #1679A7, #0D5A7A)' },
 { name: 'OpenVPN', desc: 'Open-source VPN solution for secure remote access', category: 'VPN & Network', os: ['windows', 'mac', 'linux'], version: 'v2.6', rating: 4.2, badge: null, color: 'linear-gradient(135deg, #EA7C1E, '#B8580E')' },
 { name: 'Tor Browser', desc: 'Anonymous browsing with multi-layered encryption', category: 'VPN & Network', os: ['windows', 'mac', 'linux'], version: 'v13.0', rating: 4.4, badge: null, color: 'linear-gradient(135deg, #7D4698, '#4A2860')' },

 // Communication
 { name: 'Telegram Desktop', desc: 'Fast, secure messaging with cloud sync', category: 'Communication', os: ['windows', 'mac', 'linux'], version: 'v5.0', rating: 4.5, badge: 'trending', color: 'linear-gradient(135deg, #0088CC, #005F99)' },
 { name: 'WhatsApp Desktop', desc: 'Simple, secure messaging app for desktop', category: 'Communication', os: ['windows', 'mac'], version: 'v2.0', rating: 4.2, badge: null, color: 'linear-gradient(135deg, #25D366, #128C7E)' },
 { name: 'Signal Desktop', desc: 'Privacy-focused encrypted messaging application', category: 'Communication', os: ['windows', 'mac', 'linux'], version: 'v7.0', rating: 4.6, badge: null, color: 'linear-gradient(135deg, #3A76F0, '#1D5BD5')' },
 { name: 'Skype', desc: 'Video calls, messaging, and international calling', category: 'Communication', os: ['windows', 'mac', 'linux'], version: 'v8.0', rating: 4.0, badge: null, color: 'linear-gradient(135deg, #00AFF0, '#0078D4')' },
 { name: 'Zoom Workplace', desc: 'Enterprise-grade video conferencing platform', category: 'Communication', os: ['windows', 'mac', 'linux'], version: 'v6.0', rating: 4.3, badge: null, color: 'linear-gradient(135deg, #2D8CFF, '#0A5EB5')' },
];

// State
let currentFilter = 'all';
let visibleCount = 12;

// DOM Elements
const navbar = document.getElementById('navbar');
const searchToggle = document.getElementById('searchToggle');
const searchOverlay = document.getElementById('searchOverlay');
const searchInput = document.getElementById('searchInput');
const heroSearch = document.getElementById('heroSearch');
const softwareGrid = document.getElementById('softwareGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const osBtns = document.querySelectorAll('.os-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
 renderSoftware();
 setupEventListeners();
 setupIntersectionObserver();
});

// Event Listeners
function setupEventListeners() {
 // Navbar scroll effect
 window.addEventListener('scroll', () => {
 navbar.classList.toggle('scrolled', window.scrollY > 50);
 });

 // Search overlay toggle
 searchToggle.addEventListener('click', () => {
 searchOverlay.classList.add('active');
 setTimeout(() => searchInput.focus(), 100);
 });

 // Close search
 searchOverlay.addEventListener('click', (e) => {
 if (e === searchOverlay) {
 searchOverlay.classList.remove('active');
 }
 });

 document.addEventListener('keydown', (e) => {
 if (e.key === 'Escape') {
 searchOverlay.classList.remove('active');
 }
 });

 // Hero search
 if (heroSearch) {
 heroSearch.addEventListener('focus', () => {
 searchOverlay.classList.add('active');
 setTimeout(() => searchInput.focus(), 100);
 });
 }

 // Search input
 searchInput.addEventListener('input', (e) => {
 const query = e.target.value.toLowerCase();
 filterSoftware(query, currentFilter);
 });

 // OS filter buttons
 osBtns.forEach(btn => {
 btn.addEventListener('click', () => {
 osBtns.forEach(b => b.classList.remove('active'));
 btn.classList.add('active');
 currentFilter = btn.dataset.os;
 visibleCount = 12;
 renderSoftware();
 });
 });

 // Load more
 loadMoreBtn.addEventListener('click', () => {
 visibleCount += 12;
 renderSoftware();
 });

 // Search tag clicks
 document.querySelectorAll('.search-tag').forEach(tag => {
 tag.addEventListener('click', () => {
 searchInput.value = tag.textContent;
 searchOverlay.classList.remove('active');
 filterSoftware(tag.textContent.toLowerCase(), currentFilter);
 });
 });
}

// Render software cards
function renderSoftware() {
 let filtered = softwareDB;

 if (currentFilter !== 'all') {
 filtered = filtered.filter(app => app.os.includes(currentFilter));
 }

 const softwareToShow = filtered.slice(0, visibleCount);

 if (softwareToShow.length === 0) {
 softwareGrid.innerHTML = `
 <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
 <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5-2 4-2 4 2 4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
 <h3 style="margin-top: 16px; font-size: 1.1rem; color: var(--text-secondary);">No software found</h3>
 <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 8px;">Try adjusting your filters or search term</p>
 </div>
 `;
 } else {
 softwareGrid.innerHTML = softwareToShow.map(app => createSoftwareCard(app)).join('');
 }

 // Update load more button visibility
 loadMoreBtn.style.display = visibleCount >= filtered.length ? 'none' : 'inline-block';
}

// Create software card HTML
function createSoftwareCard(app) {
 const osIcons = {
 windows: `<svg viewBox="0 0 24 24" fill="currentColor" style="width:12px;height:12px"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>`,
 mac: `<svg viewBox="0 0 24 24" fill="currentColor" style="width:12px;height:12px"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.21-1.96 1.07-3.11-1.05.05-2.31.71-3.06 1.55-.67.76-1.19 1.99-1.04 3.14 1.18.09 2.36-.77 3.03-1.58"/></svg>`,
 linux: `<svg viewBox="0 0 24 24" fill="currentColor" style="width:12px;height:12px"><path d="M12.505.178c-2.623 0-4.575 2.088-5.255 5.15-.39-.063-.755.13-.96.555-.36.738-.746 1.79-1.048 3.068-.72.386-1.093.74-1.093 1.015 0 .275.373.63 1.093 1.015.303 1.278.689 2.33 1.048 3.068.205.424.57.618.96.555.682 3.062 2.633 5.15 5.256 5.15 2.876 0 4.95-2.362 5.345-5.574.05-.398.04-.759-.06-1.06.237-.163.426-.366.553-.6.635-1.168 1.146-2.523 1.52-4.033.32-.27.754-.37 1.167-.247.588.176 1.043.587 1.254 1.143.127.333.32.652.588.907.14.132.233.3.27.483.073.358.365.612.732.612.065 0 .13-.01.196-.034a.74.74 0 0 0 .37-.949C20.958 2.177 16.792.178 12.505.178z"/></svg>`
 };

 const osLabels = app.os.map(o => osIcons[a]).filter(Boolean).join('');
 const badgeHtml = app.badge ? `<div class="card-badge ${app.badge}">${app.badge.toUpperCase()}</div>` : '';
 const ratingStars = Array(5).fill(0).map((_, i) =>
 i < Math.round(app.rating / 2)
 ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
 : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
 ).join('');

 return `
 <div class="software-card" data-os="${app.os.join(' ')}">
 ${badgeHtml}
 <div class="card-logo" style="background: ${app.color};">
 <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="rgba(255,255,255,0.9)"/>
 </svg>
 </div>
 <div class="card-body">
 <h3 class="card-title">${app.name}</h3>
 <p class="card-desc">${app.desc}</p>
 <div class="card-meta">
 <span class="card-category">${app.category}</span>
 <div class="card-ratings">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
 <span>${app.rating}</span>
 </div>
 </div>
 </div>
 <div class="card-actions">
 <span class="card-version">${app.version}</span>
 <button class="download-btn" onclick="handleDownload('${app.name}')">
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
 Download
 </button>
 </div>
 </div>
 `;
}

// Filter software
function filterSoftware(query, osFilter) {
 let filtered = softwareDB;

 if (osFilter !== 'all') {
 filtered = filtered.filter(app => app.os.includes(osFilter));
 }

 if (query) {
 filtered = filtered.filter(app =>
 app.name.toLowerCase().includes(query) ||
 app.category.toLowerCase().includes(query) ||
 app.desc.toLowerCase().includes(query)
 );
 }

 const results = filtered.slice(0, visibleCount);
 softwareGrid.innerHTML = results.map(app => createSoftwareCard(app)).join('');
 loadMoreBtn.style.display = visibleCount >= filtered.length ? 'none' : 'inline-block';
}

// Handle download click
function handleDownload(appName) {
 alert(`Downloading ${appName}...\n\nThis would redirect to the official download source.`);
}

// Intersection Observer for scroll animations
function setupIntersectionObserver() {
 const observerOptions = {
 threshold: 0.1,
 rootMargin: '0px 0px -50px 0px'
 };

 const observer = new IntersectionObserver((entries) => {
 entries.forEach(entry => {
 if (entry.isIntersecting) {
 entry.target.style.opacity = '1';
 entry.target.style.transform = 'translateY(0)';
 }
 });
 }, observerOptions);

 document.querySelectorAll('.software-card, .category-card, .why-card').forEach(el => {
 observer.observe(el);
 });
}

// Smooth scroll for navigation links
document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
 link.addEventListener('click', (e) => {
 e.preventDefault();
 const target = document.querySelector(link.getAttribute('href'));
 if (target) {
 target.scrollIntoView({ behavior: 'smooth', block: 'start' });
 }
 });
});

// Category card click
document.querySelectorAll('.category-card').forEach(card => {
 card.addEventListener('click', (e) => {
 e.preventDefault();
 const category = card.dataset.category;
 searchInput.value = category;
 searchOverlay.classList.add('active');
 filterSoftware(category, currentFilter);

 // Scroll to software section
 document.getElementById('latest')?.scrollIntoView({ behavior: 'smooth' });
 });
});
