import fs from "node:fs";

const path = "src/content/tutorials/modern-web.json";
const tutorial = JSON.parse(fs.readFileSync(path, "utf8"));
const aiPrompt =
  "Ben modern web gelistirmeyi Turkce ogreniyorum. Bana ipucu ver, kavrami sade anlat ve hatami bulmama yardim et.";

const sectionMap = new Map(tutorial.sections.map((section) => [section.id, section]));

function ensureSection(id, title, description, afterId) {
  if (sectionMap.has(id)) return sectionMap.get(id);
  const section = { id, title, description, lessonIds: [] };
  const index = tutorial.sections.findIndex((item) => item.id === afterId);
  tutorial.sections.splice(index >= 0 ? index + 1 : tutorial.sections.length, 0, section);
  sectionMap.set(id, section);
  return section;
}

const webCore = ensureSection(
  "web-core-deep",
  "Web çekirdeği derinleşme",
  "Request/response, dosya baglantilari ve tarayici zihinsel modeli.",
  "web"
);
const htmlDeep = ensureSection(
  "html-deep",
  "HTML derinleşme",
  "Semantik bolumler, formlar ve erisilebilir icerik.",
  "html"
);
const cssDeep = ensureSection(
  "css-deep",
  "CSS layout derinleşme",
  "Seciciler, grid, responsive dusunme ve state stilleri.",
  "css"
);
const jsDeep = ensureSection(
  "js-deep",
  "JavaScript etkileşim derinleşme",
  "DOM, event, UI state ve veri ile ekran iliskisi.",
  "javascript"
);
const reactDeep = ensureSection(
  "react-deep",
  "React derinleşme",
  "JSX, listeler, render dongusu ve component kontratlari.",
  "modern-stack"
);

function f(path, language, content) {
  return { path, language, content };
}

function contains(id, label, file, value) {
  return { id, label, type: "code-contains", file, value };
}

function regex(id, label, file, pattern) {
  return { id, label, type: "code-regex", file, pattern };
}

function preview(id, label, value) {
  return { id, label, type: "preview-contains", value };
}

function addLesson(section, lesson) {
  if (tutorial.lessons.some((item) => item.id === lesson.id)) return;
  tutorial.lessons.push({
    aiPrompt,
    walkthrough: [
      "Starter kodu oku ve eksik davranisi bul.",
      "Tek bir ana fikri degistir, baska seylere dokunma.",
      "Check sonucuyla veya preview ile neden calistigini dogrula."
    ],
    commonMistakes: [
      "Bir derste birden fazla kavrami ayni anda degistirmek.",
      "Etiket, parantez veya tirnak kapatmayi unutmak."
    ],
    glossary: [],
    ...lesson
  });
  section.lessonIds.push(lesson.id);
}

for (const lesson of tutorial.lessons) {
  lesson.mentalModel ??=
    "Bu dersi tek bir kucuk davranis gibi dusun: once kodu oku, sonra yalnizca hedeflenen parcayi degistir, en son sonucu kanitla.";
  lesson.instructorNotes ??= [
    "Ders kucuk tutulur; kullanici once kavrami gorur, sonra koda dokunur.",
    "Cozum, kullanici takildiginda hedef hali incelemesi icindir."
  ];
  lesson.walkthrough ??= [
    "Starter kodu oku.",
    "Gorevin istedigi satiri veya kucuk blogu ekle.",
    "Preview ve Check ile sonucu dogrula."
  ];
  lesson.commonMistakes ??= [
    "Gorev disindaki kodu gereksiz degistirmek.",
    "Acilan etiketi veya parantezi kapatmayi unutmak."
  ];
  lesson.glossary ??= [];
}

