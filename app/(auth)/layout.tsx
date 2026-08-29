"use client";

import { usePathname } from "next/navigation";
import PulsingLogo from "@/components/ui/PulsingLogo";

// Les deux pins déjà dessinés dans public/banner_login.png, sur la carte du Burkina Faso à
// gauche (image 1860×845 — ratio 2.2:1). L'image de fond est affichée en `object-cover` calée à
// gauche ("object-position: left"), ce qui, pour tout viewport moins large que ce ratio (le cas
// quasi général), met l'échelle à l'échelle de la hauteur : le point image (fx, fy) — fractions
// 0..1 — retombe donc exactement sur `top: fy*100vh` / `left: fx*imgAspect*100vh`, indépendamment
// de la largeur d'écran. Coordonnées lues directement sur le fichier source.
const IMG_ASPECT = 1860 / 845;
const MAP_PINS = [
  { fx: 0.239, fy: 0.343, color: "emerald", size: 20 },
  { fx: 0.136, fy: 0.554, color: "amber", size: 16 },
] as const;

const PIN_COLORS = {
  emerald: { ring: "bg-emerald-400", glow: "bg-emerald-300/40", core: "bg-emerald-500", shadow: "0 0 10px rgba(16,185,129,0.9)" },
  amber: { ring: "bg-amber-400", glow: "bg-amber-300/40", core: "bg-amber-500", shadow: "0 0 10px rgba(245,158,11,0.9)" },
};

function MapPulsePin({ fx, fy, color, size }: { fx: number; fy: number; color: keyof typeof PIN_COLORS; size: number }) {
  const c = PIN_COLORS[color];
  return (
    <span
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{ top: `${fy * 100}vh`, left: `${fx * IMG_ASPECT * 100}vh`, width: size, height: size }}
    >
      <span className={`absolute inset-0 animate-ping rounded-full ${c.ring} opacity-75 [animation-duration:1.6s]`} />
      <span className={`absolute -inset-2 rounded-full ${c.glow} blur-md`} />
      <span className={`absolute inset-0 rounded-full ${c.core} ring-2 ring-white/90`} style={{ boxShadow: c.shadow }} />
    </span>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return (
      <div className="relative flex min-h-screen flex-1 items-center justify-center px-4 py-8">
        <div className="fixed inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- image de fond plein cadre, hors pipeline d'optimisation Next/Image */}
          <img src="/banner_login.png" alt="" aria-hidden="true" className="h-full w-full object-cover object-left" />
          {MAP_PINS.map((p, i) => (
            <MapPulsePin key={i} {...p} />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/30" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-3 overflow-hidden rounded-xl bg-white/95 px-6 py-4 shadow-lg backdrop-blur-sm">
              <PulsingLogo size={48} />
              <div>
                <p className="text-2xl font-bold tracking-tight text-[#0B4F6C]">
                  Terra<span className="text-[#17A398]">MEAL</span>
                </p>
                <p className="text-xs font-medium text-slate-500">La donnée spatiale au service de la redevabilité</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/40 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-3 overflow-hidden rounded-xl bg-white px-6 py-4 shadow-sm dark:shadow-none">
            <PulsingLogo size={48} />
            <div>
              <p className="text-2xl font-bold tracking-tight text-[#0B4F6C]">
                Terra<span className="text-[#17A398]">MEAL</span>
              </p>
              <p className="text-xs font-medium text-slate-500">La donnée spatiale au service de la redevabilité</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {children}
        </div>
      </div>
    </div>
  );
}
