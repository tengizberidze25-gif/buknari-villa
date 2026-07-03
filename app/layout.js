export const metadata = {
  title: 'Buknari Villa',
  description: 'ვილების და სახლების გაქირავება ბუკნარში',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ka">
      <body>{children}</body>
    </html>
  );
}
