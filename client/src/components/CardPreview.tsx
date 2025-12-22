import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import Snowfall from "@/components/Snowfall";
import TwinklingLights from "@/components/TwinklingLights";
import { getTemplateById } from "@/templates"; // Importe do novo módulo

export interface CardPreviewData {
  templateId: number;
  message: string;
  senderName?: string;
  recipientName?: string;
  photoUrl?: string;
  songUrl?: string;
}

interface CardPreviewProps {
  data: CardPreviewData;
  autoReveal?: boolean;
}

export default function CardPreview({ data, autoReveal = false }: CardPreviewProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isRevealed, setIsRevealed] = useState(autoReveal);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Busca as configurações do template atual
  const currentTemplate = getTemplateById(data.templateId);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
    }
  }, [data]);

  const handleReveal = () => {
    setIsRevealed(true);
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(() => console.log("Autoplay blocked"));
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play().catch(() => {});
        audioRef.current.muted = false;
      } else {
        audioRef.current.muted = true;
      }
    }
    setIsMuted(!isMuted);
  };

  return (
    // Usa a classe vinda do template
    <div className={`w-full h-full min-h-[500px] ${currentTemplate.className} relative overflow-hidden rounded-lg`}>
      {data.songUrl && (
        <audio ref={audioRef} src={data.songUrl} loop preload="auto" />
      )}

      {/* Renderiza a animação baseada na configuração do template */}
      {currentTemplate.animation === "snow" && <Snowfall count={60} />}
      {currentTemplate.animation === "lights" && <TwinklingLights />}
      {currentTemplate.animation === "stars" && <Snowfall count={40} />}

      {/* Controls */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        {data.songUrl && (
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleMute}
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-white" />
            ) : (
              <Volume2 className="h-5 w-5 text-white" />
            )}
          </Button>
        )}
      </div>

      {/* Card Content */}
      <div className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto">
        {!isRevealed ? (
          <div
            className="cursor-pointer transform hover:scale-105 transition-transform duration-300"
            onClick={handleReveal}
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 text-center shadow-2xl border border-white/20">
              <div className="text-6xl md:text-8xl mb-6 animate-bounce">🎁</div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                Preview for {data.recipientName || "Recipient"}
              </h2>
              <p className="text-white/80 mb-6">Click to open</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg animate-in fade-in zoom-in duration-700 my-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden relative">
              {data.photoUrl && (
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={data.photoUrl}
                    alt="Card photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              )}

              <div className="p-6 md:p-8 text-center">
                {data.recipientName && (
                  <p className="text-lg text-muted-foreground mb-2">
                    Dear {data.recipientName},
                  </p>
                )}

                <div className="my-6 md:my-8">
                  <p className="text-lg md:text-xl leading-relaxed text-foreground whitespace-pre-wrap font-serif">
                    {data.message || "Your beautiful message will appear here..."}
                  </p>
                </div>

                {data.senderName && (
                  <p className="text-lg font-script text-2xl text-primary mt-6">
                    With love, {data.senderName}
                  </p>
                )}

                <div className="flex justify-center gap-4 mt-8 text-2xl md:text-3xl">
                  {/* Você pode até parametrizar esses ícones no template se quiser futuramente */}
                  <span className="animate-pulse">🎄</span>
                  <span className="animate-pulse delay-100">⭐</span>
                  <span className="animate-pulse delay-200">🎁</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}