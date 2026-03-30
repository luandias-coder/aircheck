"use client";
import { useRef, useCallback, useEffect, ReactNode, useState } from "react";

interface Props {
  onBack: () => void;
  children: ReactNode;
  threshold?: number;
  enabled?: boolean;
}

export default function SwipeBack({ onBack, children, threshold = 80, enabled = true }: Props) {
  const startX = useRef(0);
  const startY = useRef(0);
  const direction = useRef<"h" | "v" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const triggered = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    direction.current = null;
    triggered.current = false;
  }, [enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || triggered.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Lock direction on first significant movement
    if (direction.current === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      direction.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }
    if (direction.current !== "h") return;

    // Swipe left → right (dx positive) = back
    if (dx > 0) {
      const distance = Math.min(dx * 0.45, 160);
      setOffsetX(distance);
      setSwiping(true);
      if (distance > 15) e.preventDefault();
    }
  }, [enabled]);

  const handleTouchEnd = useCallback(() => {
    if (!swiping || triggered.current) return;

    if (offsetX >= threshold) {
      triggered.current = true;
      // Animate out to the right
      setOffsetX(350);
      setTimeout(() => {
        onBack();
        setOffsetX(0);
        setSwiping(false);
      }, 180);
    } else {
      setOffsetX(0);
      setSwiping(false);
    }
    direction.current = null;
  }, [swiping, offsetX, threshold, onBack]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(offsetX / threshold, 1);

  return (
    <div ref={containerRef} style={{ position: "relative", overflow: "hidden" }}>
      {/* Back arrow indicator on left edge */}
      {swiping && offsetX > 15 && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: 8,
          transform: "translateY(-50%)",
          zIndex: 30, pointerEvents: "none",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: `rgba(59,95,229,${0.08 + progress * 0.12})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: `scale(${0.6 + progress * 0.4})`,
            transition: swiping ? "none" : "all 0.2s ease",
            boxShadow: progress > 0.8 ? "0 2px 8px rgba(59,95,229,0.2)" : "none",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={`rgba(59,95,229,${0.4 + progress * 0.6})`}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </div>
        </div>
      )}

      {/* Content slides right */}
      <div style={{
        transform: offsetX ? `translateX(${offsetX}px)` : "none",
        transition: swiping ? "none" : "transform 0.22s ease-out",
        willChange: swiping ? "transform" : "auto",
      }}>
        {children}
      </div>
    </div>
  );
}
