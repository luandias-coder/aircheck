"use client";
import { useState, useRef, useCallback, useEffect, ReactNode } from "react";

interface Props {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  maxPull?: number;
}

export default function PullToRefresh({ onRefresh, children, threshold = 80, maxPull = 120 }: Props) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const canPull = useCallback(() => window.scrollY <= 0, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!canPull() || refreshing) return;
    startY.current = e.touches[0].clientY;
  }, [canPull, refreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && canPull()) {
      const distance = Math.min(diff * 0.5, maxPull);
      setPullDistance(distance);
      setPulling(true);
      if (distance > 10) e.preventDefault();
    }
  }, [canPull, maxPull, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    if (pullDistance >= threshold) {
      setRefreshing(true);
      setPullDistance(threshold * 0.6);
      try { await onRefresh(); } catch (e) { console.error(e); }
      setRefreshing(false);
    }
    setPullDistance(0);
    setPulling(false);
  }, [pulling, pullDistance, threshold, onRefresh]);

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

  const progress = Math.min(pullDistance / threshold, 1);
  const show = pullDistance > 10 || refreshing;
  const h = pullDistance || (refreshing ? threshold * 0.6 : 0);

  return (
    <div ref={containerRef} style={{ position: "relative", minHeight: "100%" }}>
      {/* Spinner area */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        display: "flex", justifyContent: "center", alignItems: "center",
        height: h, overflow: "hidden",
        transition: pulling ? "none" : "height 0.3s ease",
        zIndex: 10, pointerEvents: "none",
      }}>
        {show && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            style={{
              transform: refreshing ? "none" : `rotate(${progress * 360}deg)`,
              transition: pulling ? "none" : "transform 0.3s ease",
              animation: refreshing ? "ptr-spin 0.8s linear infinite" : "none",
            }}>
            <circle cx="12" cy="12" r="9" stroke="#3B5FE5" strokeWidth="2.5" fill="none"
              strokeDasharray={refreshing ? "20 56.5" : `${progress * 56.5} 56.5`}
              strokeLinecap="round" opacity={refreshing ? 1 : progress} />
          </svg>
        )}
      </div>

      {/* Content pushed down */}
      <div style={{
        transform: `translateY(${h}px)`,
        transition: pulling ? "none" : "transform 0.3s ease",
      }}>
        {children}
      </div>

      <style>{`@keyframes ptr-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
