// Переиспользуемые UI-примитивы дизайн-системы Expense Tracker.
// Все компоненты воспроизводят дизайн-токены и структуру из прототипа (tg-app.jsx).

import { useState } from 'react';

// Цветовые токены — соответствуют разделу "Design Tokens" в README.md.
export const C = {
  blue:    '#2AABEE', blueDark:'#1A8FC8',
  green:   '#34C759', red:     '#FF3B30', orange: '#FF9500',
  bg:      '#EFEFF4', card:    '#FFFFFF', sep:    'rgba(0,0,0,0.09)',
  text:    '#000000', hint:    '#8E8E93', border: '#E5E5EA',
};

// NavBar — iOS-стиль: высота 44px, blurred-фон, заголовок строго по центру.
export function NavBar({
  title, onBack, backLabel = '', rightLabel, onRight,
}: {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  rightLabel?: string;
  onRight?: (() => void) | null;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)', borderBottom: `0.5px solid ${C.sep}`,
      height: 44, display: 'flex', alignItems: 'center', padding: '0 4px',
      flexShrink: 0, position: 'relative', zIndex: 10,
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: C.blue,
          display: 'flex', alignItems: 'center', gap: 1,
          padding: '8px 10px', cursor: 'pointer', fontSize: 15,
          fontFamily: 'inherit', minWidth: 64, flexShrink: 0,
        }}>
          <span style={{ fontSize: 22, lineHeight: 1, marginTop: -1 }}>‹</span>
          {backLabel && <span style={{ marginLeft: 2 }}>{backLabel}</span>}
        </button>
      )}
      {/* Абсолютное позиционирование гарантирует точный центр независимо от ширины кнопок */}
      <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
        <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: -0.3 }}>{title}</span>
      </div>
      {onRight ? (
        <button onClick={onRight} style={{
          marginLeft: 'auto', background: 'none', border: 'none', color: C.blue,
          fontSize: 15, fontWeight: 500, padding: '8px 10px',
          cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
        }}>{rightLabel}</button>
      ) : <div style={{ marginLeft: 'auto', width: 64 }} />}
    </div>
  );
}

// Av — круглый аватар с инициалами. Размер и цвет задаются снаружи.
export function Av({ m, size = 40 }: { m?: { initials?: string; color?: string }; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: m?.color || C.blue, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 700, fontSize: size * 0.34, letterSpacing: -0.5,
    }}>{m?.initials || '?'}</div>
  );
}

// Pill — отображение баланса: зелёный для положительного, красный для отрицательного.
export function Pill({ n, large = false }: { n: number; large?: boolean }) {
  const pos = n >= 0;
  return (
    <span style={{ color: pos ? C.green : C.red, fontWeight: 700, fontSize: large ? 24 : 15 }}>
      {pos ? '+' : ''}{Math.abs(n).toLocaleString('ru')} ₽
    </span>
  );
}

// Card — белая карточка-контейнер с закруглёнными углами (border-radius 12px).
export function Card({
  children, mx = 16, mb = 8, style = {},
}: {
  children: React.ReactNode;
  mx?: number;
  mb?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ background: C.card, borderRadius: 12, margin: `0 ${mx}px ${mb}px`, overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

// SLabel — заголовок секции: 12px uppercase, серый (стиль iOS grouped list).
export function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 500, color: C.hint,
      textTransform: 'uppercase', letterSpacing: 0.6, padding: '14px 20px 6px',
    }}>{children}</div>
  );
}

// Row — строка списка с press-эффектом (серый фон) через pointer-события.
export function Row({
  left, sub, right, onTap, last = false, px = 16, py = 13,
}: {
  left: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode;
  onTap?: () => void; last?: boolean; px?: number; py?: number;
}) {
  const [dn, setDn] = useState(false);
  return (
    <div
      onClick={onTap}
      onPointerDown={() => setDn(true)}
      onPointerUp={() => setDn(false)}
      onPointerLeave={() => setDn(false)}
      style={{
        padding: `${py}px ${px}px`,
        borderBottom: last ? 'none' : `0.5px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: onTap ? 'pointer' : 'default',
        background: dn && onTap ? '#F2F2F7' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{left}</div>
        {sub && <div style={{ fontSize: 13, color: C.hint, marginTop: 2 }}>{sub}</div>}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
      {onTap && <span style={{ color: C.border, fontSize: 20, flexShrink: 0, marginRight: -4 }}>›</span>}
    </div>
  );
}

// Btn — полноширинная кнопка. Варианты: синяя (default), красная (danger), контурная (outline).
export function Btn({
  label, onTap, disabled = false, danger = false, outline = false, style = {},
}: {
  label: string; onTap?: () => void; disabled?: boolean;
  danger?: boolean; outline?: boolean; style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onTap}
      disabled={disabled}
      style={{
        background: outline ? 'transparent' : disabled ? '#C7C7CD' : danger ? C.red : C.blue,
        color: outline ? C.blue : 'white',
        border: outline ? `1.5px solid ${C.blue}` : 'none',
        borderRadius: 12, padding: '14px 20px', fontSize: 17, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer', width: '100%',
        fontFamily: 'inherit', letterSpacing: -0.3,
        opacity: disabled ? 0.5 : 1, ...style,
      }}
    >{label}</button>
  );
}

// Sheet — нижний модальный лист с overlay. Закрывается по клику на затемнение.
export function Sheet({
  show, onClose, title, children,
}: {
  show: boolean; onClose: () => void; title?: string; children: React.ReactNode;
}) {
  if (!show) return null;
  return (
    <div className="overlay-enter" onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200,
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div className="sheet-enter" onClick={(e) => e.stopPropagation()} style={{
        background: C.card, borderRadius: '20px 20px 0 0', width: '100%', padding: '8px 0 40px',
      }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: C.border, margin: '0 auto 14px' }} />
        {title && <div style={{ fontSize: 17, fontWeight: 600, textAlign: 'center', marginBottom: 16, padding: '0 20px' }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

// EmojiIcon — иконка категории расхода (маппинг строкового кода в эмодзи).
const EMOJI_MAP: Record<string, string> = {
  food: '🍽️', drinks: '🍺', travel: '✈️', transport: '🚕', other: '📦',
};
export function EmojiIcon({ cat }: { cat: string }) {
  return <span>{EMOJI_MAP[cat] || '📦'}</span>;
}

// avatarColor — детерминированный цвет аватара по числовому userId.
// Обеспечивает: один пользователь → один цвет везде в приложении.
export function avatarColor(userId: number): string {
  const COLORS = ['#2AABEE', '#FF6B6B', '#FFB347', '#4DBFA8', '#9B8DE8', '#F48FB1', '#81C784', '#FFD54F'];
  return COLORS[userId % COLORS.length];
}

// initials — первые буквы для аватара: "Андрей Акимов" → "АА".
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
