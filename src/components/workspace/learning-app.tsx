"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clipboard,
  Code2,
  Eye,
  FileText,
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
import { runLessonChecks, type CheckResult } from "@/lib/checks";
import { buildPreviewDocument, filesToRecord } from "@/lib/preview";
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

  const lessonsById = useMemo(
    () => new Map(tutorial.lessons.map((lesson) => [lesson.id, lesson])),
    []
  );

  const activeLesson =
    lessonsById.get(progress.activeLessonId) ?? tutorial.lessons[0];
  const lessonProgress = progress.lessons[activeLesson.id];
  const currentFiles = lessonProgress?.files ?? filesToRecord(activeLesson.starterFiles);
  const previewDoc = buildPreviewDocument(currentFiles, { darkMode });
  const completedCount = Object.values(progress.lessons).filter(
    (item) => item.completed
  ).length;

  useEffect(() => {
    setProgress(loadProgress(tutorial.lessons));
    try {
      const storedTheme = window.localStorage.getItem("modern-web-atolyesi-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(storedTheme ? storedTheme === "dark" : prefersDark);
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

  function handlePanelDrag(event: React.MouseEvent<HTMLDivElement>) {
    const startX = event.clientX;
    const root = document.documentElement;
    const initial = parseFloat(
      getComputedStyle(root).getPropertyValue("--lesson-panel-width")
    );
    const base = Number.isFinite(initial) ? initial : 34;

    function onMove(moveEvent: MouseEvent) {
      const delta = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
      root.style.setProperty(
        "--lesson-panel-width",
        `${Math.min(46, Math.max(26, base + delta))}%`
      );
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

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
        <div className="grid min-w-0 flex-1 gap-0 workspace-grid">
          <LessonPanel
            activeLesson={activeLesson}
            checkResult={checkResult}
            completedCount={completedCount}
            copyState={copyState}
            currentFiles={currentFiles}
            hintIndex={hintIndex}
            lessonProgress={lessonProgress}
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

          <div
            aria-hidden="true"
            className="w-1 cursor-col-resize bg-border/80 transition-colors hover:bg-primary"
            onMouseDown={handlePanelDrag}
          />

          <EditorPreviewPanel
            activeFilePath={activeFilePath}
            currentFiles={currentFiles}
            darkMode={darkMode}
            lesson={activeLesson}
            notes={lessonProgress?.notes ?? ""}
            onActiveFilePathChange={setActiveFilePath}
            onNotesChange={updateNotes}
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
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-accent" />
            İpucu
          </h3>
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
                <li className="flex items-center gap-2" key={item.id}>
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      item.passed ? "bg-success" : "bg-destructive"
                    )}
                  />
                  {item.label}
                </li>
              ))}
            </ul>
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

function EditorPreviewPanel({
  lesson,
  currentFiles,
  activeFilePath,
  previewDoc,
  notes,
  darkMode,
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
  onActiveFilePathChange: (path: string) => void;
  onUpdateFile: (path: string, value: string) => void;
  onNotesChange: (notes: string) => void;
}) {
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
      <div className="grid min-h-0 grid-cols-[1fr_300px]">
        <PreviewFrame darkMode={darkMode} srcDoc={previewDoc} />
        <NotesPanel notes={notes} onChange={onNotesChange} />
      </div>
    </section>
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
    <div className="flex min-h-0 flex-col border-r bg-background">
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
