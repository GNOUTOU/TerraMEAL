export default function AppLoading() {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600 dark:border-slate-800 dark:border-t-emerald-500" />
      </div>
      <p className="text-xs font-medium text-slate-400">Chargement...</p>
    </div>
  );
}
