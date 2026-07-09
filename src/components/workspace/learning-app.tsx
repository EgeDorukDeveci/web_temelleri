"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CSSProperties,
  Dispatch,
  PointerEvent as ReactPointerEvent,
  SetStateAction
} from "react";
import {
  AlertTriangle,
  BookMarked,
  BookOpen,
  CheckCircle2,
  CircleDot,
  Clipboard,
  Code2,
  Eye,
  FileText,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Moon,
  PanelLeft,
  RefreshCcw,
  RotateCcw,
  Server,
  Sun,
  TerminalSquare
} from "lucide-react";
import { tutorial } from "@/content/web-fundamentals";
import type { Lesson, StoredProgress } from "@/content/types";
import { buildAiPrompt } from "@/lib/ai-prompt";
import {
  runLessonChecks,
  type CheckResult
} from "@/lib/checks";
import { buildPreviewDocument, filesToRecord } from "@/lib/preview";
import { explainLikelyErrors, type LearningIssue } from "@/lib/error-explainer";
import { createInitialProgress, loadProgress, saveProgress } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { CodeEditor } from "@/components/editor/code-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const mobileTabs = [
  { id: "lesson", label: "Anlatım", icon: BookOpen },
  { id: "code", label: "Kod", icon: Code2 },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "notes", label: "Notlar", icon: FileText }
] as const;

type MobileTab = (typeof mobileTabs)[number]["id"];

type ConceptCard = {
  term: string;
  meaning: string;
};

type LessonStepItem = {
  title: string;
  detail: string;
  completed: boolean;
};

type DesktopLayout = {
  lessonWidth: number;
  editorHeight: number;
  previewWidth: number;
};

