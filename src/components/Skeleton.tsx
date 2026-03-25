import React from 'react';
import { motion } from 'motion/react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0.7 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, duration: 1.1, repeatType: 'reverse' }}
      className={`relative overflow-hidden rounded-xl bg-gray-100 ${className}`}
    >
      <span className="absolute inset-y-0 -left-1/2 w-1/2 animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </motion.div>
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="surface-card flex flex-col overflow-hidden">
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/5" />
        </div>
      </div>
    </div>
  );
};
