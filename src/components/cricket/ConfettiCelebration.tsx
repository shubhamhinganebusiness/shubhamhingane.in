import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface Particle {
  id: number;
  x: number; // percentage width of screen
  y: number; // random negative height above viewport
  color: string;
  size: number;
  rotation: number;
  duration: number;
  delay: number;
  shape: 'circle' | 'square' | 'triangle';
  sideDrift: number;
}

export const ConfettiCelebration: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors = [
      '#f59e0b', // Amber/Gold
      '#eab308', // Yellow
      '#10b981', // Emerald
      '#ef4444', // Red
      '#3b82f6', // Blue
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#06b6d4', // Cyan
    ];
    
    const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];
    const count = 100;
    const generated: Particle[] = [];

    for (let i = 0; i < count; i++) {
      generated.push({
        id: i,
        x: Math.random() * 100, // horizontal start percent
        y: -15 - Math.random() * 35, // staggered height above viewport
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 6, // 6px to 16px size
        rotation: Math.random() * 360,
        duration: Math.random() * 3.5 + 3.0, // 3.0s to 6.5s travel duration
        delay: Math.random() * 0.5,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        sideDrift: Math.random() * 20 - 10, // horizontal slide drift path range
      });
    }

    setParticles(generated);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[99999]" id="confetti-overlay">
      {particles.map((p) => {
        let borderRadius = '0';
        if (p.shape === 'circle') {
          borderRadius = '50%';
        }

        const isTriangle = p.shape === 'triangle';

        return (
          <motion.div
            key={p.id}
            initial={{ 
              opacity: 1, 
              x: `${p.x}vw`, 
              y: `${p.y}vh`, 
              rotate: p.rotation 
            }}
            animate={{ 
              y: '105vh', 
              rotate: p.rotation + 1080,
              x: `${Math.min(100, Math.max(0, p.x + p.sideDrift))}vw`
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'linear',
              repeat: Infinity,
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: isTriangle ? 0 : p.size,
              height: isTriangle ? 0 : p.size * (p.shape === 'square' ? 0.6 : 1), // squares are ribbon-like Rectangles
              backgroundColor: isTriangle ? 'transparent' : p.color,
              borderLeft: isTriangle ? `${p.size / 2}px solid transparent` : undefined,
              borderRight: isTriangle ? `${p.size / 2}px solid transparent` : undefined,
              borderBottom: isTriangle ? `${p.size}px solid ${p.color}` : undefined,
              borderRadius: borderRadius,
              pointerEvents: 'none',
              transformOrigin: 'center',
            }}
          />
        );
      })}
    </div>
  );
};