const DEFAULT_DESKTOP_LAYOUT: DesktopLayout = {
  lessonWidth: 34,
  editorHeight: 56,
  previewWidth: 68
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readLayoutValue(
  value: unknown,
  fallback: number,
  min: number,
  max: number
) {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(value, min, max)
    : fallback;
}

const conceptCatalog: Array<ConceptCard & { match: RegExp }> = [
  {
    term: "HTML etiketi",
    meaning: "Sayfadaki bir parçaya anlam veren açılış ve kapanış yapısıdır.",
    match: /\b(html|h1|p|section|article|main|etiket)\b/i
  },
  {
    term: "Attribute",
    meaning: "Bir etikete ek bilgi veren href, src, alt veya id gibi değerdir.",
    match: /\b(attribute|href|src|alt|id|for|input|label)\b/i
  },
  {
    term: "CSS seçici",
    meaning: "Stilin hangi HTML parçasına uygulanacağını söyler; class seçici nokta ile başlar.",
    match: /\b(css|class|seçici|padding|margin|border|grid|flex)\b/i
  },
  {
    term: "DOM",
    meaning: "Tarayıcının HTML'i JavaScript ile seçilebilir ve değiştirilebilir canlı ağaç halidir.",
    match: /\b(dom|queryselector|classlist|document)\b/i
  },
  {
    term: "Event",
    meaning: "Tıklama veya yazı yazma gibi kullanıcı hareketidir; JavaScript bu olayları dinleyebilir.",
    match: /\b(event|click|input|addeventlistener|tıkla)\b/i
  },
  {
    term: "State",
    meaning: "Arayüzün o anki bilgisidir; değiştiğinde ekran da güncellenir.",
    match: /\b(state|usestate|count|open|setcount)\b/i
  },
  {
    term: "Component",
    meaning: "Tekrar kullanılabilen küçük arayüz parçasıdır.",
    match: /\b(component|props|react|jsx|tsx)\b/i
  },
  {
    term: "Responsive",
    meaning: "Layout'un farklı ekran genişliklerinde okunabilir kalmasıdır.",
    match: /\b(responsive|media query|minmax|auto-fit|grid)\b/i
  },
  {
    term: "Build",
    meaning: "Uygulamanın paylaşılabilir, yayınlanabilir hale hazırlanmasıdır.",
    match: /\b(build|deployment|deploy|package\.json|pnpm|npm)\b/i
  }
];

function lessonSearchText(lesson: Lesson) {
  return [
    lesson.title,
    lesson.section,
    lesson.explanation,
    lesson.task,
    lesson.learningGoals.join(" "),
    lesson.hints.join(" "),
    lesson.starterFiles.map((file) => file.content).join(" ")
  ].join(" ");
}

function buildConceptCards(lesson: Lesson) {
  const searchText = lessonSearchText(lesson);
  const fromCatalog = conceptCatalog
    .filter((item) => item.match.test(searchText))
    .slice(0, 4)
    .map(({ term, meaning }) => ({ term, meaning }));
  const fromGlossary = lesson.glossary ?? [];
  const seen = new Set<string>();

  return [...fromGlossary, ...fromCatalog].filter((card) => {
    const key = card.term.toLocaleLowerCase("tr");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 4);
}

function buildLessonSteps(lesson: Lesson, checkResult: CheckResult | null): LessonStepItem[] {
  const primaryFile = lesson.starterFiles[0]?.path ?? "ilk dosya";
  const checkItems = checkResult?.items ?? [];
  const anyCheckPassed = checkItems.some((item) => item.passed);

  return [
    {
      title: "Dosyayı bul",
      detail: `${primaryFile} dosyasından başla; görev başka dosya istiyorsa sekmelerden ona geç.`,
      completed: true
    },
    {
      title: "Görevi küçült",
      detail: lesson.task,
      completed: anyCheckPassed
    },
    ...lesson.checks.slice(0, 3).map((check) => {
      const result = checkItems.find((item) => item.id === check.id);

      return {
        title: check.label,
        detail: result?.nextAction ?? "Kontrol etmeden önce bu hedefi kodda görünür hale getirmeye çalış.",
        completed: result?.passed ?? false
      };
    })
  ];
}

export function LearningApp() {
  const [progress, setProgress] = useState<StoredProgress>(() =>
    createInitialProgress(tutorial.lessons)
  );
  const [hydrated, setHydrated] = useState(false);
  const [activeFilePath, setActiveFilePath] = useState("index.html");
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>("lesson");
  const [darkMode, setDarkMode] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [desktopLayout, setDesktopLayout] = useState<DesktopLayout>(
    DEFAULT_DESKTOP_LAYOUT
  );

  const lessonsById = useMemo(
    () => new Map(tutorial.lessons.map((lesson) => [lesson.id, lesson])),
    []
  );

  const activeLesson =
    lessonsById.get(progress.activeLessonId) ?? tutorial.lessons[0];
  const lessonProgress = progress.lessons[activeLesson.id];
  const currentFiles = lessonProgress?.files ?? filesToRecord(activeLesson.starterFiles);
  const previewDoc = buildPreviewDocument(currentFiles, { darkMode });
  const learningIssues = useMemo(
    () => explainLikelyErrors(currentFiles),
    [currentFiles]
  );
  const completedCount = Object.values(progress.lessons).filter(
    (item) => item.completed
  ).length;

  useEffect(() => {
    setProgress(loadProgress(tutorial.lessons));
    try {
      const storedTheme = window.localStorage.getItem("modern-web-atolyesi-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(storedTheme ? storedTheme === "dark" : prefersDark);

      const storedLayout = window.localStorage.getItem("modern-web-atolyesi-layout");
      if (storedLayout) {
        const parsed = JSON.parse(storedLayout) as Partial<DesktopLayout>;
        setDesktopLayout({
          lessonWidth: readLayoutValue(
            parsed.lessonWidth,
            DEFAULT_DESKTOP_LAYOUT.lessonWidth,
            24,
            48
          ),
          editorHeight: readLayoutValue(
            parsed.editorHeight,
            DEFAULT_DESKTOP_LAYOUT.editorHeight,
            32,
            74
          ),
          previewWidth: readLayoutValue(
            parsed.previewWidth,
            DEFAULT_DESKTOP_LAYOUT.previewWidth,
            42,
            78
          )
        });
      }
    } catch {
      setDarkMode(false);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveProgress(progress);
  }, [hydrated, progress]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    if (hydrated) {
      try {
        window.localStorage.setItem(
          "modern-web-atolyesi-theme",
          darkMode ? "dark" : "light"
        );
      } catch {
        // Theme persistence is optional in restricted desktop storage contexts.
      }
    }
  }, [darkMode, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        "modern-web-atolyesi-layout",
        JSON.stringify(desktopLayout)
      );
    } catch {
      // Layout persistence is optional in restricted desktop storage contexts.
    }
  }, [desktopLayout, hydrated]);

  useEffect(() => {
    const firstPath = activeLesson.starterFiles[0]?.path;
    if (firstPath) setActiveFilePath(firstPath);
    setCheckResult(null);
    setHintIndex(0);
  }, [activeLesson.id, activeLesson.starterFiles]);

  function updateActiveLesson(nextLessonId: string) {
    setProgress((current) => ({ ...current, activeLessonId: nextLessonId }));
    setMobileTab("lesson");
  }

  function updateLessonProgress(
    lessonId: string,
    updater: (current: StoredProgress["lessons"][string]) => StoredProgress["lessons"][string]
  ) {
    setProgress((current) => ({
      ...current,
      lessons: {
        ...current.lessons,
        [lessonId]: updater(current.lessons[lessonId])
      }
    }));
  }

  function updateFile(path: string, value: string) {
    updateLessonProgress(activeLesson.id, (current) => ({
      ...current,
      files: {
        ...current.files,
        [path]: value
      },
      lastCheckPassed: false
    }));
    setCheckResult(null);
  }

  function resetLesson() {
    updateLessonProgress(activeLesson.id, (current) => ({
      ...current,
      files: filesToRecord(activeLesson.starterFiles),
      solutionViewed: false,
      lastCheckPassed: false
    }));
    setCheckResult(null);
  }

  function showSolution() {
    updateLessonProgress(activeLesson.id, (current) => ({
      ...current,
      files: filesToRecord(activeLesson.solutionFiles),
      solutionViewed: true
    }));
    setActiveFilePath(activeLesson.solutionFiles[0]?.path ?? activeFilePath);
  }

  function checkAnswer() {
    const result = runLessonChecks(activeLesson, currentFiles);
    setCheckResult(result);
    updateLessonProgress(activeLesson.id, (current) => ({
      ...current,
      completed: result.passed || current.completed,
      lastCheckPassed: result.passed
    }));
  }

  async function copyAiPrompt() {
    const failedChecks = checkResult?.items
      .filter((item) => !item.passed)
      .map((item) => item.label);
    const errorMessage = failedChecks?.length
      ? `Geçmeyen kontroller: ${failedChecks.join(", ")}`
      : undefined;

    await navigator.clipboard.writeText(
      buildAiPrompt(activeLesson, currentFiles, errorMessage)
    );
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1400);
  }

  function updateNotes(notes: string) {
    updateLessonProgress(activeLesson.id, (current) => ({ ...current, notes }));
  }

  function beginDrag(
    event: ReactPointerEvent<HTMLDivElement>,
    cursor: "col-resize" | "row-resize",
    onMove: (clientX: number, clientY: number) => void
  ) {
    event.preventDefault();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = cursor;
    document.body.style.userSelect = "none";

    function handleMove(moveEvent: PointerEvent) {
      onMove(moveEvent.clientX, moveEvent.clientY);
    }

    function handleEnd(endEvent: PointerEvent) {
      if (target.hasPointerCapture(endEvent.pointerId)) {
        target.releasePointerCapture(endEvent.pointerId);
      }
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
  }

  function handleLessonPanelDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const startX = event.clientX;
    const base = desktopLayout.lessonWidth;
    const containerWidth =
      event.currentTarget.parentElement?.getBoundingClientRect().width ??
      window.innerWidth;

    beginDrag(event, "col-resize", (clientX) => {
      const delta = ((clientX - startX) / containerWidth) * 100;
      setDesktopLayout((current) => ({
        ...current,
        lessonWidth: clamp(base + delta, 24, 48)
      }));
    });
  }

  const workspaceStyle = {
    "--lesson-panel-width": `${desktopLayout.lessonWidth}%`,
    "--editor-panel-height": `${desktopLayout.editorHeight}%`,
    "--preview-panel-width": `${desktopLayout.previewWidth}%`
  } as CSSProperties;

  return (
    <main className="h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--accent)/0.12),transparent_30rem),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.45))]">
      <TopBar
        activeLesson={activeLesson}
        completedCount={completedCount}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((value) => !value)}
        totalCount={tutorial.lessons.length}
      />

      <div className="hidden h-[calc(100dvh-84px)] min-h-0 lg:flex">
        <ActivityRail completedCount={completedCount} totalCount={tutorial.lessons.length} />
        <div
          className="grid min-w-0 flex-1 gap-0 workspace-grid"
          style={workspaceStyle}
        >
          <LessonPanel
            activeLesson={activeLesson}
            checkResult={checkResult}
            completedCount={completedCount}
            copyState={copyState}
            currentFiles={currentFiles}
            hintIndex={hintIndex}
            lessonProgress={lessonProgress}
            learningIssues={learningIssues}
            onCheck={checkAnswer}
            onCopyAiPrompt={copyAiPrompt}
            onHint={() =>
              setHintIndex((value) =>
                Math.min(value + 1, activeLesson.hints.length - 1)
              )
            }
            onNavigate={updateActiveLesson}
            onNext={() =>
              activeLesson.nextLessonId && updateActiveLesson(activeLesson.nextLessonId)
            }
            onPrevious={() =>
              activeLesson.previousLessonId &&
              updateActiveLesson(activeLesson.previousLessonId)
            }
            onReset={resetLesson}
            onShowSolution={showSolution}
            totalCount={tutorial.lessons.length}
            progress={progress}
          />

          <ResizeHandle
            label="Ders paneli genişliğini değiştir"
            onPointerDown={handleLessonPanelDrag}
            orientation="vertical"
          />

          <EditorPreviewPanel
            activeFilePath={activeFilePath}
            beginDrag={beginDrag}
            currentFiles={currentFiles}
            darkMode={darkMode}
            desktopLayout={desktopLayout}
            lesson={activeLesson}
            notes={lessonProgress?.notes ?? ""}
            onActiveFilePathChange={setActiveFilePath}
            onNotesChange={updateNotes}
            onResize={setDesktopLayout}
            onUpdateFile={updateFile}
            previewDoc={previewDoc}
          />
        </div>
      </div>
      <StatusBar
        activeLesson={activeLesson}
        checkResult={checkResult}
        completedCount={completedCount}
        totalCount={tutorial.lessons.length}
      />

      <div className="flex h-[calc(100dvh-56px)] flex-col lg:hidden">
        <MobileTabs activeTab={mobileTab} onChange={setMobileTab} />
        <div className="min-h-0 flex-1 overflow-hidden">
          {mobileTab === "lesson" && (
            <LessonPanel
              activeLesson={activeLesson}
              checkResult={checkResult}
              completedCount={completedCount}
              copyState={copyState}
              currentFiles={currentFiles}
              hintIndex={hintIndex}
              lessonProgress={lessonProgress}
              learningIssues={learningIssues}
              mobile
              onCheck={checkAnswer}
              onCopyAiPrompt={copyAiPrompt}
              onHint={() =>
                setHintIndex((value) =>
                  Math.min(value + 1, activeLesson.hints.length - 1)
                )
              }
              onNavigate={updateActiveLesson}
              onNext={() =>
                activeLesson.nextLessonId &&
                updateActiveLesson(activeLesson.nextLessonId)
              }
              onPrevious={() =>
                activeLesson.previousLessonId &&
                updateActiveLesson(activeLesson.previousLessonId)
              }
              onReset={resetLesson}
              onShowSolution={showSolution}
              totalCount={tutorial.lessons.length}
              progress={progress}
            />
          )}
          {mobileTab === "code" && (
            <div className="h-full">
              <CodeEditor
                activePath={activeFilePath}
                files={activeLesson.starterFiles}
                onActivePathChange={setActiveFilePath}
                onChange={updateFile}
                values={currentFiles}
              />
            </div>
          )}
          {mobileTab === "preview" && (
            <PreviewFrame darkMode={darkMode} srcDoc={previewDoc} />
          )}
          {mobileTab === "notes" && (
            <NotesPanel notes={lessonProgress?.notes ?? ""} onChange={updateNotes} />
          )}
        </div>
      </div>
    </main>
  );
}

