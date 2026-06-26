import Link from "next/link";

export const metadata = {
  title: "Efek VHS & Nostalgia: Kenapa Kita Suka Video Jadul? — Burikin Aja",
  description: "Eksplorasi fenomena lo-fi visual dan estetika VHS yang sedang tren. Kenapa video dengan kualitas rendah dan tampilan jadul begitu populer di era digital?",
};

export default function Post2() {
  return (
    <main style={{ minHeight: "100vh", maxWidth: 760, margin: "0 auto", padding: "0 18px 80px" }}>
      <header style={{ padding: "20px 0", borderBottom: "1px dashed #2a2a30" }}>
        <Link href="/blog" style={{ color: "#ffb000", textDecoration: "none", fontSize: 13, fontFamily: "monospace" }}>
          ← Kembali ke Blog
        </Link>
      </header>

      <article style={{ marginTop: 40 }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ background: "#39ff14", color: "#000", fontSize: 10, padding: "2px 8px", fontFamily: "monospace", fontWeight: "bold" }}>Artikel</span>
          <span style={{ color: "#84848c", fontSize: 12, fontFamily: "monospace", marginLeft: 10 }}>Juni 2026</span>
        </div>
        <h1 style={{ fontFamily: "monospace", fontSize: "clamp(20px, 5vw, 30px)", color: "#e8e6df", marginTop: 12, marginBottom: 24, lineHeight: 1.3 }}>
          Efek VHS & Nostalgia: Kenapa Kita Suka Video Jadul?
        </h1>

        <p style={pStyle}>
          Scroll media sosial apapun hari ini, dan kamu pasti menemukan video dengan estetika yang aneh: 
          warnanya pudar, ada garis-garis horizontal yang sesekali muncul, kualitasnya buram — seperti video yang direkam dari kaset VHS lama. 
          Tapi ini bukan video lama. Ini video baru yang sengaja dibuat agar terlihat jadul.
        </p>
        <p style={pStyle}>
          Fenomena ini disebut <strong>lo-fi aesthetic</strong> atau <strong>VHS aesthetic</strong>, dan popularitasnya terus tumbuh. 
          Kenapa? Mari kita eksplorasi.
        </p>

        <h2 style={h2Style}>Apa itu Estetika VHS?</h2>
        <p style={pStyle}>
          VHS (Video Home System) adalah format kaset video yang dominan dari tahun 1970-an hingga awal 2000-an. 
          Karakteristik visualnya sangat khas: resolusi rendah (sekitar 240 garis horizontal vs ribuan piksel di video HD modern), 
          warna yang sedikit "bleeding" (meleleh ke warna sebelahnya), noise visual berupa grain atau bintik-bintik, 
          dan terkadang ada artefak berupa garis atau distorsi di tepi layar.
        </p>
        <p style={pStyle}>
          Ketika orang bicara tentang "efek VHS" di era digital, mereka merujuk pada sekumpulan elemen visual ini yang secara kolektif 
          memberi kesan bahwa sebuah video direkam atau diputar menggunakan teknologi analog lama.
        </p>

        <h2 style={h2Style}>Psikologi di Balik Nostalgia Visual</h2>
        <p style={pStyle}>
          <strong>Nostalgia bukan hanya tentang mengingat masa lalu</strong> — ini tentang perasaan yang terhubung dengan memori tersebut. 
          Penelitian psikologi menunjukkan bahwa nostalgia memiliki efek positif pada suasana hati, meningkatkan rasa continuity (keberlanjutan identitas), 
          dan bahkan mengurangi perasaan kesepian atau kecemasan.
        </p>
        <p style={pStyle}>
          Ketika seseorang melihat video dengan estetika VHS, otak mereka — terutama yang tumbuh di era 80-an hingga 2000-an — 
          secara otomatis mengasosiasikannya dengan kenangan: rekaman ulang tahun keluarga, video game lama, film favorit masa kecil. 
          Asosiasi emosional ini menciptakan <em>warm feeling</em> yang membuat konten tersebut terasa lebih menyentuh dan engaging.
        </p>

        <h2 style={h2Style}>Ketidaksempurnaan sebagai Daya Tarik</h2>
        <p style={pStyle}>
          Ada paradoks menarik: di era di mana teknologi memungkinkan video 8K yang sempurna, justru ketidaksempurnaan analog yang dicari banyak kreator.
        </p>
        <p style={pStyle}>
          Ini berkaitan dengan konsep Jepang <strong>wabi-sabi</strong> — menemukan keindahan dalam ketidaksempurnaan dan kefanaan. 
          Sebuah video yang terlalu sempurna terasa steril dan dingin. Noise, grain, dan imperfeksi visual justru memberi "karakter" 
          yang membuat sebuah konten terasa lebih organik dan manusiawi.
        </p>
        <p style={pStyle}>
          Fenomena serupa terjadi di dunia musik dengan tren <strong>lo-fi hip hop</strong> — musik sengaja dibuat dengan 
          elemen "cacat" seperti vinyl crackle, tape hiss, dan pitch yang sedikit tidak stabil, justru untuk menciptakan 
          suasana yang hangat dan nyaman.
        </p>

        <h2 style={h2Style}>Lo-Fi Visual di Era Media Sosial</h2>
        <p style={pStyle}>
          Platform seperti TikTok dan Instagram justru menjadi inkubator bagi estetika lo-fi. Beberapa faktor yang mendorong tren ini:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}><strong>Saturasi konten HD</strong> — Semua orang memiliki kamera berkualitas tinggi. Untuk menonjol, kreator butuh cara lain untuk berbeda</li>
          <li style={liStyle}><strong>Kelelahan estetika sempurna</strong> — Generasi yang tumbuh dengan Instagram filter dan beauty standard yang tidak realistis mulai rindu dengan sesuatu yang terasa "asli"</li>
          <li style={liStyle}><strong>Nostalgia generasi Millennial dan Gen Z awal</strong> — Mereka yang kini berusia 20-35 tahun memiliki kenangan nyata tentang era VHS dan teknologi analog</li>
          <li style={liStyle}><strong>Ironi dan self-awareness</strong> — Membuat video "jelek" secara sengaja juga bisa dibaca sebagai pernyataan ironis tentang obsesi kita pada kualitas dan kesempurnaan visual</li>
        </ul>

        <h2 style={h2Style}>Cara Menciptakan Estetika Lo-Fi dengan Burikin Aja</h2>
        <p style={pStyle}>
          Jika kamu ingin mengeksplorasi estetika ini, Burikin Aja menyediakan beberapa tools yang relevan:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}><strong>Preset MAJAPAHIT</strong> — Memberikan filter grayscale yang dramatis, terinspirasi dari estetika film hitam putih tua</li>
          <li style={liStyle}><strong>Filter Vintage (Sepia Usang)</strong> — Menambahkan nuansa kecoklatan yang khas dari foto dan video era analog</li>
          <li style={liStyle}><strong>Resolusi 144p dengan FPS rendah</strong> — Kombinasi ini menciptakan tampilan yang sangat mirip dengan rekaman VHS atau handycam lama</li>
          <li style={liStyle}><strong>Audio "Mendem"</strong> — Simulasi suara yang melewati kaset magnetik yang sudah memburuk</li>
        </ul>
        <p style={pStyle}>
          Eksperimen dengan kombinasi berbeda untuk menemukan estetika yang paling cocok dengan konten dan audiens kamu.
        </p>

        <h2 style={h2Style}>Kesimpulan</h2>
        <p style={pStyle}>
          Estetika VHS dan lo-fi visual bukan sekadar tren sementara — ini adalah respons psikologis yang mendalam terhadap kondisi media modern. 
          Di tengah banjir konten sempurna, ketidaksempurnaan yang sengaja diciptakan justru menjadi bentuk ekspresi artistik yang kuat dan koneksi emosional yang autentik.
        </p>
        <p style={pStyle}>
          Dan yang terbaik dari semua ini? Kamu tidak perlu membeli kaset VHS bekas atau kamera analog untuk menciptakan estetika ini. 
          Cukup beberapa klik di browser kamu.
        </p>

        <div style={{ marginTop: 40, padding: 20, background: "#141417", border: "1px solid #ffb000", borderRadius: 8, textAlign: "center" }}>
          <p style={{ color: "#84848c", fontSize: 13, marginBottom: 12 }}>Mau coba efek VHS dan lo-fi di video kamu?</p>
          <Link href="/" style={{ display: "inline-block", background: "#ffb000", color: "#000", padding: "10px 24px", textDecoration: "none", fontFamily: "monospace", fontWeight: "bold", fontSize: 13 }}>
            Coba Burikin Aja Sekarang →
          </Link>
        </div>
      </article>
    </main>
  );
}

const h2Style = { fontFamily: "monospace", fontSize: 16, color: "#ffb000", marginTop: 32, marginBottom: 12 };
const pStyle = { fontSize: 14, color: "#84848c", lineHeight: 1.8, marginBottom: 14 };
const ulStyle = { paddingLeft: 20, marginBottom: 14 };
const liStyle = { fontSize: 14, color: "#84848c", lineHeight: 1.8, marginBottom: 8 };
