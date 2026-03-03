import './codeBlock.css';

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useShiki } from '@/hooks/useShiki';

interface Props {
  children: string;
  language?: string;
  theme?: string;
}

export default function CodeBlock({ children, language, theme = 'flicker-discord' }: Props) {
  const [rendered, setRendered] = useState<{ signature: string; html: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { highlight } = useShiki();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);
  const normalizedLanguage = language ? language.trim().toLowerCase().split(/\s+/)[0] : undefined;
  const signature = `${theme}\0${normalizedLanguage ?? ''}\0${children}`;
  const html = rendered?.signature === signature ? rendered.html : null;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !html) {
          void highlight(children, normalizedLanguage, theme).then((nextHtml) => {
            setRendered({ signature, html: nextHtml });
          });
        }
      },
      { threshold: 0.1 },
    );
    observerRef.current.observe(el);

    return () => observerRef.current?.disconnect();
  }, [children, normalizedLanguage, theme, html, highlight, signature]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    const textToCopy = children.trim();

    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setIsCopied(false);
      }, 1600);
    } catch {
      setIsCopied(false);
    }
  }, [children]);

  return (
    <div ref={ref} className='message-codeblock'>
      <button
        type='button'
        className='message-codeblock-copy'
        onClick={() => {
          void handleCopy();
        }}
        aria-label='Copy code block'
      >
        {isCopied ? 'Copied' : 'Copy'}
      </button>
      <OverlayScrollbarsComponent
        element='div'
        options={{
          scrollbars: { theme: 'os-theme-dark', autoHide: 'scroll' },
          overflow: { y: 'hidden' },
        }}
        className='message-codeblock-scroller'
      >
        <div
          className='message-codeblock-html'
          dangerouslySetInnerHTML={{
            __html: html ?? `<pre class="shiki"><code>${children}</code></pre>`,
          }}
        />
      </OverlayScrollbarsComponent>
    </div>
  );
}
