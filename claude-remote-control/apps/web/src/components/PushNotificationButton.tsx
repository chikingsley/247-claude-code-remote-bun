"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

interface PushNotificationButtonProps {
  className?: string;
  isMobile?: boolean;
}

export function PushNotificationButton({
  className,
  isMobile = false,
}: PushNotificationButtonProps) {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications();
  const [showDialog, setShowDialog] = useState(false);

  // Don't render at all if push notifications aren't supported
  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (isLoading) {
      return;
    }
    setShowDialog(true);
  };

  const handleConfirm = async () => {
    setShowDialog(false);
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const iconClass = isMobile ? "h-5 w-5" : "h-4 w-4";
  const isDisabled = isLoading;

  const getTitle = () => {
    if (isSubscribed) {
      return "Disable notifications";
    }
    return "Enable notifications";
  };

  return (
    <>
      <button
        className={cn(
          "rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-white",
          "touch-manipulation disabled:cursor-not-allowed disabled:opacity-50",
          isMobile ? "min-h-[44px] min-w-[44px] p-2.5" : "p-2",
          isSubscribed && "text-orange-400 hover:text-orange-300",
          className
        )}
        disabled={isDisabled}
        onClick={handleClick}
        title={getTitle()}
      >
        {isLoading ? (
          <Loader2 className={cn(iconClass, "animate-spin")} />
        ) : isSubscribed ? (
          <Bell className={iconClass} />
        ) : (
          <BellOff className={iconClass} />
        )}
      </button>

      <AlertDialog onOpenChange={setShowDialog} open={showDialog}>
        <AlertDialogContent className="border-white/10 bg-[#12121a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {isSubscribed
                ? "Désactiver les notifications"
                : "Activer les notifications"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {isSubscribed
                ? "Tu ne recevras plus de notifications push quand une session Claude a besoin de ton attention."
                : "Tu recevras une notification push quand une session Claude a besoin de ton attention (permission requise, input attendu, etc.)."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                isSubscribed
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              )}
              onClick={handleConfirm}
            >
              {isSubscribed ? "Désactiver" : "Activer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
