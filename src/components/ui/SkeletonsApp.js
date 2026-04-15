'use client';
import React from 'react';

export const SkeletonTabContent = () => (
  <div className="w-full h-full flex flex-col gap-6 p-2 md:p-6 animate-in fade-in duration-500">
    <div className="w-1/4 h-10 rounded-xl bg-black/5 dark:bg-white/5 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    </div>
    <div className="w-full flex-1 rounded-[32px] border bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>
    <style dangerouslySetInnerHTML={{__html: `@keyframes shimmer { 100% { transform: translateX(100%); } }`}} />
  </div>
);