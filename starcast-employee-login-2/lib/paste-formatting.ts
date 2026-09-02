import type React from "react"

const BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "LI",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BLOCKQUOTE",
  "TR",
  "SECTION",
  "ARTICLE",
  "TABLE",
])

/**
 * Reads the rich HTML representation of pasted content (when available) and
 * rebuilds plain text with real paragraph breaks preserved.
 *
 * Plain `text/plain` clipboard payloads from Word, Google Docs, Notion, etc.
 * frequently drop blank lines between paragraphs entirely, or collapse them
 * into a single line, because those apps represent paragraphs as HTML block
 * elements rather than literal "\n\n" characters. Reading `text/html` and
 * walking the block structure gives us back the paragraph/line spacing the
 * user actually copied.
 */
export function extractPastedText(e: React.ClipboardEvent): string {
  const html = e.clipboardData?.getData("text/html")

  if (html) {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html")
      doc.querySelectorAll("script, style").forEach((el) => el.remove())

      let result = ""

      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          result += node.textContent || ""
          return
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return

        const el = node as HTMLElement
        if (el.tagName === "BR") {
          result += "\n"
          return
        }

        const isBlock = BLOCK_TAGS.has(el.tagName)
        Array.from(el.childNodes).forEach(walk)

        if (isBlock) {
          result = result.replace(/[ \t]*$/, "")
          if (!result.endsWith("\n\n")) {
            result = result.replace(/\n?$/, "") + "\n\n"
          }
        }
      }

      walk(doc.body)

      const normalized = result
        .replace(/\u00a0/g, " ")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()

      if (normalized) return normalized
    } catch {
      // Fall through to plain text below.
    }
  }

  return e.clipboardData?.getData("text/plain") ?? ""
}

/**
 * Pastes `text` into a (possibly controlled) textarea/input at the current
 * cursor position, replacing any current selection, and moves the cursor to
 * just after the inserted text.
 */
export function pasteIntoField(
  target: HTMLTextAreaElement | HTMLInputElement,
  text: string,
  currentValue: string,
): string {
  const start = target.selectionStart ?? currentValue.length
  const end = target.selectionEnd ?? currentValue.length
  const nextValue = currentValue.slice(0, start) + text + currentValue.slice(end)
  const cursor = start + text.length

  // Write directly to the DOM node first so the cursor can be positioned
  // immediately. React will reconcile this against the same string once the
  // controlled state update below commits, so the visible value won't jump.
  target.value = nextValue
  target.setSelectionRange(cursor, cursor)

  return nextValue
}
