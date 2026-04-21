export default function AppLoading() {
  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="space-y-5">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-[28px] bg-muted" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-[26rem] animate-pulse rounded-[32px] bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}
