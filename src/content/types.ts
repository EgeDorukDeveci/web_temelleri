export type LessonDifficulty = "başlangıç" | "kolay" | "orta";

export type LessonFile = {
  path: string;
  language: "html" | "css" | "javascript" | "typescript" | "tsx";
  content: string;
};

export type LessonCheck =
  | {
      id: string;
      label: string;
      type: "code-contains";
      file: string;
      value: string;
    }
  | {
      id: string;
      label: string;
      type: "code-regex";
      file: string;
      pattern: string;
    }
  | {
      id: string;
      label: string;
      type: "preview-contains";
      value: string;
    };

export type Lesson = {
  id: string;
  title: string;
  section: string;
  difficulty: LessonDifficulty;
  explanation: string;
  mentalModel?: string;
  instructorNotes?: string[];
  walkthrough?: string[];
  commonMistakes?: string[];
  glossary?: Array<{
    term: string;
    meaning: string;
  }>;
  stretchGoal?: string;
  learningGoals: string[];
  task: string;
  starterFiles: LessonFile[];
  solutionFiles: LessonFile[];
  hints: string[];
  checks: LessonCheck[];
  aiPrompt: string;
  nextLessonId?: string | null;
  previousLessonId?: string | null;
};

export type TutorialSection = {
  id: string;
  title: string;
  description: string;
  lessonIds: string[];
};

export type Tutorial = {
  id: string;
  title: string;
  description: string;
  sections: TutorialSection[];
  lessons: Lesson[];
};

export type LessonProgress = {
  files: Record<string, string>;
  notes: string;
  completed: boolean;
  solutionViewed: boolean;
  lastCheckPassed: boolean;
};

export type StoredProgress = {
  activeLessonId: string;
  lessons: Record<string, LessonProgress>;
};
