import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Music,
  Image as ImageIcon,
  CreditCard,
  Loader2,
  Upload,
  Play,
  Pause,
  Check,
  Gift,
  Eye,
  // QrCode removido pois não é mais usado no pagamento
} from "lucide-react";
import CardPreview from "@/components/CardPreview";
import { AVAILABLE_TEMPLATES } from "@/templates";

// --- MÚSICAS (Se estiver usando Cloudinary, mantenha os links aqui) ---
const SONGS = [
  { id: 1, title: "Jingle Bells", artist: "Classic", fileUrl: "/assets/music/jingle-bells.mp3" },
  { id: 2, title: "Silent Night", artist: "Piano", fileUrl: "/assets/music/silent-night.mp3" },
  { id: 3, title: "We Wish You", artist: "Jazz", fileUrl: "/assets/music/we-wish-you.mp3" },
  { id: 4, title: "Deck the Halls", artist: "Instrumental", fileUrl: "/assets/music/deck-the-halls.mp3" },
];

type Step = "template" | "message" | "music" | "photo" | "payment";

const STEPS: { id: Step; title: string; icon: React.ReactNode }[] = [
  { id: "template", title: "Template", icon: <Sparkles className="h-4 w-4" /> },
  { id: "message", title: "Message", icon: <Gift className="h-4 w-4" /> },
  { id: "music", title: "Music", icon: <Music className="h-4 w-4" /> },
  { id: "photo", title: "Photo", icon: <ImageIcon className="h-4 w-4" /> },
  { id: "payment", title: "Payment", icon: <CreditCard className="h-4 w-4" /> },
];

