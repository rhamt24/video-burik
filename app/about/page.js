import Link from "next/link";

export const metadata = {
  title: "Tentang Burikin Aja — Web App Video Degrader Gratis",
  description: "Kenalan sama Burikin Aja, web app buatan anak Indonesia untuk bikin video meme, burik, dan retro langsung di browser. Dibangun oleh zals.",
};

export default function AboutPage() {
  return (
    <main style={{ minHeight: "100vh", maxWidth: 760, margin: "0 auto", padding: "0 18px 80px" }}>
      <header style={{ padding: "20px 0", borderBottom: "1px dashed #2a2a30" }}>
        <Link href="/" style={{ color: "#ffb000", textDecoration: "none", fontSize: 13, fontFamily: "monospace" }}>
          ← Kembali ke Burikin Aja
        </Link>
      </header>

      <article style={{ marginTop: 40 }}>
        <h1 style={{ fontFamily: "monospace", fontSize: 28, color: "#ffb000", marginBottom: 8 }}>Tentang Burikin Aja</h1>
        <p style={{ color: "#84848c", fontSize: 13, marginBottom: 40, lineHeight: 1.7 }}>
          Web app gratis untuk bikin video meme, burik, dan jadul — diproses 100% di browser kamu.
        </p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Asal Mula Ide</h2>
          <p style={pStyle}>
            Burikin Aja lahir dari satu pertanyaan sederhana: <em>"Kenapa video meme yang paling lucu justru yang kualitasnya paling jelek?"</em>
          </p>
          <p style={pStyle}>
            Ada sesuatu yang unik dari video yang terlihat seperti di-forward puluhan kali via WhatsApp — resolusinya hancur, suaranya "mendem", 
            frame-nya patah-patah. Kualitas yang buruk itu justru menjadi bagian dari humor-nya. Ini bukan bug, ini <em>feature</em>.
          </p>
          <p style={pStyle}>
            Tapi untuk membuat video seperti itu, kebanyakan orang harus menggunakan software editing yang berat, atau cara-cara manual yang ribet. 
            Burikin Aja hadir untuk menyederhanakan proses itu menjadi beberapa klik saja, langsung dari browser.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Teknologi di Baliknya</h2>
          <p style={pStyle}>
            Yang membuat Burikin Aja unik adalah pendekatannya yang sepenuhnya <strong>client-side</strong>. 
            Tidak ada server pemrosesan video, tidak ada upload ke cloud, tidak ada antrean render. Semua dikerjakan langsung oleh browser kamu.
          </p>
          <p style={pStyle}>Teknologi utama yang digunakan:</p>
          <ul style={ulStyle}>
            <li style={liStyle}><strong>Canvas API</strong> — Untuk merender setiap frame video dengan efek visual yang diinginkan (filter warna, pixelisasi, dll)</li>
            <li style={liStyle}><strong>MediaRecorder API</strong> — Untuk merekam output dari canvas menjadi file video yang bisa diunduh</li>
            <li style={liStyle}><strong>Web Audio API</strong> — Untuk memanipulasi audio secara real-time (lowpass filter, distorsi)</li>
            <li style={liStyle}><strong>Next.js</strong> — Framework React yang digunakan untuk membangun antarmuka pengguna</li>
          </ul>
          <p style={pStyle}>
            Pendekatan ini berarti privasi kamu terjamin sepenuhnya — video kamu tidak pernah meninggalkan perangkatmu.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Siapa yang Membuat Ini?</h2>
          <p style={pStyle}>
            Burikin Aja adalah proyek independen yang dibangun oleh <strong>zals</strong>, developer asal Indonesia yang suka bikin 
            tools sederhana tapi berguna (atau setidaknya menghibur).
          </p>
          <p style={pStyle}>
            Ini adalah proyek hobi yang dibuat dengan prinsip: <em>kalau bisa dilakukan di browser, kenapa harus install software?</em>
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Gratis Selamanya?</h2>
          <p style={pStyle}>
            Ya. Burikin Aja gratis untuk digunakan dan tidak ada rencana untuk membuat fitur berbayar. 
            Biaya operasional ditutup oleh iklan Google AdSense yang tampil di halaman ini.
          </p>
          <p style={pStyle}>
            Jika kamu suka menggunakan Burikin Aja, cara terbaik untuk mendukungnya adalah dengan bergabung ke komunitas 
            kami dan menyebarkannya ke teman-temanmu!
          </p>
          <a
            href="https://whatsapp.com/channel/0029VaYuIQT2v1IjZmqTNG3x"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-block", marginTop: 8, background: "#ffb000", color: "#000", padding: "10px 18px", textDecoration: "none", fontFamily: "monospace", fontWeight: "bold", fontSize: 13 }}
          >
            Gabung Saluran WhatsApp →
          </a>
        </section>

        <div style={{ marginTop: 40, textAlign: "center" }}>
          <Link href="/" style={{ color: "#ffb000", fontFamily: "monospace", fontSize: 14, textDecoration: "none" }}>
            Coba Burikin Aja Sekarang →
          </Link>
        </div>
      </article>
    </main>
  );
}

const sectionStyle = { marginBottom: 36, paddingBottom: 28, borderBottom: "1px solid #2a2a30" };
const h2Style = { fontFamily: "monospace", fontSize: 16, color: "#e8e6df", marginBottom: 12 };
const pStyle = { fontSize: 14, color: "#84848c", lineHeight: 1.8, marginBottom: 12 };
const ulStyle = { paddingLeft: 20, marginBottom: 12 };
const liStyle = { fontSize: 14, color: "#84848c", lineHeight: 1.8, marginBottom: 8 };
