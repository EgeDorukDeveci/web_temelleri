# Modern Web Atolyesi UX ve Mimari Plani

## Urun Amaci

Platform, kullaniciya sifirdan modern web gelistirmeyi Turkce olarak ogretir. Video kurs gibi pasif degildir. Kullanici okur, kod yazar, sonucu guvenli previewda gorur, cevabini kontrol eder, gerekirse ipucu veya cozum alir.

## Ana Deneyim

Desktop duzende sol panel anlatim ve gorev icindir. Sag taraf dikey iki bolume ayrilir: ustte dosya sekmeli kod editoru, altta sandbox iframe preview. Ust veya alt kontrol cubugunda previous, next, reset, solve, check ve AI prompt kopyalama aksiyonlari bulunur.

Mobilde panel sikistirilmaz. Dort sekme kullanilir: Anlatim, Kod, Preview, Notlar. Bu, telefon ekraninda okuma ve kodlama islerini sirayla yapmayi kolaylastirir.

## Icerik Mimarisi

Dersler JSON/TypeScript veri semasindan gelir. Uygulama sabit component metinlerine kilitlenmez. Her tutorial bolumlere, her bolum derslere ayrilir. Her ders `starterFiles`, `solutionFiles`, `checks`, `hints`, `notes` ve `aiPrompt` alanlarini tasir.

## Kod ve Preview Mimarisi

Ilk versiyon HTML/CSS/JS preview calistirir. Kullanici kodu sandbox ozellikli iframe icinde calisir. Ana uygulama ile kullanici kodu ayrilir. Mimari ileride React/TSX dersleri icin derleme katmani eklemeye aciktir.

## Progress

LocalStorage ilk versiyon icin yeterlidir. Kaydedilecek bilgiler: tamamlanan dersler, aktif ders, ders bazli kod, notlar, cozum goruldu mu, son check sonucu. Ileride IndexedDB veya bulut senkronizasyonu eklenebilir.

## Kontrol Sistemi

Ilk kontrol motoru string/regex ve preview text kontrollerini destekler. Bu sade baslangic, HTML/CSS/JS egzersizleri icin yeterlidir. Motor genisletilebilir tutulur: ileride AST, test runner veya React component kontrolu eklenebilir.

## Dosya Yapisi

- `src/content`: tutorial semasi ve ders verisi
- `src/lib`: storage, preview, check ve yardimci fonksiyonlar
- `src/components/workspace`: ana ogrenme arayuzu
- `src/components/editor`: editor ve dosya sekmeleri
- `src/components/ui`: shadcn uyumlu temel UI componentleri
- `docs`: analiz ve mimari kararlar
