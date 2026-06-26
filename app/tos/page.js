import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Burikin Aja",
  description: "Syarat dan ketentuan penggunaan layanan Burikin Aja, web app gratis untuk menurunkan kualitas video langsung di browser.",
};

export default function TosPage() {
  return (
    <main style={{ minHeight: "100vh", maxWidth: 760, margin: "0 auto", padding: "0 18px 80px" }}>
      <header style={{ padding: "20px 0", borderBottom: "1px dashed #2a2a30" }}>
        <Link href="/" style={{ color: "#ffb000", textDecoration: "none", fontSize: 13, fontFamily: "monospace" }}>
          ← Kembali ke Burikin Aja
        </Link>
      </header>

      <article style={{ marginTop: 40 }}>
        <h1 style={{ fontFamily: "monospace", fontSize: 28, color: "#ffb000", marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: "#84848c", fontSize: 12, marginBottom: 32 }}>Terakhir diperbarui: Juni 2026</p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Penerimaan Syarat</h2>
          <p style={pStyle}>
            Dengan mengakses dan menggunakan <strong>Burikin Aja</strong> (<a href="https://burikinaja.web.id" style={linkStyle}>burikinaja.web.id</a>), 
            Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat oleh Syarat dan Ketentuan ini. 
            Jika Anda tidak setuju dengan syarat-syarat ini, harap hentikan penggunaan layanan kami.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Deskripsi Layanan</h2>
          <p style={pStyle}>
            Burikin Aja adalah aplikasi web gratis yang memungkinkan pengguna untuk memanipulasi kualitas video secara sengaja (degradasi kualitas video) 
            langsung di dalam browser mereka. Fitur meliputi penurunan resolusi, pengurangan frame rate, efek audio "rusak", filter visual, 
            dan pengubahan rasio aspek video. Semua pemrosesan dilakukan secara lokal (client-side) tanpa mengirim data ke server kami.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. Penggunaan yang Diizinkan</h2>
          <p style={pStyle}>Anda boleh menggunakan Burikin Aja untuk:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Membuat konten meme dan hiburan</li>
            <li style={liStyle}>Proyek seni dan eksperimen kreatif</li>
            <li style={liStyle}>Simulasi kualitas video lama atau "nostalgia"</li>
            <li style={liStyle}>Keperluan pribadi dan non-komersial</li>
            <li style={liStyle}>Proyek komersial selama tidak melanggar hak cipta</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Penggunaan yang Dilarang</h2>
          <p style={pStyle}>Anda <strong>dilarang keras</strong> menggunakan Burikin Aja untuk:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Memproses materi yang melanggar hak cipta tanpa izin pemilik hak</li>
            <li style={liStyle}>Menyebarkan konten yang bersifat pornografi, kekerasan, atau melanggar hukum</li>
            <li style={liStyle}>Membuat konten yang melecehkan, mendiskriminasi, atau merugikan individu atau kelompok tertentu</li>
            <li style={liStyle}>Aktivitas yang melanggar hukum yang berlaku di wilayah hukum Anda</li>
            <li style={liStyle}>Melakukan reverse engineering atau mencoba mengeksploitasi layanan ini</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Hak Kekayaan Intelektual</h2>
          <p style={pStyle}>
            Anda tetap memegang semua hak atas video yang Anda proses menggunakan Burikin Aja. Kami tidak mengklaim kepemilikan atas konten Anda. 
            Namun, Anda bertanggung jawab penuh untuk memastikan bahwa Anda memiliki hak yang diperlukan untuk memproses dan mendistribusikan video tersebut.
          </p>
          <p style={pStyle}>
            Kode sumber, desain, merek dagang, dan aset visual Burikin Aja adalah milik eksklusif <strong>zals</strong> dan dilindungi oleh hukum kekayaan intelektual yang berlaku. 
            Anda tidak diperbolehkan menyalin, mendistribusikan, atau memodifikasi antarmuka pengguna kami tanpa izin tertulis.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Penolakan Jaminan</h2>
          <p style={pStyle}>
            Layanan ini disediakan <strong>"sebagaimana adanya" (as-is)</strong> dan <strong>"sebagaimana tersedia" (as-available)</strong> tanpa jaminan 
            apapun, baik tersurat maupun tersirat. Kami tidak menjamin bahwa:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Layanan akan selalu tersedia atau bebas dari gangguan</li>
            <li style={liStyle}>Hasil output video akan sesuai dengan ekspektasi pengguna</li>
            <li style={liStyle}>Layanan kompatibel dengan semua browser atau perangkat</li>
            <li style={liStyle}>Tidak akan terjadi kehilangan data selama proses rendering</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Batasan Tanggung Jawab</h2>
          <p style={pStyle}>
            Sejauh diperbolehkan oleh hukum yang berlaku, Burikin Aja dan pembuatnya tidak bertanggung jawab atas:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Kehilangan atau kerusakan data yang terjadi selama proses encoding di browser Anda</li>
            <li style={liStyle}>Kerusakan perangkat yang disebabkan oleh beban komputasi selama pemrosesan video</li>
            <li style={liStyle}>Kerugian yang timbul akibat penggunaan atau ketidakmampuan penggunaan layanan</li>
            <li style={liStyle}>Konten yang dihasilkan oleh pengguna dari video yang diproses</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. Perubahan Layanan</h2>
          <p style={pStyle}>
            Kami berhak untuk mengubah, menangguhkan, atau menghentikan layanan (atau bagian dari layanan) sewaktu-waktu tanpa pemberitahuan sebelumnya. 
            Kami juga berhak memperbarui Syarat dan Ketentuan ini. Penggunaan berkelanjutan setelah perubahan merupakan persetujuan Anda terhadap syarat yang diperbarui.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>9. Hubungi Kami</h2>
          <p style={pStyle}>
            Jika ada pertanyaan mengenai Syarat dan Ketentuan ini, silakan kunjungi{" "}
            <Link href="/contact" style={linkStyle}>halaman Kontak</Link> kami.
          </p>
        </section>
      </article>
    </main>
  );
}

const sectionStyle = { marginBottom: 36, paddingBottom: 28, borderBottom: "1px solid #2a2a30" };
const h2Style = { fontFamily: "monospace", fontSize: 16, color: "#e8e6df", marginBottom: 12 };
const pStyle = { fontSize: 14, color: "#84848c", lineHeight: 1.8, marginBottom: 12 };
const ulStyle = { paddingLeft: 20, marginBottom: 12 };
const liStyle = { fontSize: 14, color: "#84848c", lineHeight: 1.8, marginBottom: 6 };
const linkStyle = { color: "#ffb000", textDecoration: "none" };
