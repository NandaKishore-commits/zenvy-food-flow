import { useState } from "react";
import { z } from "zod";
import { CreditCard, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const cardSchema = z.object({
  number: z
    .string()
    .regex(/^\d{16}$/, "Card number must be 16 digits"),
  holder: z
    .string()
    .trim()
    .min(2, "Name is too short")
    .max(64, "Name is too long")
    .regex(/^[a-zA-Z .'-]+$/, "Use letters only"),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY"),
  cvv: z.string().regex(/^\d{3}$/, "CVV must be 3 digits"),
});

export interface CardDetails {
  number: string;
  holder: string;
  expiry: string;
  cvv: string;
}

interface Props {
  amount: number;
  loading?: boolean;
  onSubmit: (details: CardDetails) => void;
}

function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function isExpiryFuture(mmYY: string): boolean {
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(mmYY);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  const now = new Date();
  // Treat the entire expiry month as valid (last day of month).
  const exp = new Date(year, month, 0, 23, 59, 59);
  return exp.getTime() >= now.getTime();
}

export function CardPaymentForm({ amount, loading, onSubmit }: Props) {
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof CardDetails, string>>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = {
      number: number.replace(/\s/g, ""),
      holder: holder.trim(),
      expiry,
      cvv,
    };
    const result = cardSchema.safeParse(candidate);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CardDetails, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CardDetails | undefined;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    if (!isExpiryFuture(result.data.expiry)) {
      setErrors({ expiry: "Card has expired" });
      return;
    }
    setErrors({});
    onSubmit({
      number: result.data.number,
      holder: result.data.holder,
      expiry: result.data.expiry,
      cvv: result.data.cvv,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="card-number" className="text-sm font-medium">
          Card number
        </Label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="card-number"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            value={number}
            onChange={(e) => {
              setNumber(formatCardNumber(e.target.value));
              if (errors.number) setErrors((p) => ({ ...p, number: undefined }));
            }}
            disabled={loading}
            className="pl-9 tracking-wider"
            maxLength={19}
            aria-invalid={!!errors.number}
          />
        </div>
        {errors.number && <p className="text-xs text-destructive">{errors.number}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="card-holder" className="text-sm font-medium">
          Card holder name
        </Label>
        <Input
          id="card-holder"
          autoComplete="cc-name"
          placeholder="As printed on card"
          value={holder}
          onChange={(e) => {
            setHolder(e.target.value);
            if (errors.holder) setErrors((p) => ({ ...p, holder: undefined }));
          }}
          disabled={loading}
          maxLength={64}
          aria-invalid={!!errors.holder}
        />
        {errors.holder && <p className="text-xs text-destructive">{errors.holder}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="card-expiry" className="text-sm font-medium">
            Expiry
          </Label>
          <Input
            id="card-expiry"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => {
              setExpiry(formatExpiry(e.target.value));
              if (errors.expiry) setErrors((p) => ({ ...p, expiry: undefined }));
            }}
            disabled={loading}
            maxLength={5}
            aria-invalid={!!errors.expiry}
          />
          {errors.expiry && <p className="text-xs text-destructive">{errors.expiry}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="card-cvv" className="text-sm font-medium">
            CVV
          </Label>
          <Input
            id="card-cvv"
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="•••"
            value={cvv}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 3);
              setCvv(v);
              if (errors.cvv) setErrors((p) => ({ ...p, cvv: undefined }));
            }}
            disabled={loading}
            maxLength={3}
            aria-invalid={!!errors.cvv}
          />
          {errors.cvv && <p className="text-xs text-destructive">{errors.cvv}</p>}
        </div>
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