import clsx from 'clsx';

type TextMessageProps = {
  text: string;
  isUser: boolean;
};

export function TextMessage({ text, isUser }: TextMessageProps) {
  return (
    <div
      className={clsx('flex flex-row gap-2', {
        'justify-end py-2': isUser,
      })}
    >
      <div
        className={clsx('rounded-[16px] whitespace-pre-wrap', {
          'px-4 py-2 max-w-[90%] ml-4 text-foreground bg-muted': isUser,
          'py-2  text-foreground bg-[var(--color-bg-surface)]': !isUser,
          'animate-bounce bg-muted': text === '⚫︎⚫︎⚫︎',
        })}
      >
        {text}
      </div>
    </div>
  );
}