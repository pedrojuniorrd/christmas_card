import { useEffect, useState } from "react";

interface Light {
  id: number;
  left: number;
  top: number;
  color: string;
  animationDelay: number;
  size: number;
}

const COLORS = [
  "rgb(239, 68, 68)", // red
  "rgb(34, 197, 94)", // green
  "rgb(234, 179, 8)", // yellow
  "rgb(59, 130, 246)", // blue
  "rgb(168, 85, 247)", // purple
];

export default function TwinklingLights({ count = 30 }: { count?: number }) {
  const [lights, setLights] = useState<Light[]>([]);

  useEffect(() => {
    const newLights: Light[] = [];
    for (let i = 0; i < count; i++) {
      newLights.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        animationDelay: Math.random() * 3,
        size: 8 + Math.random() * 8,
      });
    }
    setLights(newLights);
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {lights.map((light) => (
        <div
          key={light.id}
          className="absolute rounded-full christmas-light"
          style={{
            left: `${light.left}%`,
            top: `${light.top}%`,
            width: `${light.size}px`,
            height: `${light.size}px`,
            backgroundColor: light.color,
            boxShadow: `0 0 ${light.size}px ${light.color}, 0 0 ${light.size * 2}px ${light.color}`,
            animationDelay: `${light.animationDelay}s`,
            animationDuration: `${1.5 + Math.random()}s`,
          }}
        />
      ))}
    </div>
  );
}
