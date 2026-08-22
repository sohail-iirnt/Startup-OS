type PlaceholderPageProps = {
  title: string
  description: string
}

function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <div className="os-card flex min-h-[500px] items-center justify-center p-8">
        <div className="max-w-md text-center">
          <p className="text-sm font-medium text-[var(--os-accent)]">
            Startup OS Module
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--os-text)]">
            {title}
          </h1>

          <p className="mt-3 text-sm leading-6 text-[var(--os-text-secondary)]">
            {description}
          </p>

          <div className="mt-6 inline-flex rounded-full border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 py-2 text-xs text-[var(--os-text-muted)]">
            Architecture ready · Module coming next
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaceholderPage