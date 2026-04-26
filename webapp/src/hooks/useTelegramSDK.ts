// Обёртка над window.Telegram.WebApp — единая точка доступа к Telegram Mini App SDK.
// Все функции безопасны вне Telegram: fallback на browser-аналоги.

const tg = () => (window as any).Telegram?.WebApp;

// ─── Haptic feedback ───────────────────────────────────────────────────────────

type ImpactStyle = 'light' | 'medium' | 'heavy';
type NotificationType = 'success' | 'error' | 'warning';

export function hapticImpact(style: ImpactStyle = 'light') {
  tg()?.HapticFeedback?.impactOccurred(style);
}

export function hapticNotification(type: NotificationType) {
  tg()?.HapticFeedback?.notificationOccurred(type);
}

// ─── Back Button ──────────────────────────────────────────────────────────────

import { useEffect } from 'react';

// Регистрирует нативную кнопку "Назад" Telegram на время жизни компонента.
export function useBackButton(onBack: () => void) {
  useEffect(() => {
    const backBtn = tg()?.BackButton;
    if (!backBtn) return;
    backBtn.show();
    backBtn.onClick(onBack);
    return () => {
      backBtn.offClick(onBack);
      backBtn.hide();
    };
  }, [onBack]);
}

// ─── Main Button ──────────────────────────────────────────────────────────────

// Управляет нативной MainButton Telegram (большая кнопка внизу экрана).
export function useMainButton(label: string, onTap: () => void, enabled: boolean) {
  useEffect(() => {
    const btn = tg()?.MainButton;
    if (!btn) return;
    btn.setText(label);
    btn.onClick(onTap);
    if (enabled) btn.show(); else btn.hide();
    btn.isActive = enabled;
    return () => {
      btn.offClick(onTap);
      btn.hide();
    };
  }, [label, onTap, enabled]);
}

// ─── Start param (invite link handling) ───────────────────────────────────────

// Возвращает startapp-параметр из deep link (например "join_abc123").
export function getStartParam(): string | undefined {
  return tg()?.initDataUnsafe?.start_param;
}

// ─── Share ────────────────────────────────────────────────────────────────────

// Открывает нативный Telegram share dialog или копирует в буфер обмена.
export function shareLink(url: string, text: string): void {
  const sdk = tg();
  if (sdk) {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    sdk.openTelegramLink(shareUrl);
  } else {
    navigator.clipboard.writeText(url).catch(() => {});
  }
}
