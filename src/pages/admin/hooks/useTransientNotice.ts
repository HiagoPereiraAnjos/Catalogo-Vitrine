import { useEffect, useState } from 'react';
import { Notice } from '../types';

export const useTransientNotice = (timeoutMs: number = 4500) => {
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = setTimeout(() => setNotice(null), timeoutMs);
    return () => clearTimeout(timer);
  }, [notice, timeoutMs]);

  return {
    notice,
    setNotice,
    clearNotice: () => setNotice(null)
  };
};
