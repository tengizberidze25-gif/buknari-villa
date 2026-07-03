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
    <>
      <nav className="nav">
        <a href="/" className="nav-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '38px', width: 'auto' }} />
        </a>
        <div className="nav-links">
          <a href="#listings">ვილები</a>
          <a href="#owner">მფლობელებისთვის</a>
          <a href="#contact">კონტაქტი</a>
          <div className="lang-switch">
            <button className="active">ქარ</button>
            <button>ENG</button>
            <button>РУС</button>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-texture" />
        <div className="horizon" />
        <div className="wrap hero-inner">
          <div className="eyebrow">შავი ზღვის სანაპირო · ბუკნარი</div>
          <h1>
            შენი დასვენება <em>ბუკნარის</em><br />ზღვისპირას იწყება აქ
          </h1>
          <p className="hero-sub">
            ხელით შერჩეული ვილები და სახლები ბუკნარში — ზღვის ხედით,
            მუქი ხისა და მინის არქიტექტურით. დაუკავშირდი მფლობელს პირდაპირ.
          </p>

          <div className="search-panel">
            <div className="search-field">
              <label>ლოკაცია</label>
              <select defaultValue="all">
                <option value="all">მთელი ბუკნარი</option>
                <option value="firstline">პირველი ხაზი</option>
                <option value="center">ცენტრი</option>
              </select>
            </div>
            <div className="search-field">
              <label>სტუმრები</label>
              <select defaultValue="2">
                <option value="2">2 სტუმარი</option>
                <option value="4">4 სტუმარი</option>
                <option value="6">6+ სტუმარი</option>
              </select>
            </div>
            <div className="search-field">
              <label>თარიღი</label>
              <input type="text" placeholder="აირჩიე თარიღი" />
            </div>
            <button className="search-btn">ძებნა</button>
          </div>
        </div>

        <div className="scroll-hint">
          <div className="scroll-hint-line" />
          დაათვალიერე ვილები
        </div>
      </header>

      <main className="wrap">
        <section className="section" id="listings">
          <div className="section-head">
            <div>
              <div className="section-eyebrow">ხელმისაწვდომია ახლა</div>
              <h2>რჩეული ვილები და სახლები</h2>
            </div>
            <p>ყველა განცხადება პირადად არის შემოწმებული მფლობელის მიერ, დაკავშირება — პირდაპირ WhatsApp-ით.</p>
          </div>

          {villas.length === 0 ? (
            <div className="empty-state">
              <p>ჯერ არცერთი ვილა არ არის დამატებული — მალე გამოჩნდება პირველი განცხადებები.</p>
            </div>
          ) : (
            <div className="villa-grid">
              {villas.map((villa) => {
                const photo = coverPhoto(villa);
                return (
                  <a href={`/villa/${villa.id}`} className="villa-card" key={villa.id}>
                    <div className="villa-photo">
                      <img src={photo || '/placeholder-villa.jpg'} alt={villa.title} />
                      <div className="villa-price-tag">
                        <span>₾{villa.price_per_night || '—'}</span> / ღამე
                      </div>
                    </div>
                    <div className="villa-body">
                      <div className="villa-location">{villa.location_name}</div>
                      <h3 className="villa-title">{villa.title}</h3>
                      <div className="villa-meta">
                        {villa.max_guests ? <span>👤 {villa.max_guests} სტუმარი</span> : null}
                        {villa.bedrooms ? <span>🛏 {villa.bedrooms} საძინებელი</span> : null}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        <div className="section-divider" />

        <section className="section" id="owner">
          <div className="cta-panel">
            <div className="cta-text">
              <h3>გაქვს სახლი ან ვილა ბუკნარში?</h3>
              <p>
                დაარეგისტრირე შენი ქონება რამდენიმე წუთში და დაიწყე სტუმრების მიღება.
                უფასოა, დამოწმება SMS-ით.
              </p>
            </div>
            <a href="/register" className="cta-btn">
              ვილის დამატება →
            </a>
          </div>
        </section>
      </main>

      <footer className="wrap footer" id="contact">
        <div className="footer-logo">Buknari Villa</div>
        <div className="footer-meta">© 2026 buknarivilla.ge</div>
      </footer>
    </>
  );
}
