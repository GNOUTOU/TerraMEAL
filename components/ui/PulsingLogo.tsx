import Image from "next/image";

// Icône de marque avec halo pulsant — pur CSS (aucun JS), utilisable aussi bien dans un
// composant serveur qu'un composant client.
export default function PulsingLogo({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/50 [animation-duration:2.2s]" />
      <span className="absolute inset-[-4px] rounded-full bg-emerald-400/15 blur-sm" />
      <Image src="/terrameal-mark.svg" alt="TerraMEAL" width={size} height={size} className="relative z-10 drop-shadow" priority />
    </span>
  );
}
