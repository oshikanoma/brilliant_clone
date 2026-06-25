// Make-up progress indicator: `total` markers (default 3) that start as gray
// dots and "pop" into pale-yellow stars as the student answers correctly.
// Replaces the level progress bar while a checkpoint's missed levels are being
// made up.
export default function MakeupDots({ stars = 0, total = 3 }) {
  return (
    <div className="makeup-dots" role="status" aria-label={`${stars} of ${total} correct`}>
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < stars
        return (
          <span
            key={i}
            className={'makeup-dot' + (filled ? ' makeup-dot--star' : '')}
            aria-hidden="true"
          >
            {filled ? '★' : ''}
          </span>
        )
      })}
    </div>
  )
}