addLesson(webCore, {
  id: "request-response-derin",
  title: "Request ve response'u ekranda modelle",
  section: "Web çekirdeği",
  difficulty: "baslangic",
  explanation:
    "Webin en temel ritmi istek ve cevaptir. Tarayici bir kaynak ister, sunucu HTML, CSS, JS veya veri ile cevap verir.",
  mentalModel:
    "Tarayiciyi mesajci gibi dusun: adresi goturur, cevabi alir, kullaniciya okunur hale getirir.",
  learningGoals: ["Request ve response kavramlarini ayirmak", "Tarayici-sunucu iliskisini gorsellestirmek"],
  task: "Kart icine Request ve Response icin iki ayri madde ekle.",
  starterFiles: [
    f("index.html", "html", "<section class=\"flow\">\n  <h1>Web akisi</h1>\n</section>"),
    f("styles.css", "css", ".flow {\n  margin: 40px auto;\n  max-width: 520px;\n  padding: 24px;\n  border: 1px solid #d6c7b4;\n}")
  ],
  solutionFiles: [
    f("index.html", "html", "<section class=\"flow\">\n  <h1>Web akisi</h1>\n  <ol>\n    <li>Request: tarayici kaynak ister</li>\n    <li>Response: sunucu cevap verir</li>\n  </ol>\n</section>"),
    f("styles.css", "css", ".flow {\n  margin: 40px auto;\n  max-width: 520px;\n  padding: 24px;\n  border: 1px solid #d6c7b4;\n}")
  ],
  hints: ["Sirali akisi gostermek icin ol kullan.", "Iki kelime de ekranda gorunmeli."],
  checks: [contains("has-ol", "Sirali liste var", "index.html", "<ol>"), preview("has-response", "Response gorunuyor", "Response")],
  glossary: [
    { term: "Request", meaning: "Tarayicinin sunucudan istedigi kaynak." },
    { term: "Response", meaning: "Sunucunun tarayiciya verdigi cevap." }
  ]
});

addLesson(webCore, {
  id: "dosya-baglama-derin",
  title: "HTML, CSS ve JS dosyalarını bağla",
  section: "Web çekirdeği",
  difficulty: "kolay",
  explanation:
    "Gercek projelerde stiller ve davranislar ayri dosyalara bolunur. HTML, link ve script ile bu dosyalari sayfaya cagirir.",
  learningGoals: ["CSS dosyasini link ile baglamak", "JS dosyasini script ile baglamak"],
  task: "index.html icine styles.css ve script.js baglantilarini ekle.",
  starterFiles: [
    f("index.html", "html", "<html>\n  <head>\n    <title>Baglanti</title>\n  </head>\n  <body>\n    <h1>Dosyalar</h1>\n  </body>\n</html>"),
    f("styles.css", "css", "body { background: #eef8f4; }"),
    f("script.js", "javascript", "document.body.dataset.ready = 'true';")
  ],
  solutionFiles: [
    f("index.html", "html", "<html>\n  <head>\n    <title>Baglanti</title>\n    <link rel=\"stylesheet\" href=\"styles.css\">\n  </head>\n  <body>\n    <h1>Dosyalar</h1>\n    <script src=\"script.js\"></script>\n  </body>\n</html>"),
    f("styles.css", "css", "body { background: #eef8f4; }"),
    f("script.js", "javascript", "document.body.dataset.ready = 'true';")
  ],
  hints: ["CSS head icinde link etiketiyle baglanir.", "script body sonunda durabilir."],
  checks: [contains("has-stylesheet", "Stylesheet linki var", "index.html", "rel=\"stylesheet\""), contains("has-script-src", "Script src var", "index.html", "src=\"script.js\"")]
});

addLesson(htmlDeep, {
  id: "semantik-html-derin",
  title: "Div yerine semantik HTML",
  section: "HTML",
  difficulty: "kolay",
  explanation:
    "Semantik etiketler bolumun gorevini anlatir. header, main, article ve footer hem kodu hem erisilebilirligi iyilestirir.",
  mentalModel:
    "Semantik HTML, binadaki oda tabelalari gibidir. Her sey div olursa hangi odada oldugunu anlamak zorlasir.",
  learningGoals: ["header/main/footer kullanmak", "article ile icerik parcasi tanimlamak"],
  task: "Div yapisini semantik bolumlere ayir.",
  starterFiles: [f("index.html", "html", "<div>\n  <h1>Gunluk</h1>\n  <p>Bugun HTML calistim.</p>\n  <small>2026</small>\n</div>")],
  solutionFiles: [f("index.html", "html", "<header>\n  <h1>Gunluk</h1>\n</header>\n<main>\n  <article>Bugun HTML calistim.</article>\n</main>\n<footer>\n  <small>2026</small>\n</footer>")],
  hints: ["Ana gorunen icerik main icine girer.", "Alt bilgi footer icin uygundur."],
  checks: [contains("has-header", "Header var", "index.html", "<header>"), contains("has-main", "Main var", "index.html", "<main>"), contains("has-footer", "Footer var", "index.html", "<footer>")]
});

