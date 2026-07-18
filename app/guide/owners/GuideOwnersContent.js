'use client';

import { useLanguage } from '../../LanguageContext';
import LangSwitch from '../../LangSwitch';
import { localizedHref } from '../../localizedHref';

const CONTENT = {
  ka: {
    navHome: 'მთავარი',
    title: 'გზამკვლევი მფლობელებისთვის',
    updated: 'ბოლო განახლება: 2026 წლის ივლისი',
    intro:
      'ეს გვერდი აღწერს ყველა ინსტრუმენტს, რაც ხელმისაწვდომია თქვენი ვილის მართვისთვის buknarivilla.ge-ზე — ფასდაკლებებიდან სარეფერალო სისტემამდე.',
    sections: [
      {
        heading: '1. ვილის რედაქტირება',
        paragraphs: [
          'თქვენს ვილას რედაქტირებთ პირად ბმულზე შესვლით. ფორმაში შეგიძლიათ შეცვალოთ ფოტოები, ფასი, აღწერა, წესები და სხვა ძირითადი ინფორმაცია.',
        ],
      },
      {
        heading: '2. ფასდაკლებები',
        list: [
          'მაღალი სეზონის ფასი — თუ გსურთ სხვა ფასი კონკრეტულ პერიოდში, მიუთითეთ ცალკე სეზონური ფასი და თარიღები. ეს ავტომატურად ჩაანაცვლებს ჩვეულებრივ ფასს იმ პერიოდის ჯავშნებში.',
          'ხანგრძლივი ყოფნის ფასდაკლება — არასავალდებულო. თუ გსურთ, მიუთითეთ მინიმალური ღამეების რაოდენობა და ფასდაკლების პროცენტი. სტუმარი ავტომატურად დაინახავს ამ ფასდაკლებას. ცარიელი ველები — ფასდაკლება არ გამოჩნდება.',
        ],
      },
      {
        heading: '3. სარეფერალო სისტემა',
        paragraphs: [
          'ეს არის საიტის საერთო ფუნქცია — მუშაობს ავტომატურად ყველა ვილაზე, თუ სპეციალურად არ გამორთავთ.',
        ],
        subheading: 'როგორ მუშაობს',
        ordered: [
          'სტუმარი ჯავშნის, დასვენება რეალურად სრულდება',
          'დასვენების დასრულების მეორე დღეს, სისტემა ავტომატურად უგზავნის სტუმარს SMS-ს "შეაფასეთ დასვენება" ბმულთან ერთად, პლუს — მისი პირადი სარეფერალო ბმული',
          'სტუმარი აზიარებს ბმულს მეგობრებთან',
          'ახალი სტუმარი, ვინც ამ ბმულით მოვა, ავტომატურად ხედავს ფასდაკლებას',
          'თუ ეს ახალი სტუმარი დაჯავშნის — მომწვევს ავტომატურად ერიცხება ახალი ფასდაკლების ჯილდო შემდეგი ჯავშნისთვის',
        ],
        paragraphsAfter: [
          'თქვენი, როგორც მფლობელის, როლი მინიმალურია — მთელი პროცესი ავტომატურია. ერთადერთი, რაც გჭირდებათ: სტუმართან ფასზე შეთანხმებისას გაითვალისწინოთ ეკრანზე უკვე ნაჩვენები ფასდაკლება, თუ ჯავშნის დეტალებში ხედავთ, რომ სტუმარი მოწვეულია.',
        ],
        subheading2: 'თუ არ გსურთ მონაწილეობა',
        paragraphs2: [
          'ვილის რედაქტირების ფორმაში იხილავთ checkbox-ს "სარეფერალო სისტემის გამორთვა" — თუ მონიშნავთ, თქვენს ვილაზე აღარც ფასდაკლება გამოჩნდება და აღარც ბმული გაეგზავნება იმ სტუმრებს, ვინც კონკრეტულად თქვენს ვილაზე დაისვენებენ.',
        ],
      },
      {
        heading: '4. Anti-fraud დაცვა',
        paragraphs: [
          'სარეფერალო ბმული ყოველთვის შემთხვევითი, უსახელო კოდია — არასდროს შეიცავს ტელეფონის ნომერს პირდაპირ. და, რაც მთავარია, ბმული გაიცემა მხოლოდ რეალური, დასრულებული დასვენების შემდეგ — არა უბრალო ჯავშნის მოთხოვნისას. ეს პრაქტიკულად გამორიცხავს ყალბი ჯავშნებით ბოროტად სარგებლობას.',
        ],
      },
      {
        heading: '5. AI ვირტუალური კონსიერჟი',
        paragraphs: [
          'თქვენი ვილის გვერდზე ავტომატურად მუშაობს AI ჩატი, რომელიც პასუხობს სტუმრების კითხვებზე თქვენი ვილის რეალურ მონაცემებზე დაყრდნობით. არაფერს იგონებს — თუ პასუხი არ იცის, სთავაზობს სტუმარს პირდაპირ დაგიკავშირდეთ.',
          'ეს ფუნქცია იყენებს ფასიან API-ს (Claude), ცალკე გამოყოფილი ბიუჯეტით და შეზღუდვით (მაქს. 8 შეტყობინება საათში ერთი ვიზიტორისგან).',
        ],
      },
      {
        heading: '6. სხვა ავტომატური ფუნქციები',
        list: [
          'Live ფასის კალკულატორი',
          'Ken Burns ცოცხალი გალერეა',
          '3D რუკის ხედვა',
          '"ახლა ათვალიერებენ" / "ბოლო ნახვები" ბეჯები',
          'მზის ჩასვლის Countdown',
          'გასაზიარებელი სამოგზაურო ბარათი',
          'WhatsApp მყისიერი დაჯავშნის ღილაკი',
          'Sticky Book Bar მობილურზე',
        ],
      },
      {
        heading: '7. Admin პარამეტრები',
        paragraphs: [
          'სარეფერალო ფასდაკლების საერთო პროცენტი (ნაგულისხმევად 10%) იმართება Admin პანელის "⚙ საიტის პარამეტრები" გვერდიდან — ეს ცვლილება მოქმედებს ყველა ვილაზე, გარდა იმ ვილებისა, სადაც მფლობელმა თავად გამორთო მონაწილეობა.',
        ],
      },
    ],
    questionsHeading: 'კითხვები?',
    questionsText: 'ტექნიკური თუ ზოგადი კითხვების შემთხვევაში, დაუკავშირდით Tengiz-ს პირდაპირ.',
    backLink: '← მთავარ გვერდზე დაბრუნება',
  },

  en: {
    navHome: 'Home',
    title: 'Owner Guide',
    updated: 'Last updated: July 2026',
    intro:
      "This page describes every tool available for managing your villa on buknarivilla.ge — from discounts to the referral program.",
    sections: [
      {
        heading: '1. Editing your villa',
        paragraphs: [
          'You edit your villa via your personal link. In the form you can change photos, price, description, house rules, and other core information.',
        ],
      },
      {
        heading: '2. Discounts',
        list: [
          "High season price — if you want a different price for a specific period, set a separate seasonal price and dates. It automatically replaces the regular price for bookings in that period.",
          "Long-stay discount — optional. If you want one, set a minimum number of nights and a discount percentage. Guests will automatically see this discount. Leave the fields empty and no discount will show.",
        ],
      },
      {
        heading: '3. The referral program',
        paragraphs: [
          "This is a site-wide feature — it works automatically on every villa unless you specifically opt out.",
        ],
        subheading: 'How it works',
        ordered: [
          "A guest books, and the stay actually takes place.",
          "The day after checkout, the system automatically sends the guest an SMS with a \"leave a review\" link, plus their own personal referral link.",
          'The guest shares the link with friends.',
          'A new guest who arrives via that link automatically sees a discount.',
          'If that new guest books — the referrer automatically earns a new discount reward for their next stay.',
        ],
        paragraphsAfter: [
          'Your role as an owner is minimal — the whole process is automatic. The only thing you need to do: when agreeing on a final price with a guest, take into account the discount already shown on screen if the booking details show the guest was referred.',
        ],
        subheading2: "If you'd rather not participate",
        paragraphs2: [
          'In the villa edit form you\'ll find a checkbox "Disable referral program" — if checked, neither the discount nor the referral link will apply to guests staying specifically at your villa.',
        ],
      },
      {
        heading: '4. Anti-fraud protection',
        paragraphs: [
          "A referral link is always a random, anonymous code — it never contains a phone number directly. And crucially, the link is only issued after a real, completed stay — not at the time of a simple booking request. This effectively rules out abuse via fake bookings.",
        ],
      },
      {
        heading: '5. AI virtual concierge',
        paragraphs: [
          "An AI chat automatically runs on your villa page, answering guest questions based on your villa's real data. It never makes things up — if it doesn't know the answer, it suggests the guest contact you directly.",
          'This feature uses a paid API (Claude), with a separate budget and a limit (max. 8 messages per hour per visitor).',
        ],
      },
      {
        heading: '6. Other automatic features',
        list: [
          'Live price calculator',
          'Ken Burns living gallery',
          '3D map view',
          '"Currently viewing" / "Recently viewed" badges',
          'Sunset countdown',
          'Shareable travel postcard',
          'WhatsApp instant booking button',
          'Sticky book bar on mobile',
        ],
      },
      {
        heading: '7. Admin settings',
        paragraphs: [
          'The site-wide referral discount percentage (default 10%) is managed from the Admin panel\'s "⚙ Site settings" page — this change applies to every villa, except villas where the owner has opted out.',
        ],
      },
    ],
    questionsHeading: 'Questions?',
    questionsText: 'For technical or general questions, contact Tengiz directly.',
    backLink: '← Back to home',
  },

  ru: {
    navHome: 'Главная',
    title: 'Гид для владельцев',
    updated: 'Последнее обновление: июль 2026',
    intro:
      'Эта страница описывает все инструменты, доступные для управления вашей виллой на buknarivilla.ge — от скидок до реферальной программы.',
    sections: [
      {
        heading: '1. Редактирование виллы',
        paragraphs: [
          'Вы редактируете свою виллу по личной ссылке. В форме можно изменить фотографии, цену, описание, правила и другую основную информацию.',
        ],
      },
      {
        heading: '2. Скидки',
        list: [
          'Цена высокого сезона — если хотите другую цену на определённый период, укажите отдельную сезонную цену и даты. Она автоматически заменит обычную цену для бронирований в этот период.',
          'Скидка за длительное проживание — необязательно. При желании укажите минимальное количество ночей и процент скидки. Гости автоматически увидят эту скидку. Пустые поля — скидка не отображается.',
        ],
      },
      {
        heading: '3. Реферальная программа',
        paragraphs: [
          'Это общесайтовая функция — работает автоматически на каждой вилле, если вы её специально не отключите.',
        ],
        subheading: 'Как это работает',
        ordered: [
          'Гость бронирует, и отдых действительно проходит.',
          'На следующий день после выезда система автоматически отправляет гостю SMS со ссылкой «оставить отзыв», а также его личную реферальную ссылку.',
          'Гость делится ссылкой с друзьями.',
          'Новый гость, пришедший по этой ссылке, автоматически видит скидку.',
          'Если этот новый гость бронирует — пригласившему автоматически начисляется новая скидочная награда на следующее проживание.',
        ],
        paragraphsAfter: [
          'Ваша роль как владельца минимальна — весь процесс автоматический. Единственное, что нужно: при согласовании окончательной цены с гостем учитывайте уже показанную на экране скидку, если в деталях бронирования видно, что гость был приглашён.',
        ],
        subheading2: 'Если не хотите участвовать',
        paragraphs2: [
          'В форме редактирования виллы вы найдёте чекбокс «Отключить реферальную программу» — если отметить его, ни скидка, ни реферальная ссылка не будут применяться к гостям, останавливающимся именно в вашей вилле.',
        ],
      },
      {
        heading: '4. Защита от мошенничества',
        paragraphs: [
          'Реферальная ссылка всегда представляет собой случайный, анонимный код — она никогда не содержит номер телефона напрямую. И, что важно, ссылка выдаётся только после реального, завершённого проживания — не в момент простого запроса на бронирование. Это практически исключает злоупотребление через фиктивные бронирования.',
        ],
      },
      {
        heading: '5. AI виртуальный консьерж',
        paragraphs: [
          'На странице вашей виллы автоматически работает AI-чат, который отвечает на вопросы гостей на основе реальных данных вашей виллы. Ничего не выдумывает — если не знает ответа, предлагает гостю связаться с вами напрямую.',
          'Эта функция использует платный API (Claude), с отдельным бюджетом и лимитом (макс. 8 сообщений в час с одного посетителя).',
        ],
      },
      {
        heading: '6. Другие автоматические функции',
        list: [
          'Живой калькулятор цены',
          'Живая галерея Ken Burns',
          '3D-вид карты',
          'Значки «сейчас смотрят» / «недавние просмотры»',
          'Обратный отсчёт до заката',
          'Открытка для путешествий, которой можно поделиться',
          'Кнопка мгновенного бронирования через WhatsApp',
          'Закреплённая панель бронирования на мобильных',
        ],
      },
      {
        heading: '7. Настройки Admin',
        paragraphs: [
          'Общий процент реферальной скидки (по умолчанию 10%) управляется со страницы «⚙ Настройки сайта» в Admin-панели — это изменение применяется ко всем виллам, кроме тех, где владелец отключил участие.',
        ],
      },
    ],
    questionsHeading: 'Вопросы?',
    questionsText: 'По техническим или общим вопросам обращайтесь напрямую к Tengiz.',
    backLink: '← Вернуться на главную',
  },

  hy: {
    navHome: 'Գլխավոր',
    title: 'Ուղեցույց սեփականատերերի համար',
    updated: 'Վերջին թարմացում՝ հուլիս 2026',
    intro:
      'Այս էջը նկարագրում է բոլոր գործիքները, որոնք հասանելի են ձեր վիլլան կառավարելու համար buknarivilla.ge-ում՝ զեղչերից մինչև երաշխավորության ծրագիրը։',
    sections: [
      {
        heading: '1. Վիլլայի խմբագրում',
        paragraphs: [
          'Դուք խմբագրում եք ձեր վիլլան անհատական հղումով մուտք գործելով։ Ձևում կարող եք փոխել լուսանկարները, գինը, նկարագրությունը, կանոնները և այլ հիմնական տեղեկություններ։',
        ],
      },
      {
        heading: '2. Զեղչեր',
        list: [
          'Բարձր սեզոնի գին — եթե ցանկանում եք այլ գին կոնկրետ ժամանակահատվածում, նշեք առանձին սեզոնային գին և ամսաթվեր։ Դա ավտոմատ կփոխարինի սովորական գինը այդ ժամանակահատվածի ամրագրումների համար։',
          'Երկարաժամկետ զեղչ — ոչ պարտադիր։ Ցանկության դեպքում նշեք նվազագույն գիշերների քանակը և զեղչի տոկոսը։ Հյուրը ավտոմատ կտեսնի այս զեղչը։ Դատարկ դաշտեր — զեղչը չի հայտնվի։',
        ],
      },
      {
        heading: '3. Երաշխավորության ծրագիր',
        paragraphs: [
          'Սա կայքի ընդհանուր գործառույթ է — աշխատում է ավտոմատ յուրաքանչյուր վիլլայում, եթե դուք հատուկ չեք անջատում այն։',
        ],
        subheading: 'Ինչպես է աշխատում',
        ordered: [
          'Հյուրը ամրագրում է, և հանգիստը իրականում տեղի է ունենում։',
          'Դուրս գալուց հաջորդ օրը համակարգը ավտոմատ ուղարկում է հյուրին SMS՝ «թողեք կարծիք» հղումով, ինչպես նաև նրա անհատական երաշխավորության հղումը։',
          'Հյուրը կիսվում է հղումով ընկերների հետ։',
          'Նոր հյուրը, ով գալիս է այս հղումով, ավտոմատ տեսնում է զեղչ։',
          'Եթե այս նոր հյուրը ամրագրում է՝ հրավիրողին ավտոմատ հաշվառվում է նոր զեղչային պարգև հաջորդ գիշերակացի համար։',
        ],
        paragraphsAfter: [
          'Ձեր՝ որպես սեփականատիրոջ, դերը նվազագույն է — ամբողջ գործընթացը ավտոմատ է։ Միակ բանը, որ անհրաժեշտ է. հյուրի հետ գնի շուրջ համաձայնվելիս հաշվի առեք էկրանին արդեն ցուցադրված զեղչը, եթե ամրագրման մանրամասներում տեսնում եք, որ հյուրը հրավիրված է։',
        ],
        subheading2: 'Եթե չեք ցանկանում մասնակցել',
        paragraphs2: [
          'Վիլլայի խմբագրման ձևում կգտնեք «Անջատել երաշխավորության ծրագիրը» չեկբոքսը — եթե նշեք, ոչ զեղչը, ոչ էլ հղումը չեն կիրառվի հենց ձեր վիլլայում հանգստացող հյուրերի համար։',
        ],
      },
      {
        heading: '4. Խարդախությունից պաշտպանություն',
        paragraphs: [
          'Երաշխավորության հղումը միշտ պատահական, անանուն կոդ է — երբեք ուղղակիորեն չի պարունակում հեռախոսահամար։ Եվ ամենակարևորը՝ հղումը տրվում է միայն իրական, ավարտված հանգստից հետո — ոչ թե պարզ ամրագրման հայտի պահին։ Սա գործնականում բացառում է կեղծ ամրագրումների միջոցով չարաշահումը։',
        ],
      },
      {
        heading: '5. AI վիրտուալ կոնսիերժ',
        paragraphs: [
          'Ձեր վիլլայի էջում ավտոմատ աշխատում է AI չաթ, որը պատասխանում է հյուրերի հարցերին՝ հիմնվելով ձեր վիլլայի իրական տվյալների վրա։ Ոչինչ չի հորինում — եթե պատասխանը չգիտի, առաջարկում է հյուրին ուղղակիորեն կապվել ձեզ հետ։',
          'Այս գործառույթն օգտագործում է վճարովի API (Claude), առանձին բյուջեով և սահմանաչափով (առավելագույնը՝ 8 հաղորդագրություն ժամում մեկ այցելուից)։',
        ],
      },
      {
        heading: '6. Այլ ավտոմատ գործառույթներ',
        list: [
          'Կենդանի գնի հաշվիչ',
          'Ken Burns կենդանի պատկերասրահ',
          '3D քարտեզի տեսք',
          '«Հիմա դիտում են» / «Վերջին դիտումներ» կրծքանշաններ',
          'Մայրամուտի հետհաշվարկ',
          'Կիսվող ճամփորդական բացիկ',
          'WhatsApp ակնթարթային ամրագրման կոճակ',
          'Կպչուն ամրագրման վահանակ բջջայինում',
        ],
      },
      {
        heading: '7. Admin կարգավորումներ',
        paragraphs: [
          'Երաշխավորության զեղչի ընդհանուր տոկոսը (լռելյայն՝ 10%) կառավարվում է Admin վահանակի «⚙ Կայքի կարգավորումներ» էջից — այս փոփոխությունը կիրառվում է բոլոր վիլլաների վրա, բացառությամբ այն վիլլաների, որտեղ սեփականատերն ինքն է անջատել մասնակցությունը։',
        ],
      },
    ],
    questionsHeading: 'Հարցեր?',
    questionsText: 'Տեխնիկական կամ ընդհանուր հարցերի դեպքում կապվեք ուղղակիորեն Tengiz-ի հետ։',
    backLink: '← Վերադառնալ գլխավոր էջ',
  },
};

