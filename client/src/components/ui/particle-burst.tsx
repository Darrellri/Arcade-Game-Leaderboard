import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ParticleProps {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  velocity: { x: number; y: number };
  life: number;
}

interface ParticleBurstProps {
  isActive: boolean;
  onComplete?: () => void;
  particleCount?: number;
  colors?: string[];
  duration?: number;
  className?: string;
}

export function ParticleBurst({
  isActive,
  onComplete,
  particleCount = 12,
  colors = ["#FFD700", "#FF6B35", "#7B68EE", "#00CED1", "#FF1493"],
  duration = 1500,
  className
}: ParticleBurstProps) {
  const [particles, setParticles] = useState<ParticleProps[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isActive && !isAnimating) {
      createBurst();
    }
  }, [isActive, isAnimating]);

  const createBurst = () => {
    setIsAnimating(true);
    
    const newParticles: ParticleProps[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 150 + Math.random() * 100; // Random velocity
      const size = 4 + Math.random() * 6;
      
      newParticles.push({
        id: i,
        x: 0,
        y: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        size,
        velocity: {
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity
        },
        life: 1
      });
    }
    
    setParticles(newParticles);
    
    // Start animation loop
    let startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        setParticles([]);
        setIsAnimating(false);
        onComplete?.();
        return;
      }
      
      setParticles(prevParticles =>
        prevParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.velocity.x * 0.016,
          y: particle.y + particle.velocity.y * 0.016 + (progress * 100), // Gravity effect
          life: 1 - progress,
          velocity: {
            x: particle.velocity.x * 0.98, // Friction
            y: particle.velocity.y * 0.98
          }
        }))
      );
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  };

  if (!isAnimating) return null;

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}>
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `calc(50% + ${particle.x}px)`,
            top: `calc(50% + ${particle.y}px)`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.life,
            transform: `scale(${particle.life})`,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            transition: "none"
          }}
        />
      ))}
    </div>
  );
}

// Shooting star effect for special achievements
export function ShootingStar({ isActive, onComplete }: { isActive: boolean; onComplete?: () => void }) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  if (!shouldRender) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
        style={{
          boxShadow: "0 0 20px #FFD700, 0 0 40px #FFD700, 0 0 60px #FFD700",
          animation: "shootingStar 2s ease-out forwards"
        }}
      />
    </div>
  );
}

// Add shooting star animation
const shootingStarStyles = `
@keyframes shootingStar {
  0% {
    transform: translateX(-100vw) translateY(100vh) rotate(-45deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateX(100vw) translateY(-100vh) rotate(-45deg);
    opacity: 0;
  }
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = shootingStarStyles;
  document.head.appendChild(styleSheet);
}