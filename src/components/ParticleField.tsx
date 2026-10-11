"use client";

import { useEffect, useRef } from "react";

/**
 * Background particle field using the vendored particles.js library
 * (see `particles.js-master/`, MIT, Vincent Garreau). The min build is copied
 * to `public/particles.min.js` and loaded as a plain script, because the
 * library is a browser global (`window.particlesJS`) rather than an ES module.
 */

/** Ceiling on spawned particles — see `capPush`. */
const MAX_PARTICLES = 240;

interface PJSInstance {
  pJS?: {
    canvas?: { el?: HTMLCanvasElement | null };
    particles?: { array?: unknown[] };
    fn?: {
      drawAnimFrame?: number;
      modes?: { pushParticles?: (nb: number, pos?: unknown) => void };
    };
  };
}

declare global {
  interface Window {
    particlesJS?: (tagId: string, params: unknown) => void;
    pJSDom?: PJSInstance[];
  }
}

const PARTICLE_CONFIG = {
  particles: {
    number: { value: 90, density: { enable: true, value_area: 900 } },
    // Theme palette: light violet → strong purple → sky blue → cyan.
    color: { value: ["#c4b5fd", "#a78bfa", "#8b5cf6", "#7dd3fc", "#67e8f9"] },
    // "circle" is listed twice so most particles stay round and only the
    // occasional one reads as a sparkle, instead of an even 50/50 mix.
    shape: { type: ["circle", "circle", "star"], stroke: { width: 0, color: "#000000" } },
    // Slow twinkle (`speed` is tiny) gives the field depth without the
    // distracting blink you get from fast opacity animation.
    opacity: {
      value: 0.65,
      random: true,
      anim: { enable: true, speed: 0.5, opacity_min: 0.12, sync: false },
    },
    // Finer, more varied dots read as a distant starfield up close.
    size: { value: 2.6, random: true, anim: { enable: false } },
    line_linked: {
      enable: true,
      distance: 130,
      color: "#8b5cf6",
      opacity: 0.18,
      width: 1,
    },
    move: {
      enable: true,
      // Calmer drift: the old speed (4) raced across the screen and made
      // the links flicker instead of float.
      speed: 1.6,
      direction: "none",
      random: true,
      straight: false,
      out_mode: "out",
      bounce: false,
    },
  },
  interactivity: {
    // The canvas sits behind content with `pointer-events: none`, so events
    // must be detected on the window — otherwise nothing would ever fire.
    detect_on: "window",
    events: {
      onhover: { enable: true, mode: "repulse" },
      onclick: { enable: true, mode: "push" },
      resize: true,
    },
    modes: {
      grab: { distance: 400, line_linked: { opacity: 1 } },
      bubble: { distance: 400, size: 40, duration: 2, opacity: 0.8, speed: 3 },
      repulse: { distance: 140, duration: 0.45 },
      push: { particles_nb: 4 },
      remove: { particles_nb: 2 },
    },
  },
  retina_detect: true,
} as const;

/** Stop every running instance and drop its canvas. */
function destroyAllInstances() {
  const instances = window.pJSDom;
  if (!Array.isArray(instances)) return;

  for (const instance of instances) {
    const drawId = instance?.pJS?.fn?.drawAnimFrame;
    if (typeof drawId === "number") {
      window.cancelAnimationFrame(drawId);
    }
    instance?.pJS?.canvas?.el?.remove();
  }

  // The library's own `destroypJS()` does `pJSDom = null`, which breaks the
  // next init, so reset to a fresh array instead.
  window.pJSDom = [];
}

/**
 * particles.js' click-to-spawn mode (`push`) appends particles with no upper
 * bound, so every click on the admin forms would grow the field forever.
 * Wrap the mode so the demo behaviour stays, but only up to `MAX_PARTICLES`.
 */
function capPush(instance: PJSInstance) {
  const modes = instance.pJS?.fn?.modes;
  const original = modes?.pushParticles;
  if (!modes || typeof original !== "function") return;

  modes.pushParticles = function (nb, pos) {
    const current = instance.pJS?.particles?.array?.length ?? 0;
    if (current >= MAX_PARTICLES) return;
    original.call(this, Math.min(nb, MAX_PARTICLES - current), pos);
  };
}

export function ParticleField() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Honour the OS reduced-motion setting: skip the field entirely.
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    const init = () => {
      // React StrictMode mounts effects twice in dev; destroy first so we
      // never end up with two animation loops on the same container.
      destroyAllInstances();
      window.particlesJS?.(container.id, PARTICLE_CONFIG);

      const created = window.pJSDom?.[window.pJSDom.length - 1];
      if (created) capPush(created);
    };

    // Reuse the script if it is already on the page (e.g. a later remount).
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-particles-src="/particles.min.js"]',
    );

    if (existing) {
      if (window.particlesJS) init();
      else existing.addEventListener("load", init, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = "/particles.min.js";
      script.dataset.particlesSrc = "/particles.min.js";
      script.async = true;
      script.addEventListener("load", init, { once: true });
      document.body.appendChild(script);
    }

    return () => {
      destroyAllInstances();
      // Keep the script tag: it is harmless and avoids re-downloading on
      // navigation. Only the animation loop and canvas are torn down.
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="particle-field"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-1"
    >
      {/* particles.js injects <canvas class="particles-js-canvas-el"> here. */}
    </div>
  );
}
