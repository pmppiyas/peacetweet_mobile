import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

interface ScrollExitGestureOptions {
  /** Gesture is only attached while true. */
  enabled: boolean;
  /** Pixels of scroll needed to fully push the viewer off screen. */
  distance: number;
  /** Return true to temporarily ignore wheel / touch input (modals open, etc). */
  isBlocked: () => boolean;
  /** Called every frame with the current progress in pixels (0 → distance). */
  onProgress: (px: number) => void;
  /** Viewer has been pushed fully off screen. */
  onComplete: () => void;
  /** Viewer returned back to its resting position (progress is 0 again). */
  onCancel?: () => void;
  /** User flicked/dragged downward (touch) – dismiss without advancing. */
  onDismissDown?: () => void;
}

/**
 * Facebook-style "scroll to leave" gesture for the full screen photo viewer.
 *
 * - The viewer follows the mouse wheel / finger 1:1 (as much as you scroll,
 *   that much it moves) and is smoothed with a per-frame ease so it never
 *   jumps, even with notched mouse wheels.
 * - The viewer is *not* snapped back after a mouse wheel scroll – it stays
 *   exactly where you left it, like a continuous page. It only auto-finishes
 *   once it is almost gone.
 * - Touch drags follow the finger and snap on release (distance / velocity).
 */
export function useScrollExitGesture(options: ScrollExitGestureOptions) {
  const optsRef = useRef(options);
  optsRef.current = options;

  const { enabled } = options;

  useEffect(() => {
    if (!enabled || Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const D = () => Math.max(1, optsRef.current.distance);

    let target = 0;
    let current = 0;
    let raf = 0;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let settling = false;
    let finished = false;
    let touching = false;

    const tick = () => {
      raf = 0;
      if (finished) return;

      const diff = target - current;
      if (touching) {
        current = target;
      } else if (Math.abs(diff) <= 0.5) {
        current = target;
      } else {
        const minStep = settling ? 14 : 2;
        const step = Math.max(Math.abs(diff) * (settling ? 0.24 : 0.28), minStep);
        current += Math.sign(diff) * Math.min(step, Math.abs(diff));
      }

      optsRef.current.onProgress(current);

      if (current >= D() - 0.5 && target >= D() - 0.5) {
        finished = true;
        optsRef.current.onComplete();
        return;
      }

      if (settling && target === 0 && current <= 0.5) {
        settling = false;
        current = 0;
        optsRef.current.onProgress(0);
        optsRef.current.onCancel?.();
        return;
      }

      if (current !== target) {
        raf = requestAnimationFrame(tick);
      }
    };

    const kick = () => {
      if (!raf && !finished) raf = requestAnimationFrame(tick);
    };

    const clearIdle = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (finished || optsRef.current.isBlocked()) return;

      // Downward wheel scroll from resting position dismisses down
      if (e.deltaY < -20 && current <= 5) {
        finished = true;
        optsRef.current.onDismissDown?.();
        return;
      }

      if (e.cancelable) e.preventDefault();

      clearIdle();
      settling = false;

      // Accumulate smooth scroll upward
      target = Math.min(D(), Math.max(0, target + e.deltaY * 0.7));
      kick();

      // If user deliberately scrolls past threshold (100px), complete exit to feed
      if (target >= Math.min(110, D() * 0.18)) {
        finished = true;
        optsRef.current.onComplete();
        return;
      }

      // If stopped scrolling before threshold, smoothly return to 0 (resting view)
      idleTimer = setTimeout(() => {
        if (!finished && target < 110) {
          settling = true;
          target = 0;
          kick();
        }
      }, 350);
    };

    // Touch: follow finger, snap on release.
    let startY = 0;
    let startX = 0;
    let startProgress = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0; // px / ms, positive = moving viewer away (swipe up)
    let dragging = false;
    let rawDy = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (finished || optsRef.current.isBlocked()) return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.closest('button') ||
          el.closest('[role="button"]') ||
          el.closest('a') ||
          el.closest('[data-clickable="true"]'))
      ) {
        return;
      }
      if (e.touches.length !== 1) return;
      startY = lastY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      startProgress = current;
      lastT = performance.now();
      velocity = 0;
      rawDy = 0;
      dragging = false;
      touching = true;
      settling = false;
      clearIdle();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touching || finished || e.touches.length !== 1) return;
      const y = e.touches[0].clientY;
      const x = e.touches[0].clientX;
      const dy = y - startY;
      const dx = x - startX;

      if (!dragging) {
        if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 1.3) {
          dragging = true;
        } else {
          return;
        }
      }
      if (e.cancelable) e.preventDefault();

      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      velocity = (lastY - y) / dt;
      lastY = y;
      lastT = now;

      rawDy = dy;
      target = Math.min(D(), Math.max(0, startProgress - dy));
      kick();
    };

    const onTouchEnd = () => {
      if (!touching) return;
      touching = false;
      if (!dragging || finished) return;
      dragging = false;

      // Downward swipe dismisses
      if (rawDy > 40 && velocity < -0.25) {
        finished = true;
        optsRef.current.onDismissDown?.();
        return;
      }

      // Upward swipe > 50px or quick flick exits to feed
      if (-rawDy > 50 || velocity > 0.3 || target > D() * 0.16) {
        finished = true;
        optsRef.current.onComplete();
        return;
      }

      // Minor drag under threshold -> smoothly spring back to resting view
      settling = true;
      target = 0;
      kick();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      if (raf) cancelAnimationFrame(raf);
      clearIdle();
    };
  }, [enabled]);
}