addLesson(htmlDeep, {
  id: "form-label-baglanti",
  title: "Formda label ve input bağlantısı",
  section: "HTML",
  difficulty: "orta",
  explanation:
    "Label, input alaninin ne istedigini aciklar. for ve id degerleri eslesirse tiklama ve ekran okuyucu deneyimi iyilesir.",
  learningGoals: ["label for kullanmak", "input id ile baglamak", "submit button eklemek"],
  task: "Email inputu icin label yaz ve forma submit butonu ekle.",
  starterFiles: [f("index.html", "html", "<form>\n  <input id=\"email\" type=\"email\">\n</form>")],
  solutionFiles: [f("index.html", "html", "<form>\n  <label for=\"email\">Email adresi</label>\n  <input id=\"email\" type=\"email\">\n  <button type=\"submit\">Kaydol</button>\n</form>")],
  hints: ["label for degeri input id ile ayni olmali.", "button type submit olabilir."],
  checks: [contains("has-label", "Label var", "index.html", "<label"), contains("label-for", "Label inputa bagli", "index.html", "for=\"email\""), contains("submit", "Submit butonu var", "index.html", "type=\"submit\"")]
});

addLesson(cssDeep, {
  id: "grid-responsive-derin",
  title: "Grid ile responsive kartlar",
  section: "CSS",
  difficulty: "orta",
  explanation:
    "Grid, satir ve sutunlari birlikte dusunmeni saglar. repeat, auto-fit ve minmax ile kartlar ekrana gore kirilir.",
  mentalModel:
    "Grid kareli kagittir. Kartlari sabit piksele kilitlemek yerine hucrelerin esnemesine izin verirsin.",
  learningGoals: ["display grid kullanmak", "repeat(auto-fit, minmax()) yazmak"],
  task: "Kart listesini responsive grid haline getir.",
  starterFiles: [
    f("index.html", "html", "<section class=\"cards\">\n  <article>HTML</article>\n  <article>CSS</article>\n  <article>JS</article>\n</section>"),
    f("styles.css", "css", ".cards article {\n  padding: 20px;\n  background: white;\n}")
  ],
  solutionFiles: [
    f("index.html", "html", "<section class=\"cards\">\n  <article>HTML</article>\n  <article>CSS</article>\n  <article>JS</article>\n</section>"),
    f("styles.css", "css", ".cards {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));\n  gap: 16px;\n}\n\n.cards article {\n  padding: 20px;\n  background: white;\n}")
  ],
  hints: ["Grid kapsayiciya yazilir.", "minmax en kucuk ve en buyuk kolon davranisini belirler."],
  checks: [contains("has-grid", "Grid aktif", "styles.css", "display: grid"), contains("has-template", "Kolon sablonu var", "styles.css", "grid-template-columns")]
});

addLesson(cssDeep, {
  id: "media-query-derin",
  title: "Media query ile kırılma noktası",
  section: "CSS",
  difficulty: "orta",
  explanation:
    "Responsive tasarimda mobil varsayilan olabilir. Belirli genislikten sonra media query ile layout degistirilir.",
  learningGoals: ["@media yazmak", "Mobil once dusunmek"],
  task: "Genis ekranda iki kolonlu layout ac.",
  starterFiles: [
    f("index.html", "html", "<section class=\"layout\">\n  <aside>Menu</aside>\n  <main>Icerik</main>\n</section>"),
    f("styles.css", "css", ".layout {\n  display: grid;\n  gap: 16px;\n}")
  ],
  solutionFiles: [
    f("index.html", "html", "<section class=\"layout\">\n  <aside>Menu</aside>\n  <main>Icerik</main>\n</section>"),
    f("styles.css", "css", ".layout {\n  display: grid;\n  gap: 16px;\n}\n\n@media (min-width: 760px) {\n  .layout {\n    grid-template-columns: 240px 1fr;\n  }\n}")
  ],
  hints: ["@media (min-width: 760px) ile basla.", "Sadece genis ekranda kolon tanimla."],
  checks: [contains("has-media", "Media query var", "styles.css", "@media"), contains("has-columns", "Iki kolon tanimli", "styles.css", "240px 1fr")]
});

