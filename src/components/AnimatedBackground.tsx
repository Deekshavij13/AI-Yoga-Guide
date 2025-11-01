import { useEffect, useRef } from "react";

type Theme = "aurora" | "sunrise" | "moonlight" | "default";

interface AnimatedBackgroundProps {
  theme: Theme;
}

export default function AnimatedBackground({ theme }: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let particles: Particle[] = [];
    let time = 0;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      life: number;

      constructor(x: number, y: number, color: string, isComet = false) {
        this.x = x;
        this.y = y;
        this.size = isComet ? Math.random() * 3 + 2 : Math.random() * 2 + 1;
        this.speedX = isComet ? Math.random() * 4 + 2 : (Math.random() - 0.5) * 0.5;
        this.speedY = isComet ? Math.random() * 2 + 1 : (Math.random() - 0.5) * 0.5;
        this.color = color;
        this.life = 1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.001;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    const createParticles = () => {
      particles = [];
      const particleCount = theme === "moonlight" ? 200 : 100;
      
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        let color = "#ffffff";
        
        if (theme === "aurora") {
          color = `hsl(${240 + Math.random() * 60}, 70%, ${60 + Math.random() * 20}%)`;
        } else if (theme === "sunrise") {
          color = `hsl(${30 + Math.random() * 30}, 80%, ${60 + Math.random() * 20}%)`;
        } else if (theme === "moonlight") {
          color = `hsl(${200 + Math.random() * 40}, 70%, ${70 + Math.random() * 30}%)`;
        } else {
          color = `hsl(${280 + Math.random() * 40}, 70%, ${70 + Math.random() * 20}%)`;
        }
        
        particles.push(new Particle(x, y, color));
      }

      // Add comet for moonlight theme
      if (theme === "moonlight") {
        setInterval(() => {
          if (Math.random() > 0.7) {
            particles.push(
              new Particle(
                Math.random() * canvas.width,
                0,
                "#ffffff",
                true
              )
            );
          }
        }, 2000);
      }
    };

    const drawGradient = () => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      
      if (theme === "aurora") {
        // Bluish black to light purple
        const offset = Math.sin(time * 0.001) * 0.1 + 0.5;
        gradient.addColorStop(0, `hsl(240, 50%, ${5 + offset * 5}%)`);
        gradient.addColorStop(0.5, `hsl(260, 60%, ${15 + offset * 10}%)`);
        gradient.addColorStop(1, `hsl(280, 70%, ${40 + offset * 10}%)`);
      } else if (theme === "sunrise") {
        // Orangish to whitish yellow
        const offset = Math.sin(time * 0.001) * 0.1 + 0.5;
        gradient.addColorStop(0, `hsl(25, 80%, ${40 + offset * 10}%)`);
        gradient.addColorStop(0.5, `hsl(40, 90%, ${60 + offset * 10}%)`);
        gradient.addColorStop(1, `hsl(50, 100%, ${85 + offset * 5}%)`);
      } else if (theme === "moonlight") {
        // Dark night sky
        gradient.addColorStop(0, "hsl(230, 40%, 8%)");
        gradient.addColorStop(0.5, "hsl(240, 50%, 12%)");
        gradient.addColorStop(1, "hsl(250, 60%, 18%)");
      } else {
        // Light purple to light pink
        const offset = Math.sin(time * 0.001) * 0.1 + 0.5;
        gradient.addColorStop(0, `hsl(280, 70%, ${75 + offset * 10}%)`);
        gradient.addColorStop(0.5, `hsl(300, 80%, ${80 + offset * 5}%)`);
        gradient.addColorStop(1, `hsl(330, 90%, ${85 + offset * 5}%)`);
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const animate = () => {
      drawGradient();
      time++;

      // Update and draw particles
      particles = particles.filter((particle) => {
        particle.update();
        particle.draw(ctx);
        return particle.life > 0 && 
               particle.x > -50 && 
               particle.x < canvas.width + 50 &&
               particle.y > -50 && 
               particle.y < canvas.height + 50;
      });

      // Add new particles occasionally
      if (particles.length < (theme === "moonlight" ? 200 : 100) && Math.random() > 0.95) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        let color = "#ffffff";
        
        if (theme === "aurora") {
          color = `hsl(${240 + Math.random() * 60}, 70%, ${60 + Math.random() * 20}%)`;
        } else if (theme === "sunrise") {
          color = `hsl(${30 + Math.random() * 30}, 80%, ${60 + Math.random() * 20}%)`;
        } else if (theme === "moonlight") {
          color = `hsl(${200 + Math.random() * 40}, 70%, ${70 + Math.random() * 30}%)`;
        } else {
          color = `hsl(${280 + Math.random() * 40}, 70%, ${70 + Math.random() * 20}%)`;
        }
        
        particles.push(new Particle(x, y, color));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    createParticles();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
