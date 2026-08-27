import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="rounded-xl bg-white px-5 py-3 shadow-sm dark:shadow-none">
            <Image
              src="/terrameal-C-logo-horizontal.svg"
              alt="TerraMEAL — La donnée spatiale au service de la redevabilité"
              width={310}
              height={90}
              priority
              className="h-auto w-72"
            />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {children}
        </div>
      </div>
    </div>
  );
}
