import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <>
      {error === "inactive" && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          Votre compte est désactivé. Contactez un administrateur TerraMEAL.
        </p>
      )}
      <LoginForm next={next ?? "/dashboard"} />
    </>
  );
}
