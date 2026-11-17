import { execFileSync } from 'node:child_process'

/** Record the active macOS power policy: it can cap RAF before game work begins. */
export function fightPerformancePower() {
  const battery = execFileSync('pmset', ['-g', 'batt'], { encoding: 'utf8' })
  const policies = execFileSync('pmset', ['-g', 'custom'], { encoding: 'utf8' })
  const source = battery.match(/Now drawing from '([^']+)'/)?.[1] ?? 'unknown'
  const section = policies.split(`${source}:`)[1]?.split(/\n\S/)[0] ?? ''
  return {
    source,
    batteryPercent: Number(battery.match(/(\d+)%;/)?.[1] ?? NaN),
    lowPowerMode: Number(section.match(/lowpowermode\s+(\d+)/)?.[1] ?? NaN),
  }
}
