import React, { useEffect, useRef } from "react";

interface ConfettiCanvasProps {
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
}

export const ConfettiCanvas: React.FC<ConfettiCanvasProps> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.width = window.innerWidth;
        height = canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", handleResize);

    const colors = [
      "#10b981", // Emerald
      "#3b82f6", // Blue
      "#f59e0b", // Amber
      "#ef4444", // Red
      "#a855f7", // Purple
      "#ec4899", // Pink
      "#06b6d4"  // Sky
    ];

    const createParticle = (isInitial = false): Particle => {
      const size = Math.random() * 8 + 6;
      return {
        x: Math.random() * width,
        y: isInitial ? Math.random() * height - height : -20,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 3 - 1.5,
        speedY: Math.random() * 4 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 2 - 1
      };
    };

    if (active) {
      const initialCount = 120;
      particlesRef.current = Array.from({ length: initialCount }, () => createParticle(true));
    } else {
      particlesRef.current = [];
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        // Draw standard rectangular confetti piece
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
        ctx.restore();

        // Recycle particle if it falls off bottom or sides
        if (p.y > height && active) {
          particles[i] = createParticle();
        }
      }

      // Slowly bleed out particles if deactivated
      if (!active && particles.length > 0) {
        particlesRef.current = particles.filter(p => p.y <= height);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [active]);

  if (!active && particlesRef.current.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      id="confetti-canvas"
      className="fixed inset-0 pointer-events-none z-[150] w-full h-full"
    />
  );
};
