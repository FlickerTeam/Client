import './chatInput.css';

import { useLayoutEffect, useRef } from 'react';

interface ChatInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  onSubmit?: (e?: React.SyntheticEvent) => void;
}

const ChatInput = ({ value, onChange, onSubmit, disabled, ...props }: ChatInputProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  //Auto-resize
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.height = '1em';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  //Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;

    props.onKeyDown?.(e);

    if (!e.defaultPrevented && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.(e);
    }
  };

  return (
    <textarea
      {...props}
      ref={ref}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className='message-content chat-input'
    />
  );
};

export default ChatInput;
