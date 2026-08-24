import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { toCsv } from "@/lib/exports/csv";

// Export des interventions (33). La visibilité des lignes est intégralement gouvernée par
// les policies RLS de la vue interventions_geo — un bailleur/partenaire n'exportera donc que
// ce qu'il est autorisé à voir dans l'application.
export async function GET(request: NextRequest) {
  const { userId, profile } = await requireUser();
  const supabase = await createClient();
  const sp = request.nextUrl.searchParams;
  const format = sp.get("format") ?? "csv";

  let query = supabase.from("interventions_geo").select("*");
  if (sp.get("project")) query = query.eq("project_id", sp.get("project")!);
  if (sp.get("sector")) query = query.eq("sector_id", sp.get("sector")!);
  if (sp.get("zone")) query = query.eq("admin_zone_id", sp.get("zone")!);
  if (sp.get("status")) query = query.eq("validation_status", sp.get("status")!);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from("activity_log").insert({
    user_id: userId,
    action: "export",
    entity_table: "interventions",
    source: format,
    new_value: { role: profile.role, count: data?.length ?? 0, filters: Object.fromEntries(sp.entries()) },
  });

  if (format === "geojson") {
    const geojson = {
      type: "FeatureCollection",
      features: (data ?? [])
        .filter((r) => r.geom_json)
        .map((r) => ({
          type: "Feature",
          geometry: r.geom_json,
          properties: {
            id: r.id,
            name: r.name,
            type: r.type,
            project: r.project_name,
            sector: r.sector_name,
            zone: r.admin_zone_name,
            date: r.date,
            status: r.status,
            validation_status: r.validation_status,
            beneficiaries_total: r.beneficiaries_total,
            source: r.source,
            source_id: r.source_id,
          },
        })),
    };
    return new NextResponse(JSON.stringify(geojson, null, 2), {
      headers: { "Content-Type": "application/geo+json", "Content-Disposition": 'attachment; filename="interventions.geojson"' },
    });
  }

  const flatRows = (data ?? []).map((r) => ({
    id: r.id,
    nom: r.name,
    type: r.type,
    projet: r.project_name,
    secteur: r.sector_name,
    zone: r.admin_zone_name,
    date: r.date,
    statut: r.status,
    statut_validation: r.validation_status,
    beneficiaires: r.beneficiaries_total,
    source: r.source,
    identifiant_source: r.source_id,
    derniere_maj: r.last_updated_at,
  }));

  if (format === "excel") {
    const worksheet = XLSX.utils.json_to_sheet(flatRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Interventions");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="interventions.xlsx"',
      },
    });
  }

  return new NextResponse(toCsv(flatRows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="interventions.csv"' },
  });
}
