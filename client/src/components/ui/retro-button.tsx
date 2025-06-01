import React, { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RetroButtonProps extends Omit<ButtonProps, 'variant'> {
  retroVariant?: "arcade" | "neon" | "pixel" | "glow" | "power";
  soundEffect?: boolean;
}

export function RetroButton({ 
  children, 
  className, 
  retroVariant = "arcade", 
  soundEffect = true,
  onClick,
  ...props 
}: RetroButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const getVariantStyles = () => {
    switch (retroVariant) {
      case "neon":
        return cn(
          "bg-gradient-to-br from-cyan-400 to-blue-600",
          "border-2 border-cyan-300 text-white font-bold",
          "shadow-lg shadow-cyan-400/50",
          "hover:shadow-xl hover:shadow-cyan-400/70",
          "active:shadow-inner active:shadow-cyan-600/50",
          "transition-all duration-150 ease-out",
          "hover:scale-105 active:scale-95"
        );
      case "pixel":
        return cn(
          "bg-gradient-to-br from-green-400 to-emerald-600",
          "border-4 border-green-300 text-white font-black",
          "shadow-lg shadow-green-400/50",
          "hover:shadow-xl hover:shadow-green-400/70",
          "transition-all duration-100 ease-out",
          "hover:translate-y-[-2px] active:translate-y-[1px]",
          "font-mono text-sm tracking-wider"
        );
      case "glow":
        return cn(
          "bg-gradient-to-br from-purple-500 to-pink-600",
          "border-2 border-purple-400 text-white font-bold",
          "shadow-lg shadow-purple-500/50",
          "hover:shadow-xl hover:shadow-purple-500/80",
          "transition-all duration-200 ease-out",
          "hover:scale-110 active:scale-95",
          "animate-pulse hover:animate-none"
        );
      case "power":
        return cn(
          "bg-gradient-to-br from-red-500 to-orange-600",
          "border-3 border-red-400 text-white font-black",
          "shadow-lg shadow-red-500/50",
          "hover:shadow-xl hover:shadow-red-500/80",
          "transition-all duration-150 ease-out",
          "hover:scale-105 active:scale-95",
          "relative overflow-hidden"
        );
      default: // arcade
        return cn(
          "bg-gradient-to-br from-yellow-400 to-orange-500",
          "border-3 border-yellow-300 text-black font-black",
          "shadow-lg shadow-yellow-400/60",
          "hover:shadow-xl hover:shadow-yellow-400/80",
          "transition-all duration-150 ease-out",
          "hover:scale-105 active:scale-95",
          "relative overflow-hidden"
        );
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsPressed(true);
    
    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { id: Date.now(), x, y };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
    
    // Reset pressed state
    setTimeout(() => setIsPressed(false), 150);
    
    onClick?.(e);
  };

  return (
    <Button
      className={cn(
        "relative transition-all duration-150 ease-out select-none",
        "font-mono uppercase tracking-wider",
        isPressed && "brightness-110 scale-95",
        getVariantStyles(),
        className
      )}
      onClick={handleClick}
      style={{
        textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
        transform: isPressed ? "scale(0.95)" : "scale(1)",
      }}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "ripple 0.6s ease-out",
          }}
        />
      ))}
      
      {/* Power variant energy effect */}
      {retroVariant === "power" && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 ease-out" />
      )}
      
      {/* Button content */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </Button>
  );
}

// Add ripple animation keyframes
const rippleStyles = `
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(10);
    opacity: 0;
  }
}
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = rippleStyles;
  document.head.appendChild(styleSheet);
}