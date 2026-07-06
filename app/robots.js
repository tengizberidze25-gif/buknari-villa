export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/',
        '/api/',
        '/dashboard',
        '/edit-villa/',
        '/add-villa',
        '/register',
        '/my-bookings',
        '/cancel/',
        '/review/',
      ],
    },
    sitemap: 'https://www.buknarivilla.ge/sitemap.xml',
  };
}