export default function CreateCard() {
  const { language, setLanguage, currency, priceFormatted } = useLanguage();
  const { creditCode } = useParams<{ creditCode?: string }>();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>("template");
  
  // Estados do Formulário
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [selectedSong, setSelectedSong] = useState<number | null>(null);
  const [customSongFile, setCustomSongFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"single" | "family">("single");
  
  // Estados de UI
  const [playingSong, setPlayingSong] = useState<number | null>(null);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Mutações
  const getSignatureMutation = trpc.files.getUploadSignature.useMutation();

  const generateMessageMutation = trpc.cards.generateMessage.useMutation({
    onSuccess: (data) => {
      setMessage(data.message);
      toast.success(language === "pt" ? "Mensagem gerada!" : "Message generated!");
    },
    onError: () => toast.error(language === "pt" ? "Erro ao gerar mensagem" : "Failed to generate message"),
  });

  const createCardMutation = trpc.cards.create.useMutation({
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else if (data.publicId) {
        setLocation(`/c/${encodeURIComponent(data.publicId)}`);
      }
    },
    onError: (error) => toast.error(error.message || "Failed to create card"),
  });

  // --- LÓGICA DE UPLOAD ---
  const uploadToCloudinary = async (file: File | Blob, resourceType: "image" | "video" | "raw" | "auto" = "auto") => {
    const signData = await getSignatureMutation.mutateAsync();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signData.apiKey!);
    formData.append("timestamp", signData.timestamp.toString());
    formData.append("signature", signData.signature);
    formData.append("folder", signData.folder);
    
    if (resourceType !== "auto") {
        formData.append("resource_type", resourceType);
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/${resourceType}/upload`;
    
    const res = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
        console.error(await res.json());
        throw new Error("Cloudinary upload failed");
    }
    const data = await res.json();
    return {
        url: data.secure_url,
        public_id: data.public_id
    };
  };

  const handleNext = () => {
    const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id);
    }
  };

  const handleBack = () => {
    const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id);
    } else {
      setLocation("/");
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    setIsUploading(true);

    try {
      let finalPhotoUrl = undefined;
      let finalSongUrl = undefined;

      if (photoFile) {
        const result = await uploadToCloudinary(photoFile, "image");
        finalPhotoUrl = result.url;
      }

      if (customSongFile) {
        const result = await uploadToCloudinary(customSongFile, "video");
        finalSongUrl = result.url;
      } else if (selectedSong) {
        finalSongUrl = SONGS.find(s => s.id === selectedSong)?.fileUrl;
      }

      const cardData = {
        templateId: selectedTemplate,
        message,
        senderName,
        recipientName,
        photoUrl: finalPhotoUrl,
        songUrl: finalSongUrl,
        plan: selectedPlan,
        currency: currency,
        createdAt: new Date().toISOString(),
      };

      const jsonBlob = new Blob([JSON.stringify(cardData)], { type: "application/json" });
      const jsonFile = new File([jsonBlob], `card_${Date.now()}.json`, { type: "application/json" });
      
      const uploadResult = await uploadToCloudinary(jsonFile, "raw"); 
      const cardPublicId = uploadResult.public_id;

      await createCardMutation.mutateAsync({
        cloudinaryId: cardPublicId,
        email,
        plan: selectedPlan,
        currency: currency,
        creditCode: creditCode || undefined,
        templateId: selectedTemplate!, 
        message, 
      });

    } catch (error) {
      console.error("Error creating card:", error);
      toast.error(language === "pt" ? "Erro ao salvar. Tente novamente." : "Error saving card. Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Helpers de UI
  const togglePlaySong = (songId: number, url: string) => {
    if (playingSong === songId) {
      audioRef.current?.pause();
      setPlayingSong(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
      setPlayingSong(songId);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo must be less than 5MB");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSongChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Audio file must be less than 10MB");
        return;
      }
      setCustomSongFile(file);
      setSelectedSong(null);
    }
  };

  const handleGenerateMessage = async () => {
    setIsGeneratingMessage(true);
    try {
      await generateMessageMutation.mutateAsync({
        recipientName: recipientName || undefined,
        senderName: senderName || undefined,
        tone: "warm",
      });
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  const getPreviewData = () => {
    let songUrl: string | undefined;
    if (customSongFile) {
      songUrl = URL.createObjectURL(customSongFile);
    } else if (selectedSong) {
      songUrl = SONGS.find(s => s.id === selectedSong)?.fileUrl;
    }

    return {
      templateId: selectedTemplate || 1,
      message,
      senderName,
      recipientName,
      photoUrl: photoPreview || undefined,
      songUrl
    };
  };

  const canProceed = () => {
    switch (currentStep) {
      case "template": return selectedTemplate !== null;
      case "message": return message.trim().length > 0;
      case "music": return true; 
      case "photo": return true; 
      case "payment": return email.trim().length > 0;
      default: return false;
    }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Textos Traduzidos
  const t = {
    back: language === "pt" ? "Voltar" : "Back",
    next: language === "pt" ? "Próximo" : "Next",
    preview: language === "pt" ? "Visualizar" : "Preview",
    title: language === "pt" ? "Crie seu Cartão" : "Create Your Card",
    chooseTemplate: language === "pt" ? "Escolha seu Modelo" : "Choose Your Template",
    writeMessage: language === "pt" ? "Escreva sua Mensagem" : "Write Your Message",
    to: language === "pt" ? "Para (Destinatário)" : "To (Recipient)",
    from: language === "pt" ? "De (Você)" : "From (You)",
    aiSuggest: language === "pt" ? "Sugestão IA" : "AI Suggestion",
    addMusic: language === "pt" ? "Adicionar Música" : "Add Music",
    customUpload: language === "pt" ? "Seu Arquivo" : "Custom Upload",
    library: language === "pt" ? "Biblioteca" : "Library",
    addPhoto: language === "pt" ? "Adicionar Foto" : "Add a Photo",
    remove: language === "pt" ? "Remover" : "Remove",
    finalize: language === "pt" ? "Finalizar e Pagar" : "Finalize & Pay",
    // Texto de pagamento atualizado
    securePayment: language === "pt" ? "Pagamento seguro via Cartão" : "Secure payment via Card",
    emailLabel: language === "pt" ? "Seu Email (para receber o recibo)" : "Your Email",
    processing: language === "pt" ? "Processando..." : "Processing...",
    // Botão unificado
    payButton: language === "pt" ? `Pagar ${priceFormatted}` : `Pay ${priceFormatted}`,
  };

  return (
    <div className="min-h-screen bg-background relative">
      <audio ref={audioRef} onEnded={() => setPlayingSong(null)} />

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.back}
            </Button>
            
            <h1 className="font-semibold hidden md:block">{t.title}</h1>

            <div className="flex items-center gap-2">
              <div className="flex rounded-md border p-1 bg-muted/20">
                <button 
                  onClick={() => setLanguage("pt")}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors ${language === "pt" ? "bg-white shadow-sm text-black" : "text-muted-foreground hover:text-foreground"}`}
                >
                  🇧🇷 BR
                </button>
                <button 
                  onClick={() => setLanguage("en")}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors ${language === "en" ? "bg-white shadow-sm text-black" : "text-muted-foreground hover:text-foreground"}`}
                >
                  🇺🇸 US
                </button>
              </div>

              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!selectedTemplate}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t.preview}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[90vh] p-0 border-none bg-transparent shadow-none">
                  <div className="w-full h-full relative">
                    <CardPreview data={getPreviewData()} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2">
              {STEPS.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                  className={`flex items-center gap-1 text-xs ${
                    index <= currentStepIndex ? "text-primary font-medium" : "text-muted-foreground"
                  }`}
                  disabled={index > currentStepIndex}
                >
                  {step.icon}
                  <span className="hidden sm:inline">
                    {language === "pt" && step.id === "template" ? "Modelo" :
                     language === "pt" && step.id === "message" ? "Mensagem" :
                     language === "pt" && step.id === "music" ? "Música" :
                     language === "pt" && step.id === "photo" ? "Foto" :
                     language === "pt" && step.id === "payment" ? "Pagamento" :
                     step.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 max-w-4xl">
        
        {/* Step 1: Template */}
        {currentStep === "template" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">{t.chooseTemplate}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {AVAILABLE_TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    selectedTemplate === template.id ? "ring-2 ring-primary shadow-lg" : ""
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardContent className="p-4">
                    <div className={`aspect-[3/4] rounded-lg ${template.className} flex items-center justify-center text-4xl mb-3`}>
                      {template.preview}
                    </div>
                    <h3 className="font-semibold text-sm">{template.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Message */}
        {currentStep === "message" && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">{t.writeMessage}</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.to}</Label>
                  <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="e.g. Maria" />
                </div>
                <div>
                  <Label>{t.from}</Label>
                  <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="e.g. João" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Message</Label>
                  <Button variant="outline" size="sm" onClick={handleGenerateMessage} disabled={isGeneratingMessage}>
                    <Sparkles className="h-4 w-4 mr-2" /> {t.aiSuggest}
                  </Button>
                </div>
                <Textarea 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  rows={6} 
                  maxLength={500} 
                  placeholder={language === "pt" ? "Feliz Natal..." : "Merry Christmas..."}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Music */}
        {currentStep === "music" && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">{t.addMusic}</h2>
            </div>
            
            <Card>
              <CardHeader><CardTitle className="text-lg flex gap-2"><Upload className="h-5 w-5"/> {t.customUpload}</CardTitle></CardHeader>
              <CardContent>
                 <Input type="file" accept="audio/*" onChange={handleSongChange} />
                 {customSongFile && <p className="text-sm mt-2">{customSongFile.name}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg flex gap-2"><Music className="h-5 w-5"/> {t.library}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {SONGS.map((song) => (
                    <div
                      key={song.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                        selectedSong === song.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => { setSelectedSong(song.id); setCustomSongFile(null); }}
                    >
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                          e.stopPropagation();
                          togglePlaySong(song.id, song.fileUrl);
                        }}>
                          {playingSong === song.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <div>
                          <p className="font-medium text-sm">{song.title}</p>
                          <p className="text-xs text-muted-foreground">{song.artist}</p>
                        </div>
                      </div>
                      {selectedSong === song.id && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Photo */}
        {currentStep === "photo" && (
          <div className="space-y-6 max-w-2xl mx-auto">
             <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">{t.addPhoto}</h2>
            </div>
            <Card>
              <CardContent className="pt-6 text-center">
                {photoPreview ? (
                  <div className="relative inline-block">
                    <img src={photoPreview} alt="Preview" className="max-h-64 rounded-lg" />
                    <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}>{t.remove}</Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-12">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <Input type="file" accept="image/*" onChange={handlePhotoChange} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5: Payment */}
        {currentStep === "payment" && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">{t.finalize}</h2>
              <p className="text-muted-foreground">{t.securePayment}</p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Label>{t.emailLabel}</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Button 
                className={`flex-1 h-14 text-lg ${language === "pt" ? "bg-green-600 hover:bg-green-700" : ""}`}
                size="lg" 
                onClick={handleSubmit} 
                disabled={isUploading || createCardMutation.isPending || !canProceed()}
              >
                {(isUploading || createCardMutation.isPending) ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-5 w-5 mr-2" />
                )}
                {isUploading ? t.processing : t.payButton}
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        {currentStep !== "payment" && (
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack}>{t.back}</Button>
            <div className="flex gap-2">
              {selectedTemplate && (
                <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
                  <Eye className="h-4 w-4 mr-2" /> {t.preview}
                </Button>
              )}
              <Button onClick={handleNext} disabled={!canProceed()}>{t.next} <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}