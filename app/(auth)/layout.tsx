"use client";

import { usePathname } from "next/navigation";
import PulsingLogo from "@/components/ui/PulsingLogo";

// Deux points de localisation déjà dessinés dans public/banner_login.png (carte du Burkina Faso,
// à gauche de l'image) — positionnés en % pour rester alignés avec l'image en `object-cover`.
const MAP_PULSE_POINTS = [
  { top: "34.3%", left: "23.9%", size: 14 },
  { top: "55.4%", left: "13.6%", size: 11 },
];

function MapPulseDot({ top, left, size }: { top: string; left: string; size: number }) {
  return (
    <span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ top, left, width: size, height: size }}>
      <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300 opacity-75 [animation-duration:1.8s]" />
      <span className="absolute inset-[-6px] rounded-full bg-emerald-300/30 blur-md" />
      <span className="absolute inset-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] ring-2 ring-white/80" />
    </span>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return (
      <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-8">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- image de fond plein cadre, hors pipeline d'optimisation Next/Image */}
          <img src="/banner_login.png" alt="" aria-hidden="true" className="h-full w-full object-cover" />
          {MAP_PULSE_POINTS.map((p, i) => (
            <MapPulseDot key={i} {...p} />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/30" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-3 rounded-xl bg-white/95 px-6 py-4 shadow-lg backdrop-blur-sm">
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
          <div className="flex items-center gap-3 rounded-xl bg-white px-6 py-4 shadow-sm dark:shadow-none">
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
