import PulsingLogo from "@/components/ui/PulsingLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
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