addLesson(jsDeep, {
  id: "ui-state-toggle",
  title: "UI state ile aç/kapat",
  section: "JavaScript",
  difficulty: "orta",
  explanation:
    "State, arayuzun o anki bilgisidir. Menu acik mi, sayac kac, buton aktif mi gibi cevaplar state ile tutulur.",
  mentalModel:
    "State arayuzun hafizasidir. Hafiza degisince ekrani ona gore guncellersin.",
  learningGoals: ["Boolean state kullanmak", "classList.toggle ile ekran guncellemek"],
  task: "Butona tiklaninca panelin open classini ac/kapat.",
  starterFiles: [
    f("index.html", "html", "<button id=\"toggle\">Ac / kapa</button>\n<section class=\"panel\">Panel</section>"),
    f("styles.css", "css", ".panel { display: none; }\n.panel.open { display: block; }"),
    f("script.js", "javascript", "const button = document.querySelector('#toggle');\nconst panel = document.querySelector('.panel');\nlet open = false;")
  ],
  solutionFiles: [
    f("index.html", "html", "<button id=\"toggle\">Ac / kapa</button>\n<section class=\"panel\">Panel</section>"),
    f("styles.css", "css", ".panel { display: none; }\n.panel.open { display: block; }"),
    f("script.js", "javascript", "const button = document.querySelector('#toggle');\nconst panel = document.querySelector('.panel');\nlet open = false;\n\nbutton.addEventListener('click', () => {\n  open = !open;\n  panel.classList.toggle('open', open);\n});")
  ],
  hints: ["open = !open boolean degeri tersler.", "classList.toggle ikinci argumanla kosullu calisir."],
  checks: [contains("toggles-state", "State tersleniyor", "script.js", "open = !open"), contains("toggles-class", "Class toggle var", "script.js", "classList.toggle")]
});

addLesson(jsDeep, {
  id: "input-event-derin",
  title: "Input event ile canlı metin",
  section: "JavaScript",
  difficulty: "orta",
  explanation:
    "input eventi, kullanici yazdikca calisir. Form arayuzlerinde canli onizleme ve validasyon icin temel taslardan biridir.",
  learningGoals: ["input eventini dinlemek", "Kullanicinin yazdigi degeri okumak"],
  task: "Inputa yazilan metni preview paragrafina aninda aktar.",
  starterFiles: [
    f("index.html", "html", "<input id=\"name\" placeholder=\"Adin\">\n<p id=\"preview\">Merhaba</p>"),
    f("script.js", "javascript", "const input = document.querySelector('#name');\nconst preview = document.querySelector('#preview');")
  ],
  solutionFiles: [
    f("index.html", "html", "<input id=\"name\" placeholder=\"Adin\">\n<p id=\"preview\">Merhaba</p>"),
    f("script.js", "javascript", "const input = document.querySelector('#name');\nconst preview = document.querySelector('#preview');\n\ninput.addEventListener('input', () => {\n  preview.textContent = `Merhaba ${input.value}`;\n});")
  ],
  hints: ["Event adi input olmali.", "input.value kullanicinin yazdigi degerdir."],
  checks: [contains("has-input-listener", "Input eventi dinleniyor", "script.js", "addEventListener('input'"), contains("uses-value", "Input value okunuyor", "script.js", "input.value")]
});

addLesson(reactDeep, {
  id: "jsx-expression-derin",
  title: "JSX içinde JavaScript ifadesi",
  section: "React",
  difficulty: "kolay",
  explanation:
    "JSX HTML gibi gorunur ama suslu parantez icinde JavaScript ifadesi calistirabilir. Veri ve gorunum boyle baglanir.",
  mentalModel:
    "Suslu parantez JSX icinde acilan kucuk JavaScript penceresidir.",
  learningGoals: ["JSX icinde degisken kullanmak", "Metin ve ifadeyi birlestirmek"],
  task: "course degiskenini h1 icinde kullan.",
  starterFiles: [f("App.tsx", "tsx", "export default function App() {\n  const course = 'React';\n  return <h1>Kurs</h1>;\n}")],
  solutionFiles: [f("App.tsx", "tsx", "export default function App() {\n  const course = 'React';\n  return <h1>{course} kursu</h1>;\n}")],
  hints: ["JSX icinde {course} yaz.", "Metinle ifadeyi ayni h1 icinde kullanabilirsin."],
  checks: [contains("uses-expression", "JSX ifade kullanildi", "App.tsx", "{course}"), contains("has-variable", "course degiskeni var", "App.tsx", "const course")]
});

