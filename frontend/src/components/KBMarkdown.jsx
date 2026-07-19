"use client"

import { Check } from "lucide-react"

/* ────────────────────────────────────────────────────────────────
 * KBMarkdown
 * Renderiza markdown técnico (headings, código, listas, checklists,
 * tablas, citas, links, negrita/cursiva/inline-code) como JSX real
 * en vez de dangerouslySetInnerHTML — mismo look táctico que el
 * resto de ARES, sin dependencias externas.
 *
 * Uso: <KBMarkdown content={content.content} />
 * ──────────────────────────────────────────────────────────────── */

// ---------- Parser inline (negrita, cursiva, code, links, tachado) ----------

function tokenizeInline(text) {
  const re =
    /`([^`\n]+)`|\*\*([^*]+?)\*\*|__([^_]+?)__|\*([^*]+?)\*|_([^_]+?)_|~~([^~]+?)~~|\[([^\]]+?)\]\(([^)]+?)\)/g
  const tokens = []
  let lastIndex = 0
  let m
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) tokens.push({ type: "text", content: text.slice(lastIndex, m.index) })
    if (m[1] !== undefined) tokens.push({ type: "code", content: m[1] })
    else if (m[2] !== undefined) tokens.push({ type: "bold", content: m[2] })
    else if (m[3] !== undefined) tokens.push({ type: "bold", content: m[3] })
    else if (m[4] !== undefined) tokens.push({ type: "italic", content: m[4] })
    else if (m[5] !== undefined) tokens.push({ type: "italic", content: m[5] })
    else if (m[6] !== undefined) tokens.push({ type: "strike", content: m[6] })
    else if (m[7] !== undefined) tokens.push({ type: "link", content: m[7], url: m[8] })
    lastIndex = re.lastIndex
  }
  if (lastIndex < text.length) tokens.push({ type: "text", content: text.slice(lastIndex) })
  return tokens
}

function renderInline(text, keyPrefix) {
  return tokenizeInline(text).map((tok, idx) => {
    const key = `${keyPrefix}-${idx}`
    switch (tok.type) {
      case "code":
        return (
          <code
            key={key}
            className="rounded border border-neutral-800/60 bg-neutral-900/70 px-1.5 py-0.5 text-[0.82em] text-red-300/90"
          >
            {tok.content}
          </code>
        )
      case "bold":
        return (
          <strong key={key} className="font-semibold text-neutral-100">
            {tok.content}
          </strong>
        )
      case "italic":
        return (
          <em key={key} className="italic text-neutral-300">
            {tok.content}
          </em>
        )
      case "strike":
        return (
          <span key={key} className="text-neutral-600 line-through">
            {tok.content}
          </span>
        )
      case "link":
        return (
          <a
            key={key}
            href={tok.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400/90 underline decoration-red-500/30 underline-offset-2 transition-colors hover:text-red-300"
          >
            {tok.content}
          </a>
        )
      default:
        return <span key={key}>{tok.content}</span>
    }
  })
}

// ---------- Parser de bloques ----------

function parseBlocks(markdown) {
  const lines = (markdown || "").replace(/\r\n/g, "\n").split("\n")
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === "") {
      i++
      continue
    }

    // bloque de código
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim()
      i++
      const codeLines = []
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i])
        i++
      }
      i++
      blocks.push({ type: "code", lang, content: codeLines.join("\n") })
      continue
    }

    // encabezados
    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/)
    if (headingMatch) {
      blocks.push({ type: "heading", level: headingMatch[1].length, text: headingMatch[2].trim() })
      i++
      continue
    }

    // línea divisoria
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      blocks.push({ type: "hr" })
      i++
      continue
    }

    // cita
    if (line.trim().startsWith(">")) {
      const quoteLines = []
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""))
        i++
      }
      blocks.push({ type: "quote", text: quoteLines.join(" ") })
      continue
    }

    // tabla
    if (line.trim().startsWith("|")) {
      const tableLines = []
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i])
        i++
      }
      const rows = tableLines
        .filter((l) => !/^\|?[\s:|-]+\|?$/.test(l.trim()))
        .map((l) =>
          l
            .trim()
            .replace(/^\||\|$/g, "")
            .split("|")
            .map((c) => c.trim())
        )
      const [header, ...bodyRows] = rows
      blocks.push({ type: "table", header: header || [], rows: bodyRows })
      continue
    }

    // listas (con soporte de checklist "- [x] ")
    if (/^\s*([-*])\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const items = []
      const ordered = /^\s*\d+\.\s+/.test(line)
      while (i < lines.length && (/^\s*([-*])\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))) {
        let raw = lines[i].replace(/^\s*([-*]|\d+\.)\s+/, "")
        let checked = null
        const checkboxMatch = raw.match(/^\[([ xX])\]\s+(.*)$/)
        if (checkboxMatch) {
          checked = checkboxMatch[1].toLowerCase() === "x"
          raw = checkboxMatch[2]
        }
        items.push({ text: raw, checked })
        i++
      }
      blocks.push({ type: "list", ordered, items })
      continue
    }

    // párrafo
    const paraLines = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("|") &&
      !/^\s*([-*])\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i])
      i++
    }
    blocks.push({ type: "paragraph", text: paraLines.join(" ") })
  }

  return blocks
}

// ---------- Render de bloques ----------

function Heading({ level, text, keyPrefix }) {
  const content = renderInline(text, keyPrefix)
  if (level <= 2) {
    return (
      <h2 className="mt-6 mb-2.5 border-b border-neutral-800/40 pb-2 font-mono text-[0.85rem] font-semibold tracking-wide text-white first:mt-0">
        {content}
      </h2>
    )
  }
  if (level === 3) {
    return (
      <h3 className="mt-5 mb-1.5 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-red-400">
        {content}
      </h3>
    )
  }
  return (
    <h4 className="mt-4 mb-1 font-mono text-[0.7rem] font-semibold uppercase tracking-wide text-neutral-400">
      {content}
    </h4>
  )
}

function CodeBlock({ lang, content }) {
  return (
    <pre className="my-3 overflow-x-auto rounded-lg border border-neutral-800/40 bg-[#050505] px-4 py-3.5 font-mono text-[0.72rem] leading-relaxed text-neutral-200">
      {lang ? (
        <div className="mb-2 text-[0.62rem] uppercase tracking-[0.08em] text-neutral-600">{lang}</div>
      ) : null}
      <code>{content}</code>
    </pre>
  )
}

function ListBlock({ ordered, items, keyPrefix }) {
  const isChecklist = items.some((it) => it.checked !== null)

  if (isChecklist) {
    return (
      <ul className="my-2 flex flex-col gap-1.5">
        {items.map((it, idx) => (
          <li key={`${keyPrefix}-${idx}`} className="flex items-start gap-2 text-[0.78rem] leading-relaxed">
            <span
              className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${
                it.checked ? "border-red-500/50 bg-red-500/10" : "border-neutral-700 bg-transparent"
              }`}
            >
              {it.checked ? <Check className="h-2.5 w-2.5 text-red-400" strokeWidth={3} /> : null}
            </span>
            <span className={it.checked ? "text-neutral-500 line-through decoration-neutral-700" : "text-neutral-300"}>
              {renderInline(it.text, `${keyPrefix}-${idx}`)}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  const Tag = ordered ? "ol" : "ul"
  return (
    <Tag className={`my-2 flex flex-col gap-1 pl-4 ${ordered ? "list-decimal" : "list-disc"} marker:text-neutral-700`}>
      {items.map((it, idx) => (
        <li key={`${keyPrefix}-${idx}`} className="text-[0.78rem] leading-relaxed text-neutral-400">
          {renderInline(it.text, `${keyPrefix}-${idx}`)}
        </li>
      ))}
    </Tag>
  )
}

