import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"

export default function MarkdownRenderer({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        p: ({ node, ...props }) => (
          <p className="mb-2 last:mb-0 leading-relaxed" {...props} />
        ),
        code: ({ node, className, children, ...props }) => {
          const isInline = !className
          if (isInline) {
            return (
              <code
                className="bg-zinc-800/80 text-red-300 px-1 py-0.5 rounded text-xs font-mono"
                {...props}
              >
                {children}
              </code>
            )
          }
          return (
            <div className="my-2 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <code className="text-xs font-mono text-zinc-200 leading-relaxed block" {...props}>
                {children}
              </code>
            </div>
          )
        },
        strong: ({ node, ...props }) => (
          <strong className="text-zinc-100 font-semibold" {...props} />
        ),
        em: ({ node, ...props }) => (
          <em className="text-zinc-200 italic" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc list-inside mb-2 space-y-0.5 marker:text-red-500" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal list-inside mb-2 space-y-0.5 marker:text-zinc-400" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="text-zinc-300" {...props} />
        ),
        a: ({ node, ...props }) => (
          <a className="text-red-400 underline hover:text-red-300 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
        ),
        h1: ({ node, ...props }) => <h1 className="text-base font-semibold text-zinc-100 mb-2 mt-3" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-sm font-semibold text-zinc-100 mb-1.5 mt-2.5" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-sm font-medium text-zinc-100 mb-1 mt-2" {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-2 border-red-800/60 pl-3 my-2 text-zinc-400 italic text-xs" {...props} />
        ),
        hr: ({ node, ...props }) => <hr className="border-zinc-800 my-3" {...props} />,
        table: ({ node, ...props }) => (
          <div className="my-2 overflow-x-auto">
            <table className="w-full text-xs border-collapse" {...props} />
          </div>
        ),
        th: ({ node, ...props }) => <th className="border border-zinc-800 px-2 py-1 text-zinc-100 font-medium bg-zinc-900/50" {...props} />,
        td: ({ node, ...props }) => <td className="border border-zinc-800 px-2 py-1 text-zinc-300" {...props} />,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
