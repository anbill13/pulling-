/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';

export type HapticType = 'gift' | 'combo' | 'redLight' | 'tap' | 'error' | 'sync' | 'win';

// Vibration patterns in milliseconds [vibrate, pause, vibrate, ...]
const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  tap: 15, // Subtle tick for likes/taps
  gift: [40, 30, 60], // Joyful two-beat vibration for sending gifts
  combo: [30, 20, 30, 20, 70], // Dynamic triple pulse for combo milestones
  redLight: [120, 60, 180], // Strong warning pulse when Red Light begins
  sync: [50, 40, 50, 40, 80], // Synchrony wave
  win: [100, 50, 100, 50, 250], // Triumphant celebration pulse
  error: [80, 50, 80], // Warning buzz
};

/**
 * Hook that uses navigator.vibrate API to provide tactile haptic feedback
 * for mobile users when they perform successful interactions like sending a gift,
 * reaching a combo milestone, or when a red light begins, ensuring it respects
 * the prefers-reduced-motion setting.
 */
export function useHaptics() {
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [hasVibrationSupport, setHasVibrationSupport] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleChange);
      return () => (mediaQuery as any).removeListener(handleChange);
    }
  }, []);

  const trigger = useCallback(
    (type: HapticType = 'tap') => {
      // Respect user's accessibility preference: no haptic buzz if prefers-reduced-motion is enabled
      if (reducedMotion) return false;
      if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;

      try {
        const pattern = HAPTIC_PATTERNS[type] ?? 20;
        return navigator.vibrate(pattern);
      } catch (err) {
        // Fallback gracefully on environments where vibration is restricted
        return false;
      }
    },
    [reducedMotion]
  );

  return {
    trigger,
    reducedMotion,
    hasVibrationSupport,
    triggerGift: useCallback(() => trigger('gift'), [trigger]),
    triggerCombo: useCallback(() => trigger('combo'), [trigger]),
    triggerRedLight: useCallback(() => trigger('redLight'), [trigger]),
    triggerSync: useCallback(() => trigger('sync'), [trigger]),
    triggerTap: useCallback(() => trigger('tap'), [trigger]),
    triggerWin: useCallback(() => trigger('win'), [trigger]),
  };
}
