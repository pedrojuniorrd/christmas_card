import { useEffect, useState } from "react";

export function Stars() {
  const [stars, setStars] = useState<{ id: number; left: number; top: number; delay: number }[]>([]);

  useEffect(() => {
    // Cria 50 estrelas em posições aleatórias
    const newStars = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
    }));
    setStars(newStars);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            animationDelay: `${star.delay}s`,
            opacity: Math.random() * 0.7 + 0.3,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.5); opacity: 0.3; }
        }
        .animate-twinkle {
          animation: twinkle 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}