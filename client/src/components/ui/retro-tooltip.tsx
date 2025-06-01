import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const RetroTooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    variant?: "default" | "powerup" | "coin" | "score" | "life";
  }
>(({ className, sideOffset = 4, variant = "default", children, ...props }, ref) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "powerup":
        return "bg-gradient-to-br from-yellow-400 to-orange-500 text-black border-2 border-yellow-300 shadow-lg shadow-yellow-400/50 animate-pulse";
      case "coin":
        return "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-black border-2 border-yellow-200 shadow-lg shadow-yellow-400/60 animate-bounce";
      case "score":
        return "bg-gradient-to-br from-green-400 to-emerald-500 text-white border-2 border-green-300 shadow-lg shadow-green-400/50";
      case "life":
        return "bg-gradient-to-br from-red-400 to-pink-500 text-white border-2 border-red-300 shadow-lg shadow-red-400/50 animate-pulse";
      default:
        return "bg-gradient-to-br from-purple-500 to-blue-600 text-white border-2 border-purple-400 shadow-lg shadow-purple-500/50";
    }
  };

  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-lg px-3 py-2 text-sm font-bold text-center",
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        "transform transition-all duration-200 ease-out",
        "hover:scale-110 hover:rotate-1",
        "before:content-[''] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
        getVariantStyles(),
        className
      )}
      style={{
        textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
        fontFamily: "monospace",
        letterSpacing: "0.5px",
      }}
      {...props}
    >
      <div className="relative z-10 flex items-center gap-1">
        {variant === "coin" && <span className="text-xs">💰</span>}
        {variant === "powerup" && <span className="text-xs">⚡</span>}
        {variant === "score" && <span className="text-xs">📊</span>}
        {variant === "life" && <span className="text-xs">❤️</span>}
        {children}
      </div>
    </TooltipPrimitive.Content>
  );
});
RetroTooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, RetroTooltipContent as TooltipContent, TooltipProvider };