export default function GuideOwnersContent() {
  const { lang } = useLanguage();
  const c = CONTENT[lang] || CONTENT.ka;

  return (
    <div className="legal-page">
      <nav className="nav">
        <a href={localizedHref('/', lang)} className="nav-logo">
          <img src="/logo-nav.png" alt="Buknari Villa" style={{ height: '56px', width: 'auto' }} />
        </a>
        <div className="nav-links">
          <a href={localizedHref('/', lang)}>{c.navHome}</a>
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
            {s.paragraphs?.map((para, j) => (
              <p key={j}>{para}</p>
            ))}
            {s.subheading && <h3 style={{ fontSize: '17px', margin: '20px 0 8px' }}>{s.subheading}</h3>}
            {s.ordered && (
              <ol>
                {s.ordered.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ol>
            )}
            {s.list && (
              <ul>
                {s.list.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )}
            {s.paragraphsAfter?.map((para, j) => (
              <p key={`a-${j}`}>
                <strong>{para}</strong>
              </p>
            ))}
            {s.subheading2 && <h3 style={{ fontSize: '17px', margin: '20px 0 8px' }}>{s.subheading2}</h3>}
            {s.paragraphs2?.map((para, j) => (
              <p key={`b-${j}`}>{para}</p>
            ))}
          </div>
        ))}

        <h2>{c.questionsHeading}</h2>
        <p>{c.questionsText}</p>

        <p className="legal-back">
          <a href={localizedHref('/', lang)}>{c.backLink}</a>
        </p>
      </main>

      <footer className="wrap footer">
        <div className="footer-logo">Buknari Villa</div>
        <a href="mailto:info@buknarivilla.ge" className="footer-email">info@buknarivilla.ge</a>
        <div className="footer-meta">© 2026 buknarivilla.ge</div>
      </footer>
    </div>
  );
}
