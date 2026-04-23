import { Check, Clock, ChefHat, Truck, Package, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import type { OrderStatus } from "@/services/orders";

const STEPS: { key: OrderStatus; label: string; icon: typeof Check }[] = [
  { key: "placed", label: "Order Placed", icon: Check },
  { key: "confirmed", label: "Confirmed", icon: Clock },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Package },
];

export function OrderStepper({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 p-6 rounded-xl bg-destructive/10 border border-destructive/20">
        <XCircle className="w-6 h-6 text-destructive" />
        <div>
          <p className="font-semibold text-destructive">Order cancelled</p>
          <p className="text-sm text-muted-foreground">This order is no longer active.</p>
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="space-y-1">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isPending = i > currentIndex;

        return (
          <div key={step.key} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                className={`w-10 h-10 rounded-full grid place-items-center transition-colors ${
                  isDone
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-0.5 h-10 transition-colors ${
                    isDone ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
            <div className="pt-2 pb-6">
              <p
                className={`font-medium ${
                  isPending ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {step.label}
              </p>
              {isCurrent && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-primary mt-0.5"
                >
                  In progress…
                </motion.p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}