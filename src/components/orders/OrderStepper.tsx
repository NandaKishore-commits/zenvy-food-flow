import { Check, Clock, ChefHat, Truck, Package, XCircle, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { OrderStatus } from "@/services/orders";

type StepTheme = {
  bg: string;       // Filled icon background + text color
  ring: string;     // Ring color when current
  connector: string;// Vertical line color when done
  text: string;     // "In progress…" label color
};

type StepConfig = {
  key: OrderStatus;
  label: string;
  icon: LucideIcon;
  theme: StepTheme;
};

const DELIVERED_THEME: StepTheme = {
  bg: "bg-emerald-500 text-white",
  ring: "ring-emerald-500/25",
  connector: "bg-emerald-500",
  text: "text-emerald-600 dark:text-emerald-400",
};

const STEPS: StepConfig[] = [
  {
    key: "placed",
    label: "Order Placed",
    icon: Check,
    theme: {
      bg: "bg-muted-foreground text-background",
      ring: "ring-muted-foreground/20",
      connector: "bg-muted-foreground",
      text: "text-muted-foreground",
    },
  },
  {
    key: "confirmed",
    label: "Confirmed",
    icon: Clock,
    theme: {
      bg: "bg-primary text-primary-foreground",
      ring: "ring-primary/20",
      connector: "bg-primary",
      text: "text-primary",
    },
  },
  {
    key: "preparing",
    label: "Preparing",
    icon: ChefHat,
    theme: {
      bg: "bg-secondary text-secondary-foreground",
      ring: "ring-secondary/30",
      connector: "bg-secondary",
      text: "text-secondary-foreground",
    },
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    icon: Truck,
    theme: {
      bg: "bg-accent text-accent-foreground",
      ring: "ring-accent/30",
      connector: "bg-accent",
      text: "text-accent",
    },
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: Package,
    theme: DELIVERED_THEME,
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
  const allDelivered = status === "delivered";

  return (
    <div className="space-y-1">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isPending = i > currentIndex;
        const isLast = i === STEPS.length - 1;

        // When delivered, paint everything green; otherwise use per-step theme.
        const theme = allDelivered ? DELIVERED_THEME : step.theme;

        const iconClass = allDelivered || isDone
          ? theme.bg
          : isCurrent
          ? `${theme.bg} ring-4 ${theme.ring}`
          : "bg-muted text-muted-foreground";

        const connectorClass = allDelivered || isDone ? theme.connector : "bg-muted";

        const labelClass = allDelivered
          ? "text-emerald-600 dark:text-emerald-400"
          : isPending
          ? "text-muted-foreground"
          : "text-foreground";

        return (
          <div key={step.key} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                className={`w-10 h-10 rounded-full grid place-items-center transition-colors ${iconClass}`}
              >
                <step.icon className="w-5 h-5" />
              </motion.div>
              {!isLast && <div className={`w-0.5 h-10 transition-colors ${connectorClass}`} />}
            </div>

            <div className="pt-2 pb-6">
              <p className={`font-medium ${labelClass}`}>{step.label}</p>

              {isCurrent && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-sm mt-0.5 ${
                    allDelivered ? "text-emerald-600 dark:text-emerald-400 font-medium" : theme.text
                  }`}
                >
                  {allDelivered ? "Successfully delivered ✓" : "In progress…"}
                </motion.p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
