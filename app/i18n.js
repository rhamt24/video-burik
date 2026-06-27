// Dictionary terjemahan untuk Burikin Aja
// Tambah bahasa baru cukup dengan menambah key baru di objek `translations`,
// lalu daftarkan kodenya di array `LANGUAGES`.

export const LANGUAGES = [
  { code: "id", label: "ID", name: "Bahasa Indonesia" },
  { code: "en", label: "EN", name: "English" },
];

export const DEFAULT_LANG = "id";

export const translations = {
  id: {
    // Header
    totalVisitor: "Total Pengunjung",
    joinWaChannel: "JOIN SALURAN WA",

    // Hero
    eyebrow: "// NO SIGNAL — PROSES LOKAL DI PERANGKATMU",
    tagline: "Bikin video burik kaya direpost berkali-kali, atau bikin videonya gepeng absurd buat meme dengan mudah.",

    // Media card - video
    videoSelected: "✓ VIDEO DIPILIH",
    pickVideo: "PILIH VIDEO",
    pickVideoHint: "mp4, webm, dll",

    // Media card - image
    imageSelected: "✓ GAMBAR DIPILIH",
    burikinImage: "BURIKIN GAMBAR",
    burikinImageHint: "jpg, png, webp, dll",

    // Preview
    processing: "MEMPROSES",
    processingWarning: "⚠️ PENTING: Jangan pindah tab browser atau mematikan layar HP selama proses ini berjalan.",
    rec: "● REC",
    livePreview: "● LIVE PREVIEW",

    // Presets
    presetRingan: "RINGAN",
    presetSedang: "SEDANG",
    presetParah: "PARAH",
    presetMajapahit: "MAJAPAHIT",
    presetCustom: "KUSTOM",

    // Settings - Visual & Audio
    sectionVisualAudio: "🛠️ VISUAL & AUDIO",
    outputResolution: "Resolusi Output",
    res144: "140p / 144p (Sangat Buram)",
    res240: "240p (Buram)",
    res360: "360p (Standar)",
    res480: "480p (Lumayan)",
    resOriginal: "Sesuai Ukuran Asli",

    frameRate: "Frame Rate (FPS)",
    fps8: "8 FPS (Sangat Patah-patah)",
    fps12: "12 FPS (Patah-patah)",
    fps15: "15 FPS (Kurang Lancar)",
    fps24: "24 FPS (Normal Film)",
    fps30: "30 FPS (Lancar)",

    videoCompression: "Kompresi Video (Bitrate)",
    vq1: "Parah (Artefak Kompresi)",
    vq2: "Sedang (Sedikit Artefak)",
    vq3: "Bagus (Normal)",
    vq4: "Sangat Bagus (Jernih)",

    audioQualityLabel: "Kualitas Suara (Audio)",
    aq1: "Hancur (Pecah & Kresek)",
    aq2: "Mendem (Kaya HP Jadul)",
    aq3: "Biasa (Sedikit Teredam)",
    aq4: "Normal (Jernih Asli)",

    // Audio effects
    sectionAudioEffects: "🎙️ EFEK AUDIO SPESIAL",
    effNoneLabel: "NORMAL", effNoneDesc: "Asli",
    effTupaiLabel: "TUPAI", effTupaiDesc: "Suara chipmunk",
    effSetanLabel: "SETAN", effSetanDesc: "Bass gelap",
    effBassLabel: "BASS", effBassDesc: "Sub bass pecah",
    effMegaphoneLabel: "MEGAPHONE", effMegaphoneDesc: "Pengeras jalan",
    effCaveLabel: "GUA", effCaveDesc: "Echo & reverb",
    effRobotLabel: "ROBOT", effRobotDesc: "Ring modulator",
    effVhsLabel: "VHS", effVhsDesc: "Kaset lawas",
    effTelephoneLabel: "TELEPON", effTelephoneDesc: "Jaringan 2G",

    // Absurd effects
    sectionAbsurdEffects: "👽 EFEK ABSURD",
    colorFilterLabel: "Filter Warna",
    cf0: "Normal (Asli)",
    cf1: "Majapahit (Hitam Putih)",
    cf2: "Vintage (Sepia Usang)",
    cf3: "Deep Fried (Ngejreng Parah)",

    pixelScaleLabel: "Kotak-Kotak (Pixel)",
    px1: "Mulus (Asli)",
    px2: "Kotak Halus",
    px4: "Kotak Sedang",
    px8: "Kotak Besar (Retro 8-bit)",
    px16: "Kotak Raksasa (Minecraft)",

    stretchLabel: "Rasio Video (Gepengin)",
    stretch05: "Kurus Kering (Tinggi)",
    stretch1: "Normal (Sesuai Asli)",
    stretch15: "Lumayan Lebar",
    stretch2: "Gepeng (Wide)",
    stretch3: "Super Gepeng Parah",

    // Process button
    processBtnProcessing: "MEMPROSES",
    processBtnIdle: "BIKININ & DOWNLOAD",

    // Result
    downloadResult: "⬇ DOWNLOAD HASIL",

    // Burikin Gambar section
    imageSectionTitle: "🖼️ BURIKIN GAMBAR",
    burikLevel: "TINGKAT BURIK",
    burikLevelClear: "JERNIH",
    burikLevelLittle: "DIKIT",
    burikLevelEnough: "LUMAYAN",
    burikLevelSevere: "PARAH",
    burikLevel8bit: "8-BIT",
    burikLevelMinecraft: "MINECRAFT",
    colorFilterTitle: "FILTER WARNA",
    filterNormal: "NORMAL",
    filterBW: "B&W",
    filterSepia: "SEPIA",
    filterFried: "FRIED",
    downloadImage: "⬇ DOWNLOAD",

    // SEO Article
    seoTitle: "Tentang Burikin Aja",
    seoP1: "adalah sebuah web app gratis untuk mengedit dan menurunkan kualitas video secara sengaja. Ingin membuat video terlihat seperti direkam menggunakan HP jadul, hasil kiriman WhatsApp yang di-forward berkali-kali, atau membuat meme absurd dengan rasio layar gepeng?",
    seoP2: "Aplikasi ini berjalan 100% secara lokal di browser (client-side). Kami tidak pernah mengunggah, menyimpan, atau menyebarkan video Anda ke server mana pun.",
    seoFeaturesTitle: "Fitur Utama & Kustomisasi",
    seoFeature1: "Turunkan Resolusi & Bitrate: Paksa video resolusi tinggi menjadi buram, patah-patah, dan penuh kotak pixel art.",
    seoFeature2: "Efek Audio Rusak: Buat suara video terdengar \"mendem\", pecah, atau seperti kualitas rekaman kaset rusak.",
    seoFeature3: "Gepengin Video: Ubah bentuk video normal menjadi super lebar atau sangat kurus memanjang.",
    seoFeature4: "Filter Visual: Terapkan filter grayscale ekstrem atau Deep Fried yang mencolok.",
    seoHowToTitle: "Cara Penggunaan",
    seoStep1: "Klik tombol PILIH VIDEO dan masukkan video dari galeri HP atau komputer Anda.",
    seoStep2: "Perhatikan Live Preview untuk melihat efek secara langsung.",
    seoStep3: "Pilih Preset atau atur sendiri parameter sesuka hati.",
    seoStep4: "Klik BIKININ & DOWNLOAD. Tetap berada di halaman ini selama proses berjalan.",
    seoFaqTitle: "Pertanyaan Umum (FAQ)",
    seoFaqQ1: "T: Mengapa durasi video hasil download saya hanya 1 detik?",
    seoFaqA1: "J: Ini sudah diperbaiki di versi terbaru! Sebelumnya masalah ini terjadi karena browser menghentikan perekaman saat tab berpindah. Sekarang sistem menggunakan setInterval untuk menggambar frame (bukan requestAnimationFrame) sehingga tetap berjalan meski tab di-minimize.",
    seoFaqQ2: "T: Apakah layanan ini gratis? Apakah ada batas durasi?",
    seoFaqA2: "J: Sepenuhnya gratis! Disarankan memproses video di bawah 3 menit karena proses encoding mengandalkan CPU/GPU perangkat Anda.",

    // Footer
    footerPrivacy: "Privacy Policy",
    footerTos: "Terms of Service",
    footerContact: "Contact Us",
    footerAbout: "About",
    footerBlog: "Blog",
    footerMadeBy: "Dibuat oleh",
    footerProcessedLocally: "— Diproses 100% di perangkatmu, tanpa server.",
    footerJoinWa: "Gabung Saluran WhatsApp",
    footerCopyright: "All rights reserved.",

    // Modals
    modalPrivacyTitle: "Privacy Policy",
    modalPrivacyP1: "Privasi Anda sangat penting bagi kami. Aplikasi {appName} dirancang untuk memproses seluruh manipulasi video secara 100% lokal di perangkat Anda (client-side).",
    modalPrivacyP2: "Kami tidak pernah mengunggah, menyimpan, atau membagikan file video Anda ke server kami atau pihak ketiga mana pun.",
    modalTosTitle: "Terms of Service",
    modalTosP1: "Dengan menggunakan layanan {appName}, Anda setuju untuk menggunakan alat ini secara bertanggung jawab.",
    modalTosP2: "Layanan ini disediakan \"sebagaimana adanya\" tanpa jaminan apa pun. Pengguna dilarang memproses materi ilegal atau yang melanggar hukum hak cipta.",
    modalContactTitle: "Contact Us",
    modalContactP1: "Punya pertanyaan, saran, atau menemukan bug?",
    modalContactBtn: "Bergabung ke Komunitas WhatsApp",
    modalAboutTitle: "About Us",
    modalAboutP1: "{appName} adalah proyek independen yang dibangun oleh zals.",
    modalAboutP2: "Terinspirasi dari tren meme video dengan kualitas rendah, alat ini diciptakan untuk memudahkan siapa saja membuat video \"shitpost\" atau retro tanpa perlu software editing berat.",

    errorPrefix: "Gagal memproses",
    errorUnknown: "error tidak diketahui",
    blogLabel: "BLOG",
  },

  en: {
    // Header
    totalVisitor: "Total Visitors",
    joinWaChannel: "JOIN WA CHANNEL",

    // Hero
    eyebrow: "// NO SIGNAL — PROCESSED LOCALLY ON YOUR DEVICE",
    tagline: "Make your video look like it's been reposted a hundred times, or stretch it absurdly for memes — all in a few clicks.",

    // Media card - video
    videoSelected: "✓ VIDEO SELECTED",
    pickVideo: "PICK A VIDEO",
    pickVideoHint: "mp4, webm, etc",

    // Media card - image
    imageSelected: "✓ IMAGE SELECTED",
    burikinImage: "DEGRADE IMAGE",
    burikinImageHint: "jpg, png, webp, etc",

    // Preview
    processing: "PROCESSING",
    processingWarning: "⚠️ IMPORTANT: Don't switch browser tabs or turn off your phone screen while this is processing.",
    rec: "● REC",
    livePreview: "● LIVE PREVIEW",

    // Presets
    presetRingan: "LIGHT",
    presetSedang: "MEDIUM",
    presetParah: "SEVERE",
    presetMajapahit: "MAJAPAHIT",
    presetCustom: "CUSTOM",

    // Settings - Visual & Audio
    sectionVisualAudio: "🛠️ VISUAL & AUDIO",
    outputResolution: "Output Resolution",
    res144: "140p / 144p (Very Blurry)",
    res240: "240p (Blurry)",
    res360: "360p (Standard)",
    res480: "480p (Decent)",
    resOriginal: "Same as Original",

    frameRate: "Frame Rate (FPS)",
    fps8: "8 FPS (Very Choppy)",
    fps12: "12 FPS (Choppy)",
    fps15: "15 FPS (Not Smooth)",
    fps24: "24 FPS (Normal Film)",
    fps30: "30 FPS (Smooth)",

    videoCompression: "Video Compression (Bitrate)",
    vq1: "Severe (Heavy Artifacts)",
    vq2: "Medium (Some Artifacts)",
    vq3: "Good (Normal)",
    vq4: "Very Good (Clean)",

    audioQualityLabel: "Audio Quality",
    aq1: "Destroyed (Crackly & Crushed)",
    aq2: "Muffled (Like Old Phone)",
    aq3: "Decent (Slightly Muffled)",
    aq4: "Normal (Original Clarity)",

    // Audio effects
    sectionAudioEffects: "🎙️ SPECIAL AUDIO EFFECTS",
    effNoneLabel: "NORMAL", effNoneDesc: "Original",
    effTupaiLabel: "CHIPMUNK", effTupaiDesc: "Chipmunk voice",
    effSetanLabel: "DEMONIC", effSetanDesc: "Dark bass",
    effBassLabel: "BASS", effBassDesc: "Blown-out sub bass",
    effMegaphoneLabel: "MEGAPHONE", effMegaphoneDesc: "Street loudspeaker",
    effCaveLabel: "CAVE", effCaveDesc: "Echo & reverb",
    effRobotLabel: "ROBOT", effRobotDesc: "Ring modulator",
    effVhsLabel: "VHS", effVhsDesc: "Old cassette tape",
    effTelephoneLabel: "TELEPHONE", effTelephoneDesc: "2G network",

    // Absurd effects
    sectionAbsurdEffects: "👽 ABSURD EFFECTS",
    colorFilterLabel: "Color Filter",
    cf0: "Normal (Original)",
    cf1: "Majapahit (Black & White)",
    cf2: "Vintage (Worn Sepia)",
    cf3: "Deep Fried (Extremely Saturated)",

    pixelScaleLabel: "Pixelation",
    px1: "Smooth (Original)",
    px2: "Light Pixels",
    px4: "Medium Pixels",
    px8: "Large Pixels (Retro 8-bit)",
    px16: "Giant Pixels (Minecraft)",

    stretchLabel: "Aspect Ratio (Stretch)",
    stretch05: "Super Thin (Tall)",
    stretch1: "Normal (Original)",
    stretch15: "Slightly Wide",
    stretch2: "Stretched (Wide)",
    stretch3: "Super Stretched",

    // Process button
    processBtnProcessing: "PROCESSING",
    processBtnIdle: "PROCESS & DOWNLOAD",

    // Result
    downloadResult: "⬇ DOWNLOAD RESULT",

    // Burikin Gambar section
    imageSectionTitle: "🖼️ DEGRADE IMAGE",
    burikLevel: "DEGRADE LEVEL",
    burikLevelClear: "CLEAN",
    burikLevelLittle: "SLIGHT",
    burikLevelEnough: "NOTICEABLE",
    burikLevelSevere: "SEVERE",
    burikLevel8bit: "8-BIT",
    burikLevelMinecraft: "MINECRAFT",
    colorFilterTitle: "COLOR FILTER",
    filterNormal: "NORMAL",
    filterBW: "B&W",
    filterSepia: "SEPIA",
    filterFried: "FRIED",
    downloadImage: "⬇ DOWNLOAD",

    // SEO Article
    seoTitle: "About Burikin Aja",
    seoP1: "is a free web app for intentionally editing and degrading video quality. Want your video to look like it was recorded on an old phone, forwarded a hundred times on WhatsApp, or stretched into an absurd meme format?",
    seoP2: "This app runs 100% locally in your browser (client-side). We never upload, store, or share your video files with any server.",
    seoFeaturesTitle: "Key Features & Customization",
    seoFeature1: "Lower Resolution & Bitrate: Force high-res video into a blurry, choppy, pixelated mess.",
    seoFeature2: "Broken Audio Effects: Make your audio sound muffled, crackly, or like a damaged cassette tape.",
    seoFeature3: "Stretch Video: Turn a normal video into a super wide or super thin elongated shape.",
    seoFeature4: "Visual Filters: Apply extreme grayscale or eye-searing Deep Fried filters.",
    seoHowToTitle: "How to Use",
    seoStep1: "Click the PICK A VIDEO button and choose a video from your phone gallery or computer.",
    seoStep2: "Watch the Live Preview to see the effect in real time.",
    seoStep3: "Choose a Preset or customize every parameter yourself.",
    seoStep4: "Click PROCESS & DOWNLOAD. Stay on this page while it processes.",
    seoFaqTitle: "Frequently Asked Questions (FAQ)",
    seoFaqQ1: "Q: Why is my downloaded video only 1 second long?",
    seoFaqA1: "A: This has been fixed in the latest version! It used to happen because the browser paused recording when you switched tabs. The system now uses setInterval to draw frames (instead of requestAnimationFrame), so it keeps running even when the tab is minimized.",
    seoFaqQ2: "Q: Is this service free? Is there a duration limit?",
    seoFaqA2: "A: Completely free! We recommend processing videos under 3 minutes since encoding relies on your device's CPU/GPU.",

    // Footer
    footerPrivacy: "Privacy Policy",
    footerTos: "Terms of Service",
    footerContact: "Contact Us",
    footerAbout: "About",
    footerBlog: "Blog",
    footerMadeBy: "Made by",
    footerProcessedLocally: "— Processed 100% on your device, no server involved.",
    footerJoinWa: "Join WhatsApp Channel",
    footerCopyright: "All rights reserved.",

    // Modals
    modalPrivacyTitle: "Privacy Policy",
    modalPrivacyP1: "Your privacy matters a lot to us. The {appName} app is designed to process all video manipulation 100% locally on your device (client-side).",
    modalPrivacyP2: "We never upload, store, or share your video files with our servers or any third party.",
    modalTosTitle: "Terms of Service",
    modalTosP1: "By using {appName}, you agree to use this tool responsibly.",
    modalTosP2: "This service is provided \"as is\" without any warranty. Users are prohibited from processing illegal material or content that infringes copyright law.",
    modalContactTitle: "Contact Us",
    modalContactP1: "Have a question, suggestion, or found a bug?",
    modalContactBtn: "Join the WhatsApp Community",
    modalAboutTitle: "About Us",
    modalAboutP1: "{appName} is an independent project built by zals.",
    modalAboutP2: "Inspired by the trend of intentionally low-quality meme videos, this tool was made to help anyone create \"shitpost\" or retro-style videos without needing heavy editing software.",

    errorPrefix: "Processing failed",
    errorUnknown: "unknown error",
    blogLabel: "BLOG",
  },
};

export function getTranslations(lang) {
  return translations[lang] || translations[DEFAULT_LANG];
    }
