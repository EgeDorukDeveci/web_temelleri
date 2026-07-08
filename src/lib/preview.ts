import type { LessonFile } from "@/content/types";

export function filesToRecord(files: LessonFile[]) {
  return Object.fromEntries(files.map((file) => [file.path, file.content]));
}

type PreviewOptions = {
  darkMode?: boolean;
};

export function buildPreviewDocument(
  files: Record<string, string>,
  options: PreviewOptions = {}
) {
  const html = files["index.html"] ?? files["app.html"] ?? "";
  const css = files["styles.css"] ?? files["style.css"] ?? "";
  const js = files["script.js"] ?? files["main.js"] ?? "";
  const darkMode = options.darkMode ?? false;
  const previewPalette = darkMode
    ? {
        scheme: "dark",
        background: "#0f1922",
        foreground: "#f1eadf",
        surface: "#14212b",
        surfaceMuted: "#1b2b36",
        border: "#304250",
        accent: "#5eead4",
        errorBackground: "#2b1519",
        errorBorder: "#f87171",
        errorText: "#fecdd3"
      }
    : {
        scheme: "light",
        background: "#fbf7ef",
        foreground: "#16222d",
        surface: "#ffffff",
        surfaceMuted: "#f3eadc",
        border: "#dbcdb7",
        accent: "#1b8a7a",
        errorBackground: "#fff1f2",
        errorBorder: "#b91c1c",
        errorText: "#b91c1c"
      };

  const darkPreviewOverrides = darkMode
    ? `
      html, body {
        background: ${previewPalette.background} !important;
        color: ${previewPalette.foreground} !important;
      }
      body :where(article, section, main, div, aside, header, footer, nav) {
        border-color: ${previewPalette.border};
      }
      body :where(.card, .box, article, section, main) {
        background-color: ${previewPalette.surface} !important;
      }
      body :where(button, input, textarea, select) {
        background: ${previewPalette.surfaceMuted};
        border-color: ${previewPalette.border};
        color: ${previewPalette.foreground};
      }
      body :where(a) {
        color: ${previewPalette.accent};
      }
    `
    : "";

  if (!html && !css && !js) {
    return `<!doctype html>
<html lang="tr">
  <body style="margin:0;background:${previewPalette.background};color:${previewPalette.foreground};">
    <main style="font-family: system-ui; padding: 24px; background:${previewPalette.surface}; min-height:100vh;">
      <h1>Preview hazır</h1>
      <p>Bu ders kod odaklı. HTML/CSS/JS dosyaları olduğunda burada çalışır.</p>
    </main>
  </body>
</html>`;
  }

  const hasHtmlShell = /<html[\s>]/i.test(html);
  const body = hasHtmlShell ? html : `<main class="lesson-root">${html}</main>`;

  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { color-scheme: ${previewPalette.scheme}; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: ${previewPalette.foreground};
        background: ${previewPalette.background};
      }
      .lesson-root { padding: 24px; }
      button { cursor: pointer; }
      img { max-width: 100%; }
      ${css}
      ${darkPreviewOverrides}
    </style>
  </head>
  <body>
    ${body}
    <script>
      try {
        ${js}
      } catch (error) {
        document.body.insertAdjacentHTML(
          "beforeend",
          "<pre style='white-space:pre-wrap;margin:16px;padding:12px;border:1px solid ${previewPalette.errorBorder};color:${previewPalette.errorText};background:${previewPalette.errorBackground};'>JavaScript hatası: " +
            String(error && error.message ? error.message : error) +
            "</pre>"
        );
      }
    </script>
  </body>
</html>`;
}

export function previewTextFromDocument(srcDoc: string) {
  return srcDoc
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
