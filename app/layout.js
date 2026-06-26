
import "./globals.css";

export const metadata = {
  title: "BURIKIN — Bikin video burik, langsung di browser",
  description:
    "Tambahin efek noise/grain/VHS/3GP jadul ke video kamu. Diproses di perangkatmu sendiri, suara ikut burik juga kalau mau.",
  manifest: "/manifest.json",
  themeColor: "#000000",
  icons: {
    icon: "/logo-192.png",
    apple: "/logo-192.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* Meta Google Site Verification Baru */}
        <meta name="google-site-verification" content="2LXfski1y6RJdglQv40n7jsKu3Ww5wWj5sANTHm-pAI" />
        
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Script AdSense Utama */}
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6307870813026612"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body>{children}</body>
    </html>
  );
}

