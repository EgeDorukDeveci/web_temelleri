import type { Lesson, LessonCheck } from "@/content/types";
import { buildPreviewDocument, previewTextFromDocument } from "@/lib/preview";

export type CheckItemResult = {
  id: string;
  label: string;
  passed: boolean;
};

export type CheckResult = {
  passed: boolean;
  items: CheckItemResult[];
};

function runCheck(check: LessonCheck, files: Record<string, string>) {
  if (check.type === "code-contains") {
    return (files[check.file] ?? "").includes(check.value);
  }

  if (check.type === "code-regex") {
    return new RegExp(check.pattern, "m").test(files[check.file] ?? "");
  }

  const previewText = previewTextFromDocument(buildPreviewDocument(files));
  return previewText.toLocaleLowerCase("tr").includes(check.value.toLocaleLowerCase("tr"));
}

export function runLessonChecks(lesson: Lesson, files: Record<string, string>): CheckResult {
  const items = lesson.checks.map((check) => ({
    id: check.id,
    label: check.label,
    passed: runCheck(check, files)
  }));

  return {
    passed: items.every((item) => item.passed),
    items
  };
}
