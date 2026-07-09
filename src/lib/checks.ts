import type { Lesson, LessonCheck } from "@/content/types";
import { buildPreviewDocument, previewTextFromDocument } from "@/lib/preview";

export type CheckItemResult = {
  id: string;
  label: string;
  passed: boolean;
  feedback: string;
  nextAction: string;
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

function describeCheckTarget(check: LessonCheck) {
  if (check.type === "code-contains") {
    return `${check.file} içinde ${check.value} aranıyor.`;
  }

  if (check.type === "code-regex") {
    return `${check.file} içinde beklenen kod kalıbı aranıyor.`;
  }

  return `Canlı preview içinde "${check.value}" metni aranıyor.`;
}

function buildCheckFeedback(
  check: LessonCheck,
  passed: boolean,
  files: Record<string, string>
) {
  if (passed) {
    return {
      feedback: `${describeCheckTarget(check)} Bu kontrol geçti.`,
      nextAction: "Sıradaki kontrole geçebilirsin."
    };
  }

  if (check.type === "code-contains") {
    const currentFile = files[check.file];
    return {
      feedback: currentFile === undefined
        ? `${check.file} dosyası bulunamadı. Önce doğru dosyanın açık olduğundan emin ol.`
        : `${check.file} dosyasında "${check.value}" henüz görünmüyor.`,
      nextAction: `Kod editöründe ${check.file} dosyasına geç ve bu parçayı doğru etiketin veya bloğun içine ekle: ${check.value}`
    };
  }

  if (check.type === "code-regex") {
    return {
      feedback: `${check.file} dosyasında beklenen yapı henüz oluşmamış.`,
      nextAction: "Parantez, süslü parantez, attribute adı ve yazım sırasını kontrol et; doğru dosyada çalıştığından emin ol."
    };
  }

  return {
    feedback: `Preview içinde "${check.value}" metni henüz görünmüyor.`,
    nextAction: "Kod doğru yerde olsa bile ekranda görünmüyorsa etiketi kapatmayı, dosya bağlantılarını ve metnin gerçekten render edilip edilmediğini kontrol et."
  };
}

export function runLessonChecks(lesson: Lesson, files: Record<string, string>): CheckResult {
  const items = lesson.checks.map((check) => {
    const passed = runCheck(check, files);
    const feedback = buildCheckFeedback(check, passed, files);

    return {
      id: check.id,
      label: check.label,
      passed,
      ...feedback
    };
  });

  return {
    passed: items.every((item) => item.passed),
    items
  };
}
