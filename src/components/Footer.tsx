'use client';

import { useState, useEffect } from 'react';

export default function Footer() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  useEffect(() => {
    const now = new Date().getFullYear();
    if (year !== now) setYear(now);
  }, [year]);
  return (
    <footer className="w-full py-8 flex flex-col items-center justify-center text-center text-white/60 text-sm font-medium bg-transparent select-none">
      <div className="mb-1">© {year} FocusQuest · Built with love for fellow overthinkers, forgetters, and dreamers.</div>
    </footer>
  );
} 