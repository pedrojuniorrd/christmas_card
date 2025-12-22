import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Volume2, VolumeX, Share2, Gift } from "lucide-react";
import Snowfall from "@/components/Snowfall";
import TwinklingLights from "@/components/TwinklingLights";
import { toast } from "sonner";
import { getTemplateById } from "@/templates"; // Importa o sistema modular

export default function CardView() {
  const { publicId } = useParams<{ publicId: string }>();
  const [isMuted, setIsMuted] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: card, isLoading, error } = trpc.cards.getByPublicId.useQuery(
    { publicId: publicId || "" },
    { enabled: !!publicId }
  );

  // Busca as configurações do template (ou usa o padrão se não carregar)
  const currentTemplate = card ? getTemplateById(card.templateId) : getTemplateById(1);

  useEffect(() => {
    if (card && audioRef.current) {
      audioRef.current.volume = 0.5;
    }
  }, [card]);

  const handleReveal = () => {
    setIsRevealed(true);
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(() => {
        // Autoplay blocked, user needs to interact
      });
    }
  };

  const toggleMute = () => {
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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Christmas Card",
          text: "Someone sent you a Christmas card!",
          url,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your card...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Card Not Found</h1>
          <p className="text-muted-foreground mb-4">
            This card may have expired or doesn't exist. Cards are accessible until January 15th.
          </p>
          <Button onClick={() => window.location.href = "/"}>
            Create Your Own Card
          </Button>
        </div>
      </div>
    );
  }

  const audioUrl = card.customSongUrl || card.songUrl;

  return (
    <div className={`min-h-screen ${currentTemplate.className} relative overflow-hidden`}>
      {/* Audio element */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} loop preload="auto" />
      )}

      {/* Animation based on template configuration */}
      {currentTemplate.animation === "snow" && <Snowfall count={60} />}
      {currentTemplate.animation === "lights" && <TwinklingLights />}
      {currentTemplate.animation === "stars" && <Snowfall count={40} />}

      {/* Controls */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {audioUrl && (
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
        <Button
          variant="secondary"
          size="icon"
          onClick={handleShare}
          className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
        >
          <Share2 className="h-5 w-5 text-white" />
        </Button>
      </div>

      {/* Card Content */}
      <div className="min-h-screen flex items-center justify-center p-4">
        {!isRevealed ? (
          /* Envelope / Reveal Animation */
          <div
            className="cursor-pointer transform hover:scale-105 transition-transform duration-300"
            onClick={handleReveal}
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 text-center shadow-2xl border border-white/20">
              <div className="text-8xl mb-6 animate-bounce">🎁</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                You've received a Christmas Card!
              </h2>
              <p className="text-white/80 mb-6">
                {card.senderName ? `From ${card.senderName}` : "From someone special"}
              </p>
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
              >
                Open Your Card
              </Button>
            </div>
          </div>
        ) : (
          /* Revealed Card */
          <div className="w-full max-w-lg animate-in fade-in zoom-in duration-700">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden">
              {/* Photo Section */}
              {card.photoUrl && (
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={card.photoUrl}
                    alt="Card photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              )}

              {/* Message Section */}
              <div className="p-8 text-center">
                {card.recipientName && (
                  <p className="text-lg text-muted-foreground mb-2">
                    Dear {card.recipientName},
                  </p>
                )}

                <div className="my-8">
                  <p className="text-xl leading-relaxed text-foreground whitespace-pre-wrap font-serif">
                    {card.message}
                  </p>
                </div>

                {card.senderName && (
                  <p className="text-lg font-script text-2xl text-primary mt-6">
                    With love, {card.senderName}
                  </p>
                )}

                {/* Decorative elements */}
                <div className="flex justify-center gap-4 mt-8 text-3xl">
                  <span className="animate-pulse">🎄</span>
                  <span className="animate-pulse delay-100">⭐</span>
                  <span className="animate-pulse delay-200">🎁</span>
                </div>

                <p className="text-xs text-muted-foreground mt-8">
                  Merry Christmas & Happy New Year!
                </p>
              </div>
            </div>

            {/* Create your own CTA */}
            <div className="text-center mt-8">
              <Button
                variant="secondary"
                onClick={() => window.location.href = "/"}
                className="bg-white/20 text-white hover:bg-white/30"
              >
                <Gift className="h-4 w-4 mr-2" />
                Create Your Own Card
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}