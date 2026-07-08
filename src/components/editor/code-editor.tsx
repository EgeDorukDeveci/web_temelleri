"use client";

import type { KeyboardEvent } from "react";
import type { LessonFile } from "@/content/types";
import { cn } from "@/lib/utils";

type CodeEditorProps = {
  files: LessonFile[];
  values: Record<string, string>;
  activePath: string;
  onActivePathChange: (path: string) => void;
  onChange: (path: string, value: string) => void;
};

export function CodeEditor({
  files,
  values,
  activePath,
  onActivePathChange,
  onChange
}: CodeEditorProps) {
  const activeFile = files.find((file) => file.path === activePath) ?? files[0];
  const value = activeFile ? values[activeFile.path] ?? activeFile.content : "";
  const lineCount = Math.max(1, value.split("\n").length);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab" || !activeFile) return;

    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = `${value.slice(0, start)}  ${value.slice(end)}`;

    onChange(activeFile.path, nextValue);
    window.requestAnimationFrame(() => {
      textarea.selectionStart = start + 2;
      textarea.selectionEnd = start + 2;
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-10 items-center gap-1 overflow-x-auto border-b bg-muted/55 px-2">
        {files.map((file) => (
          <button
            key={file.path}
            className={cn(
              "h-8 shrink-0 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors",
              file.path === activeFile?.path
                ? "bg-background text-foreground shadow-sm"
                : "hover:bg-background/70 hover:text-foreground"
            )}
            onClick={() => onActivePathChange(file.path)}
            type="button"
          >
            {file.path}
          </button>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto] bg-background">
        <textarea
          aria-label={`${activeFile?.path ?? "dosya"} kod editörü`}
          className="min-h-0 w-full resize-none overflow-auto bg-transparent px-4 py-3 font-mono text-[13px] leading-6 text-foreground outline-none selection:bg-accent/25"
          onChange={(event) => {
            if (activeFile) onChange(activeFile.path, event.target.value);
          }}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          value={value}
          wrap="off"
        />
        <div className="flex h-8 items-center justify-between border-t bg-muted/45 px-3 text-[11px] font-medium text-muted-foreground">
          <span>{activeFile?.language ?? "text"}</span>
          <span>{lineCount} satır</span>
        </div>
      </div>
    </div>
  );
}
