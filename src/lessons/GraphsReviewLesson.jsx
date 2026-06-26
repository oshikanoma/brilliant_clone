import ConceptLesson from './ConceptLesson.jsx'

// The "Review" checkpoint closes out the Graphs and Linear Relationships
// section. It's a mixed multiple-choice quiz drawing one question from each
// graphing skill (y-intercept, slope, reading/graphing a line, and systems of
// equations). Like every other checkpoint, any question missed on the first
// try must be made up by answering three in a row before the section unlocks.
// The shared ConceptLesson engine handles option shuffling, make-up, and the
// summary.

const QUESTIONS = [
  {
    id: 'yintercept',
    topic: 'Y-Intercept',
    prompt: 'What is the y-intercept of  y = 3x − 4 ?',
    options: ['(0, −4)', '(0, 3)', '(−4, 0)', '(0, 4)'],
    correct: 0,
    explain: 'The y-intercept is where x = 0: y = 3·0 − 4 = −4, so the point is (0, −4).',
  },
  {
    id: 'slope',
    topic: 'Slope',
    prompt: 'What is the slope of  y = −2x + 5 ?',
    options: ['−2', '5', '2', '−5'],
    correct: 0,
    explain: 'In y = mx + b, the slope m is the coefficient of x — here that is −2.',
  },
  {
    id: 'riserun',
    topic: 'Slope',
    prompt: 'A line goes up 6 units for every 3 units it moves right. What is its slope?',
    options: ['2', '1/2', '3', '6'],
    correct: 0,
    explain: 'Slope = rise / run = 6 / 3 = 2.',
  },
  {
    id: 'readline',
    topic: 'Reading a Line',
    prompt: 'A line passes through (0, 1) with slope 2. Which point is also on the line?',
    options: ['(1, 3)', '(1, 2)', '(2, 1)', '(1, −1)'],
    correct: 0,
    explain: 'Start at (0, 1) and move right 1, up 2: that lands on (1, 3).',
  },
  {
    id: 'systems-concept',
    topic: 'Systems of Equations',
    prompt: 'The solution to a system of two lines is the point where the lines ___?',
    options: ['cross / intersect', 'are parallel', 'have the same slope', 'hit the y-axis'],
    correct: 0,
    explain: 'A system is solved at the point where both lines cross — it satisfies both equations.',
  },
  {
    id: 'systems-solve',
    topic: 'Systems of Equations',
    prompt: 'Where do the lines  y = x + 1  and  y = −x + 5  meet?',
    options: ['(2, 3)', '(3, 2)', '(1, 5)', '(0, 1)'],
    correct: 0,
    explain: 'Set x + 1 = −x + 5 → 2x = 4 → x = 2, then y = 2 + 1 = 3. They meet at (2, 3).',
  },
]

const INTRO = {
  icon: '📈',
  eyebrow: 'Graphs & Linear Relationships · Checkpoint',
  title: 'Time to test your graphing skills!',
  blurb: (
    <span>
      You've covered y-intercepts, slope, reading lines, and systems of
      equations. <strong>Let's see what stuck.</strong>
    </span>
  ),
  cta: "Show me what you've got →",
}

export default function GraphsReviewLesson(props) {
  return <ConceptLesson {...props} levels={QUESTIONS} isReview intro={INTRO} />
}
