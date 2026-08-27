import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  MapPinned,
  Gauge,
  UploadCloud,
  ShieldCheck,
  LayoutDashboard,
  FolderKanban,
  Layers,
  Lock,
  ScrollText,
  Server,
  KeyRound,
  Globe2,
  CheckCircle2,
  FileSpreadsheet,
  Smartphone,
  Droplets,
  FileText,
  Database,
  FileCheck2,
  ShieldAlert,
  PackageCheck,
  HandCoins,
  Handshake,
  Users,
  Building2,
} from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroMockup from "@/components/landing/HeroMockup";
import RevealOnScroll from "@/components/landing/RevealOnScroll";

const MODULES = [
  {
    icon: MapPinned,
    title: "Carte interactive (WebGIS)",
    description:
      "Visualisez chaque intervention, infrastructure et activité sur une carte unique : couches, filtres combinés, recherche géographique et fiches contextuelles.",
  },
  {
    icon: FolderKanban,
    title: "Suivi de projets & réalisations",
    description:
      "Fiches projet complètes — financement, zones de couverture, secteurs, partenaires — reliées à chaque réalisation terrain géolocalisée.",
  },
  {
    icon: Gauge,
    title: "Indicateurs & tableaux de bord",
    description:
      "Référentiel d'indicateurs, cibles vs réalisé, taux d'atteinte et KPI consolidés, filtrables par projet, secteur, bailleur ou zone.",
  },
  {
    icon: UploadCloud,
    title: "Import & synchronisation",
    description:
      "Connecteurs KoboToolbox et mWater, import CSV/Excel/GeoJSON avec correspondance de champs et prévisualisation avant intégration.",
  },
  {
    icon: ShieldCheck,
    title: "Contrôle qualité",
    description:
      "Détection automatique des anomalies GPS, doublons, champs manquants et données obsolètes — avec workflow de traitement tracé.",
  },
  {
    icon: Lock,
    title: "Sécurité & gouvernance",
    description:
      "Accès aux données gouverné ligne par ligne selon le rôle de chaque utilisateur, avec journal d'activité complet sur les opérations sensibles.",
  },
];

const PIPELINE = [
  { icon: Database, label: "SOURCE", desc: "Kobo, mWater, fichiers" },
  { icon: FileText, label: "RAW", desc: "Copie fidèle, jamais modifiée" },
  { icon: Layers, label: "STAGING", desc: "Nettoyage & normalisation" },
  { icon: ShieldAlert, label: "VALIDATION", desc: "Contrôle qualité & revue" },
  { icon: PackageCheck, label: "PRODUCTION", desc: "Donnée publiable" },
];

const ROLES = [
  { icon: KeyRound, title: "Administrateur", desc: "Utilisateurs, référentiels, sources et paramètres généraux." },
  { icon: ShieldCheck, title: "MEAL / SIG", desc: "Import, contrôle qualité, validation et analyse cartographique." },
  { icon: FolderKanban, title: "Responsable Programme", desc: "Suivi et mise à jour des projets qui lui sont attribués." },
  { icon: Building2, title: "Direction", desc: "Vue consolidée du portefeuille, indicateurs et cartographie institutionnelle." },
  { icon: HandCoins, title: "Bailleur", desc: "Accès filtré aux projets financés, données validées uniquement." },
  { icon: Handshake, title: "Partenaire", desc: "Consultation des interventions liées à sa mise en œuvre." },
];

const SECURITY_POINTS = [
  { icon: ShieldCheck, text: "Contrôle d'accès ligne par ligne (RLS) selon le rôle et le périmètre projet" },
  { icon: ScrollText, text: "Journal d'activité : qui a fait quoi, quand, sur quelle donnée" },
  { icon: Server, text: "Séparation stricte RAW / STAGING / PRODUCTION" },
  { icon: Lock, text: "Données sensibles jamais exposées aux vues publiques ou externes" },
  { icon: FileCheck2, text: "Sauvegardes régulières et procédure de restauration" },
  { icon: Globe2, text: "HTTPS de bout en bout, portail public strictement opt-in" },
];

