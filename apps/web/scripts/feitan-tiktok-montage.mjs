// Times refer to the 60 Hz simulation before the montage cuts.
const shots = [
  [14.03, 14.73], // Cold open: the payoff, then a hard cut back to the guard.
  [0.23, 0.97],
  [1.5, 3.5],
  [3.87, 6.45],
  [6.5, 8.88],
  [9.08, 9.8],
  [10.42, 16],
]

export const tiktokDuration = shots.reduce((total, [start, end]) => total + end - start, 0)

export function tiktokFilters(impacts) {
  const effects = impacts.map(({ frame }) => Math.round((frame * 1000) / 60))
  const filters = [
    '[2:a]highpass=f=160,lowpass=f=2700,afade=t=out:d=0.1,volume=0.42[crack]',
    '[3:a]afade=t=out:d=0.12,volume=0.45[sub]',
    '[crack][sub]amix=inputs=2:normalize=0[hit]',
    `[hit]asplit=${effects.length}${effects.map((_, i) => `[h${i}]`).join('')}`,
    ...effects.map((ms, i) => `[h${i}]adelay=${ms}:all=1[s${i}]`),
    '[1:a]volume=1.55[bed]',
    `[bed][4:a]${effects.map((_, i) => `[s${i}]`).join('')}amix=inputs=${effects.length + 2}:normalize=0,volume=5.5dB,alimiter=limit=0.9:latency=1[mix]`,
    `[mix]asplit=${shots.length}${shots.map((_, i) => `[mix${i}]`).join('')}`,
    ...shots.flatMap(([start, end], i) => [
      `[0:v]trim=start=${start}:end=${end},setpts=PTS-STARTPTS[v${i}]`,
      `[mix${i}]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS,afade=t=in:d=0.024,afade=t=out:st=${end - start - 0.035}:d=0.035[a${i}]`,
    ]),
    `${shots.map((_, i) => `[v${i}][a${i}]`).join('')}concat=n=${shots.length}:v=1:a=1[cut][audio]`,
    '[cut]scale=1080:1920:flags=lanczos,setsar=1[video]',
  ]
  return filters.join(';')
}
