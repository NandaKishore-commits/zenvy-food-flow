import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Smartphone, Banknote, Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { placeOrder } from "@/services/dataLayer";
import { initiatePayment, type PaymentMethod } from "@/services/payments";
import { useNavigate } from "react-router-dom";

export interface CheckoutCartItem {
  id: string;
  quantity: number;
  restaurant_id: string;
}

const METHODS: { id: PaymentMethod; label: string; icon: typeof CreditCard; description: string }[] = [
  { id: "upi", label: "UPI", icon: Smartphone, description: "Pay instantly with any UPI app" },
  { id: "card", label: "Card", icon: CreditCard, description: "Credit / Debit card" },
  { id: "cod", label: "Cash on Delivery", icon: Banknote, description: "Pay in cash when it arrives" },
];

type Step = "method" | "processing" | "success" | "failed";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: CheckoutCartItem[];
  total: number;
  onComplete?: () => void;
}

export function CheckoutDialog({ open, onOpenChange, items, total, onComplete }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [step, setStep] = useState<Step>("method");
  const [orderId, setOrderId] = useState<string | null>(null);

  const reset = () => {
    setStep("method");
    setOrderId(null);
  };

  const handleClose = (v: boolean) => {
    if (step === "processing") return;
    onOpenChange(v);
    if (!v) setTimeout(reset, 300);
  };

  const handlePay = async () => {
    if (!user || items.length === 0) return;
    setStep("processing");
    try {
      const restaurantId = items[0].restaurant_id;
      const placed = await placeOrder({
        userId: user.id,
        restaurantId,
        items: items.map((i) => ({ menu_item_id: i.id, quantity: i.quantity })),
      });
      setOrderId(placed.order_id);

      const { success } = await initiatePayment({
        orderId: placed.order_id,
        userId: user.id,
        amount: placed.total,
        method,
      });

      if (success) {
        setStep("success");
        toast({ title: "Payment successful 🎉", description: "Your order is confirmed." });
        onComplete?.();
      } else {
        setStep("failed");
        toast({
          title: "Payment failed",
          description: "No money was charged. Please try again.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      setStep("failed");
      toast({ title: "Checkout failed", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "method" && (
          <>
            <DialogHeader>
              <DialogTitle>Choose payment method</DialogTitle>
              <DialogDescription>Total payable: ₹{total.toFixed(2)}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 my-2">
              {METHODS.map((m) => {
                const Icon = m.icon;
                const selected = method === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg grid place-items-center ${
                        selected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button size="lg" onClick={handlePay} className="w-full">
              {method === "cod" ? `Confirm COD · ₹${total.toFixed(2)}` : `Pay ₹${total.toFixed(2)}`}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              Demo gateway · no real money is charged
            </p>
          </>
        )}

        {step === "processing" && (
          <div className="py-10 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="text-center">
              <p className="font-medium">Processing payment…</p>
              <p className="text-sm text-muted-foreground">Please don't close this window.</p>
            </div>
          </div>
        )}

        {step === "success" && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-8 flex flex-col items-center gap-4 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-accent/15 grid place-items-center">
              <CheckCircle2 className="w-10 h-10 text-accent" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold">Order confirmed</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We've sent your order to the restaurant.
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={() => handleClose(false)}>
                Keep browsing
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  handleClose(false);
                  if (orderId) navigate(`/orders/${orderId}`);
                }}
              >
                Track order
              </Button>
            </div>
          </motion.div>
        )}

        {step === "failed" && (
          <div className="py-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/15 grid place-items-center">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold">Payment failed</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your order was created but no payment was captured. You can retry from the Orders page.
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={() => handleClose(false)}>
                Close
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  handleClose(false);
                  navigate("/orders");
                }}
              >
                Go to orders
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}