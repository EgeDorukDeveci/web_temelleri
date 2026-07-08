import type { Lesson, StoredProgress } from "@/content/types";
import { filesToRecord } from "@/lib/preview";

const STORAGE_KEY = "modern-web-atolyesi-progress-v1";

export function createInitialProgress(lessons: Lesson[]): StoredProgress {
  const firstLesson = lessons[0];

  return {
    activeLessonId: firstLesson?.id ?? "",
    lessons: Object.fromEntries(
      lessons.map((lesson) => [
        lesson.id,
        {
          files: filesToRecord(lesson.starterFiles),
          notes: "",
          completed: false,
          solutionViewed: false,
          lastCheckPassed: false
        }
      ])
    )
  };
}

export function loadProgress(lessons: Lesson[]) {
  if (typeof window === "undefined") return createInitialProgress(lessons);

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialProgress(lessons);

    const parsed = JSON.parse(raw) as StoredProgress;
    const base = createInitialProgress(lessons);

    return {
      activeLessonId: parsed.activeLessonId || base.activeLessonId,
      lessons: {
        ...base.lessons,
        ...parsed.lessons
      }
    };
  } catch {
    return createInitialProgress(lessons);
  }
}

export function saveProgress(progress: StoredProgress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Some desktop/file origins can deny storage. The lesson should still run.
  }
}
