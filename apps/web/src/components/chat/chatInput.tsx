import './chatInput.css';

import { useLayoutEffect, useRef } from 'react';

interface ChatInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  onSubmit?: (e?: React.SyntheticEvent) => void;
}

const ChatInput = ({ value, onChange, onSubmit, disabled, ...props }: ChatInputProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.height = '1em';
    el.style.height = `${String(el.scrollHeight)}px`;
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;

    props.onKeyDown?.(e);

    if (!e.defaultPrevented && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    if (newValue.toLowerCase().includes('b1nzy')) {
      window.open('https://takeb1nzyto.space/', '_blank');

      return; //You're gonna get ratelimited.
    }

    onChange(e);
  };

  return (
    <textarea
      {...props}
      ref={ref}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className='chat-input'
    />
  );
};

export default ChatInput;
