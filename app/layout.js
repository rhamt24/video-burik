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
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
