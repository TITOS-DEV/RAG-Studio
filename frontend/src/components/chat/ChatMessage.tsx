import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTypewriter } from '@/hooks/useTypewriter';
import type { Message } from '@/types';

interface Props {
  message: Message;
  isLatest?: boolean;
  assistantName?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white/90 transition-colors">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

const MarkdownContent = memo(({ content }: { content: string }) => (
  <ReactMarkdown
    components={{
      code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        const codeString = String(children).replace(/\n$/, '');
        if (match) {
          return (
            <div className="my-4 rounded-xl overflow-hidden border border-white/10">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                <span className="text-xs text-white/40 font-mono">{match[1]}</span>
                <CopyButton text={codeString} />
              </div>
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                customStyle={{ margin: 0, background: 'rgba(0,0,0,0.4)', padding: '1rem', fontSize: '0.8rem' }}
              >
                {codeString}
              </SyntaxHighlighter>
            </div>
          );
        }
        return (
          <code className="px-1.5 py-0.5 rounded-md bg-white/10 text-violet-300 font-mono text-[0.85em]" {...props}>
            {children}
          </code>
        );
      },
      p: ({ children }) => <p className="mb-3 last:mb-0 leading-7">{children}</p>,
      h1: ({ children }) => <h1 className="text-xl font-bold mt-5 mb-3 text-white">{children}</h1>,
      h2: ({ children }) => <h2 className="text-lg font-semibold mt-4 mb-2 text-white/90">{children}</h2>,
      h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-2 text-white/80">{children}</h3>,
      ul: ({ children }) => <ul className="mb-3 space-y-1.5 pl-1">{children}</ul>,
      ol: ({ children }) => <ol className="mb-3 space-y-1.5 pl-4 list-decimal">{children}</ol>,
      li: ({ children }) => (
        <li className="flex gap-2 text-white/85">
          <span className="text-violet-400 mt-1 shrink-0">▸</span>
          <span>{children}</span>
        </li>
      ),
      blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-violet-500/50 pl-4 my-3 text-white/60 italic">{children}</blockquote>
      ),
      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
      em: ({ children }) => <em className="italic text-white/80">{children}</em>,
      hr: () => <hr className="my-4 border-white/10" />,
      a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer"
          className="text-violet-400 hover:text-violet-300 underline underline-offset-2 inline-flex items-center gap-0.5">
          {children}<ExternalLink className="w-3 h-3" />
        </a>
      ),
      table: ({ children }) => (
        <div className="overflow-x-auto my-4">
          <table className="w-full border-collapse text-sm">{children}</table>
        </div>
      ),
      th: ({ children }) => <th className="border border-white/10 px-3 py-2 bg-white/5 text-left font-semibold">{children}</th>,
      td: ({ children }) => <td className="border border-white/10 px-3 py-2">{children}</td>,
    }}
  >
    {content}
  </ReactMarkdown>
));

export function ChatMessage({ message, isLatest, assistantName }: Props) {
  const isUser = message.role === 'user';
  const safeContent = message.content ?? '';
  const { displayed, done } = useTypewriter(
    safeContent,
    !isUser && !!isLatest,
    12
  );

  const content = (!isUser && isLatest) ? displayed : safeContent;

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end mb-6"
      >
        <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm bg-white/[0.08] border border-white/[0.08] text-white/90 text-sm leading-relaxed">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* Assistant label */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          {assistantName ?? 'Asistente'}
        </span>
      </div>

      {/* Content */}
      <div className="pl-8 text-[0.95rem] text-white/85">
        <MarkdownContent content={content} />

        {/* Cursor while typing */}
        {isLatest && !done && (
          <span className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 animate-pulse align-middle" />
        )}

        {/* Sources */}
        {done && message.sources && message.sources.filter(s => typeof s === 'string' && s).length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/[0.06]"
          >
            <span className="text-xs text-white/30 self-center">Fuentes:</span>
            {message.sources.filter(s => typeof s === 'string' && s).map((src, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white/[0.06] text-white/50 border border-white/[0.08] hover:bg-white/[0.1] transition-colors cursor-default">
                <ExternalLink className="w-2.5 h-2.5" />
                {src}
              </span>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
