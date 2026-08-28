import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  basePath,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && key !== "page") params.set(key, value);
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-slate-400">
        {from}–{to} sur {totalCount.toLocaleString("fr-FR")}
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={hrefFor(Math.max(1, currentPage - 1))}
          aria-disabled={currentPage <= 1}
          aria-label="Page précédente"
          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400 ${
            currentPage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <ChevronLeft size={15} />
        </Link>
        <span className="min-w-[5.5rem] text-center text-xs font-medium text-slate-500">
          Page {currentPage} / {totalPages}
        </span>
        <Link
          href={hrefFor(Math.min(totalPages, currentPage + 1))}
          aria-disabled={currentPage >= totalPages}
          aria-label="Page suivante"
          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400 ${
            currentPage >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
}
