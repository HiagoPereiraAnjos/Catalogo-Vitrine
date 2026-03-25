import { CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Notice } from '../types';

interface AdminNoticeToastProps {
  notice: Notice;
}

export const AdminNoticeToast = ({ notice }: AdminNoticeToastProps) => {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`fixed right-4 top-20 z-[120] flex w-[min(92vw,420px)] items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur sm:right-6 sm:top-24 ${
        notice.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {notice.type === 'success' ? <CheckCircle2 className="mt-0.5 h-5 w-5" /> : <XCircle className="mt-0.5 h-5 w-5" />}
      <p className="text-sm font-medium">{notice.message}</p>
    </motion.div>
  );
};
