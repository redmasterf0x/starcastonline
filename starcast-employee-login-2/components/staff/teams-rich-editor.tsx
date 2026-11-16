"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { rewordStaffMessageWithAi } from "@/app/actions/staff-inbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  RemoveFormatting,
  Undo2,
  Redo2,
  Quote,
  Sparkles,
  Loader2,
  RotateCcw,
  ChevronDown,
  Palette,
} from "lucide-react"

interface TeamsRichEditorProps {
  valueHtml: string
  onChange: (next: { html: string; text: string }) => void
  placeholder?: string
  contextSubject?: string
  minHeight?: number
  disabled?: boolean
}

type AiTone = "executive" | "friendly" | "concise"

const TEXT_COLORS = [
  { label: "Default", value: "#f5f7ff" },
  { label: "StarCast Orange", value: "#ea6f2a" },
  { label: "Cosmic Cyan", value: "#20efe0" },
  { label: "Solar Gold", value: "#ffd166" },
  { label: "Mint", value: "#6ee7b7" },
]

export function TeamsRichEditor({
  valueHtml,
  onChange,
  placeholder = "Write your message... Use the toolbar for Word-style formatting or click 'Make me sound smart' to polish with AI.",
  contextSubject,
  minHeight = 180,
  disabled = false,
}: TeamsRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalChange = useRef(false)

  const [isEmpty, setIsEmpty] = useState(true)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [showColorMenu, setShowColorMenu] = useState(false)
  const [showBlockMenu, setShowBlockMenu] = useState(false)
  const [activeBlock, setActiveBlock] = useState("Normal")

  const [aiTone, setAiTone] = useState<AiTone>("executive")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiStatus, setAiStatus] = useState<string | null>(null)
  const [previousSnapshot, setPreviousSnapshot] = useState<{ html: string; text: string } | null>(null)

  const syncStatsAndEmit = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    const html = el.innerHTML
    const text = (el.innerText || "").replace(/\u00a0/g, " ").trim()
    setIsEmpty(text.length === 0)
    setCharCount(text.length)
    setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0)

    isInternalChange.current = true
    onChange({ html: text ? html : "", text })
  }, [onChange])

  // Sync external resets or AI updates into the contentEditable DOM
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (isInternalChange.current) {
      isInternalChange.current = false
      return
    }
    if (el.innerHTML !== valueHtml) {
      el.innerHTML = valueHtml || ""
      const text = (el.innerText || "").replace(/\u00a0/g, " ").trim()
      setIsEmpty(text.length === 0)
      setCharCount(text.length)
      setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0)
    }
  }, [valueHtml])

  function execFormat(command: string, value?: string) {
    if (disabled) return
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    syncStatsAndEmit()
  }

  function applyBlockFormat(tag: string, label: string) {
    setActiveBlock(label)
    setShowBlockMenu(false)
    execFormat("formatBlock", tag)
  }

  function handleInsertLink() {
    const trimmed = linkUrl.trim()
    if (!trimmed) {
      setShowLinkInput(false)
      return
    }
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    execFormat("createLink", normalized)
    setLinkUrl("")
    setShowLinkInput(false)
  }

  async function handleMakeMeSoundSmart() {
    const el = editorRef.current
    if (!el || aiLoading || disabled) return
    const currentText = (el.innerText || "").replace(/\u00a0/g, " ").trim()
    const currentHtml = el.innerHTML

    if (!currentText) {
      setAiError("Type a quick draft or rough notes first, then click Make me sound smart.")
      return
    }

    setAiLoading(true)
    setAiError(null)
    setAiStatus(null)
    setPreviousSnapshot({ html: currentHtml, text: currentText })

    try {
      const result = await rewordStaffMessageWithAi({
        text: currentText,
        contextSubject,
        tone: aiTone,
      })

      if (editorRef.current) {
        editorRef.current.innerHTML = result.rewrittenHtml
      }
      isInternalChange.current = true
      onChange({
        html: result.rewrittenHtml,
        text: result.rewrittenText,
      })
      const newText = result.rewrittenText.trim()
      setIsEmpty(newText.length === 0)
      setCharCount(newText.length)
      setWordCount(newText ? newText.split(/\s+/).filter(Boolean).length : 0)

      setAiStatus(
        result.provider === "gemini"
          ? "Reworded with Gemini AI"
          : result.provider === "openai"
          ? "Reworded with AI"
          : "Polished & structured"
      )
    } catch (err: any) {
      setAiError(err?.message || "Could not reword message right now.")
    } finally {
      setAiLoading(false)
    }
  }

  function handleRevertAi() {
    if (!previousSnapshot || !editorRef.current) return
    editorRef.current.innerHTML = previousSnapshot.html
    isInternalChange.current = true
    onChange(previousSnapshot)
    const text = previousSnapshot.text.trim()
    setIsEmpty(text.length === 0)
    setCharCount(text.length)
    setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0)
    setPreviousSnapshot(null)
    setAiStatus(null)
    setAiError(null)
  }

  return (
    <div className="rounded-2xl border border-[#20205a] bg-[#05052d] overflow-visible shadow-inner focus-within:border-[#ea6f2a]/70 transition-colors">
      {/* ── MICROSOFT TEAMS / WORD STYLE FORMATTING RIBBON ── */}
      <div className="flex flex-wrap items-center gap-1 px-2.5 py-2 border-b border-[#20205a]/80 bg-[#0b0b38] rounded-t-2xl">
        {/* Heading / Style Selector */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setShowBlockMenu((v) => !v)
              setShowColorMenu(false)
            }}
            className="h-8 px-2.5 rounded-lg text-xs font-semibold text-[#dbe0fb] hover:bg-[#20205a]/60 hover:text-white flex items-center gap-1.5 transition-colors"
            title="Paragraph style"
          >
            <span>{activeBlock}</span>
            <ChevronDown className="w-3 h-3 text-[#9a9fc4]" />
          </button>

          {showBlockMenu && (
            <div className="absolute left-0 top-full mt-1 z-30 w-40 rounded-xl border border-[#20205a] bg-[#0c0c3f] shadow-xl p-1 space-y-0.5">
              {[
                { tag: "P", label: "Normal", cls: "text-xs font-normal" },
                { tag: "H1", label: "Heading 1", cls: "text-base font-extrabold" },
                { tag: "H2", label: "Heading 2", cls: "text-sm font-bold" },
                { tag: "H3", label: "Heading 3", cls: "text-xs font-bold uppercase tracking-wide" },
                { tag: "BLOCKQUOTE", label: "Quote", cls: "text-xs italic border-l-2 border-[#ea6f2a] pl-2" },
              ].map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => applyBlockFormat(item.tag, item.label)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[#f5f7ff] hover:bg-[#ea6f2a]/20 transition-colors ${item.cls}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-[#20205a] mx-0.5" />

        {/* Basic Text Formatting */}
        <ToolbarBtn title="Bold (Ctrl+B)" onClick={() => execFormat("bold")} disabled={disabled}>
          <Bold className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Italic (Ctrl+I)" onClick={() => execFormat("italic")} disabled={disabled}>
          <Italic className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Underline (Ctrl+U)" onClick={() => execFormat("underline")} disabled={disabled}>
          <Underline className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Strikethrough" onClick={() => execFormat("strikeThrough")} disabled={disabled}>
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolbarBtn>

        {/* Text Color Picker */}
        <div className="relative">
          <ToolbarBtn
            title="Text color"
            onClick={() => {
              setShowColorMenu((v) => !v)
              setShowBlockMenu(false)
            }}
            disabled={disabled}
          >
            <Palette className="w-3.5 h-3.5 text-[#ffd166]" />
          </ToolbarBtn>

          {showColorMenu && (
            <div className="absolute left-0 top-full mt-1 z-30 flex items-center gap-1.5 rounded-xl border border-[#20205a] bg-[#0c0c3f] shadow-xl p-2">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => {
                    execFormat("foreColor", c.value)
                    setShowColorMenu(false)
                  }}
                  className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-[#20205a] mx-0.5" />

        {/* Lists & Quote */}
        <ToolbarBtn title="Bulleted list" onClick={() => execFormat("insertUnorderedList")} disabled={disabled}>
          <List className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Numbered list" onClick={() => execFormat("insertOrderedList")} disabled={disabled}>
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Blockquote" onClick={() => execFormat("formatBlock", "BLOCKQUOTE")} disabled={disabled}>
          <Quote className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-[#20205a] mx-0.5 hidden sm:block" />

        {/* Alignment */}
        <div className="hidden sm:flex items-center gap-0.5">
          <ToolbarBtn title="Align left" onClick={() => execFormat("justifyLeft")} disabled={disabled}>
            <AlignLeft className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Align center" onClick={() => execFormat("justifyCenter")} disabled={disabled}>
            <AlignCenter className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Align right" onClick={() => execFormat("justifyRight")} disabled={disabled}>
            <AlignRight className="w-3.5 h-3.5" />
          </ToolbarBtn>
        </div>

        <div className="w-px h-5 bg-[#20205a] mx-0.5" />

        {/* Link, Clear Formatting, Undo/Redo */}
        <ToolbarBtn
          title="Insert hyperlink"
          onClick={() => setShowLinkInput((v) => !v)}
          disabled={disabled}
        >
          <Link2 className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Clear formatting"
          onClick={() => execFormat("removeFormat")}
          disabled={disabled}
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Undo" onClick={() => execFormat("undo")} disabled={disabled}>
          <Undo2 className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Redo" onClick={() => execFormat("redo")} disabled={disabled}>
          <Redo2 className="w-3.5 h-3.5" />
        </ToolbarBtn>
      </div>

      {/* Inline Link Input Bar */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0e0e44] border-b border-[#20205a]/80">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleInsertLink()
              }
            }}
            placeholder="https://starcast.online/..."
            className="h-8 text-xs bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleInsertLink}
            className="h-8 px-3 text-xs bg-[#ea6f2a] hover:bg-[#bc3f00] text-white"
          >
            Add Link
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowLinkInput(false)}
            className="h-8 px-2 text-xs text-[#9a9fc4]"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* ── CONTENTEDITABLE WORD CANVAS ── */}
      <div className="relative">
        {isEmpty && (
          <div className="pointer-events-none absolute top-3.5 left-4 right-4 text-xs sm:text-sm text-[#9a9fc4]/60 select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={syncStatsAndEmit}
          onBlur={syncStatsAndEmit}
          style={{ minHeight: `${minHeight}px` }}
          className="w-full max-h-[360px] overflow-y-auto px-4 py-3.5 text-xs sm:text-sm text-[#f5f7ff] leading-relaxed outline-none prose prose-invert prose-sm max-w-none [&_h1]:text-xl [&_h1]:font-extrabold [&_h1]:text-white [&_h1]:my-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_h2]:my-1.5 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:uppercase [&_h3]:text-[#ffd166] [&_h3]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:border-[#ea6f2a] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[#cbd0f2] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-[#20efe0] [&_a]:underline"
        />
      </div>

      {/* ── TEAMS-STYLE BOTTOM AI & STATUS BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-[#20205a]/80 bg-[#0b0b38] rounded-b-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tone Pills */}
          <div className="inline-flex items-center rounded-lg bg-[#05052d] border border-[#20205a] p-0.5">
            {(
              [
                { id: "executive", label: "Smart" },
                { id: "friendly", label: "Warm" },
                { id: "concise", label: "Concise" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={disabled || aiLoading}
                onClick={() => setAiTone(t.id)}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                  aiTone === t.id
                    ? "bg-[#20205a] text-[#20efe0]"
                    : "text-[#9a9fc4] hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Signature "Make me sound smart" AI Button */}
          <Button
            type="button"
            size="sm"
            disabled={disabled || aiLoading || isEmpty}
            onClick={handleMakeMeSoundSmart}
            className="h-8 px-3 rounded-xl bg-gradient-to-r from-[#20efe0] to-[#38bdf8] hover:from-[#1ad8ca] hover:to-[#0ea5e9] text-[#05052d] font-extrabold text-xs shadow-md shadow-[#20efe0]/15 disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Polishing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Make me sound smart
              </>
            )}
          </Button>

          {previousSnapshot && !aiLoading && (
            <button
              type="button"
              onClick={handleRevertAi}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#ffd166] hover:underline px-1.5 py-1"
              title="Restore original draft"
            >
              <RotateCcw className="w-3 h-3" /> Undo AI
            </button>
          )}

          {aiStatus && !aiError && (
            <span className="text-[11px] font-semibold text-emerald-400">
              {aiStatus}
            </span>
          )}
          {aiError && (
            <span className="text-[11px] font-semibold text-red-400">
              {aiError}
            </span>
          )}
        </div>

        <div className="text-[11px] font-mono text-[#9a9fc4] ml-auto">
          {wordCount} {wordCount === 1 ? "word" : "words"} &bull; {charCount} chars
        </div>
      </div>
    </div>
  )
}

function ToolbarBtn({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // Keep text selection inside contentEditable
      onClick={onClick}
      className="h-8 w-8 rounded-lg flex items-center justify-center text-[#cbd0f2] hover:bg-[#20205a]/70 hover:text-white disabled:opacity-40 transition-colors"
    >
      {children}
    </button>
  )
}

