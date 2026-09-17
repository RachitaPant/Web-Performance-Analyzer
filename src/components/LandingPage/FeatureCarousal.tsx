"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Zap,
  Shield,
  Clock,
  Gauge,
  Sparkles,
  Layers,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  tint: string;
};

const FEATURES: Feature[] = [
  {
    icon: Zap,
    title: "Comprehensive audits",
    description:
      "Run a structured performance audit against any public URL and get the full Lighthouse picture back.",
    tint: "from-blue-500/20 to-blue-900/5",
  },
  {
    icon: Shield,
    title: "Core Web Vitals",
    description:
      "LCP, CLS, TBT and INP tracked together, with the thresholds Google actually ranks against.",
    tint: "from-cyan-500/20 to-blue-900/5",
  },
  {
    icon: Clock,
    title: "Bottleneck detection",
    description:
      "See which scripts, images and third-party requests are holding up the render.",
    tint: "from-purple-500/20 to-blue-900/5",
  },
  {
    icon: Gauge,
    title: "Optimization opportunities",
    description:
      "Every finding comes with the milliseconds you stand to win back by fixing it.",
    tint: "from-pink-500/20 to-blue-900/5",
  },
  {
    icon: Sparkles,
    title: "Prioritized findings",
    description:
      "Ordered by impact, so you start with the fix that moves the score most.",
    tint: "from-fuchsia-500/20 to-blue-900/5",
  },
  {
    icon: Layers,
    title: "Developer-ready reports",
    description:
      "Concrete diagnostics with file names and selectors, not vague advice.",
    tint: "from-indigo-500/20 to-blue-900/5",
  },
];

/* Arc geometry */
const RADIUS = 620; // distance from the virtual pivot to each card
const STEP = 16; // degrees between cards
const DRAG_SENSITIVITY = 0.09; // degrees per pixel dragged
const FRICTION = 0.94;
const SNAP_STRENGTH = 0.12;