function TopBar({
  activeLesson,
  completedCount,
  totalCount,
  darkMode,
  onToggleDark
}: {
  activeLesson: Lesson;
  completedCount: number;
  totalCount: number;
  darkMode: boolean;
  onToggleDark: () => void;
}) {
  const percent = Math.round((completedCount / totalCount) * 100);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background/92 px-3 backdrop-blur md:px-4">
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1.5 md:flex" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-[#d95f55]" />
          <span className="h-3 w-3 rounded-full bg-[#d8a642]" />
          <span className="h-3 w-3 rounded-full bg-[#4b9d73]" />
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <TerminalSquare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight">Modern Web Atölyesi</h1>
          <p className="hidden text-xs text-muted-foreground md:block">
            {activeLesson.section} / {activeLesson.title}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden min-w-44 items-center gap-2 md:flex">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{percent}%</span>
        </div>
        <Button
          aria-label="Tema değiştir"
          onClick={onToggleDark}
          size="icon"
          type="button"
          variant="outline"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}

function ActivityRail({
  completedCount,
  totalCount
}: {
  completedCount: number;
  totalCount: number;
}) {
  return (
    <nav className="flex w-12 flex-col items-center border-r bg-secondary text-secondary-foreground">
      <div className="flex h-12 w-full items-center justify-center border-b border-secondary-foreground/10">
        <BookOpen className="h-5 w-5" />
      </div>
      <div className="flex flex-1 flex-col items-center gap-2 py-3">
        <button className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary-foreground/12" type="button" title="Dersler">
          <ListChecks className="h-4 w-4" />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-md text-secondary-foreground/75 hover:bg-secondary-foreground/10" type="button" title="Kod">
          <Code2 className="h-4 w-4" />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-md text-secondary-foreground/75 hover:bg-secondary-foreground/10" type="button" title="Preview">
          <Eye className="h-4 w-4" />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-md text-secondary-foreground/75 hover:bg-secondary-foreground/10" type="button" title="Notlar">
          <FileText className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-secondary-foreground/15 text-[10px] font-semibold">
        {completedCount}/{totalCount}
      </div>
    </nav>
  );
}

