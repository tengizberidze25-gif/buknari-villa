'use client';

import { useLanguage } from '../LanguageContext';
import LangSwitch from '../LangSwitch';

const CONTENT = {
  ka: {
    navHome: 'მთავარი',
    title: 'კონფიდენციალურობის პოლიტიკა',
    updated: 'ბოლო განახლება: 2026 წლის ივლისი',
    intro:
      'buknarivilla.ge ("საიტი") პატივს სცემს მომხმარებელთა კონფიდენციალურობას. ეს გვერდი მარტივად აღწერს, რა მონაცემებს ვაგროვებთ, რატომ, და ვის გადაეცემა ისინი.',
    sections: [
      {
        heading: 'რა მონაცემებს ვაგროვებთ',
        paragraphs: [
          'ვილის დაჯავშნისას: სახელი, ტელეფონის ნომერი, სასურველი თარიღები და დამატებითი კომენტარი, თუ დატოვებთ.',
          'მფლობელის რეგისტრაციისას: ტელეფონის ნომერი, სახელი (თუ მიუთითებთ), ვილის დეტალები და ფოტოები, რომლებსაც თავად ტვირთავთ.',
          'საიტზე სტუმრობისას: ზოგადი, პიროვნების იდენტიფიცირებას არ დაქვემდებარებული სტატისტიკა — რომელ გვერდებს სტუმრობთ, საიდან მოხვდით საიტზე, მოწყობილობის/ბრაუზერის ტიპი (Google Analytics-ის მეშვეობით).',
        ],
      },
      {
        heading: 'როგორ ვიყენებთ თქვენს მონაცემებს',
        list: [
          'ჯავშნის დასადასტურებლად და მასზე დასაკავშირებლად SMS-ის ან WhatsApp-ის მეშვეობით',
          'ტელეფონის ნომრის დასადასტურებლად SMS-კოდით (OTP), სისტემაში შესვლისას',
          'ვილის განცხადების გამოსაქვეყნებლად და მართვისთვის',
          'საიტის გაუმჯობესებისთვის — რომელი გვერდები მუშაობს კარგად, სად სჭირდება ცვლილება',
        ],
        after: 'თქვენი მონაცემები არასდროს გაიყიდება ან გადაეცემა მესამე მხარეს სარეკლამო მიზნით.',
      },
      {
        heading: 'მესამე მხარის სერვისები',
        paragraphs: ['საიტის მუშაობისთვის ვიყენებთ შემდეგ სერვისებს, თითოეული საკუთარი კონფიდენციალურობის პოლიტიკით:'],
        list: [
          'Supabase — მონაცემთა ბაზა და ფოტოების შენახვა (სერვერები — ფრანკფურტი, გერმანია)',
          'bulksms.ge — SMS შეტყობინებების (OTP კოდები, ჯავშნის დადასტურებები) გაგზავნა',
          'Google Analytics — ანონიმური სტატისტიკა საიტის ვიზიტორების შესახებ',
          'Anthropic (Claude) — ვილის აღწერილობების ავტომატური თარგმნა უცხო ენებზე',
          'Vercel — საიტის ჰოსტინგი',
        ],
      },
      {
        heading: 'Cookies',
        paragraphs: [
          'საიტი იყენებს მინიმალურ, ტექნიკურად აუცილებელ მონაცემებს ბრაუზერის localStorage-ში (თქვენი სესიის შესანარჩუნებლად — რომ არ დაგჭირდეთ ყოველ ჯერზე ხელახლა შესვლა), და Google Analytics-ის cookies-ს ანონიმური სტატისტიკისთვის.',
        ],
      },
      {
        heading: 'მონაცემთა შენახვა და წაშლა',
        paragraphs: [
          'თქვენი მონაცემები ინახება მანამ, სანამ თქვენი ანგარიში/ჯავშანი აქტიურია. თუ გსურთ თქვენი მონაცემების წაშლა (მაგ. ჯავშნის ისტორია ან მფლობელის ანგარიში), დაგვიკავშირდით ქვემოთ მითითებულ ელ-ფოსტაზე.',
        ],
      },
      {
        heading: 'უსაფრთხოება',
        paragraphs: [
          'სისტემაში შესვლა ხდება მხოლოდ ტელეფონის ნომრის დადასტურებით (SMS კოდი) — პაროლები საერთოდ არ გამოიყენება და არ ინახება. ყველა სესია დაცულია კრიპტოგრაფიული ხელმოწერით.',
        ],
      },
    ],
    contactHeading: 'დაგვიკავშირდით',
    contactPre: 'კითხვების შემთხვევაში, დაგვიწერეთ: ',
    disclaimer:
      'ეს გვერდი ხელმისაწვდომია რამდენიმე ენაზე მოხერხებულობისთვის. დავის ან ორაზროვნების შემთხვევაში, უპირატესობა ენიჭება ქართულ ვერსიას.',
    backLink: '← მთავარ გვერდზე დაბრუნება',
    footerTerms: 'წესები და პირობები',
  },
  en: {
    navHome: 'Home',
    title: 'Privacy Policy',
    updated: 'Last updated: July 2026',
    intro:
      'buknarivilla.ge ("the Site") respects your privacy. This page explains, in plain terms, what data we collect, why, and who it is shared with.',
    sections: [
      {
        heading: 'What data we collect',
        paragraphs: [
          'When booking a villa: your name, phone number, requested dates, and any additional message you leave.',
          "When registering as an owner: your phone number, name (if provided), villa details, and the photos you upload.",
          'When browsing the site: general, non-identifying statistics — which pages you visit, where you came from, and your device/browser type (via Google Analytics).',
        ],
      },
      {
        heading: 'How we use your data',
        list: [
          'To confirm your booking and contact you via SMS or WhatsApp',
          'To verify your phone number with an SMS code (OTP) when logging in',
          'To publish and manage villa listings',
          'To improve the site — understanding which pages work well and where changes are needed',
        ],
        after: 'Your data is never sold or shared with third parties for advertising purposes.',
      },
      {
        heading: 'Third-party services',
        paragraphs: ['We rely on the following services to run the site, each governed by its own privacy policy:'],
        list: [
          'Supabase — database and photo storage (servers located in Frankfurt, Germany)',
          'bulksms.ge — sending SMS messages (OTP codes, booking confirmations)',
          'Google Analytics — anonymous visitor statistics',
          'Anthropic (Claude) — automatic translation of villa descriptions',
          'Vercel — site hosting',
        ],
      },
      {
        heading: 'Cookies',
        paragraphs: [
          'The site uses minimal, technically necessary data in your browser\'s localStorage (to keep you signed in without repeated logins), along with Google Analytics cookies for anonymous statistics.',
        ],
      },
      {
        heading: 'Data retention and deletion',
        paragraphs: [
          'Your data is kept for as long as your account or booking remains active. If you would like your data deleted (e.g. booking history or an owner account), contact us at the email below.',
        ],
      },
      {
        heading: 'Security',
        paragraphs: [
          'Sign-in works only through phone number verification (SMS code) — passwords are never used or stored. All sessions are protected with cryptographic signatures.',
        ],
      },
    ],
    contactHeading: 'Contact us',
    contactPre: 'For any questions, write to us at: ',
    disclaimer:
      'This page is available in several languages for convenience. In case of any dispute or ambiguity, the Georgian version shall prevail.',
    backLink: '← Back to homepage',
    footerTerms: 'Terms & Conditions',
  },
  ru: {
    navHome: 'Главная',
    title: 'Политика конфиденциальности',
    updated: 'Последнее обновление: июль 2026',
    intro:
      'buknarivilla.ge («Сайт») уважает конфиденциальность своих пользователей. На этой странице простым языком объясняется, какие данные мы собираем, зачем, и кому они передаются.',
    sections: [
      {
        heading: 'Какие данные мы собираем',
        paragraphs: [
          'При бронировании виллы: имя, номер телефона, желаемые даты и дополнительный комментарий, если вы его оставите.',
          'При регистрации владельца: номер телефона, имя (если указано), данные виллы и фотографии, которые вы загружаете.',
          'При посещении сайта: обезличенная статистика — какие страницы вы посещаете, откуда пришли на сайт, тип устройства/браузера (через Google Analytics).',
        ],
      },
      {
        heading: 'Как мы используем ваши данные',
        list: [
          'Для подтверждения брони и связи с вами через SMS или WhatsApp',
          'Для подтверждения номера телефона SMS-кодом (OTP) при входе',
          'Для публикации и управления объявлениями вилл',
          'Для улучшения сайта — понимания, какие страницы работают хорошо и что нужно изменить',
        ],
        after: 'Ваши данные никогда не продаются и не передаются третьим лицам в рекламных целях.',
      },
      {
        heading: 'Сторонние сервисы',
        paragraphs: ['Для работы сайта мы используем следующие сервисы, каждый со своей политикой конфиденциальности:'],
        list: [
          'Supabase — база данных и хранение фотографий (серверы во Франкфурте, Германия)',
          'bulksms.ge — отправка SMS-сообщений (коды OTP, подтверждения бронирования)',
          'Google Analytics — анонимная статистика посетителей сайта',
          'Anthropic (Claude) — автоматический перевод описаний вилл',
          'Vercel — хостинг сайта',
        ],
      },
      {
        heading: 'Cookies',
        paragraphs: [
          'Сайт использует минимальные, технически необходимые данные в localStorage вашего браузера (чтобы вы оставались в системе без повторного входа), а также cookies Google Analytics для анонимной статистики.',
        ],
      },
      {
        heading: 'Хранение и удаление данных',
        paragraphs: [
          'Ваши данные хранятся, пока ваш аккаунт или бронь активны. Если вы хотите удалить свои данные (например, историю бронирований или аккаунт владельца), напишите нам на указанный ниже email.',
        ],
      },
      {
        heading: 'Безопасность',
        paragraphs: [
          'Вход в систему возможен только через подтверждение номера телефона (SMS-код) — пароли не используются и не хранятся. Все сессии защищены криптографической подписью.',
        ],
      },
    ],
    contactHeading: 'Свяжитесь с нами',
    contactPre: 'По любым вопросам пишите: ',
    disclaimer:
      'Эта страница доступна на нескольких языках для удобства. В случае спора или неоднозначности приоритет имеет грузинская версия.',
    backLink: '← Вернуться на главную',
    footerTerms: 'Условия использования',
  },
  hy: {
    navHome: 'Գլխավոր',
    title: 'Գաղտնիության քաղաքականություն',
    updated: 'Վերջին թարմացումը՝ հուլիս 2026',
    intro:
      'buknarivilla.ge-ը («Կայք») հարգում է օգտատերերի գաղտնիությունը։ Այս էջը պարզ լեզվով բացատրում է, թե ինչ տվյալներ ենք հավաքում, ինչու, և ում ենք դրանք փոխանցում։',
    sections: [
      {
        heading: 'Ինչ տվյալներ ենք հավաքում',
        paragraphs: [
          'Վիլլայի ամրագրման ժամանակ՝ անուն, հեռախոսահամար, ցանկալի ամսաթվեր և լրացուցիչ մեկնաբանություն, եթե թողնեք։',
          'Սեփականատիրոջ գրանցման ժամանակ՝ հեռախոսահամար, անուն (եթե նշված է), վիլլայի մանրամասներ և նկարներ, որոնք դուք վերբեռնում եք։',
          'Կայք այցելելիս՝ ընդհանուր, ոչ նույնականացնող վիճակագրություն՝ որ էջեր եք այցելում, որտեղից եք եկել, սարքի/բրաուզերի տեսակը (Google Analytics-ի միջոցով)։',
        ],
      },
      {
        heading: 'Ինչպես ենք օգտագործում ձեր տվյալները',
        list: [
          'Ամրագրումը հաստատելու և ձեզ հետ SMS-ով կամ WhatsApp-ով կապվելու համար',
          'Մուտք գործելիս հեռախոսահամարը SMS կոդով (OTP) հաստատելու համար',
          'Վիլլայի հայտարարությունը հրապարակելու և կառավարելու համար',
          'Կայքը բարելավելու համար՝ հասկանալու, թե որ էջերն են լավ աշխատում և որտեղ են փոփոխություններ անհրաժեշտ',
        ],
        after: 'Ձեր տվյալները երբեք չեն վաճառվում կամ փոխանցվում երրորդ կողմերին գովազդային նպատակներով։',
      },
      {
        heading: 'Երրորդ կողմի ծառայություններ',
        paragraphs: ['Կայքի աշխատանքի համար օգտագործում ենք հետևյալ ծառայությունները, յուրաքանչյուրն իր գաղտնիության քաղաքականությամբ.'],
        list: [
          'Supabase — տվյալների բազա և նկարների պահպանում (սերվերներ՝ Ֆրանկֆուրտ, Գերմանիա)',
          'bulksms.ge — SMS հաղորդագրությունների (OTP կոդեր, ամրագրման հաստատումներ) ուղարկում',
          'Google Analytics — կայքի այցելուների անանուն վիճակագրություն',
          'Anthropic (Claude) — վիլլաների նկարագրությունների ավտոմատ թարգմանություն',
          'Vercel — կայքի հոսթինգ',
        ],
      },
      {
        heading: 'Cookies',
        paragraphs: [
          'Կայքն օգտագործում է նվազագույն, տեխնիկապես անհրաժեշտ տվյալներ ձեր բրաուզերի localStorage-ում (ձեր սեսիան պահպանելու համար՝ որպեսզի ամեն անգամ նորից մուտք չգործեք), ինչպես նաև Google Analytics cookies՝ անանուն վիճակագրության համար։',
        ],
      },
      {
        heading: 'Տվյալների պահպանում և ջնջում',
        paragraphs: [
          'Ձեր տվյալները պահվում են այնքան ժամանակ, քանի դեռ ձեր հաշիվը կամ ամրագրումն ակտիվ է։ Եթե ցանկանում եք ջնջել ձեր տվյալները (օրինակ՝ ամրագրումների պատմությունը կամ սեփականատիրոջ հաշիվը), գրեք մեզ ստորև նշված էլ. փոստին։',
        ],
      },
      {
        heading: 'Անվտանգություն',
        paragraphs: [
          'Համակարգ մուտք գործելը հնարավոր է միայն հեռախոսահամարի հաստատմամբ (SMS կոդ) — գաղտնաբառեր երբեք չեն օգտագործվում կամ պահվում։ Բոլոր սեսիաները պաշտպանված են կրիպտոգրաֆիկ ստորագրությամբ։',
        ],
      },
    ],
    contactHeading: 'Կապվեք մեզ հետ',
    contactPre: 'Հարցերի դեպքում գրեք՝ ',
    disclaimer:
      'Այս էջը հասանելի է մի քանի լեզուներով՝ հարմարության համար։ Վեճի կամ երկիմաստության դեպքում առաջնահերթությունը տրվում է վրացերեն տարբերակին։',
    backLink: '← Վերադառնալ գլխավոր էջ',
    footerTerms: 'Կանոններ և պայմաններ',
  },
};