const SOURCES = [
  { icon: Smartphone, label: "KoboToolbox" },
  { icon: Droplets, label: "mWater" },
  { icon: FileSpreadsheet, label: "Excel / CSV" },
  { icon: Layers, label: "Fichiers SIG" },
  { icon: FileText, label: "Rapports" },
];

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-white dark:bg-slate-950">
      <LandingHeader />

      {/* ---------- Hero ---------- */}
      <section className="relative isolate px-4 pb-20 pt-16 md:px-8 md:pb-28 md:pt-20">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="animate-blob absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-600/20" />
          <div className="animate-blob-delay absolute -right-24 top-32 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl dark:bg-blue-600/15" />
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Plateforme WebSIG institutionnelle — usage interne
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1] dark:text-white">
              La donnée spatiale au service de <span className="text-emerald-600">la redevabilité</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              TerraMEAL centralise les données de vos projets, cartographie vos interventions et fiabilise votre
              reporting — un référentiel institutionnel unique, entre la collecte terrain et la prise de décision.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-600/35"
              >
                Se connecter <ArrowRight size={16} />
              </Link>
              <Link
                href="/public"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Explorer le portail public
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Accès réservé aux équipes autorisées — les comptes sont créés par un administrateur TerraMEAL.
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ---------- Problème / convergence des sources ---------- */}
      <section className="border-y border-slate-100 bg-slate-50 px-4 py-16 md:px-8 dark:border-slate-900 dark:bg-slate-900/40">
        <div className="mx-auto max-w-5xl text-center">
          <RevealOnScroll>
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl dark:text-white">
              Vos données sont dispersées. Elles ne devraient plus l&apos;être.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-500 dark:text-slate-400">
              KoboToolbox, mWater, fichiers Excel, exports SIG, rapports internes — TerraMEAL n&apos;ajoute pas une
              source de plus : il les rassemble en un référentiel unique, contrôlé et exploitable.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={120}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              {SOURCES.map((s, i) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <s.icon size={18} className="text-slate-400" />
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{s.label}</span>
                  </div>
                  {i < SOURCES.length - 1 && <ArrowRight size={14} className="hidden text-slate-300 sm:block dark:text-slate-700" />}
                </div>
              ))}
              <ArrowRight size={16} className="text-slate-300 dark:text-slate-700" />
              <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/40">
                <Image src="/terrameal-mark.svg" alt="" width={22} height={22} />
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">TerraMEAL</span>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ---------- Modules ---------- */}
      <section id="modules" className="px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Modules</span>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl dark:text-white">
              Un outil WebSIG, un outil MEAL, un outil de reporting
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Chaque module répond à un besoin concret des équipes projet, MEAL et direction — reliés entre eux par
              la même base institutionnelle.
            </p>
          </RevealOnScroll>

          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m, i) => (
              <RevealOnScroll key={m.title} delay={i * 80}>
                <div className="group h-full rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-900">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950 dark:text-emerald-400">
                    <m.icon size={20} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{m.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{m.description}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Pipeline qualité ---------- */}
      <section id="pipeline" className="border-y border-slate-100 bg-slate-50 px-4 py-20 md:px-8 md:py-28 dark:border-slate-900 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Qualité des données</span>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl dark:text-white">
              De la donnée brute à la donnée publiable
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Aucune donnée importée n&apos;est publiée sans contrôle. Chaque enregistrement suit un pipeline
              traçable, du système source jusqu&apos;à la production.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <div className="relative mt-16 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-5 sm:gap-y-0">
              <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent sm:block dark:via-slate-700" />
              {PIPELINE.map((step) => (
                <div key={step.label} className="relative flex flex-col items-center text-center">
                  <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-slate-50 bg-white text-emerald-600 shadow-md dark:border-slate-900 dark:bg-slate-800 dark:text-emerald-400">
                    <step.icon size={19} />
                  </div>
                  <p className="mt-3 text-xs font-bold tracking-wide text-slate-800 dark:text-slate-100">{step.label}</p>
                  <p className="mt-1 max-w-[9rem] text-[11px] text-slate-500 dark:text-slate-400">{step.desc}</p>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ---------- Gouvernance / rôles ---------- */}
      <section id="gouvernance" className="px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Gouvernance</span>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl dark:text-white">
              Chaque rôle voit exactement ce qu&apos;il doit voir
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Les permissions ne sont pas une couche ajoutée : elles sont appliquées au niveau de la base de données,
              ligne par ligne, pour chacun des six profils de la plateforme.
            </p>
          </RevealOnScroll>

          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((r, i) => (
              <RevealOnScroll key={r.title} delay={i * 70}>
                <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <r.icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{r.desc}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Sécurité ---------- */}
      <section className="border-y border-slate-100 bg-slate-50 px-4 py-20 md:px-8 md:py-28 dark:border-slate-900 dark:bg-slate-900/40">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <RevealOnScroll>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Sécurité &amp; fiabilité</span>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl dark:text-white">
              Une base institutionnelle, pensée pour durer
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Les données de vos projets survivent à la fin d&apos;un projet, au départ d&apos;un collaborateur, au
              changement d&apos;outil de collecte. C&apos;est la mémoire institutionnelle de l&apos;organisation.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <ul className="space-y-3">
              {SECURITY_POINTS.map((p) => (
                <li key={p.text} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">{p.text}</span>
                </li>
              ))}
            </ul>
          </RevealOnScroll>
        </div>
      </section>

      {/* ---------- CTA final ---------- */}
      <section className="px-4 py-20 md:px-8 md:py-24">
        <RevealOnScroll>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 px-8 py-16 text-center shadow-2xl shadow-emerald-900/20 sm:px-16">
            <div className="pointer-events-none absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
            <div className="relative">
              <Users size={28} className="mx-auto mb-5 text-emerald-100" />
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">Votre portefeuille de projets, une seule plateforme</h2>
              <p className="mx-auto mt-3 max-w-xl text-emerald-50/90">
                Connectez-vous avec le compte fourni par votre administrateur TerraMEAL pour accéder au tableau de
                bord, à la carte interactive et à vos projets.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Se connecter <ArrowRight size={16} />
                </Link>
                <Link
                  href="/public"
                  className="flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Explorer le portail public
                </Link>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ---------- Footer ---------- */}
      <footer id="plateforme" className="border-t border-slate-100 px-4 py-12 md:px-8 dark:border-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/terrameal-mark.svg" alt="TerraMEAL" width={26} height={26} />
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">TerraMEAL</p>
              <p className="text-xs text-slate-400">La donnée spatiale au service de la redevabilité</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/public" className="hover:text-slate-800 dark:hover:text-slate-200">
              Portail public
            </Link>
            <Link href="/login" className="hover:text-slate-800 dark:hover:text-slate-200">
              Connexion
            </Link>
          </div>
          <p className="text-xs text-slate-400">Plateforme à usage interne — accès sur autorisation uniquement.</p>
        </div>
      </footer>
    </div>
  );
}
