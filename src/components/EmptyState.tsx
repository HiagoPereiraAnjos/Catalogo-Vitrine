import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, actionLabel, onAction }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26 }}
      className="surface-card-strong premium-reveal relative overflow-hidden px-6 py-14 text-center md:px-10"
    >
      <div className="pointer-events-none absolute -top-14 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-gray-100 blur-2xl" aria-hidden="true" />
      <div className="relative">
        <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm">
          <Icon className="h-6 w-6" />
        </span>
        <h3 className="text-2xl tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>
          {title}
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-gray-500">{description}</p>
        {actionLabel && onAction && (
          <div className="mt-7">
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

