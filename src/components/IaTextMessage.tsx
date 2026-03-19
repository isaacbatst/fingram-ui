import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

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
};

export function TextMessage({ text, isUser }: TextMessageProps) {
  return (
    <div
      className={clsx('flex flex-row gap-2', {
        'justify-end py-2': isUser,
      })}
    >
      <div
        className={clsx('rounded-[16px]', {
          'px-4 py-2 max-w-[90%] ml-4 text-foreground bg-muted whitespace-pre-wrap':
            isUser,
          'py-2 text-foreground': !isUser,
          'animate-bounce bg-muted': text === '⚫︎⚫︎⚫︎',
        })}
      >
        {isUser ? (
          text
        ) : (
          <ReactMarkdown components={markdownComponents}>
            {text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
