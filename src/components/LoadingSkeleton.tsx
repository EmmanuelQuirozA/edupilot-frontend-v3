import './LoadingSkeleton.css'

interface LoadingSkeletonProps {
  variant?: 'dashboard' | 'table'
  cardCount?: number
  rowCount?: number
}

function createRange(count: number) {
  return Array.from({ length: count }, (_, index) => index)
}

export function LoadingSkeleton({
  variant = 'dashboard',
  cardCount = 6,
  rowCount = 6,
}: LoadingSkeletonProps) {
  return (
    <div className="loading-skeleton">
      <div className="loading-skeleton__header">
        <div className="loading-skeleton__pill" />
        <div className="loading-skeleton__line loading-skeleton__line--title" />
        <div className="loading-skeleton__line loading-skeleton__line--subtitle" />
      </div>

      {variant === 'dashboard' ? (
        <div className="loading-skeleton__grid">
          {createRange(cardCount).map((item) => (
            <div key={item} className="loading-skeleton__card">
              <div className="loading-skeleton__line loading-skeleton__line--muted" />
              <div className="loading-skeleton__line loading-skeleton__line--highlight" />
              <div className="loading-skeleton__line loading-skeleton__line--muted short" />
            </div>
          ))}
        </div>
      ) : (
        <div className="loading-skeleton__table card shadow-sm border-0">
          <div className="loading-skeleton__table-header">
            {createRange(4).map((item) => (
              <div key={item} className="loading-skeleton__line loading-skeleton__line--muted" />
            ))}
          </div>
          <div className="loading-skeleton__table-body">
            {createRange(rowCount).map((row) => (
              <div key={row} className="loading-skeleton__table-row">
                {createRange(5).map((cell) => (
                  <div
                    key={cell}
                    className="loading-skeleton__line loading-skeleton__line--muted"
                    style={{ width: `${60 - cell * 8}%` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
