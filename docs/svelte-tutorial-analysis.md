# Svelte Tutorial Analiz Raporu

Bu analiz Svelte tutorialinin birebir tasarimini kopyalamak icin degil, interaktif ogrenme mantigini anlamak icin hazirlandi.

## Genel Layout

Svelte tutorial, tek ekranda uc kritik seyi birlestiren bir atelye duzeni kurar: anlatim, kod editoru ve canli sonuc. Kullanici dokumandan baska bir ortama gecmez; okur, dosyayi duzenler ve sonucu ayni yuzeyde gorur. Bu, pasif kurs hissini azaltir ve deneme dongusunu kisaltir.

## Ders Anlatimi, Editor ve Preview

Anlatim bolumu kisa ve gorev odaklidir. Kod editoru dersin baslangic durumunu tasir. Preview, kodun etkisini hemen gosterir. Bu uclu yapi pedagojik olarak sunu yapar: kavram once aciklanir, sonra kullanicinin eli kodla temas eder, ardindan davranis gorunur hale gelir.

## Navigasyon

Bolumler ve alt dersler hiyerarsiktir. Kullanici bir yandan genel haritayi gorur, diger yandan previous/next ile lineer akista ilerler. Bu ikili navigasyon hem "siradaki adimi" hem de "tum mufredat nerede" sorusunu cevaplar.

## Egzersiz Mantigi

Dersler kucuk ve tek fikirlidir. Her egzersizde starter state ve hedef state vardir. Solve, reset, previous ve next kontrolleri bu yapiyi tamamlar: kullanici takilirsa cozum gorebilir, bozarsa sifirlayabilir, tamamlayinca sonraki derse gecebilir.

## Zorluk Artisi

Akis once component okuryazarligi ile baslar, sonra reactivity, props, logic, events, bindings ve stiller gelir. Daha sonra advanced Svelte ve SvelteKit konulari ile uygulama mimarisine gecilir. Bu siralama once "bir component nasil dusunulur?" sorusunu cozer, sonra "bir uygulama nasil kurulur?" sorusuna ilerler.

## UX Kararlari

En onemli karar, ogrenme dongusunu ayni ekranda tutmaktir. Kisa metinler, gorunur gorevler, aninda preview, cozum ve reset kontrolleri kullanicinin kontrol hissini guclendirir. Mobilde ayni panel yapisini sikistirmak yerine sekmeli akis daha dogrudur: Anlatim, Kod, Preview, Notlar.
