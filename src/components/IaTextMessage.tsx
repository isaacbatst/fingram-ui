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
          'px-4 py-2 max-w-[90%] ml-4 text-stone--900 bg-[#ededed]': isUser,
          'py-2  text-black bg-white': !isUser,
          'animate-bounce bg-gray-200': text === '⚫︎⚫︎⚫︎',
        })}
      >
        {text}
      </div>
    </div>
  );
}