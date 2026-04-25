import { Check, Clock, ChefHat, Truck, Package, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import type { OrderStatus } from "@/services/orders";

type StepConfig = {
  key: OrderStatus;
  label: string;
  icon: typeof Check;
  // Tailwind classes per state
  doneBg: string;
  currentBg: string;
  currentRing: string;
  connector: string;
  currentText: string;
};

const STEPS: StepConfig[] = [
  {
    key: "placed",
    label: "Order Placed",
    icon: Check,
    doneBg: "bg-muted-foreground text-background",
    currentBg: "bg-muted-foreground text-background",
    currentRing: "ring-muted-foreground/20",
    connector: "bg-muted-foreground",
    currentText: "text-muted-foreground",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    icon: Clock,
    doneBg: "bg-primary text-primary-foreground",
    currentBg: "bg-primary text-primary-foreground",
    currentRing: "ring-primary/20",
    connector: "bg-primary",
    currentText: "text-primary",
  },
  {
    key: "preparing",
    label: "Preparing",
    icon: ChefHat,
    doneBg: "bg-secondary text-secondary-foreground",
    currentBg: "bg-secondary text-secondary-foreground",
    currentRing: "ring-secondary/30",
    connector: "bg-secondary",
    currentText: "text-secondary-foreground",
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    icon: Truck,
    doneBg: "bg-accent text-accent-foreground",
    currentBg: "bg-accent text-accent-foreground",
    currentRing: "ring-accent/30",
    connector: "bg-accent",
    currentText: "text-accent",
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: Package,
    doneBg: "bg-emerald-500 text-white",
    currentBg: "bg-emerald-500 text-white",
    currentRing: "ring-emerald-500/25",
    connector: "bg-emerald-500",
    currentText: "text-emerald-600 dark:text-emerald-400",
  },
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
  const isDeliveredAll = status === "delivered";

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
                  isDeliveredAll
                    ? "bg-emerald-500 text-white"
                    : isDone
                    ? step.doneBg
                    : isCurrent
                    ? `${step.currentBg} ring-4 ${step.currentRing}`
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-0.5 h-10 transition-colors ${
                    isDeliveredAll
                      ? "bg-emerald-500"
                      : isDone
                      ? step.connector
                      : "bg-muted"
                  }`}
                />
              )}
            </div>
            <div className="pt-2 pb-6">
              <p
                className={`font-medium ${
                  isDeliveredAll
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isPending
                    ? "text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {step.label}
              </p>
              {isCurrent && !isDeliveredAll && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-sm mt-0.5 ${step.currentText}`}
                >
                  In progress…
                </motion.p>
              )}
              {isCurrent && isDeliveredAll && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm mt-0.5 text-emerald-600 dark:text-emerald-400 font-medium"
                >
                  Successfully delivered ✓
                </motion.p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}