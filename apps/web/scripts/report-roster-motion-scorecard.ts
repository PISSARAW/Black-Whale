import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { rosterMotionScorecard } from '../src/lib/fighting/rosterMotionScorecard'

const output =
  process.env.ROSTER_MOTION_SCORECARD_OUTPUT ?? '/tmp/black-whale-roster-motion-scorecard'
const scorecard = rosterMotionScorecard()
await mkdir(output, { recursive: true })
await writeFile(path.join(output, 'scorecard.json'), JSON.stringify(scorecard, null, 2))

const lines = [
  '# Black Whale Clash — roster motion scorecard',
  '',
  '| Rank | Fighter | Score | Mechanics | Rhythm | Contact | Silhouette | Identity | Dedicated | Priorities |',
  '| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
  ...scorecard.map(
    (fighter, index) =>
      `| ${index + 1} | ${fighter.id} | ${fighter.score.toFixed(1)} | ${fighter.mechanics.toFixed(1)} | ${fighter.rhythm.toFixed(1)} | ${fighter.contact.toFixed(1)} | ${fighter.silhouette.toFixed(1)} | ${fighter.identity.toFixed(1)} | ${fighter.dedicatedMoves}/9 | ${fighter.priorityMoves.join(', ')} |`,
  ),
  '',
  'Scores measure authored presentation depth, not gameplay strength or frame advantage.',
]
await writeFile(path.join(output, 'scorecard.md'), `${lines.join('\n')}\n`)
process.stdout.write(`${lines.join('\n')}\n\nReports: ${output}\n`)