addLesson(reactDeep, {
  id: "react-list-key-derin",
  title: "Liste render ve key",
  section: "React",
  difficulty: "orta",
  explanation:
    "Dizi verilerini map ile JSX listesine cevirebilirsin. key, Reactin hangi satirin hangisi oldugunu takip etmesini saglar.",
  mentalModel:
    "Key, listedeki her satirin kimlik kartidir. Siralama degisse bile React satiri taniyabilir.",
  learningGoals: ["map ile render etmek", "key prop kullanmak"],
  task: "topics dizisini li listesine cevir ve key ver.",
  starterFiles: [f("App.tsx", "tsx", "const topics = ['HTML', 'CSS', 'JavaScript'];\n\nexport default function App() {\n  return <ul></ul>;\n}")],
  solutionFiles: [f("App.tsx", "tsx", "const topics = ['HTML', 'CSS', 'JavaScript'];\n\nexport default function App() {\n  return (\n    <ul>\n      {topics.map((topic) => (\n        <li key={topic}>{topic}</li>\n      ))}\n    </ul>\n  );\n}")],
  hints: ["topics.map ile don.", "li elementine key={topic} ver."],
  checks: [contains("uses-map", "map kullanildi", "App.tsx", ".map"), contains("has-key", "key prop var", "App.tsx", "key=")]
});

addLesson(reactDeep, {
  id: "react-render-dongusu-derin",
  title: "State ve render döngüsü",
  section: "React",
  difficulty: "orta",
  explanation:
    "Reactte state degisince component yeniden render edilir. Ekrani direkt degistirmek yerine statei degistirirsin.",
  mentalModel:
    "State skordur, render skor tabelasidir. Skoru degistirince tabela yeniden yazilir.",
  learningGoals: ["useState kullanmak", "Event ile state guncellemek"],
  task: "Butona basinca count stateini bir arttir.",
  starterFiles: [f("App.tsx", "tsx", "import { useState } from 'react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return <button>{count}</button>;\n}")],
  solutionFiles: [f("App.tsx", "tsx", "import { useState } from 'react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}")],
  hints: ["onClick eventini butona ver.", "setCount(count + 1) statei gunceller."],
  checks: [contains("has-onclick", "onClick var", "App.tsx", "onClick"), contains("has-set-count", "setCount kullanildi", "App.tsx", "setCount")]
});

for (const lesson of tutorial.lessons) {
  lesson.mentalModel ??=
    "Bu dersi tek bir kucuk davranis gibi dusun: once kodu oku, sonra yalnizca hedeflenen parcayi degistir, en son sonucu kanitla.";
  lesson.instructorNotes ??= [
    "Ders kucuk tutulur; kullanici once kavrami gorur, sonra koda dokunur.",
    "Cozum, kullanici takildiginda hedef hali incelemesi icindir."
  ];
  lesson.walkthrough ??= [
    "Starter kodu oku.",
    "Gorevin istedigi satiri veya kucuk blogu ekle.",
    "Preview ve Check ile sonucu dogrula."
  ];
  lesson.commonMistakes ??= [
    "Gorev disindaki kodu gereksiz degistirmek.",
    "Acilan etiketi veya parantezi kapatmayi unutmak."
  ];
  lesson.glossary ??= [];
}

for (let index = 0; index < tutorial.lessons.length; index += 1) {
  tutorial.lessons[index].previousLessonId = tutorial.lessons[index - 1]?.id ?? null;
  tutorial.lessons[index].nextLessonId = tutorial.lessons[index + 1]?.id ?? null;
}

fs.writeFileSync(path, JSON.stringify(tutorial, null, 2) + "\n");
console.log(`Deepened content: ${tutorial.lessons.length} lessons, ${tutorial.sections.length} sections`);