function TableBlock({ header, rows, keyPrefix }) {
  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-neutral-800/40">
      <table className="w-full border-collapse text-left">
        {header.length > 0 && (
          <thead>
            <tr className="bg-neutral-900/50">
              {header.map((cell, idx) => (
                <th
                  key={`${keyPrefix}-h-${idx}`}
                  className="border-b border-neutral-800/40 px-3 py-2 font-mono text-[0.68rem] uppercase tracking-wide text-neutral-500"
                >
                  {renderInline(cell, `${keyPrefix}-h-${idx}`)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={`${keyPrefix}-r-${rIdx}`} className="border-t border-neutral-800/30">
              {row.map((cell, cIdx) => (
                <td key={`${keyPrefix}-r-${rIdx}-${cIdx}`} className="px-3 py-2 text-[0.75rem] text-neutral-300">
                  {renderInline(cell, `${keyPrefix}-r-${rIdx}-${cIdx}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function KBMarkdown({ content }) {
  const blocks = parseBlocks(content)

  return (
    <div className="space-y-0.5">
      {blocks.map((block, idx) => {
        const key = `b-${idx}`
        switch (block.type) {
          case "heading":
            return <Heading key={key} level={block.level} text={block.text} keyPrefix={key} />
          case "code":
            return <CodeBlock key={key} lang={block.lang} content={block.content} />
          case "list":
            return <ListBlock key={key} ordered={block.ordered} items={block.items} keyPrefix={key} />
          case "table":
            return <TableBlock key={key} header={block.header} rows={block.rows} keyPrefix={key} />
          case "quote":
            return (
              <blockquote
                key={key}
                className="my-3 rounded-r-md border-l-2 border-red-500/40 bg-neutral-900/30 py-2 pl-3.5 pr-3 text-[0.78rem] italic leading-relaxed text-neutral-400"
              >
                {renderInline(block.text, key)}
              </blockquote>
            )
          case "hr":
            return <hr key={key} className="my-4 border-neutral-800/40" />
          case "paragraph":
          default:
            return (
              <p key={key} className="my-2 text-[0.78rem] leading-[1.7] text-neutral-400">
                {renderInline(block.text, key)}
              </p>
            )
        }
      })}
    </div>
  )
}
