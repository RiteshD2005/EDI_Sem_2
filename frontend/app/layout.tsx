import "./globals.css";

export const metadata = {
  title: "Seminar Booking System",
  description: "Authentication flow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}