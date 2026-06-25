import ConceptLesson from './ConceptLesson.jsx'

// The "Review" checkpoint closes out the Algebra Foundations section. It's a
// mixed multiple-choice quiz drawing one question from each foundational skill
// (solving, order of operations, like terms, distributing, evaluating). Like
// every other checkpoint, any question missed on the first try must be made up
// by answering three in a row before the section unlocks. The shared
// ConceptLesson engine handles option shuffling, make-up, and the summary.

const QUESTIONS = [
  {
    id: 'solve',
    topic: 'Solving Equations',
    prompt: 'Solve for x:  x + 7 = 12',
    options: ['x = 5', 'x = 19', 'x = 7', 'x = 12'],
    correct: 0,
    explain: 'Subtract 7 from both sides: x = 12 − 7 = 5.',
  },
  {
    id: 'order1',
    topic: 'Order of Operations',
    prompt: 'Simplify:  2 + 3 × 4',
    options: ['14', '20', '24', '9'],
    correct: 0,
    explain: 'Multiply before you add: 3 × 4 = 12, then 2 + 12 = 14.',
  },
  {
    id: 'order2',
    topic: 'Order of Operations',
    prompt: 'Simplify:  (6 − 2) × 3',
    options: ['12', '4', '0', '7'],
    correct: 0,
    explain: 'Parentheses first: 6 − 2 = 4, then 4 × 3 = 12.',
  },
  {
    id: 'liketerms',
    topic: 'Combining Like Terms',
    prompt: 'Combine like terms:  3x + 5x − 2',
    options: ['8x − 2', '8x', '6x', '10x'],
    correct: 0,
    explain: 'Add the x-terms: 3x + 5x = 8x. The −2 has no like term, so it stays.',
  },
  {
    id: 'distribute',
    topic: 'Distributive Property',
    prompt: 'Expand:  2(x + 4)',
    options: ['2x + 8', '2x + 4', 'x + 8', '2x + 6'],
    correct: 0,
    explain: 'Multiply 2 by each term inside: 2·x + 2·4 = 2x + 8.',
  },
  {
    id: 'evaluate',
    topic: 'Evaluating Expressions',
    prompt: 'If x = 3, what is  4x − 5 ?',
    options: ['7', '17', '12', '2'],
    correct: 0,
    explain: '4 × 3 − 5 = 12 − 5 = 7.',
  },
]

const INTRO = {
  icon: '📝',
  eyebrow: 'Algebra Foundations · Checkpoint',
  title: "Let's put your skills to the test!",
  blurb: (
    <span>
      You've learned a lot — solving equations, order of operations, like terms,
      distributing, and evaluating. <strong>Let's see what stuck.</strong>
    </span>
  ),
  cta: "Show me what you've got →",
}

export default function ReviewLesson(props) {
  return <ConceptLesson {...props} levels={QUESTIONS} isReview intro={INTRO} />
}