function LessonPanel({
  activeLesson,
  lessonProgress,
  currentFiles,
  checkResult,
  hintIndex,
  learningIssues,
  completedCount,
  totalCount,
  copyState,
  progress,
  onNavigate,
  onPrevious,
  onNext,
  onReset,
  onShowSolution,
  onCheck,
  onHint,
  onCopyAiPrompt,
  mobile = false
}: {
  activeLesson: Lesson;
  lessonProgress: StoredProgress["lessons"][string];
  currentFiles: Record<string, string>;
  checkResult: CheckResult | null;
  hintIndex: number;
  learningIssues: LearningIssue[];
  completedCount: number;
  totalCount: number;
  copyState: "idle" | "copied";
  progress: StoredProgress;
  onNavigate: (lessonId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
  onShowSolution: () => void;
  onCheck: () => void;
  onHint: () => void;
  onCopyAiPrompt: () => void;
  mobile?: boolean;
}) {
  return (
    <aside className={cn("flex h-full min-h-0 min-w-0 flex-col border-r bg-background/95", mobile && "border-r-0")}>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <Badge>{activeLesson.section}</Badge>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              {activeLesson.title}
            </h2>
          </div>
          <Badge className="capitalize">{activeLesson.difficulty}</Badge>
        </div>

        <div className="mb-4 rounded-md border bg-muted/45 px-3 py-2 text-xs font-medium text-muted-foreground">
          {completedCount}/{totalCount} ders tamamlandı
        </div>

        <section className="space-y-3">
          <p className="max-w-[72ch] text-sm leading-6 text-muted-foreground">
            {activeLesson.explanation}
          </p>
          {activeLesson.mentalModel && (
            <div className="rounded-md border bg-accent/10 p-3">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <Server className="h-4 w-4 text-accent" />
                Mental model
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {activeLesson.mentalModel}
              </p>
            </div>
          )}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Öğrenme hedefleri</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {activeLesson.learningGoals.map((goal) => (
                <li className="flex gap-2" key={goal}>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border bg-background p-3 shadow-panel">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <PanelLeft className="h-4 w-4" />
              Görev
            </h3>
            <p className="text-sm leading-6">{activeLesson.task}</p>
          </div>
          <LessonStepGuide lesson={activeLesson} checkResult={checkResult} />
          <ConceptGuide lesson={activeLesson} />
          {learningIssues.length > 0 && (
            <ErrorGuide issues={learningIssues} />
          )}
        </section>

        <section className="mt-4 grid gap-3">
          {activeLesson.walkthrough && (
            <div className="rounded-md border bg-background p-3">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <ListChecks className="h-4 w-4" />
                Çalışma akışı
              </h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                {activeLesson.walkthrough.map((step, index) => (
                  <li className="flex gap-2" key={step}>
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-foreground">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {activeLesson.commonMistakes && (
            <div className="rounded-md border bg-muted/30 p-3">
              <h3 className="mb-2 text-sm font-semibold">Sık düşülen tuzaklar</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {activeLesson.commonMistakes.map((mistake) => (
                  <li className="flex gap-2" key={mistake}>
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeLesson.glossary && activeLesson.glossary.length > 0 && (
            <div className="rounded-md border bg-background p-3">
              <h3 className="mb-2 text-sm font-semibold">Mini sözlük</h3>
              <dl className="space-y-2 text-sm">
                {activeLesson.glossary.map((item) => (
                  <div key={item.term}>
                    <dt className="font-medium">{item.term}</dt>
                    <dd className="text-muted-foreground">{item.meaning}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>

        <section className="mt-4 rounded-md border bg-muted/35 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="h-4 w-4 text-accent" />
              İpucu
            </h3>
            <span className="text-xs font-medium text-muted-foreground">
              {hintIndex + 1}/{activeLesson.hints.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {activeLesson.hints[hintIndex] ?? activeLesson.hints[0]}
          </p>
          <Button
            className="mt-3"
            disabled={hintIndex >= activeLesson.hints.length - 1}
            onClick={onHint}
            size="sm"
            type="button"
            variant="outline"
          >
            Sonraki ipucu
          </Button>
        </section>

        {checkResult && (
          <section
            className={cn(
              "mt-5 rounded-md border p-4",
              checkResult.passed
                ? "border-success/40 bg-success/10"
                : "border-destructive/35 bg-destructive/10"
            )}
          >
            <h3 className="mb-2 text-sm font-semibold">
              {checkResult.passed ? "Harika, cevap geçerli" : "Biraz daha düzeltelim"}
            </h3>
            <ul className="space-y-1 text-sm">
              {checkResult.items.map((item) => (
                <li className="flex gap-2" key={item.id}>
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      item.passed ? "bg-success" : "bg-destructive"
                    )}
                  />
                  <span>
                    <span className="font-medium">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      {item.feedback}
                    </span>
                    {!item.passed && (
                      <span className="mt-1 block text-xs leading-5">
                        {item.nextAction}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {checkResult.passed && (
              <LessonRecap lesson={activeLesson} />
            )}
          </section>
        )}

        <section className="mt-5">
          <h3 className="mb-3 text-sm font-semibold">Dersler</h3>
          <div className="space-y-3">
            {tutorial.sections.map((section) => (
              <div key={section.id}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.lessonIds.map((lessonId) => {
                    const lesson = tutorial.lessons.find((item) => item.id === lessonId);
                    if (!lesson) return null;
                    const done = progress.lessons[lessonId]?.completed;
                    return (
                      <button
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                          lesson.id === activeLesson.id
                            ? "bg-secondary text-secondary-foreground"
                            : "hover:bg-muted"
                        )}
                        key={lesson.id}
                        onClick={() => onNavigate(lesson.id)}
                        type="button"
                      >
                        <span>{lesson.title}</span>
                        {done && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="shrink-0 border-t bg-background p-3">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Button
            disabled={!activeLesson.previousLessonId}
            onClick={onPrevious}
            type="button"
            variant="outline"
          >
            Önceki
          </Button>
          <Button onClick={onReset} type="button" variant="outline">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button onClick={onShowSolution} type="button" variant="outline">
            <RefreshCcw className="h-4 w-4" />
            Çöz
          </Button>
          <Button onClick={onCheck} type="button" variant="default">
            Kontrol
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button onClick={onCopyAiPrompt} type="button" variant="ghost">
            <Clipboard className="h-4 w-4" />
            {copyState === "copied" ? "Kopyalandı" : "AI'a sor"}
          </Button>
          <Button
            disabled={!activeLesson.nextLessonId}
            onClick={onNext}
            type="button"
            variant={lessonProgress?.lastCheckPassed ? "success" : "secondary"}
          >
            Sonraki
          </Button>
        </div>
      </div>
    </aside>
  );

}

function LessonStepGuide({
  lesson,
  checkResult
}: {
  lesson: Lesson;
  checkResult: CheckResult | null;
}) {
  const steps = buildLessonSteps(lesson, checkResult);

  return (
    <div className="rounded-md border bg-background p-3">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <ListChecks className="h-4 w-4" />
        Adım adım
      </h3>
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li className="flex gap-2 text-sm" key={`${step.title}-${index}`}>
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold",
                step.completed
                  ? "bg-success text-success-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step.completed ? "✓" : index + 1}
            </span>
            <span>
              <span className="font-medium">{step.title}</span>
              <span className="block text-xs leading-5 text-muted-foreground">
                {step.detail}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ConceptGuide({ lesson }: { lesson: Lesson }) {
  const concepts = buildConceptCards(lesson);

  if (concepts.length === 0) return null;

  return (
    <div className="rounded-md border bg-muted/25 p-3">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <BookMarked className="h-4 w-4" />
        Kavram rehberi
      </h3>
      <div className="grid gap-2">
        {concepts.map((concept) => (
          <div className="rounded-md border bg-background px-3 py-2" key={concept.term}>
            <div className="text-xs font-semibold">{concept.term}</div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {concept.meaning}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorGuide({ issues }: { issues: LearningIssue[] }) {
  return (
    <div className="rounded-md border border-accent/30 bg-accent/10 p-3">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="h-4 w-4 text-accent" />
        Hata rehberi
      </h3>
      <ul className="space-y-2">
        {issues.map((issue) => (
          <li className="text-sm" key={`${issue.file}-${issue.title}`}>
            <div className="flex items-center gap-2 font-medium">
              <CircleDot className="h-3.5 w-3.5 text-accent" />
              {issue.file}: {issue.title}
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {issue.explanation}
            </p>
            <p className="mt-1 text-xs leading-5">{issue.fix}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LessonRecap({ lesson }: { lesson: Lesson }) {
  return (
    <div className="mt-4 rounded-md border bg-background/75 p-3">
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <GraduationCap className="h-4 w-4 text-success" />
        Ders özeti
      </h4>
      <ul className="space-y-1 text-xs leading-5 text-muted-foreground">
        {lesson.learningGoals.map((goal) => (
          <li className="flex gap-2" key={goal}>
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            <span>{goal}</span>
          </li>
        ))}
      </ul>
      {lesson.mentalModel && (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {lesson.mentalModel}
        </p>
      )}
    </div>
  );
}

function EditorPreviewPanel({
  lesson,
  currentFiles,
  activeFilePath,
  previewDoc,
  notes,
  darkMode,
  desktopLayout,
  beginDrag,
  onResize,
  onActiveFilePathChange,
  onUpdateFile,
  onNotesChange
}: {
  lesson: Lesson;
  currentFiles: Record<string, string>;
  activeFilePath: string;
  previewDoc: string;
  notes: string;
  darkMode: boolean;
  desktopLayout: DesktopLayout;
  beginDrag: (
    event: ReactPointerEvent<HTMLDivElement>,
    cursor: "col-resize" | "row-resize",
    onMove: (clientX: number, clientY: number) => void
  ) => void;
  onResize: Dispatch<SetStateAction<DesktopLayout>>;
  onActiveFilePathChange: (path: string) => void;
  onUpdateFile: (path: string, value: string) => void;
  onNotesChange: (notes: string) => void;
}) {
  function handleEditorHeightDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const startY = event.clientY;
    const base = desktopLayout.editorHeight;
    const containerHeight =
      event.currentTarget.parentElement?.getBoundingClientRect().height ??
      window.innerHeight;

    beginDrag(event, "row-resize", (_clientX, clientY) => {
      const delta = ((clientY - startY) / containerHeight) * 100;
      onResize((current) => ({
        ...current,
        editorHeight: clamp(base + delta, 32, 74)
      }));
    });
  }

  function handlePreviewWidthDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const startX = event.clientX;
    const base = desktopLayout.previewWidth;
    const containerWidth =
      event.currentTarget.parentElement?.getBoundingClientRect().width ??
      window.innerWidth;

    beginDrag(event, "col-resize", (clientX) => {
      const delta = ((clientX - startX) / containerWidth) * 100;
      onResize((current) => ({
        ...current,
        previewWidth: clamp(base + delta, 42, 78)
      }));
    });
  }

  return (
    <section className="grid h-full min-h-0 min-w-0 bg-muted/35 editor-preview-grid">
      <div className="min-h-0 border-b bg-background/88">
        <div className="flex h-10 items-center justify-between border-b px-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Code2 className="h-4 w-4" />
            Kod editörü
          </div>
          <Badge>{lesson.starterFiles.length} dosya</Badge>
        </div>
        <div className="h-[calc(100%-40px)] min-h-0">
          <CodeEditor
            activePath={activeFilePath}
            files={lesson.starterFiles}
            onActivePathChange={onActiveFilePathChange}
            onChange={onUpdateFile}
            values={currentFiles}
          />
        </div>
      </div>
      <ResizeHandle
        label="Kod editörü yüksekliğini değiştir"
        onPointerDown={handleEditorHeightDrag}
        orientation="horizontal"
      />
      <div className="grid min-h-0 preview-notes-grid">
        <PreviewFrame darkMode={darkMode} srcDoc={previewDoc} />
        <ResizeHandle
          label="Preview ve notlar genişliğini değiştir"
          onPointerDown={handlePreviewWidthDrag}
          orientation="vertical"
        />
        <NotesPanel notes={notes} onChange={onNotesChange} />
      </div>
    </section>
  );
}

function ResizeHandle({
  label,
  onPointerDown,
  orientation
}: {
  label: string;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  orientation: "horizontal" | "vertical";
}) {
  return (
    <div
      aria-label={label}
      aria-orientation={orientation}
      className="resize-handle"
      data-orientation={orientation}
      onPointerDown={onPointerDown}
      role="separator"
      tabIndex={0}
      title={label}
    >
      <span aria-hidden="true" />
    </div>
  );
}

function PreviewFrame({
  srcDoc,
  darkMode
}: {
  srcDoc: string;
  darkMode: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-col bg-background">
      <div className="flex h-10 items-center gap-2 border-b px-3 text-sm font-semibold">
        <Eye className="h-4 w-4" />
        Canlı preview
      </div>
      <iframe
        className="min-h-0 flex-1 bg-background"
        sandbox="allow-scripts"
        srcDoc={srcDoc}
        style={{ colorScheme: darkMode ? "dark" : "light" }}
        title="Canlı preview"
      />
    </div>
  );
}

function StatusBar({
  activeLesson,
  checkResult,
  completedCount,
  totalCount
}: {
  activeLesson: Lesson;
  checkResult: CheckResult | null;
  completedCount: number;
  totalCount: number;
}) {
  return (
    <footer className="hidden h-7 items-center justify-between border-t bg-secondary px-3 text-[11px] font-medium text-secondary-foreground lg:flex">
      <div className="flex items-center gap-4">
        <span>Desktop workbench</span>
        <span>{activeLesson.difficulty}</span>
        <span>{activeLesson.starterFiles.length} dosya</span>
      </div>
      <div className="flex items-center gap-4">
        <span>{completedCount}/{totalCount} tamamlandı</span>
        <span>{checkResult ? (checkResult.passed ? "Check: başarılı" : "Check: düzeltme gerekli") : "Check: bekliyor"}</span>
      </div>
    </footer>
  );
}

function NotesPanel({
  notes,
  onChange
}: {
  notes: string;
  onChange: (notes: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex h-10 items-center gap-2 border-b px-3 text-sm font-semibold">
        <FileText className="h-4 w-4" />
        Notlar
      </div>
      <textarea
        className="min-h-0 flex-1 resize-none bg-transparent p-3 text-sm leading-6 outline-none placeholder:text-muted-foreground"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Bu ders için kendi notlarını yaz..."
        value={notes}
      />
    </div>
  );
}

function MobileTabs({
  activeTab,
  onChange
}: {
  activeTab: MobileTab;
  onChange: (tab: MobileTab) => void;
}) {
  return (
    <nav className="grid grid-cols-4 border-b bg-background">
      {mobileTabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            className={cn(
              "flex h-12 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground",
              activeTab === tab.id && "bg-muted text-foreground"
            )}
            key={tab.id}
            onClick={() => onChange(tab.id)}
            type="button"
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
