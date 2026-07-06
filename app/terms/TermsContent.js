'use client';

import { useLanguage } from '../LanguageContext';
import LangSwitch from '../LangSwitch';

const CONTENT = {
  ka: {
    navHome: 'მთავარი',
    title: 'წესები და პირობები',
    updated: 'ბოლო განახლება: 2026 წლის ივლისი',
    intro:
      'buknarivilla.ge ("საიტი") სტუმრებსა და ვილების მფლობელებს უკავშირებს ერთმანეთს ბუკნარში დასასვენებლად. გთხოვთ, ჯავშნის გაკეთებამდე გაეცნოთ ქვემოთ მოცემულ წესებს.',
    sections: [
      {
        heading: 'საიტის როლი',
        paragraphs: [
          'საიტი არის დამაკავშირებელი პლატფორმა — ის არ არის ქირავნობის ხელშეკრულების მხარე. რეალური ხელშეკრულება იდება უშუალოდ სტუმარსა და ვილის მფლობელს შორის. ვილის აღწერილობის, ფასის, ფოტოებისა და ხელმისაწვდომობის სისწორეზე პასუხისმგებელია მფლობელი.',
        ],
      },
      {
        heading: 'როგორ მუშაობს ჯავშანი',
        list: [
          'თქვენ აგზავნით ჯავშნის მოთხოვნას მითითებული თარიღებით',
          'მფლობელი იღებს SMS/WhatsApp შეტყობინებას და ადასტურებს ან უარყოფს მოთხოვნას',
          'დადასტურების შემდეგ, თანხის გადახდის დეტალებზე შეთანხმება ხდება პირდაპირ მფლობელთან — საიტი გადახდას არ ამუშავებს',
        ],
      },
    ],
    cancellationHeading: 'გაუქმების პოლიტიკა',
    cancellationPre: 'ვინაიდან საიტი ონლაინ გადახდას არ ამუშავებს, ჯავშნის გაუქმება უფასოა და შესაძლებელია ნებისმიერ დროს — თქვენ მიერ მიღებული SMS ბმულით ან ',
    cancellationLinkText: '„ჩემი ჯავშნები“',
    cancellationPost: ' გვერდიდან, ტელეფონის ნომრის დადასტურების შემდეგ.',
    cancellationExtra:
      'თუ მფლობელთან ცალკე შეთანხმდით ავანსის/დეპოზიტის გადახდაზე, ამ თანხის დაბრუნების პირობებზე პასუხისმგებელია მხოლოდ მფლობელი — საიტს ამაში მონაწილეობა არ მიუღია.',
    sections2: [
      {
        heading: 'სტუმრის ვალდებულებები',
        list: [
          'მიუთითოთ ზუსტი საკონტაქტო ინფორმაცია და თარიღები',
          'დაიცვათ ვილის შიდა წესები, რასაც მფლობელი დაჯავშნისას გაცნობებთ',
          'დროულად შეატყობინოთ მფლობელს, თუ გეგმები შეიცვალა',
        ],
      },
      {
        heading: 'მფლობელის ვალდებულებები',
        list: [
          'განცხადებაში მითითებული ფასი, ფოტოები და აღწერა შეესაბამებოდეს რეალობას',
          'დროულად უპასუხოს ჯავშნის მოთხოვნებს',
          'არ დაადასტუროს ჯავშანი იმ თარიღებზე, რომლებზეც ვილა რეალურად დაკავებულია',
        ],
      },
      {
        heading: 'შეფასებები',
        paragraphs: [
          'სტუმრებს, ვისაც დადასტურებული ჯავშანი ჰქონდათ, საშუალება აქვთ დატოვონ შეფასება check-out-ის შემდეგ. შეფასება უნდა ასახავდეს რეალურ გამოცდილებას — მოგონილი ან შეურაცხმყოფელი შეფასებები წაიშლება.',
        ],
      },
      {
        heading: 'პასუხისმგებლობის შეზღუდვა',
        paragraphs: [
          'საიტი არ იძლევა გარანტიას ვილის მდგომარეობის, უსაფრთხოების ან მფლობელის/სტუმრის ქცევის შესახებ. დავის შემთხვევაში, საიტი შეძლებისდაგვარად დაეხმარება მხარეებს დაკავშირებაში, მაგრამ არ არის პასუხისმგებელი ფინანსურ ან სხვა ზიანზე, რომელიც წარმოიშვა მხარეთა შორის ურთიერთობიდან.',
        ],
      },
      {
        heading: 'ცვლილებები',
        paragraphs: [
          'ეს წესები შეიძლება დროდადრო განახლდეს. მნიშვნელოვანი ცვლილებების შემთხვევაში, თარიღი ამ გვერდის თავში განახლდება.',
        ],
      },
    ],
    contactHeading: 'დაგვიკავშირდით',
    contactPre: 'კითხვების შემთხვევაში: ',
    disclaimer:
      'ეს გვერდი ხელმისაწვდომია რამდენიმე ენაზე მოხერხებულობისთვის. დავის ან ორაზროვნების შემთხვევაში, უპირატესობა ენიჭება ქართულ ვერსიას.',
    backLink: '← მთავარ გვერდზე დაბრუნება',
    footerPrivacy: 'კონფიდენციალურობა',
  },
  en: {
    navHome: 'Home',
    title: 'Terms & Conditions',
    updated: 'Last updated: July 2026',
    intro:
      'buknarivilla.ge ("the Site") connects guests and villa owners for stays in Buknari. Please read the terms below before making a booking.',
    sections: [
      {
        heading: "The Site's role",
        paragraphs: [
          "The Site is a platform that connects guests and owners — it is not a party to the rental agreement. The actual agreement is made directly between the guest and the villa owner. The owner is responsible for the accuracy of the listing's description, price, photos, and availability.",
        ],
      },
      {
        heading: 'How a booking works',
        list: [
          'You send a booking request with your desired dates',
          'The owner receives an SMS/WhatsApp notification and confirms or declines the request',
          'Once confirmed, payment details are arranged directly with the owner — the Site does not process payments',
        ],
      },
    ],
    cancellationHeading: 'Cancellation policy',
    cancellationPre:
      'Since the Site does not process online payments, cancelling a booking is free and possible at any time — via the SMS link you received, or from the ',
    cancellationLinkText: '"My Bookings"',
    cancellationPost: ' page, after verifying your phone number.',
    cancellationExtra:
      'If you separately agreed with the owner on a deposit or advance payment, the terms of refunding that amount are the owner\'s sole responsibility — the Site is not involved in that arrangement.',
    sections2: [
      {
        heading: "Guest responsibilities",
        list: [
          'Provide accurate contact information and dates',
          "Follow the villa's house rules, which the owner will share when you book",
          'Let the owner know promptly if your plans change',
        ],
      },
      {
        heading: "Owner responsibilities",
        list: [
          'Ensure the price, photos, and description in the listing match reality',
          'Respond to booking requests in a timely manner',
          'Do not confirm a booking for dates the villa is actually unavailable',
        ],
      },
      {
        heading: 'Reviews',
        paragraphs: [
          'Guests with a confirmed booking may leave a review after check-out. Reviews should reflect a genuine experience — fabricated or abusive reviews will be removed.',
        ],
      },
      {
        heading: 'Limitation of liability',
        paragraphs: [
          "The Site does not guarantee the condition of any villa, its safety, or the conduct of owners or guests. In the event of a dispute, the Site will help put the parties in touch where possible, but is not liable for financial or other damages arising from the relationship between the parties.",
        ],
      },
      {
        heading: 'Changes',
        paragraphs: [
          'These terms may be updated from time to time. In case of significant changes, the date at the top of this page will be updated.',
        ],
      },
    ],
    contactHeading: 'Contact us',
    contactPre: 'For any questions: ',
    disclaimer:
      'This page is available in several languages for convenience. In case of any dispute or ambiguity, the Georgian version shall prevail.',
    backLink: '← Back to homepage',
    footerPrivacy: 'Privacy Policy',
  },
  ru: {
    navHome: 'Главная',
    title: 'Условия использования',
    updated: 'Последнее обновление: июль 2026',
    intro:
      'buknarivilla.ge («Сайт») соединяет гостей и владельцев вилл для отдыха в Букнари. Пожалуйста, ознакомьтесь с условиями ниже перед бронированием.',
    sections: [
      {
        heading: 'Роль сайта',
        paragraphs: [
          'Сайт является платформой, соединяющей гостей и владельцев — он не является стороной договора аренды. Реальный договор заключается напрямую между гостем и владельцем виллы. За точность описания, цены, фотографий и доступности виллы отвечает владелец.',
        ],
      },
      {
        heading: 'Как работает бронирование',
        list: [
          'Вы отправляете запрос на бронирование с желаемыми датами',
          'Владелец получает SMS/WhatsApp уведомление и подтверждает или отклоняет запрос',
          'После подтверждения детали оплаты согласовываются напрямую с владельцем — сайт не обрабатывает платежи',
        ],
      },
    ],
    cancellationHeading: 'Политика отмены',
    cancellationPre:
      'Поскольку сайт не обрабатывает онлайн-платежи, отмена брони бесплатна и возможна в любое время — по полученной SMS-ссылке или со страницы ',
    cancellationLinkText: '«Мои брони»',
    cancellationPost: ' после подтверждения номера телефона.',
    cancellationExtra:
      'Если вы отдельно договорились с владельцем об авансе/депозите, условия возврата этой суммы — исключительная ответственность владельца, сайт в этом не участвует.',
    sections2: [
      {
        heading: 'Обязанности гостя',
        list: [
          'Указывать точную контактную информацию и даты',
          'Соблюдать внутренние правила виллы, о которых сообщит владелец при бронировании',
          'Своевременно сообщать владельцу об изменении планов',
        ],
      },
      {
        heading: 'Обязанности владельца',
        list: [
          'Указанные в объявлении цена, фото и описание должны соответствовать действительности',
          'Своевременно отвечать на запросы бронирования',
          'Не подтверждать бронь на даты, когда вилла фактически занята',
        ],
      },
      {
        heading: 'Отзывы',
        paragraphs: [
          'Гости с подтверждённой бронью могут оставить отзыв после выезда. Отзыв должен отражать реальный опыт — вымышленные или оскорбительные отзывы будут удалены.',
        ],
      },
      {
        heading: 'Ограничение ответственности',
        paragraphs: [
          'Сайт не гарантирует состояние виллы, безопасность или поведение владельцев/гостей. В случае спора сайт по возможности поможет сторонам связаться друг с другом, но не несёт ответственности за финансовый или иной ущерб, возникший из отношений между сторонами.',
        ],
      },
      {
        heading: 'Изменения',
        paragraphs: [
          'Эти условия могут периодически обновляться. При существенных изменениях дата в начале страницы будет обновлена.',
        ],
      },
    ],
    contactHeading: 'Свяжитесь с нами',
    contactPre: 'По любым вопросам: ',
    disclaimer:
      'Эта страница доступна на нескольких языках для удобства. В случае спора или неоднозначности приоритет имеет грузинская версия.',
    backLink: '← Вернуться на главную',
    footerPrivacy: 'Конфиденциальность',
  },
  hy: {
    navHome: 'Գլխավոր',
    title: 'Կանոններ և պայմաններ',
    updated: 'Վերջին թարմացումը՝ հուլիս 2026',
    intro:
      'buknarivilla.ge-ը («Կայք») կապում է հյուրերին և վիլլաների սեփականատերերին Բուկնարիում հանգստի համար։ Խնդրում ենք ամրագրումից առաջ ծանոթանալ ստորև նշված կանոններին։',
    sections: [
      {
        heading: 'Կայքի դերը',
        paragraphs: [
          'Կայքը հյուրերին և սեփականատերերին կապող հարթակ է — այն վարձակալության պայմանագրի կողմ չէ։ Իրական պայմանագիրը կնքվում է ուղղակիորեն հյուրի և վիլլայի սեփականատիրոջ միջև։ Հայտարարության նկարագրության, գնի, նկարների և հասանելիության ճշգրտության համար պատասխանատու է սեփականատերը։',
        ],
      },
      {
        heading: 'Ինչպես է աշխատում ամրագրումը',
        list: [
          'Դուք ուղարկում եք ամրագրման հայտ՝ ցանկալի ամսաթվերով',
          'Սեփականատերը ստանում է SMS/WhatsApp ծանուցում և հաստատում կամ մերժում հայտը',
          'Հաստատումից հետո վճարման մանրամասները համաձայնեցվում են ուղղակիորեն սեփականատիրոջ հետ — կայքը վճարումներ չի մշակում',
        ],
      },
    ],
    cancellationHeading: 'Չեղարկման քաղաքականություն',
    cancellationPre:
      'Քանի որ կայքը առցանց վճարումներ չի մշակում, ամրագրման չեղարկումն անվճար է և հնարավոր է ցանկացած ժամանակ՝ ստացված SMS հղումով կամ ',
    cancellationLinkText: '«Իմ ամրագրումները»',
    cancellationPost: ' էջից, հեռախոսահամարի հաստատումից հետո։',
    cancellationExtra:
      'Եթե սեփականատիրոջ հետ առանձին համաձայնվել եք կանխավճարի/դեպոզիտի մասին, այդ գումարի վերադարձման պայմանների համար պատասխանատու է միայն սեփականատերը — կայքն այս հարցում չի մասնակցում։',
    sections2: [
      {
        heading: 'Հյուրի պարտականությունները',
        list: [
          'Նշեք ճշգրիտ կոնտակտային տվյալներ և ամսաթվեր',
          'Պահպանեք վիլլայի ներքին կանոնները, որոնց մասին սեփականատերը կտեղեկացնի ամրագրելիս',
          'Ժամանակին տեղեկացրեք սեփականատիրոջը, եթե ձեր ծրագրերը փոխվեն',
        ],
      },
      {
        heading: 'Սեփականատիրոջ պարտականությունները',
        list: [
          'Հայտարարության մեջ նշված գինը, նկարները և նկարագրությունը պետք է համապատասխանեն իրականությանը',
          'Ժամանակին պատասխանեք ամրագրման հայտերին',
          'Մի հաստատեք ամրագրում այն ամսաթվերի համար, երբ վիլլան իրականում զբաղված է',
        ],
      },
      {
        heading: 'Կարծիքներ',
        paragraphs: [
          'Հաստատված ամրագրում ունեցող հյուրերը կարող են կարծիք թողնել մեկնումից հետո։ Կարծիքը պետք է արտացոլի իրական փորձառություն — հորինված կամ վիրավորական կարծիքները կհեռացվեն։',
        ],
      },
      {
        heading: 'Պատասխանատվության սահմանափակում',
        paragraphs: [
          'Կայքը երաշխիք չի տալիս վիլլայի վիճակի, անվտանգության կամ սեփականատերերի/հյուրերի վարքագծի վերաբերյալ։ Վեճի դեպքում կայքը հնարավորության դեպքում կօգնի կողմերին կապվել միմյանց հետ, բայց պատասխանատվություն չի կրում կողմերի հարաբերություններից բխող ֆինանսական կամ այլ վնասների համար։',
        ],
      },
      {
        heading: 'Փոփոխություններ',
        paragraphs: [
          'Այս կանոնները կարող են ժամանակ առ ժամանակ թարմացվել։ Էական փոփոխությունների դեպքում այս էջի սկզբում ամսաթիվը կթարմացվի։',
        ],
      },
    ],
    contactHeading: 'Կապվեք մեզ հետ',
    contactPre: 'Հարցերի դեպքում՝ ',
    disclaimer:
      'Այս էջը հասանելի է մի քանի լեզուներով՝ հարմարության համար։ Վեճի կամ երկիմաստության դեպքում առաջնահերթությունը տրվում է վրացերեն տարբերակին։',
    backLink: '← Վերադառնալ գլխավոր էջ',
    footerPrivacy: 'Գաղտնիության քաղաքականություն',
  },
};

export default function TermsContent() {
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
          <div key={`a-${i}`}>
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
          </div>
        ))}

        <h2>{c.cancellationHeading}</h2>
        <p>
          {c.cancellationPre}
          <a href="/my-bookings">{c.cancellationLinkText}</a>
          {c.cancellationPost}
        </p>
        <p>{c.cancellationExtra}</p>

        {c.sections2.map((s, i) => (
          <div key={`b-${i}`}>
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
        <a href="/privacy" className="footer-email">{c.footerPrivacy}</a>
        <div className="footer-meta">© 2026 buknarivilla.ge</div>
      </footer>
    </div>
  );
}
