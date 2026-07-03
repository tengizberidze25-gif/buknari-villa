export const metadata = {
  title: 'Buknari Villa',
  description: 'ვილების და სახლების გაქირავება ბუქნარში',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ka">
      <body>{children}</body>
    </html>
  );
}
