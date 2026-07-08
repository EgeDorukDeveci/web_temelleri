# Modern Web Atölyesi

Türkçe, interaktif ve local-first modern frontend öğrenme uygulaması. Svelte tutorial mantığından esinlenen; ders anlatımı, görev, canlı preview, kod editörü, kontrol listesi, ipucu ve not alanını tek ekranda birleştiren desktop odaklı bir öğrenme deneyimidir.

## Özellikler

- 32 derslik Türkçe modern web öğrenme akışı
- HTML, CSS, JavaScript, React, TypeScript, Tailwind, shadcn/ui ve Next.js konuları
- Kod editörü, canlı preview, check sistemi, ipuçları ve çözüm gösterme
- Karanlık tema desteği
- Electron ile Windows exe çıktısı
- İlerleme ve notları yerelde saklama

## Kurulum

```bash
pnpm install
pnpm dev
```

Tarayıcıda:

```text
http://localhost:3000
```

## Masaüstü Uygulaması

Geliştirme modunda Electron:

```bash
pnpm desktop
```

Windows unpacked exe üretmek:

```bash
pnpm desktop:win
```

Çıktı:

```text
dist/win-unpacked/
```

## Kalite Kontrol

```bash
pnpm typecheck
pnpm build
```

## Proje Yapısı

```text
src/app/                 Next.js app router
src/components/          UI, editor ve öğrenme workspace bileşenleri
src/content/             Ders tipleri ve tutorial içeriği
src/lib/                 Preview, check, storage ve yardımcı fonksiyonlar
electron/                Electron main/preload dosyaları
docs/                    Tutorial analizi ve platform notları
```
