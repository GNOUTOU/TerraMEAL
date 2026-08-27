import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import SectionTitle from "@/components/ui/SectionTitle";
import { ROLE_LABELS } from "@/lib/types";
import UpdatePasswordInline from "./UpdatePasswordInline";
import { UserCircle, IdCard, KeyRound } from "lucide-react";

export default async function ProfilePage() {
  const { profile } = await requireUser();

  return (
    <div>
      <PageHeader title="Mon profil" icon={UserCircle} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={IdCard} className="mb-3">Informations</SectionTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Nom</dt>
              <dd className="text-slate-700 dark:text-slate-200">{profile.full_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">E-mail</dt>
              <dd className="text-slate-700 dark:text-slate-200">{profile.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Rôle</dt>
              <dd className="text-slate-700 dark:text-slate-200">{ROLE_LABELS[profile.role]}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Organisation</dt>
              <dd className="text-slate-700 dark:text-slate-200">{profile.organization ?? "—"}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <SectionTitle icon={KeyRound} className="mb-3">Changer de mot de passe</SectionTitle>
          <UpdatePasswordInline />
        </Card>
      </div>
    </div>
  );
}
