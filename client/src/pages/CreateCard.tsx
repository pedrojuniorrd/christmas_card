import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Music,
  Image,
  CreditCard,
  Loader2,
  Upload,
  Play,
  Pause,
  Check,
  Gift,
} from "lucide-react";
import Snowfall from "@/components/Snowfall";

type Step = "template" | "message" | "music" | "photo" | "payment";

const STEPS: { id: Step; title: string; icon: React.ReactNode }[] = [
  { id: "template", title: "Template", icon: <Sparkles className="h-4 w-4" /> },
  { id: "message", title: "Message", icon: <Gift className="h-4 w-4" /> },
  { id: "music", title: "Music", icon: <Music className="h-4 w-4" /> },
  { id: "photo", title: "Photo", icon: <Image className="h-4 w-4" /> },
  { id: "payment", title: "Payment", icon: <CreditCard className="h-4 w-4" /> },
];

const TEMPLATES = [
  {
    id: 1,
    name: "Classic Red",
    description: "Traditional Christmas warmth",
    backgroundColor: "christmas-gradient-red",
    accentColor: "gold",
    animationType: "snow",
    preview: "🎄",
  },
  {
    id: 2,
    name: "Evergreen",
    description: "Fresh forest vibes",
    backgroundColor: "christmas-gradient-green",
    accentColor: "gold",
    animationType: "lights",
    preview: "🌲",
  },
  {
    id: 3,
    name: "Golden Glow",
    description: "Elegant and festive",
    backgroundColor: "christmas-gradient-gold",
    accentColor: "red",
    animationType: "stars",
    preview: "⭐",
  },
  {
    id: 4,
    name: "Silent Night",
    description: "Peaceful winter evening",
    backgroundColor: "christmas-gradient-night",
    accentColor: "white",
    animationType: "snow",
    preview: "🌙",
  },
];

