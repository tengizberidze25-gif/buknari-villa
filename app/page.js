const demoVillas = [
  {
    id: 1,
    title: 'ზღვის ხედის ვილა, მეზონინით',
    location: 'ბუკნარი, პირველი ხაზი',
    price: 280,
    guests: 6,
    bedrooms: 3,
    img: 'https://picsum.photos/seed/buknari-villa-1/900/700',
  },
  {
    id: 2,
    title: 'მუქი ხის კოტეჯი, კერძო ეზოთი',
    location: 'ბუკნარი, ცენტრი',
    price: 190,
    guests: 4,
    bedrooms: 2,
    img: 'https://picsum.photos/seed/buknari-villa-2/900/700',
  },
  {
    id: 3,
    title: 'მინის ფასადის სახლი ზღვასთან',
    location: 'ბუკნარი, სანაპირო',
    price: 340,
    guests: 8,
    bedrooms: 4,
    img: 'https://picsum.photos/seed/buknari-villa-3/900/700',
  },
  {
    id: 4,
    title: 'პატარა საოჯახო სახლი ბაღით',
    location: 'ბუკნარი, ზემო უბანი',
    price: 130,
    guests: 3,
    bedrooms: 1,
    img: 'https://picsum.photos/seed/buknari-villa-4/900/700',
  },
  {
    id: 5,
    title: 'პანორამული ვილა აუზით',
    location: 'ბუკნარი, პირველი ხაზი',
    price: 420,
    guests: 10,
    bedrooms: 5,
    img: 'https://picsum.photos/seed/buknari-villa-5/900/700',
  },
  {
    id: 6,
    title: 'მოდერნისტული სტუდიო ზღვასთან',
    location: 'ბუკნარი, სანაპირო',
    price: 150,
    guests: 2,
    bedrooms: 1,
    img: 'https://picsum.photos/seed/buknari-villa-6/900/700',
  },
];

export default function HomePage() {
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

          <div className="villa-grid">
            {demoVillas.map((villa) => (
              <a href="#" className="villa-card" key={villa.id}>
                <div className="villa-photo">
                  <img src={villa.img} alt={villa.title} />
                  <div className="villa-price-tag">
                    <span>₾{villa.price}</span> / ღამე
                  </div>
                </div>
                <div className="villa-body">
                  <div className="villa-location">{villa.location}</div>
                  <h3 className="villa-title">{villa.title}</h3>
                  <div className="villa-meta">
                    <span>👤 {villa.guests} სტუმარი</span>
                    <span>🛏 {villa.bedrooms} საძინებელი</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
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
