import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FloatingScoreProps {
  score: number;
  isVisible: boolean;
  onComplete?: () => void;
  variant?: "default" | "bonus" | "combo" | "perfect";
  className?: string;
}

export function FloatingScore({ 
  score, 
  isVisible, 
  onComplete, 
  variant = "default",
  className 
}: FloatingScoreProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  const getVariantStyles = () => {
    switch (variant) {
      case "bonus":
        return "text-yellow-400 text-2xl font-black animate-bounce";
      case "combo":
        return "text-orange-400 text-xl font-black animate-pulse";
      case "perfect":
        return "text-green-400 text-3xl font-black animate-ping";
      default:
        return "text-blue-400 text-lg font-bold";
    }
  };

  const getPrefix = () => {
    switch (variant) {
      case "bonus":
        return "BONUS! +";
      case "combo":
        return "COMBO! +";
      case "perfect":
        return "PERFECT! +";
      default:
        return "+";
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "absolute pointer-events-none z-50 select-none",
        "animate-in fade-in slide-in-from-bottom-4 duration-300",
        "animate-out fade-out slide-out-to-top-8 fill-mode-forwards",
        getVariantStyles(),
        className
      )}
      style={{
        textShadow: "2px 2px 4px rgba(0,0,0,0.8), 0 0 10px currentColor",
        fontFamily: "monospace",
        letterSpacing: "1px",
        animation: isVisible 
          ? "floatUp 2s ease-out forwards" 
          : "none"
      }}
    >
      {getPrefix()}{score.toLocaleString()}
      {variant === "perfect" && <span className="ml-1">✨</span>}
      {variant === "bonus" && <span className="ml-1">💎</span>}
      {variant === "combo" && <span className="ml-1">🔥</span>}
    </div>
  );
}

// Add custom keyframes to the global CSS
const floatingScoreStyles = `
@keyframes floatUp {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  20% {
    transform: translateY(-20px) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) scale(0.8);
    opacity: 0;
  }
}
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = floatingScoreStyles;
  document.head.appendChild(styleSheet);
}