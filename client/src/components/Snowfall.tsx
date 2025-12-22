import { useEffect, useState } from "react";
import { createPortal } from "react-dom"; //

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    
    return () => setMounted(false);
  }, [count]);

  // Se não estiver montado no cliente ainda, não renderiza nada
  if (!mounted) return null;

  // Renderiza o conteúdo diretamente no body usando createPortal
  return createPortal(
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[9999]">
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
            position: 'absolute', // Garante que a neve se posicione corretamente dentro do container fixed
            top: '-2rem', // Começa um pouco acima da tela para não "brotar" do nada
          }}
        >
          ❄
        </div>
      ))}
      <style>{`
        @keyframes snowfall-fall {
          0% { transform: translateY(0); }
          100% { transform: translateY(100vh); } /* Garante queda até o final da viewport */
        }
        .snowflake {
          animation-name: snowfall-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>,
    document.body
  );
}