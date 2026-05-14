export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#fffbea_0%,#f7fee7_42%,#ffffff_100%)]">
      <div className="text-center" role="status" aria-label="Caricamento in corso">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-lime-200 border-t-lime-600" />
        <p className="mt-4 text-sm font-medium text-zinc-500">
          Caricamento in corso…
        </p>
      </div>
    </div>
  );
}
