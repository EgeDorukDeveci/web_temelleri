import type { Lesson } from "@/content/types";

export function buildAiPrompt(
  lesson: Lesson,
  files: Record<string, string>,
  errorMessage?: string
) {
  const code = Object.entries(files)
    .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join("\n\n");

  return `${lesson.aiPrompt}

Ders adı: ${lesson.title}
Konu: ${lesson.section}
Görev: ${lesson.task}

Mevcut kodum:
${code}

${errorMessage ? `Hata mesajı: ${errorMessage}\n` : ""}
Lütfen bana doğrudan cevabı vermeden, nerede takıldığımı anlamama yardım edecek şekilde açıkla.`;
}
