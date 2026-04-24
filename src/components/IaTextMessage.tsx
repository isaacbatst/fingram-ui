import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

type TextMessageProps = {
  text: string;
  isUser: boolean;
};

const markdownComponents: Components = {
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-4 my-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 my-1">{children}</ol>
  ),
  li: ({ children }) => <li className="my-0.5">{children}</li>,
  h1: ({ children }) => (
    <h1 className="text-lg font-semibold mt-2 mb-1">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-semibold mt-2 mb-1">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold mt-1 mb-0.5">{children}</h3>
  ),
  p: ({ children }) => <p className="my-1">{children}</p>,
  code: ({ children }) => (
    <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  ),
  table: ({ children }) => (
    <div className="my-2 -mx-1 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-border">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-border/50 last:border-0">{children}</tr>
  ),
  th: ({ children, style }) => (
    <th
      className="px-2 py-1.5 text-left font-semibold text-muted-foreground"
      style={style}
    >
      {children}
    </th>
  ),
  td: ({ children, style }) => (
    <td className="px-2 py-1.5 align-top" style={style}>
      {children}
    </td>
  ),
};

const remarkPlugins = [remarkGfm];

export function TextMessage({ text, isUser }: TextMessageProps) {
  return (
    <div
      className={clsx('flex flex-row gap-2 w-full min-w-0', {
        'justify-end py-2': isUser,
      })}
    >
      <div
        className={clsx('rounded-[16px] min-w-0', {
          'px-4 py-2 max-w-[90%] ml-4 text-foreground bg-muted whitespace-pre-wrap':
            isUser,
          'py-2 text-foreground flex-1': !isUser,
          'animate-bounce bg-muted': text === '⚫︎⚫︎⚫︎',
        })}
      >
        {isUser ? (
          text
        ) : (
          <ReactMarkdown
            components={markdownComponents}
            remarkPlugins={remarkPlugins}
          >
            {text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
