import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { toCsv } from "@/lib/exports/csv";

export async function GET(request: NextRequest) {
  const { userId, profile } = await requireUser();
  const supabase = await createClient();
  const format = request.nextUrl.searchParams.get("format") ?? "csv";

  const { data, error } = await supabase.from("projects").select("*").is("deleted_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from("activity_log").insert({
    user_id: userId,
    action: "export",
    entity_table: "projects",
    source: format,
    new_value: { role: profile.role, count: data?.length ?? 0 },
  });

  const flatRows = (data ?? []).map((p) => ({
    code: p.code,
    nom: p.name,
    statut: p.status,
    debut: p.start_date,
    fin: p.end_date,
    annee: p.year,
    budget: p.budget,
    devise: p.currency,
  }));

  if (format === "excel") {
    const worksheet = XLSX.utils.json_to_sheet(flatRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Projets");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="projets.xlsx"',
      },
    });
  }

  return new NextResponse(toCsv(flatRows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="projets.csv"' },
  });
}
