import { useEffect, useState } from "react";

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  opacity: number;
  size: number;
}

export default function Snowfall({ count = 50 }: { count?: number }) {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    const flakes: Snowflake[] = [];
    for (let i = 0; i < count; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: 5 + Math.random() * 10,
        animationDelay: Math.random() * 5,
        opacity: 0.3 + Math.random() * 0.7,
        size: 0.5 + Math.random() * 1,
      });
    }
    setSnowflakes(flakes);
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: `${flake.left}%`,
            animationDuration: `${flake.animationDuration}s`,
            animationDelay: `${flake.animationDelay}s`,
            opacity: flake.opacity,
            fontSize: `${flake.size}rem`,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
}
