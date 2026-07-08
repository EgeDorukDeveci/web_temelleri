# Svelte Tutorial Analiz Raporu

Bu analiz Svelte tutorialinin birebir tasarımını kopyalamak için değil, interaktif öğrenme mantığını anlamak için hazırlandı.

## Genel Layout

Svelte tutorial, tek ekranda üç kritik şeyi birleştiren bir atölye düzeni kurar: anlatım, kod editörü ve canlı sonuç. Kullanıcı dokümandan başka bir ortama geçmez; okur, dosyayı düzenler ve sonucu aynı yüzeyde görür. Bu, pasif kurs hissini azaltır ve deneme döngüsünü kısaltır.

## Ders Anlatımı, Editor ve Preview

Anlatım bölümü kısa ve görev odaklıdır. Kod editörü dersin başlangıç durumunu taşır. Preview, kodun etkisini hemen gösterir. Bu üçlü yapı pedagojik olarak şunu yapar: kavram önce açıklanır, sonra kullanıcının eli kodla temas eder, ardından davranış görünür hale gelir.

## Navigasyon

Bölümler ve alt dersler hiyerarşiktir. Kullanıcı bir yandan genel haritayı görür, diğer yandan previous/next ile lineer akışta ilerler. Bu ikili navigasyon hem "sıradaki adımı" hem de "tüm müfredat nerede" sorusunu cevaplar.

## Egzersiz Mantığı

Dersler küçük ve tek fikirlidir. Her egzersizde starter state ve hedef state vardır. Solve, reset, previous ve next kontrolleri bu yapıyı tamamlar: kullanıcı takılırsa çözüm görebilir, bozarsa sıfırlayabilir, tamamlayınca sonraki derse geçebilir.

## Zorluk Artışı

Akış önce component okuryazarlığı ile başlar, sonra reactivity, props, logic, events, bindings ve stiller gelir. Daha sonra advanced Svelte ve SvelteKit konuları ile uygulama mimarisine geçilir. Bu sıralama önce "bir component nasıl düşünülür?" sorusunu çözer, sonra "bir uygulama nasıl kurulur?" sorusuna ilerler.

## UX Kararları

En önemli karar, öğrenme döngüsünü aynı ekranda tutmaktır. Kısa metinler, görünür görevler, anında preview, çözüm ve reset kontrolleri kullanıcının kontrol hissini güçlendirir. Mobilde aynı panel yapısını sıkıştırmak yerine sekmeli akış daha doğrudur: Anlatım, Kod, Preview, Notlar.
