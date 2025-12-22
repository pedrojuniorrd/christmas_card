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
} from "lucide-react";
// import Snowfall from "@/components/Snowfall";
import CardPreview from "@/components/CardPreview";
import { AVAILABLE_TEMPLATES } from "@/templates";

// --- 1. MÚSICAS HARDCODED (Sem banco de dados) ---
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
  const generateMessageMutation = trpc.cards.generateMessage.useMutation({
    onSuccess: (data) => {
      setMessage(data.message);
      toast.success("Message generated!");
    },
    onError: () => toast.error("Failed to generate message"),
  });

  // Mutação de criação (agora só inicia o pagamento ou redireciona)
  const createCardMutation = trpc.cards.create.useMutation({
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else if (data.publicId) {
        setLocation(`/c/${data.publicId}`);
      }
    },
    onError: (error) => toast.error(error.message || "Failed to create card"),
  });

  // --- 2. LÓGICA DE UPLOAD PARA CLOUDINARY ---
const uploadToCloudinary = async (file: File | Blob, resourceType: "image" | "video" | "raw" | "auto" = "auto") => {
    // 1. Pega a assinatura do backend
    const signResponse = await fetch("/api/sign-upload");
    if (!signResponse.ok) throw new Error("Failed to get upload signature");
    const signData = await signResponse.json();

    // 2. Prepara o formulário para o Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signData.apiKey);
    formData.append("timestamp", signData.timestamp.toString());
    formData.append("signature", signData.signature);
    formData.append("folder", signData.folder);
    
    // Se não for auto, força o tipo no form data também (embora a URL controle isso principalmente)
    if (resourceType !== "auto") {
        formData.append("resource_type", resourceType);
    }

    // 3. Envia direto para a nuvem
    // Aqui o resourceType define se vai para /image/upload, /video/upload ou /auto/upload
    const uploadUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/${resourceType}/upload`;
    
    const res = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Cloudinary upload failed");
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

  // --- 3. SUBMIT PRINCIPAL (Salva JSON na Nuvem) ---
  const handleSubmit = async () => {
    if (!canProceed()) return;
    setIsUploading(true);

    try {
      let finalPhotoUrl = undefined;
      let finalSongUrl = undefined;

      // A. Upload da Foto (se houver)
      if (photoFile) {
        const result = await uploadToCloudinary(photoFile, "image");
        finalPhotoUrl = result.url;
      }

      // B. Upload da Música Customizada (se houver)
      if (customSongFile) {
        const result = await uploadToCloudinary(customSongFile, "video"); // Audio geralmente é tratado como 'video' no cloudinary upload API ou 'auto'
        finalSongUrl = result.url;
      } else if (selectedSong) {
        // Se escolheu da biblioteca, pega a URL fixa
        finalSongUrl = SONGS.find(s => s.id === selectedSong)?.fileUrl;
      }

      // C. Cria o Objeto de Dados do Cartão
      const cardData = {
        templateId: selectedTemplate,
        message,
        senderName,
        recipientName,
        photoUrl: finalPhotoUrl,
        songUrl: finalSongUrl,
        plan: selectedPlan,
        createdAt: new Date().toISOString(),
      };

      // D. Salva esse objeto como um arquivo JSON no Cloudinary
      // Isso substitui o banco de dados!
      
      const jsonBlob = new Blob([JSON.stringify(cardData)], { type: "application/json" });
      const jsonFile = new File([jsonBlob], `card_${Date.now()}.json`, { type: "application/json" });
      
      // raw = arquivos não processados (json, txt)
      const uploadResult = await uploadToCloudinary(jsonFile, "raw"); 
      const cardPublicId = uploadResult.public_id; // Esse será o ID do nosso cartão!

      // E. Chama o Backend apenas para processar pagamento (passando o ID do JSON)
      // O backend vai criar a sessão do Stripe e colocar esse ID no metadata
      await createCardMutation.mutateAsync({
        cloudinaryId: cardPublicId, // Passamos o ID do arquivo JSON
        email,
        plan: selectedPlan,
        creditCode: creditCode || undefined,
        // Mandamos os dados redundantes caso o backend precise pro email, mas o ID é o principal
        templateId: selectedTemplate!, 
        message, 
      });

    } catch (error) {
      console.error("Error creating card:", error);
      toast.error("Erro ao salvar cartão. Tente novamente.");
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

  return (
    <div className="min-h-screen bg-background relative">
      {/* <Snowfall count={30} /> */}
      <audio ref={audioRef} onEnded={() => setPlayingSong(null)} />

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="font-semibold hidden md:block">Create Your Card</h1>
            
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={!selectedTemplate}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl h-[90vh] p-0 border-none bg-transparent shadow-none">
                <div className="w-full h-full relative">
                  <CardPreview data={getPreviewData()} />
                </div>
              </DialogContent>
            </Dialog>
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
                  <span className="hidden sm:inline">{step.title}</span>
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
              <h2 className="text-2xl font-bold mb-2">Choose Your Template</h2>
              <p className="text-muted-foreground">Select a beautiful design</p>
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
              <h2 className="text-2xl font-bold mb-2">Write Your Message</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>To (Recipient)</Label>
                  <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="e.g. Mom" />
                </div>
                <div>
                  <Label>From (You)</Label>
                  <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="e.g. John" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Your Message</Label>
                  <Button variant="outline" size="sm" onClick={handleGenerateMessage} disabled={isGeneratingMessage}>
                    <Sparkles className="h-4 w-4 mr-2" /> AI Suggestion
                  </Button>
                </div>
                <Textarea 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  rows={6} 
                  maxLength={500} 
                  placeholder="Merry Christmas..." 
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Music */}
        {currentStep === "music" && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Add Music</h2>
            </div>
            
            <Card>
              <CardHeader><CardTitle className="text-lg flex gap-2"><Upload className="h-5 w-5"/> Custom Upload</CardTitle></CardHeader>
              <CardContent>
                 <Input type="file" accept="audio/*" onChange={handleSongChange} />
                 {customSongFile && <p className="text-sm mt-2">{customSongFile.name}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg flex gap-2"><Music className="h-5 w-5"/> Library</CardTitle></CardHeader>
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
              <h2 className="text-2xl font-bold mb-2">Add a Photo</h2>
            </div>
            <Card>
              <CardContent className="pt-6 text-center">
                {photoPreview ? (
                  <div className="relative inline-block">
                    <img src={photoPreview} alt="Preview" className="max-h-64 rounded-lg" />
                    <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}>Remove</Button>
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
              <h2 className="text-2xl font-bold mb-2">Finalize & Pay</h2>
              <p className="text-muted-foreground">Secure payment via Stripe</p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Label>Your Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button 
                className="flex-1" 
                size="lg" 
                onClick={handleSubmit} 
                disabled={isUploading || createCardMutation.isPending || !canProceed()}
              >
                {(isUploading || createCardMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {isUploading ? "Uploading..." : "Pay R$ 3.00"}
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        {currentStep !== "payment" && (
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack}>Back</Button>
            <div className="flex gap-2">
              {selectedTemplate && (
                <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
                  <Eye className="h-4 w-4 mr-2" /> Preview
                </Button>
              )}
              <Button onClick={handleNext} disabled={!canProceed()}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}