"use client";

import { useRouter } from "next/navigation";

export default function DonorSelect({ donors, current }: { donors: { id: string; name: string }[]; current: string }) {
  const router = useRouter();
  return (
    <select
      defaultValue={current}
      onChange={(e) => router.push(`/donor?donor=${e.target.value}`)}
      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
    >
      {donors.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </select>
  );
}
