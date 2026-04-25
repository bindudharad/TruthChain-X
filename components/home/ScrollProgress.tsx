"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const [mounted, setMounted] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[100] h-1 origin-left bg-gradient-to-r from-sky-400 via-cyan-300 to-violet-500 shadow-[0_0_22px_rgba(56,189,248,0.75)]"
    />
  );
}
