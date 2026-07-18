'use client';

import { useLanguage } from '../../LanguageContext';
import LangSwitch from '../../LangSwitch';
import { localizedHref } from '../../localizedHref';

const CONTENT = {
  ka: {
    navHome: 'მთავარი',
    title: 'გზამკვლევი სტუმრებისთვის',
    updated: 'ბოლო განახლება: 2026 წლის ივლისი',
    intro:
      'ეს გვერდი გიხსნით, რას შეხვდებით buknarivilla.ge-ზე — ვილის დათვალიერებიდან დაჯავშნის დადასტურებამდე — და როგორ გამოიყენოთ საიტის ყველა ფუნქცია მაქსიმალურად.',
    sections: [
      {
        heading: '1. ვილის დათვალიერება',
        paragraphs: [
          'ვილის გვერდზე შესვლისთანავე დაინახავთ ცოცხალ, ნელა "მოძრავ" ფოტო-გალერეას — ეს განზრახ ეფექტია, არა ტექნიკური ხარვეზი. თუ სურათზე დააჭერთ, იხსნება სრულეკრანიანი ხედვა.',
        ],
        list: [
          '„ახლა ამდენი ადამიანი ათვალიერებს" — თუ ეს ბეჯი გამოჩნდა, ეს ნიშნავს, რომ სინამდვილეში სხვა სტუმრებიც ერთდროულად ათვალიერებენ ამ ვილას. რეალურ მონაცემზეა დაფუძნებული.',
          '„ბოლო 48 საათში ნახეს" და „ბოლო ჯავშანი" — დამატებითი ნიშნულები იმის შესახებ, რამდენად აქტიურად ინტერესდებიან ამ ვილით.',
          'მზის ჩასვლის Countdown — ცოცხლად ითვლის, რამდენი დრო დარჩა მზის ჩასვლემდე ვილის ზუსტ მდებარეობაზე.',
        ],
      },
      {
        heading: '2. რუკა და მდებარეობა',
        paragraphs: [
          'ვილის გვერდზე ჩართული რუკა გაძლევთ საშუალებას ნახოთ ზუსტი მდებარეობა. თუ ხედავთ ღილაკს „🏔️ 3D ხედი", დააჭირეთ — რუკა გადავა მოცულობით, ბრუნვად ხედვაზე. ეს ფუნქცია სრულად არის დამოკიდებული Google-ის მონაცემებზე კონკრეტულ ლოკაციაზე — ზოგან მუშაობს, ზოგან ჯერ არა.',
        ],
      },
      {
        heading: '3. ფასის გაგება',
        paragraphs: [
          'თარიღების არჩევისთანავე, გვერდზე გამოჩნდება სრული "ფასის დეტალები" ბარათი — არა უბრალოდ ერთი რიცხვი. შესაძლოა დაინახოთ რამდენიმე ხაზი:',
        ],
        list: [
          'ფასი ღამეში × ღამეების რაოდენობა — საბაზისო გამოთვლა',
          '(მოიცავს მაღალი სეზონის ფასს) — თუ თქვენი თარიღები მაღალ სეზონს ეხება, ავტომატურად გამოიყენება შესაბამისი ფასი',
          'ხანგრძლივი ყოფნის ფასდაკლება — ზოგიერთ ვილას აქვს ავტომატური ფასდაკლება გრძელვადიან ჯავშანზე',
          '🎁 სარეფერალო ფასდაკლება — თუ მეგობრის ბმულით მოხვდით საიტზე, ავტომატურად ჩაითვლება ფასდაკლება',
          '🎉 თქვენი მოწვევის ჯილდო — თუ თქვენ თვითონ მოიწვიეთ ვინმე და ისინი დაჯავშნენ, ჯილდო აქ ავტომატურად ჩაითვლება',
        ],
        paragraphsAfter: [
          'ყველა ფასდაკლება ერთმანეთს ემატება საბოლოო ჯამში. ეს ფასი ინფორმაციულია — საბოლოო თანხაზე ყოველთვის შეთანხმდებით მფლობელთან პირდაპირ.',
        ],
      },
      {
        heading: '4. კითხვების დასმა — AI კონსიერჟი',
        paragraphs: [
          'ეკრანის ქვედა მარჯვენა კუთხეში დაინახავთ 💬 ღილაკს. დააჭირეთ და დაწერეთ ნებისმიერი კითხვა ვილის შესახებ — მდებარეობა, წესები, სტუმრების რაოდენობა, გაუქმების პირობები და სხვ. პასუხი მოდის მყისიერად, ვილის რეალურ მონაცემებზე დაყრდნობით.',
        ],
      },
      {
        heading: '5. დაჯავშნის პროცესი',
        paragraphs: ['ორი გზა გაქვთ ჯავშნის გასაკეთებლად:'],
        list: [
          'ჩვეულებრივი ფორმა — აირჩიეთ თარიღები, შეავსეთ სახელი, ტელეფონი, დააჭირეთ "ჯავშნის მოთხოვნის გაგზავნა". მფლობელი დაგიკავშირდებათ დასადასტურებლად.',
          '💬 დაჯავშნა WhatsApp-ზე — თუ თარიღები უკვე აირჩიეთ, ეს ღილაკი პირდაპირ ხსნის WhatsApp-ს, უკვე შევსებული შეტყობინებით.',
        ],
        paragraphsAfter: [
          'ჯავშნის მოთხოვნის გაგზავნისთანავე მიიღებთ SMS-ს დადასტურებით და გაუქმების ბმულით.',
        ],
      },
      {
        heading: '6. სარეფერალო სისტემა — გააზიარეთ და მიიღეთ ფასდაკლება',
        list: [
          'თუ მეგობრის ბმულით მოხვდით საიტზე, თქვენს ჯავშანზე ავტომატურად ჩაირთვება ფასდაკლება.',
          'თუ თქვენ მოიწვიეთ მეგობარი — თქვენი ბმული გამოგეგზავნებათ SMS-ით დასვენების დასრულების შემდეგ. გააზიარეთ ეს ბმული — მეგობრის პირველი ჯავშნის შემდეგ, თქვენ ავტომატურად მიიღებთ ფასდაკლებას.',
        ],
      },
      {
        heading: '7. ჯავშნის დადასტურების შემდეგ',
        paragraphs: [
          'წარმატებული ჯავშნის მოთხოვნის შემდეგ, ეკრანზე ავტომატურად გენერირდება ლამაზი "სამოგზაურო ბარათი" — ვილის ფოტოთი და თქვენი თარიღებით.',
        ],
        list: ['⬇ გადმოწერა — შეინახოთ სურათი ტელეფონში', '↗ გაზიარება — გააზიაროთ პირდაპირ Instagram/WhatsApp Stories-ზე'],
      },
      {
        heading: '8. საიტის აპლიკაციად დაყენება',
        paragraphs: ['buknarivilla.ge შეგიძლიათ დააყენოთ ტელეფონზე, როგორც ნამდვილი აპლიკაცია:'],
        list: [
          'Android/Chrome — მენიუდან აირჩიეთ "Install app" ან "Add to Home Screen"',
          'iPhone/Safari — Share ღილაკიდან აირჩიეთ "Add to Home Screen"',
        ],
      },
    ],
    questionsHeading: 'კითხვები?',
    questionsText: 'თუ რაიმე ბუნდოვანია, დაუკავშირდით კონკრეტული ვილის მფლობელს — მისი საკონტაქტო ინფორმაცია ხელმისაწვდომია ვილის გვერდზე.',
    backLink: '← მთავარ გვერდზე დაბრუნება',
  },

  en: {
    navHome: 'Home',
    title: 'Guest Guide',
    updated: 'Last updated: July 2026',
    intro:
      'This page explains what to expect on buknarivilla.ge — from browsing a villa to confirming your booking — and how to get the most out of every feature.',
    sections: [
      {
        heading: '1. Browsing a villa',
        paragraphs: [
          "As soon as you open a villa page, you'll notice a living, slowly-moving photo gallery — that's intentional, not a bug. Click a photo to open the full-screen view.",
        ],
        list: [
          '"X people are looking at this right now" — if this badge appears, it means other guests are genuinely browsing this villa at the same time. Based on real data.',
          '"Viewed X times in the last 48h" and "Booked Xh ago" — additional trust signals based on real activity.',
          "Sunset countdown — ticks live, showing how long until sunset at the villa's exact location.",
        ],
      },
      {
        heading: '2. Map and location',
        paragraphs: [
          'The map on the villa page shows the exact location. If you see a "🏔️ 3D View" button, tap it — the map switches to a tilted, rotating 3D view. This depends entirely on Google\'s data for that specific spot — it works in some places, not yet in others.',
        ],
      },
      {
        heading: '3. Understanding the price',
        paragraphs: [
          "As soon as you pick dates, a full price breakdown appears — not just one number. You may see several lines:",
        ],
        list: [
          'Price per night × nights — the base calculation',
          "(includes high season pricing) — if your dates fall in high season, the correct rate is applied automatically",
          'Long-stay discount — some villas offer an automatic discount for longer bookings',
          "🎁 Referral discount — if you arrived via a friend's link, a discount is applied automatically",
          '🎉 Your referral reward — if you referred someone who booked, your reward is applied automatically here',
        ],
        paragraphsAfter: [
          "All discounts stack in the final total. This price is informational — the final amount is always confirmed directly with the owner.",
        ],
      },
      {
        heading: '4. Asking questions — AI Concierge',
        paragraphs: [
          "In the bottom-right corner you'll see a 💬 button. Tap it and ask anything about the villa — location, rules, guest capacity, cancellation policy, and more. Answers come instantly, grounded in the villa's real data.",
        ],
      },
      {
        heading: '5. Making a booking',
        paragraphs: ['There are two ways to book:'],
        list: [
          'Standard form — pick dates, fill in your name and phone, tap "Send booking request." The owner will contact you to confirm.',
          '💬 Book via WhatsApp — once dates are picked, this button opens WhatsApp with a pre-filled message.',
        ],
        paragraphsAfter: ["As soon as you submit a request, you'll get an SMS confirmation with a cancellation link."],
      },
      {
        heading: '6. Referral program — share and save',
        list: [
          "If you arrived via a friend's link, a discount is automatically applied to your booking.",
          "If you referred a friend — your personal link is sent by SMS after your stay is complete. Share it — after your friend's first booking, you automatically get a discount on your next stay.",
        ],
      },
      {
        heading: '7. After your booking is confirmed',
        paragraphs: [
          'After a successful booking request, a shareable "travel postcard" is generated on screen — with the villa\'s photo and your dates.',
        ],
        list: ['⬇ Download — save the image to your phone', '↗ Share — share directly to Instagram/WhatsApp Stories'],
      },
      {
        heading: '8. Installing the site as an app',
        paragraphs: ['You can install buknarivilla.ge on your phone like a real app:'],
        list: [
          'Android/Chrome — choose "Install app" or "Add to Home Screen" from the menu',
          'iPhone/Safari — choose "Add to Home Screen" from the Share button',
        ],
      },
    ],
    questionsHeading: 'Questions?',
    questionsText: "If anything is unclear, contact the specific villa's owner — their contact details are available on the villa page.",
    backLink: '← Back to home',
  },

  ru: {
    navHome: 'Главная',
    title: 'Гид для гостей',
    updated: 'Последнее обновление: июль 2026',
    intro:
      'Эта страница объясняет, что вас ждёт на buknarivilla.ge — от просмотра виллы до подтверждения бронирования — и как использовать все возможности сайта.',
    sections: [
      {
        heading: '1. Просмотр виллы',
        paragraphs: [
          'Сразу при открытии страницы виллы вы увидите живую, медленно "дышащую" фотогалерею — это сделано намеренно. Нажмите на фото, чтобы открыть полноэкранный просмотр.',
        ],
        list: [
          '«Сейчас это смотрят N человек» — если значок появился, это значит, что другие гости действительно одновременно просматривают эту виллу. Основано на реальных данных.',
          '«Просмотрено N раз за 48ч» и «Забронировано Nч назад» — дополнительные признаки доверия на основе реальной активности.',
          'Обратный отсчёт до заката — считает в реальном времени, сколько осталось до заката именно в точке расположения виллы.',
        ],
      },
      {
        heading: '2. Карта и расположение',
        paragraphs: [
          'Карта на странице виллы показывает точное расположение. Если видите кнопку «🏔️ 3D вид», нажмите — карта перейдёт в наклонный, вращающийся 3D-режим. Эта функция полностью зависит от данных Google для конкретного места — где-то работает, где-то пока нет.',
        ],
      },
      {
        heading: '3. Понимание цены',
        paragraphs: [
          'Как только вы выберете даты, появится полная разбивка цены — не просто одна цифра. Возможные строки:',
        ],
        list: [
          'Цена за ночь × количество ночей — базовый расчёт',
          '(включает цену высокого сезона) — если ваши даты попадают в высокий сезон, применяется соответствующая цена',
          'Скидка за длительное проживание — на некоторых виллах доступна автоматическая скидка при долгом бронировании',
          '🎁 Реферальная скидка — если вы пришли по ссылке друга, скидка применяется автоматически',
          '🎉 Ваша реферальная награда — если вы пригласили кого-то, и они забронировали, ваша награда учитывается здесь автоматически',
        ],
        paragraphsAfter: [
          'Все скидки суммируются в итоговой сумме. Эта цена информационная — окончательная сумма всегда согласовывается напрямую с владельцем.',
        ],
      },
      {
        heading: '4. Вопросы — AI-консьерж',
        paragraphs: [
          'В правом нижнем углу экрана вы увидите кнопку 💬. Нажмите и напишите любой вопрос о вилле — расположение, правила, количество гостей, условия отмены и т.д. Ответ приходит мгновенно, на основе реальных данных виллы.',
        ],
      },
      {
        heading: '5. Процесс бронирования',
        paragraphs: ['Есть два способа забронировать:'],
        list: [
          'Обычная форма — выберите даты, укажите имя и телефон, нажмите «Отправить запрос на бронирование». Владелец свяжется с вами для подтверждения.',
          '💬 Забронировать через WhatsApp — если даты уже выбраны, эта кнопка сразу открывает WhatsApp с готовым сообщением.',
        ],
        paragraphsAfter: ['Сразу после отправки запроса вы получите SMS с подтверждением и ссылкой для отмены.'],
      },
      {
        heading: '6. Реферальная программа — делитесь и экономьте',
        list: [
          'Если вы пришли по ссылке друга, скидка автоматически применяется к вашему бронированию.',
          'Если вы пригласили друга — ваша личная ссылка придёт по SMS после завершения вашего отдыха. Поделитесь ею — после первого бронирования друга вы автоматически получите скидку на следующее проживание.',
        ],
      },
      {
        heading: '7. После подтверждения бронирования',
        paragraphs: [
          'После успешного запроса на бронирование на экране автоматически создаётся красивая «дорожная открытка» — с фото виллы и вашими датами.',
        ],
        list: ['⬇ Скачать — сохранить изображение на телефон', '↗ Поделиться — напрямую в Instagram/WhatsApp Stories'],
      },
      {
        heading: '8. Установка сайта как приложения',
        paragraphs: ['Вы можете установить buknarivilla.ge на телефон как настоящее приложение:'],
        list: [
          'Android/Chrome — выберите «Установить приложение» или «Добавить на главный экран» в меню',
          'iPhone/Safari — выберите «На экран Домой» в меню «Поделиться»',
        ],
      },
    ],
    questionsHeading: 'Вопросы?',
    questionsText: 'Если что-то неясно, свяжитесь напрямую с владельцем конкретной виллы — его контакты указаны на странице виллы.',
    backLink: '← Вернуться на главную',
  },

  hy: {
    navHome: 'Գլխավոր',
    title: 'Ուղեցույց հյուրերի համար',
    updated: 'Վերջին թարմացում՝ հուլիս 2026',
    intro:
      'Այս էջը բացատրում է, թե ինչ է ձեզ սպասվում buknarivilla.ge-ում՝ վիլլայի դիտումից մինչև ամրագրման հաստատում,- և ինչպես օգտագործել կայքի բոլոր հնարավորությունները առավելագույնս։',
    sections: [
      {
        heading: '1. Վիլլայի դիտում',
        paragraphs: [
          'Վիլլայի էջ մտնելուն պես կտեսնեք կենդանի, դանդաղ "շնչող" լուսանկարների պատկերասրահ — սա միտումնավոր է, ոչ թե սխալ։ Սեղմեք լուսանկարի վրա՝ լիաէկրան դիտման համար։',
        ],
        list: [
          '«Հիմա N մարդ դիտում է» — եթե այս կրծքանշանը հայտնվում է, դա նշանակում է, որ իրական այլ հյուրեր միաժամանակ դիտում են այս վիլլան։ Հիմնված է իրական տվյալների վրա։',
          '«Դիտվել է N անգամ վերջին 48 ժամում» և «Ամրագրվել է N ժամ առաջ» — լրացուցիչ վստահության նշաններ, հիմնված իրական ակտիվության վրա։',
          'Մայրամուտի հետհաշվարկ — կենդանի հաշվում է, թե որքան ժամանակ է մնացել մայրամուտից մինչև վիլլայի ճշգրիտ գտնվելու վայրում։',
        ],
      },
      {
        heading: '2. Քարտեզ և գտնվելու վայրը',
        paragraphs: [
          'Վիլլայի էջում ներառված քարտեզը ցույց է տալիս ճշգրիտ գտնվելու վայրը։ Եթե տեսնում եք «🏔️ 3D տեսք» կոճակը, սեղմեք — քարտեզը կանցնի ծավալային, պտտվող տեսքի։ Այս գործառույթը ամբողջությամբ կախված է Google-ի տվյալներից կոնկրետ վայրի համար։',
        ],
      },
      {
        heading: '3. Գնի հասկացում',
        paragraphs: [
          'Ամսաթվերն ընտրելուն պես էջում կհայտնվի գնի ամբողջական բաշխում — ոչ միայն մեկ թիվ։ Հնարավոր տողեր.',
        ],
        list: [
          'Գին մեկ գիշերվա համար × գիշերների քանակ — հիմնական հաշվարկ',
          '(ներառում է բարձր սեզոնի գինը) — եթե ձեր ամսաթվերը ընկնում են բարձր սեզոնում, ավտոմատ կիրառվում է համապատասխան գինը',
          'Երկարաժամկետ զեղչ — որոշ վիլլաներում կա ավտոմատ զեղչ երկարատև ամրագրման դեպքում',
          '🎁 Երաշխավորության զեղչ — եթե եկել եք ընկերոջ հղումով, զեղչը ավտոմատ կիրառվում է',
          '🎉 Ձեր հրավերի պարգևը — եթե դուք հրավիրել եք որևէ մեկին և նա ամրագրել է, ձեր պարգևը այստեղ ավտոմատ հաշվառվում է',
        ],
        paragraphsAfter: [
          'Բոլոր զեղչերը գումարվում են վերջնական գումարում։ Այս գինը տեղեկատվական է — վերջնական գումարը միշտ համաձայնեցվում է անմիջապես սեփականատիրոջ հետ։',
        ],
      },
      {
        heading: '4. Հարցեր տալը — AI կոնսիերժ',
        paragraphs: [
          'Էկրանի ներքևի աջ անկյունում կտեսնեք 💬 կոճակը։ Սեղմեք և գրեք ցանկացած հարց վիլլայի մասին — գտնվելու վայրը, կանոնները, հյուրերի քանակը, չեղարկման պայմանները և այլն։ Պատասխանը գալիս է ակնթարթորեն, հիմնված վիլլայի իրական տվյալների վրա։',
        ],
      },
      {
        heading: '5. Ամրագրման գործընթացը',
        paragraphs: ['Ամրագրելու երկու եղանակ կա.'],
        list: [
          'Սովորական ձև — ընտրեք ամսաթվերը, լրացրեք անունը և հեռախոսը, սեղմեք «Ուղարկել ամրագրման հայտը»։ Սեփականատերը կկապվի ձեզ հետ հաստատման համար։',
          '💬 Ամրագրել WhatsApp-ով — եթե ամսաթվերն արդեն ընտրված են, այս կոճակը անմիջապես բացում է WhatsApp-ը՝ պատրաստի հաղորդագրությամբ։',
        ],
        paragraphsAfter: ['Հայտն ուղարկելուն պես կստանաք SMS հաստատմամբ և չեղարկման հղումով։'],
      },
      {
        heading: '6. Երաշխավորության ծրագիր — կիսվեք և խնայեք',
        list: [
          'Եթե եկել եք ընկերոջ հղումով, զեղչը ավտոմատ կիրառվում է ձեր ամրագրման վրա։',
          'Եթե հրավիրել եք ընկերոջ — ձեր անհատական հղումը կուղարկվի SMS-ով ձեր հանգստի ավարտից հետո։ Կիսվեք դրանով — ընկերոջ առաջին ամրագրումից հետո դուք ավտոմատ կստանաք զեղչ ձեր հաջորդ գիշերակացի համար։',
        ],
      },
      {
        heading: '7. Ամրագրման հաստատումից հետո',
        paragraphs: [
          'Ամրագրման հաջող հայտից հետո էկրանին ավտոմատ ստեղծվում է գեղեցիկ «ճամփորդական բացիկ»՝ վիլլայի լուսանկարով և ձեր ամսաթվերով։',
        ],
        list: ['⬇ Ներբեռնել — պահպանել նկարը հեռախոսում', '↗ Կիսվել — կիսվել ուղղակիորեն Instagram/WhatsApp Stories-ում'],
      },
      {
        heading: '8. Կայքի տեղադրումը որպես հավելված',
        paragraphs: ['Կարող եք տեղադրել buknarivilla.ge-ը ձեր հեռախոսում որպես իրական հավելված.'],
        list: [
          'Android/Chrome — ընտրացանկից ընտրեք «Install app» կամ «Add to Home Screen»',
          'iPhone/Safari — Share կոճակից ընտրեք «Add to Home Screen»',
        ],
      },
    ],
    questionsHeading: 'Հարցեր?',
    questionsText: 'Եթե որևէ բան անհասկանալի է, կապվեք կոնկրետ վիլլայի սեփականատիրոջ հետ — նրա կոնտակտային տվյալները հասանելի են վիլլայի էջում։',
    backLink: '← Վերադառնալ գլխավոր էջ',
  },
};

export default function GuideGuestsContent() {
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
            {s.list && (
              <ul>
                {s.list.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )}
            {s.paragraphsAfter?.map((para, j) => (
              <p key={`a-${j}`}>{para}</p>
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
