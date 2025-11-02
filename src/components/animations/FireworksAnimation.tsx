import React, { useEffect, useState } from 'react';

interface FireworksAnimationProps {
  show: boolean;
  isMilestone?: boolean;
}

interface Firework {
  id: number;
  x: number;
  y: number;
  delay: number;
  particles: Particle[];
}

interface Particle {
  angle: number;
  distance: number;
  color: string;
  size: number;
}

const FireworksAnimation: React.FC<FireworksAnimationProps> = ({ show, isMilestone = false }) => {
  const [fireworks, setFireworks] = useState<Firework[]>([]);

  useEffect(() => {
    if (show) {
      const colors = isMilestone
        ? ['#FFD700', '#FFA500', '#FF8C00', '#FFE135', '#FFED4E']
        : ['#FF6B9D', '#4ECDC4', '#FFE66D', '#A8E6CF', '#C7CEEA'];

      const count = isMilestone ? 12 : 8;
      const newFireworks: Firework[] = [];

      for (let i = 0; i < count; i++) {
        const particles: Particle[] = [];
        const particleCount = isMilestone ? 30 : 20;

        for (let j = 0; j < particleCount; j++) {
          particles.push({
            angle: (360 / particleCount) * j,
            distance: 80 + Math.random() * 40,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 4 + Math.random() * 4
          });
        }

        newFireworks.push({
          id: i,
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 40,
          delay: i * 0.3,
          particles
        });
      }

      setFireworks(newFireworks);

      const timeout = setTimeout(() => {
        setFireworks([]);
      }, count * 300 + 2000);

      return () => clearTimeout(timeout);
    } else {
      setFireworks([]);
    }
  }, [show, isMilestone]);

  if (!show || fireworks.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 999997 }}>
      {fireworks.map((firework) => (
        <div
          key={firework.id}
          className="absolute"
          style={{
            left: `${firework.x}%`,
            top: `${firework.y}%`,
            animation: `appear ${firework.delay}s`
          }}
        >
          {firework.particles.map((particle, idx) => (
            <div
              key={idx}
              className="absolute rounded-full"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                animation: `explode-${firework.id}-${idx} 1.5s ease-out ${firework.delay}s forwards`,
                opacity: 0
              }}
            />
          ))}
        </div>
      ))}
      <style>{`
        @keyframes appear {
          to {
            opacity: 1;
          }
        }
        ${fireworks.map((firework) =>
          firework.particles.map((particle, idx) => {
            const radians = (particle.angle * Math.PI) / 180;
            const x = Math.cos(radians) * particle.distance;
            const y = Math.sin(radians) * particle.distance;
            return `
              @keyframes explode-${firework.id}-${idx} {
                0% {
                  transform: translate(0, 0) scale(0);
                  opacity: 1;
                }
                50% {
                  opacity: 1;
                }
                100% {
                  transform: translate(${x}px, ${y}px) scale(1);
                  opacity: 0;
                }
              }
            `;
          }).join('\n')
        ).join('\n')}
      `}</style>
    </div>
  );
};

export default FireworksAnimation;
