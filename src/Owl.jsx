// The little owl mascot's face/body, built from CSS shapes. The caller wraps
// this in a positioning element (`.owl` peeking behind a checkpoint, or
// `.owl--float` floating beside a lesson).
export default function Owl() {
  return (
    <span className="owl__body">
      <span className="owl__ear owl__ear--l" />
      <span className="owl__ear owl__ear--r" />
      <span className="owl__wing owl__wing--l" />
      <span className="owl__wing owl__wing--r" />
      <span className="owl__eye owl__eye--l">
        <span className="owl__glint" />
      </span>
      <span className="owl__eye owl__eye--r">
        <span className="owl__glint" />
      </span>
      <span className="owl__cheek owl__cheek--l" />
      <span className="owl__cheek owl__cheek--r" />
      <span className="owl__belly" />
      <span className="owl__glasses" aria-hidden="true">
        <span className="owl__lens owl__lens--l" />
        <span className="owl__bridge" />
        <span className="owl__lens owl__lens--r" />
      </span>
      <span className="owl__beak" />
    </span>
  )
}
