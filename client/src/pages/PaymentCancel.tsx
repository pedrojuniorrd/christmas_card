import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, Gift } from "lucide-react";
import Snowfall from "@/components/Snowfall";

export default function PaymentCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center">
      <Snowfall count={30} />

      <div className="container max-w-md text-center px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 text-destructive mb-4">
          <XCircle className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Payment Cancelled</h1>
        <p className="text-muted-foreground mb-6">
          Your payment was cancelled. Don't worry, you can try again whenever you're ready.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => setLocation("/create")}>
            <Gift className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