export default function CreateCard() {
  const { creditCode } = useParams<{ creditCode?: string }>();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [selectedSong, setSelectedSong] = useState<number | null>(null);
  const [customSongFile, setCustomSongFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [playingSong, setPlayingSong] = useState<number | null>(null);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"single" | "family">("single");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch songs from library
  const { data: songs = [], isLoading: loadingSongs } = trpc.songs.list.useQuery();
  
  // AI message suggestion mutation
  const generateMessageMutation = trpc.cards.generateMessage.useMutation({
    onSuccess: (data) => {
      setMessage(data.message);
      toast.success("Message generated!");
    },
    onError: () => {
      toast.error("Failed to generate message");
    },
  });

  // Create card mutation
  const createCardMutation = trpc.cards.create.useMutation({
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else if (data.publicId) {
        setLocation(`/c/${data.publicId}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create card");
    },
  });

  // File upload mutation
  const uploadFileMutation = trpc.files.upload.useMutation();

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

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
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    try {
      let photoUrl: string | undefined;
      let customSongUrl: string | undefined;

      // Upload photo if provided
      if (photoFile) {
        const photoBase64 = await fileToBase64(photoFile);
        const uploadResult = await uploadFileMutation.mutateAsync({
          file: photoBase64,
          filename: photoFile.name,
          type: "photo",
        });
        photoUrl = uploadResult.url;
      }

      // Upload custom song if provided
      if (customSongFile) {
        const songBase64 = await fileToBase64(customSongFile);
        const uploadResult = await uploadFileMutation.mutateAsync({
          file: songBase64,
          filename: customSongFile.name,
          type: "audio",
        });
        customSongUrl = uploadResult.url;
      }

      await createCardMutation.mutateAsync({
        templateId: selectedTemplate,
        message,
        senderName: senderName || undefined,
        recipientName: recipientName || undefined,
        songId: selectedSong || undefined,
        customSongUrl,
        photoUrl,
        email,
        plan: selectedPlan,
        creditCode: creditCode || undefined,
      });
    } catch (error) {
      console.error("Error creating card:", error);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case "template":
        return selectedTemplate !== null;
      case "message":
        return message.trim().length > 0;
      case "music":
        return true; // Music is optional
      case "photo":
        return true; // Photo is optional
      case "payment":
        return email.trim().length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <Snowfall count={30} />
      <audio ref={audioRef} onEnded={() => setPlayingSong(null)} />

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="font-semibold">Create Your Card</h1>
            <div className="w-20" />
          </div>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2">
              {STEPS.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                  className={`flex items-center gap-1 text-xs ${
                    index <= currentStepIndex
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
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
        {/* Template Selection */}
        {currentStep === "template" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose Your Template</h2>
              <p className="text-muted-foreground">
                Select a beautiful design for your Christmas card
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    selectedTemplate === template.id
                      ? "ring-2 ring-primary shadow-lg"
                      : ""
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardContent className="p-4">
                    <div
                      className={`aspect-[3/4] rounded-lg ${template.backgroundColor} flex items-center justify-center text-4xl mb-3`}
                    >
                      {template.preview}
                    </div>
                    <h3 className="font-semibold text-sm">{template.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {template.description}
                    </p>
                    {selectedTemplate === template.id && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        {currentStep === "message" && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Write Your Message</h2>
              <p className="text-muted-foreground">
                Add a personal touch to your card
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipientName">To (Recipient Name)</Label>
                  <Input
                    id="recipientName"
                    placeholder="e.g., Mom"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="senderName">From (Your Name)</Label>
                  <Input
                    id="senderName"
                    placeholder="e.g., John"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="message">Your Message</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateMessage}
                    disabled={isGeneratingMessage}
                  >
                    {isGeneratingMessage ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    AI Suggestion
                  </Button>
                </div>
                <Textarea
                  id="message"
                  placeholder="Write your heartfelt Christmas message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {message.length}/500 characters
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Music Selection */}
        {currentStep === "music" && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Add Music</h2>
              <p className="text-muted-foreground">
                Choose a Christmas song or upload your own
              </p>
            </div>

            {/* Upload Custom Song */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Your Own Music
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={handleSongChange}
                    className="flex-1"
                  />
                  {customSongFile && (
                    <span className="text-sm text-muted-foreground">
                      {customSongFile.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Max file size: 10MB. Supported formats: MP3, WAV, OGG
                </p>
              </CardContent>
            </Card>

            {/* Song Library */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Christmas Song Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSongs ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : songs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No songs available. Upload your own music above!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {songs.map((song) => (
                      <div
                        key={song.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedSong === song.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => {
                          setSelectedSong(song.id);
                          setCustomSongFile(null);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePlaySong(song.id, song.fileUrl);
                            }}
                          >
                            {playingSong === song.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <div>
                            <p className="font-medium text-sm">{song.title}</p>
                            {song.artist && (
                              <p className="text-xs text-muted-foreground">
                                {song.artist}
                              </p>
                            )}
                          </div>
                        </div>
                        {selectedSong === song.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground">
              Music is optional. You can skip this step if you prefer.
            </p>
          </div>
        )}

        {/* Photo Upload */}
        {currentStep === "photo" && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Add a Photo</h2>
              <p className="text-muted-foreground">
                Make your card more personal with a photo
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="max-w-full max-h-64 rounded-lg shadow-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-12 text-center w-full">
                      <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Drag and drop or click to upload
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Max file size: 5MB. Supported formats: JPG, PNG, GIF
                </p>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground">
              Photo is optional. You can skip this step if you prefer.
            </p>
          </div>
        )}

        {/* Payment */}
        {currentStep === "payment" && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Complete Your Order</h2>
              <p className="text-muted-foreground">
                Choose your plan and complete payment
              </p>
            </div>

            {creditCode ? (
              <Card className="border-primary">
                <CardContent className="pt-6 text-center">
                  <Check className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Credit Code Applied</h3>
                  <p className="text-muted-foreground">
                    You're using credit code: <strong>{creditCode}</strong>
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedPlan === "single"
                      ? "ring-2 ring-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPlan("single")}
                >
                  <CardContent className="pt-6 text-center">
                    <h3 className="font-semibold text-lg mb-1">Single Card</h3>
                    <p className="text-3xl font-bold text-primary mb-2">R$ 3</p>
                    <p className="text-sm text-muted-foreground">1 card</p>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-all relative ${
                    selectedPlan === "family"
                      ? "ring-2 ring-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPlan("family")}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                    Best Value
                  </div>
                  <CardContent className="pt-6 text-center">
                    <h3 className="font-semibold text-lg mb-1">Family Pack</h3>
                    <p className="text-3xl font-bold text-primary mb-2">R$ 5</p>
                    <p className="text-sm text-muted-foreground">5 cards</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="email">Your Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll send your QR code and card link to this email
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                className="flex-1"
                size="lg"
                onClick={handleSubmit}
                disabled={createCardMutation.isPending || !canProceed()}
              >
                {createCardMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {creditCode ? "Create Card" : "Proceed to Payment"}
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Secure payment powered by Stripe. Cards are accessible until January 15th, 2025.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep !== "payment" && (
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
