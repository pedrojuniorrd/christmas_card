import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Check, Copy, Gift, Loader2, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";
import Snowfall from "@/components/Snowfall";
import QRCode from "@/components/QRCode";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get("session_id");
    if (session) {
      setSessionId(session);
    }
  }, []);

  const { data: paymentData, isLoading } = trpc.payments.verifySession.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  const handleCopyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const link = document.createElement("a");
      link.download = "christmas-card-qr.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("QR code downloaded!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Snowfall count={30} />
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (!paymentData || !paymentData.publicId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Snowfall count={30} />
        <div className="text-center max-w-md mx-auto px-4">
          <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Payment Not Found</h1>
          <p className="text-muted-foreground mb-4">
            We couldn't find your payment. Please try again or contact support.
          </p>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const cardUrl = `${window.location.origin}/c/${paymentData.publicId}`;

  return (
    <div className="min-h-screen bg-background relative">
      <Snowfall count={40} />

      <div className="container max-w-2xl py-12 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-4">
            <Check className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your Christmas card has been created and is ready to share.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h2 className="font-semibold text-lg mb-4">Your Card QR Code</h2>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white rounded-xl shadow-lg">
                  <QRCode value={cardUrl} size={200} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Scan this QR code to view your card, or share the link below
              </p>
              <div className="flex items-center gap-2 justify-center flex-wrap">
                <code className="bg-muted px-3 py-2 rounded text-sm break-all max-w-xs">
                  {cardUrl}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyLink(cardUrl)}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => window.open(cardUrl, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview Card
              </Button>
              <Button variant="outline" onClick={handleDownloadQR}>
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {paymentData.remainingCards > 0 && paymentData.creditCode && (
          <Card className="mb-6 border-primary">
            <CardContent className="pt-6 text-center">
              <Gift className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold mb-1">
                You have {paymentData.remainingCards} more card
                {paymentData.remainingCards > 1 ? "s" : ""} to create!
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use your credit code to create more cards
              </p>
              <div className="flex items-center gap-2 justify-center mb-4">
                <code className="bg-muted px-3 py-2 rounded font-mono text-lg">
                  {paymentData.creditCode}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(paymentData.creditCode || "");
                    toast.success("Credit code copied!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={() =>
                  setLocation(`/create/${paymentData.creditCode}`)
                }
              >
                Create Another Card
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            A confirmation email has been sent to your email address.
          </p>
          <Button variant="outline" onClick={() => setLocation("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
