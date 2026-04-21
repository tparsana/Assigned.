export default function TeamLoading() {
  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="space-y-5">
        <div className="h-8 w-40 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-[28px] bg-muted" />
        <div className="grid gap-5 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-[32px] bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}
