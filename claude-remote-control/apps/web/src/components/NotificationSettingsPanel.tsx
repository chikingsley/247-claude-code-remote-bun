'use client';

import { Bell, Volume2, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useSoundNotifications } from '@/hooks/useSoundNotifications';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function ToggleSwitch({ enabled, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-[#0d0d14]',
        enabled ? 'bg-orange-500' : 'bg-white/10',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

export function NotificationSettingsPanel() {
  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    permission: pushPermission,
    isLoading: isPushLoading,
    error: pushError,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
  } = usePushNotifications();

  const { soundEnabled, setSoundPreference } = useNotificationPreferences();

  const { testSound, isLoaded: isSoundLoaded } = useSoundNotifications();

  const handlePushToggle = async () => {
    if (isPushSubscribed) {
      await unsubscribeFromPush();
    } else {
      await subscribeToPush();
    }
  };

  const handleSoundToggle = () => {
    setSoundPreference(!soundEnabled);
  };

  const handleTestSound = async () => {
    const played = await testSound();
    if (!played) {
      console.warn('Could not play test sound');
    }
  };

  const getPushStatusMessage = () => {
    if (!isPushSupported) {
      return 'Browser notifications are not supported on this device.';
    }
    if (pushPermission === 'denied') {
      return 'Notifications are blocked. Please enable them in your browser settings.';
    }
    if (isPushSubscribed) {
      return 'You will receive browser notifications when sessions need attention.';
    }
    return 'Enable to receive browser notifications when sessions need attention.';
  };

  const getPushStatusIcon = () => {
    if (!isPushSupported || pushPermission === 'denied') {
      return <AlertCircle className="h-4 w-4 text-amber-400" />;
    }
    if (isPushSubscribed) {
      return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-sm text-white/60">
          Configure how you want to be notified when sessions need your attention.
        </p>
      </div>

      {/* Browser Push Notifications */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Bell className="h-5 w-5 text-blue-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-white">Browser Notifications</h3>
              <p className="text-sm text-white/50">
                Receive push notifications even when the browser is in the background.
              </p>
            </div>
          </div>
          <ToggleSwitch
            enabled={isPushSubscribed}
            onChange={handlePushToggle}
            disabled={!isPushSupported || isPushLoading || pushPermission === 'denied'}
          />
        </div>

        {/* Status message */}
        <div className="mt-3 flex items-center gap-2 text-sm">
          {getPushStatusIcon()}
          <span
            className={cn(
              !isPushSupported || pushPermission === 'denied'
                ? 'text-amber-400'
                : isPushSubscribed
                  ? 'text-emerald-400'
                  : 'text-white/50'
            )}
          >
            {isPushLoading ? 'Loading...' : getPushStatusMessage()}
          </span>
        </div>

        {pushError && <div className="mt-2 text-sm text-red-400">Error: {pushError}</div>}
      </div>

      {/* Sound Notifications */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Volume2 className="h-5 w-5 text-orange-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-white">Sound Notifications</h3>
              <p className="text-sm text-white/50">
                Play a sound when a notification appears while the app is in the foreground.
              </p>
            </div>
          </div>
          <ToggleSwitch enabled={soundEnabled} onChange={handleSoundToggle} />
        </div>

        {/* Test Sound Button */}
        {soundEnabled && (
          <div className="mt-3">
            <button
              onClick={handleTestSound}
              disabled={!isSoundLoaded}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white',
                'border border-white/10',
                'transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              Test Sound
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-xl bg-white/5 p-4 text-sm text-white/50">
        <p>
          <strong className="text-white/70">Tip:</strong> You can enable both notification types.
          Browser notifications work in the background, while sound notifications are great for when
          the app is visible.
        </p>
      </div>
    </div>
  );
}
