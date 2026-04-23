import { useState } from "react";
import { z } from "zod";
import { Loader2, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const upiSchema = z.object({
  upiId: z
    .string()
    .trim()
    .min(3, "UPI ID is too short")
    .max(64, "UPI ID is too long")
    .regex(/^[a-zA-Z0-9._-]{2,}@[a-zA-Z][a-zA-Z0-9]{1,}$/, "Enter a valid UPI ID like name@bank"),
});

export interface UpiDetails {
  upiId: string;
}

interface Props {
  amount: number;
  loading?: boolean;
  onSubmit: (details: UpiDetails) => void;
}

export function UpiPaymentForm({ amount, loading, onSubmit }: Props) {
  const [upiId, setUpiId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = upiSchema.safeParse({ upiId });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid UPI ID");
      return;
    }
    setError(null);
    onSubmit({ upiId: result.data.upiId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="upi-id" className="text-sm font-medium">
          UPI ID
        </Label>
        <div className="relative">
          <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="upi-id"
            inputMode="email"
            autoComplete="off"
            placeholder="yourname@bank"
            value={upiId}
            onChange={(e) => {
              setUpiId(e.target.value);
              if (error) setError(null);
            }}
            disabled={loading}
            className="pl-9"
            maxLength={64}
            aria-invalid={!!error}
            aria-describedby={error ? "upi-error" : undefined}
          />
        </div>
        {error && (
          <p id="upi-error" className="text-xs text-destructive">
            {error}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          You'll get a payment request on your UPI app.
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing…
          </>
        ) : (
          `Pay ₹${amount.toFixed(2)}`
        )}
      </Button>
    </form>
  );
}