import { supabase } from '../lib/supabase';

export const revalidate = 30; // 30 წამში ერთხელ ახლდება (ISR)

async function getVillas() {
  const { data, error } = await supabase
    .from('villas')
    .select('*, villa_photos(url, sort_order)')
    .eq('status', 'approved')
    .eq('is_available', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error.message);
    return [];
  }
  return data || [];
}

function coverPhoto(villa) {
  if (!villa.villa_photos || villa.villa_photos.length === 0) return null;
  const sorted = [...villa.villa_photos].sort((a, b) => a.sort_order - b.sort_order);
  return sorted[0].url;
}

export default async function HomePage() {
  const villas = await getVillas();

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>ბუკნარი <span style={styles.logoAccent}>ვილა</span></span>
          <nav style={styles.nav}>
            <a href="#listings" style={styles.navLink}>განცხადებები</a>
            <a href="/add" style={styles.navLinkCta}>დაამატე სახლი</a>
          </nav>
        </div>
      </header>

      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>დაისვენე ბუკნარის ზღვის სანაპიროზე</h1>
        <p style={styles.heroSubtitle}>
          გაქირავებული სახლები და ვილები — პირდაპირ მფლობელისგან, WhatsApp-ით დაკავშირებით
        </p>
      </section>

      <section id="listings" style={styles.listings}>
        {villas.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyTitle}>ჯერ არცერთი ვილა არ არის დამატებული</p>
            <p style={styles.emptyText}>
              როგორც კი მფლობელი დაარეგისტრირებს და ადმინი დაამტკიცებს განცხადებას, აქ გამოჩნდება.
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {villas.map((villa) => {
              const photo = coverPhoto(villa);
              return (
                <article key={villa.id} style={styles.card}>
                  <div style={styles.cardImageWrap}>
                    {photo ? (
                      <img src={photo} alt={villa.title} style={styles.cardImage} />
                    ) : (
                      <div style={styles.cardImagePlaceholder}>ფოტო არ არის</div>
                    )}
                  </div>
                  <div style={styles.cardBody}>
                    <h3 style={styles.cardTitle}>{villa.title}</h3>
                    <p style={styles.cardLocation}>{villa.location_name}</p>
                    <div style={styles.cardMeta}>
                      {villa.max_guests ? <span>{villa.max_guests} სტუმარი</span> : null}
                      {villa.bedrooms ? <span> · {villa.bedrooms} საძინებელი</span> : null}
                    </div>
                    <div style={styles.cardFooter}>
                      <span style={styles.price}>
                        {villa.price_per_night ? `${villa.price_per_night} ₾ / ღამე` : 'ფასი შეთანხმებით'}
                      </span>
                      {villa.contact_whatsapp ? (
                        <a
                          href={`https://wa.me/${villa.contact_whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.whatsappBtn}
                        >
                          WhatsApp
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    background: '#0f1210',
    color: '#f2ede4',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    position: 'sticky',
    top: 0,
    background: 'rgba(15,18,16,0.9)',
    backdropFilter: 'blur(8px)',
    zIndex: 10,
  },
  headerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '18px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { fontSize: 20, fontWeight: 600, letterSpacing: 0.5 },
  logoAccent: { color: '#c9a86a' },
  nav: { display: 'flex', gap: 24, alignItems: 'center' },
  navLink: { color: '#cfc9bd', textDecoration: 'none', fontSize: 15 },
  navLinkCta: {
    color: '#0f1210',
    background: '#c9a86a',
    padding: '9px 18px',
    borderRadius: 6,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
  },
  hero: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '80px 24px 56px',
    textAlign: 'center',
  },
  heroTitle: { fontSize: 40, fontWeight: 600, margin: 0, lineHeight: 1.25 },
  heroSubtitle: { marginTop: 16, fontSize: 17, color: '#b7b0a2' },
  listings: { maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' },
  empty: {
    textAlign: 'center',
    padding: '80px 24px',
    border: '1px dashed rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: 600, marginBottom: 8 },
  emptyText: { color: '#a9a296', fontSize: 15 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 28,
  },
  card: {
    background: '#171a17',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardImageWrap: { aspectRatio: '4 / 3', background: '#20241f' },
  cardImage: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#5c6058',
    fontSize: 14,
  },
  cardBody: { padding: '16px 18px 18px' },
  cardTitle: { fontSize: 17, fontWeight: 600, margin: '0 0 4px' },
  cardLocation: { fontSize: 14, color: '#a9a296', margin: '0 0 8px' },
  cardMeta: { fontSize: 13, color: '#8f9089', marginBottom: 14 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 15, fontWeight: 600, color: '#c9a86a' },
  whatsappBtn: {
    background: '#25D366',
    color: '#0f1210',
    fontSize: 13,
    fontWeight: 600,
    padding: '7px 14px',
    borderRadius: 6,
    textDecoration: 'none',
  },
};
