export type LearningIssue = {
  file: string;
  title: string;
  explanation: string;
  fix: string;
};

const htmlVoidTags = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);

function delimiterIssue(file: string, content: string, open: string, close: string) {
  const openCount = (content.match(new RegExp(`\\${open}`, "g")) ?? []).length;
  const closeCount = (content.match(new RegExp(`\\${close}`, "g")) ?? []).length;

  if (openCount === closeCount) return null;

  return {
    file,
    title: `${open}${close} dengesi bozuk olabilir`,
    explanation: `${file} içinde ${openCount} tane "${open}" ve ${closeCount} tane "${close}" var.`,
    fix: openCount > closeCount
      ? `Bir "${close}" eksik olabilir; en son açtığın bloğun kapanıp kapanmadığını kontrol et.`
      : `Fazladan bir "${close}" olabilir; kapanış işaretinin gerçekten bir açılışa karşılık geldiğini kontrol et.`
  };
}

function explainHtml(file: string, content: string) {
  const issues: LearningIssue[] = [];
  const stack: string[] = [];
  const tagPattern = /<\/?([a-zA-Z][\w-]*)(?:\s[^>]*)?>/g;

  for (const match of content.matchAll(tagPattern)) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();

    if (htmlVoidTags.has(tagName) || fullTag.endsWith("/>")) continue;

    if (fullTag.startsWith("</")) {
      const last = stack.pop();
      if (last && last !== tagName) {
        issues.push({
          file,
          title: "HTML etiket sırası karışmış olabilir",
          explanation: `<${last}> açılmıştı ama </${tagName}> kapanışı geldi.`,
          fix: "Açılış ve kapanış etiketlerini iç içe aynı sırayla kapat."
        });
        break;
      }
    } else {
      stack.push(tagName);
    }
  }

  const lastOpenTag = stack.at(-1);
  if (lastOpenTag) {
    issues.push({
      file,
      title: "Kapanmamış HTML etiketi olabilir",
      explanation: `<${lastOpenTag}> etiketi açılmış ama kapanışı bulunamadı.`,
      fix: `İlgili bölümün sonuna </${lastOpenTag}> eklenmesi gerekip gerekmediğini kontrol et.`
    });
  }

  return issues;
}

function explainCss(file: string, content: string) {
  const issues: LearningIssue[] = [];
  const braceIssue = delimiterIssue(file, content, "{", "}");

  if (braceIssue) issues.push(braceIssue);

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (
      trimmed &&
      !trimmed.startsWith("@") &&
      !trimmed.startsWith("}") &&
      !trimmed.endsWith("{") &&
      !trimmed.endsWith("}") &&
      !trimmed.includes(":")
    ) {
      issues.push({
        file,
        title: "CSS kuralında iki nokta eksik olabilir",
        explanation: `"${trimmed}" satırı property: value biçimine benzemiyor.`,
        fix: "CSS içinde kurallar genelde color: red; veya padding: 16px; şeklinde yazılır."
      });
      break;
    }
  }

  return issues;
}

function explainScript(file: string, content: string) {
  const issues = [
    delimiterIssue(file, content, "(", ")"),
    delimiterIssue(file, content, "{", "}"),
    delimiterIssue(file, content, "[", "]")
  ].filter(Boolean) as LearningIssue[];

  for (const quote of ['"', "'", "`"]) {
    const count = (content.match(new RegExp(quote === "`" ? "`" : `\\${quote}`, "g")) ?? [])
      .length;
    if (count % 2 !== 0) {
      issues.push({
        file,
        title: "Tırnak kapanmamış olabilir",
        explanation: `${file} içinde tek sayıda ${quote} tırnağı var.`,
        fix: "Metin yazdığın yerde açtığın tırnağı aynı işaretle kapat."
      });
      break;
    }
  }

  return issues;
}

function explainJson(file: string, content: string) {
  try {
    JSON.parse(content);
    return [];
  } catch (error) {
    return [{
      file,
      title: "JSON biçimi geçersiz",
      explanation: error instanceof Error ? error.message : "JSON okunamadı.",
      fix: "JSON alanlarında çift tırnak, virgül ve süslü parantez sırasını kontrol et."
    }];
  }
}

export function explainLikelyErrors(files: Record<string, string>) {
  const issues: LearningIssue[] = [];

  for (const [file, content] of Object.entries(files)) {
    if (file.endsWith(".html")) issues.push(...explainHtml(file, content));
    if (file.endsWith(".css")) issues.push(...explainCss(file, content));
    if (file.endsWith(".js") || file.endsWith(".ts") || file.endsWith(".tsx")) {
      issues.push(...explainScript(file, content));
    }
    if (file.endsWith(".json")) issues.push(...explainJson(file, content));
  }

  return issues.slice(0, 3);
}