export default function FeatureCarousel() {
  // rotation is measured in "card units", not degrees
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const pointerRef = useRef<{ id: number; x: number; moved: boolean } | null>(
    null,
  );
  const frameRef = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const maxIndex = FEATURES.length - 1;

  const clamp = (v: number) => Math.max(0, Math.min(maxIndex, v));

  const commit = useCallback((next: number) => {
    rotationRef.current = next;
    setRotation(next);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /* Inertia + snap loop, runs only while it has work to do */
  const startLoop = useCallback(() => {
    if (frameRef.current !== null) return;

    const tick = () => {
      const current = rotationRef.current;
      const target = clamp(Math.round(current));
      const distance = target - current;

      velocityRef.current *= FRICTION;
      velocityRef.current += distance * SNAP_STRENGTH;

      const next = clamp(current + velocityRef.current);

      const settled =
        Math.abs(velocityRef.current) < 0.0005 && Math.abs(distance) < 0.0015;

      if (settled) {
        velocityRef.current = 0;
        commit(target);
        frameRef.current = null;
        return;
      }

      commit(next);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [commit, maxIndex]);

  const stopLoop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  useEffect(() => stopLoop, [stopLoop]);

  const goTo = useCallback(
    (index: number) => {
      velocityRef.current = 0;
      if (reducedMotion) {
        commit(clamp(index));
        return;
      }
      rotationRef.current = rotationRef.current; // keep current, let loop ease in
      velocityRef.current = 0;
      commit(rotationRef.current);
      // nudge toward the target by overriding the snap target
      const target = clamp(index);
      const animateTo = () => {
        const current = rotationRef.current;
        const delta = target - current;
        if (Math.abs(delta) < 0.002) {
          commit(target);
          frameRef.current = null;
          return;
        }
        commit(current + delta * 0.18);
        frameRef.current = requestAnimationFrame(animateTo);
      };
      stopLoop();
      frameRef.current = requestAnimationFrame(animateTo);
    },
    [commit, reducedMotion, stopLoop, maxIndex],
  );

  /* Pointer handling */
  const onPointerDown = (e: React.PointerEvent) => {
    stopLoop();
    velocityRef.current = 0;
    pointerRef.current = { id: e.pointerId, x: e.clientX, moved: false };
    setDragging(true);
    trackRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== e.pointerId) return;

    const dx = e.clientX - pointer.x;
    if (Math.abs(dx) > 3) pointer.moved = true;
    pointer.x = e.clientX;

    const deltaUnits = (-dx * DRAG_SENSITIVITY) / STEP;
    velocityRef.current = deltaUnits;
    commit(clamp(rotationRef.current + deltaUnits));
  };

  const endDrag = (e: React.PointerEvent) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== e.pointerId) return;
    pointerRef.current = null;
    setDragging(false);
    trackRef.current?.releasePointerCapture?.(e.pointerId);

    // carry the last movement into inertia
    velocityRef.current *= 8;
    if (reducedMotion) {
      commit(clamp(Math.round(rotationRef.current)));
      return;
    }
    startLoop();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(Math.round(rotationRef.current) - 1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(Math.round(rotationRef.current) + 1);
    }
  };

  const activeIndex = Math.round(rotation);

  return (
    <section className="relative py-24">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <h2 className="text-4xl font-bold tracking-tight">
          Everything the audit gives you
        </h2>
        <p className="text-gray-400 mt-3 max-w-xl">
          Drag the deck sideways, or use the arrow keys, to move through what
          SitePulse reports back.
        </p>
      </div>

      {/* Stage */}
      <div
        ref={trackRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="SitePulse features"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className={`relative h-[430px] w-full overflow-hidden touch-pan-y select-none outline-none
          focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020e1d]
          ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{ perspective: "1600px" }}
      >
        {/* edge fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 z-30 bg-gradient-to-r from-[#020e1d] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 z-30 bg-gradient-to-l from-[#020e1d] to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center">
          {FEATURES.map((feature, i) => {
            const offset = i - rotation;
            const angle = offset * STEP;
            const rad = (angle * Math.PI) / 180;

            const x = Math.sin(rad) * RADIUS;
            const y = (1 - Math.cos(rad)) * RADIUS * 0.55;
            const distance = Math.abs(offset);

            const scale = Math.max(0.72, 1 - distance * 0.08);
            const opacity = Math.max(0, 1 - distance * 0.28);
            const zIndex = 20 - Math.round(distance * 2);
            const isActive = Math.round(rotation) === i;

            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                aria-hidden={opacity < 0.15}
                className="absolute w-[280px] sm:w-[300px] will-change-transform"
                suppressHydrationWarning
                style={{
                  transform: `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg) scale(${scale})`,
                  opacity,
                  zIndex,
                }}
              >
                <div
                  className={`relative h-[330px] rounded-[22px] border p-6 flex flex-col
                    bg-gradient-to-b ${feature.tint}
                    backdrop-blur-xl transition-[border-color,box-shadow] duration-300
                    ${
                      isActive
                        ? "border-pink-400/40 shadow-[0_0_60px_-12px_rgba(236,72,153,0.45)]"
                        : "border-blue-400/15 shadow-[0_18px_40px_-20px_rgba(2,14,29,0.9)]"
                    }`}
                >
                  {/* inner sheen */}
                  <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[radial-gradient(120%_70%_at_50%_0%,rgba(255,255,255,0.10),transparent_60%)]" />

                  <div
                    className={`relative w-11 h-11 rounded-xl flex items-center justify-center mb-6 border
                      ${
                        isActive
                          ? "border-pink-400/40 bg-pink-500/15 text-pink-300"
                          : "border-blue-400/25 bg-blue-500/10 text-blue-300"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="relative text-lg font-semibold leading-snug mb-3">
                    {feature.title}
                  </h3>

                  <p className="relative text-sm text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="relative mt-auto pt-5 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      {String(i + 1).padStart(2, "0")} of{" "}
                      {String(FEATURES.length).padStart(2, "0")}
                    </span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? "bg-pink-400" : "bg-blue-400/40"
                      }`}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {FEATURES.map((feature, i) => (
          <button
            key={feature.title}
            onClick={() => goTo(i)}
            aria-label={`Show ${feature.title}`}
            aria-current={activeIndex === i}
            className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-blue-400/60
              ${
                activeIndex === i
                  ? "w-8 bg-pink-500"
                  : "w-1.5 bg-blue-400/30 hover:bg-blue-400/60"
              }`}
          />
        ))}
      </div>
    </section>
  );
}
