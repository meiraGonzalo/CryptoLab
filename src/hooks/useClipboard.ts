import { useCallback, useEffect, useRef, useState } from 'react';

export function useClipboard(resetMs = 1600) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setFailed(false);
      } catch {
        setFailed(true);
        setCopied(false);
      }
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setCopied(false);
        setFailed(false);
      }, resetMs);
    },
    [resetMs],
  );

  return { copied, failed, copy };
}