export default function PrivacyContent() {
  const { lang } = useLanguage();
  const c = CONTENT[lang] || CONTENT.ka;

  return (
    <div className="legal-page">
      <nav className="nav">
        <a href="/" className="nav-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>
        <div className="nav-links">
          <a href="/">{c.navHome}</a>
        </div>
        <LangSwitch />
      </nav>

      <main className="wrap legal-content">
        <h1>{c.title}</h1>
        <p className="legal-updated">{c.updated}</p>

        <p>{c.intro}</p>

        {c.sections.map((s, i) => (
          <div key={i}>
            <h2>{s.heading}</h2>
            {s.paragraphs?.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
            {s.list && (
              <ul>
                {s.list.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )}
            {s.after && <p>{s.after}</p>}
          </div>
        ))}

        <h2>{c.contactHeading}</h2>
        <p>
          {c.contactPre}
          <a href="mailto:info@buknarivilla.ge">info@buknarivilla.ge</a>
        </p>

        <p className="legal-disclaimer">{c.disclaimer}</p>

        <p className="legal-back">
          <a href="/">{c.backLink}</a>
        </p>
      </main>

      <footer className="wrap footer">
        <div className="footer-logo">Buknari Villa</div>
        <a href="mailto:info@buknarivilla.ge" className="footer-email">info@buknarivilla.ge</a>
        <a href="/terms" className="footer-email">{c.footerTerms}</a>
        <div className="footer-meta">© 2026 buknarivilla.ge</div>
      </footer>
    </div>
  );
}
