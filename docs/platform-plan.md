# Modern Web Atölyesi UX ve Mimari Planı

## Ürün Amacı

Platform, kullanıcıya sıfırdan modern web geliştirmeyi Türkçe olarak öğretir. Video kurs gibi pasif değildir. Kullanıcı okur, kod yazar, sonucu güvenli previewda görür, cevabını kontrol eder, gerekirse ipucu veya çözüm alır.

## Ana Deneyim

Desktop düzende sol panel anlatım ve görev içindir. Sağ taraf dikey iki bölüme ayrılır: üstte dosya sekmeli kod editörü, altta sandbox iframe preview. Üst veya alt kontrol çubuğunda previous, next, reset, solve, check ve AI prompt kopyalama aksiyonları bulunur.

Mobilde panel sıkıştırılmaz. Dört sekme kullanılır: Anlatım, Kod, Preview, Notlar. Bu, telefon ekranında okuma ve kodlama işlerini sırayla yapmayı kolaylaştırır.

## İçerik Mimarisi

Dersler JSON/TypeScript veri şemasından gelir. Uygulama sabit component metinlerine kilitlenmez. Her tutorial bölümlere, her bölüm derslere ayrılır. Her ders `starterFiles`, `solutionFiles`, `checks`, `hints`, `notes` ve `aiPrompt` alanlarını taşır.

## Kod ve Preview Mimarisi

İlk versiyon HTML/CSS/JS preview çalıştırır. Kullanıcı kodu sandbox özellikli iframe içinde çalışır. Ana uygulama ile kullanıcı kodu ayrılır. Mimari ileride React/TSX dersleri için derleme katmanı eklemeye açıktır.

## Progress

LocalStorage ilk versiyon için yeterlidir. Kaydedilecek bilgiler: tamamlanan dersler, aktif ders, ders bazlı kod, notlar, çözüm görüldü mü, son check sonucu. İleride IndexedDB veya bulut senkronizasyonu eklenebilir.

## Kontrol Sistemi

İlk kontrol motoru string/regex ve preview text kontrollerini destekler. Bu sade başlangıç, HTML/CSS/JS egzersizleri için yeterlidir. Motor genişletilebilir tutulur: ileride AST, test runner veya React component kontrolü eklenebilir.

## Dosya Yapısı

- `src/content`: tutorial şeması ve ders verisi
- `src/lib`: storage, preview, check ve yardımcı fonksiyonlar
- `src/components/workspace`: ana öğrenme arayüzu
- `src/components/editor`: editor ve dosya sekmeleri
- `src/components/ui`: shadcn uyumlu temel UI component'leri
- `docs`: analiz ve mimari kararlar
