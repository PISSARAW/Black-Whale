import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { chromium } from 'playwright'

const run = promisify(execFile)
const root = fileURLToPath(new URL('../../..', import.meta.url))
const episode = [5, 4, 3, 2].find((number) => process.argv.includes(`--episode-${number}`)) ?? 1
const episodeNumber = String(episode).padStart(2, '0')
const output = path.join(root, 'output', `black-whale-visite-${episodeNumber}`)
const base = process.env.BLACK_WHALE_TOUR_URL ?? 'http://127.0.0.1:3011'
const youtubeEnglish = process.argv.includes('--youtube-en')
const portrait = !youtubeEnglish && (episode > 1 || process.argv.includes('--tiktok-en'))
const musicOnly = portrait || youtubeEnglish
const viewport = portrait ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 }
const music = [
  'Or sous la nappe.mp3',
  'Quatorze places.mp3',
  'Au-dessus des gradins.mp3',
  'Sous la ligne de flottaison.mp3',
  'La pression des ponts.mp3',
]
const soundtrack = path.join(root, 'Musique', music[episode - 1])
const title = 'Les quartiers royaux'
const episodeOne = [
  {
    view: 'royal-liner-prince-view',
    label: 'BLACK WHALE  /  ÉPISODE 01',
    title,
    voice:
      'Bienvenue à bord du Black Whale. Aujourd’hui, on visite le pont royal, du salon privé du roi jusqu’à la salle du banquet.',
  },
  {
    view: 'princely-corridor-perspective',
    label: 'LA COURSIVE DES PRINCES',
    voice:
      'Derrière ces portes numérotées se trouvent les appartements des princes. La coursive qui les dessert ressemble davantage à celle d’un grand hôtel qu’à un couloir de navire.',
  },
  {
    view: 'nasubi-salon-overview',
    label: 'LE SALON DU ROI NASUBI',
    voice:
      'On entre dans le salon de Nasubi. Dans l’axe, un fauteuil de repos fait face à un paysage encadré, presque aussi large que le mur.',
  },
  {
    view: 'nasubi-living-vault',
    voice:
      'Lève les yeux. La voûte à caissons unifie la pièce, tandis que les tableaux et les piliers rythment les murs.',
  },
  {
    view: 'nasubi-mantel-objects',
    voice:
      'Approchons du manteau. On y distingue un buste, des cadres, une horloge et des vases. Ce sont ces petites choses qui font de ce salon une pièce habitée.',
  },
  {
    view: 'halkenburg-bedroom-curtains',
    label: 'LA CHAMBRE DE HALKENBURG',
    voice:
      'Chez Halkenburg, le lit domine la chambre. Une tête de lit sculptée l’encadre, et les rideaux dessinent un fond presque théâtral.',
  },
  {
    view: 'halkenburg-bookcases',
    label: 'LES BIBLIOTHÈQUES',
    voice:
      'Dans son espace de réception, le luxe se lit dans les rayonnages, les corniches et les panneaux décoratifs, jusque dans les angles de la pièce.',
  },
  {
    view: 'banquet-side-galleries',
    label: 'LA SALLE DU BANQUET',
    voice:
      'On termine par la salle du banquet. Sur les côtés, les galeries surplombent les tables. Les colonnes guident le regard d’un bout à l’autre.',
  },
  {
    view: 'banquet-throne-panorama',
    voice:
      'Voici la salle depuis le trône. Les lustres se succèdent au-dessus des tables, et tout au fond, de l’autre côté de la salle, se trouve la scène du concert de Melody.',
  },
  {
    view: 'banquet-performance-stage',
    label: 'VISITE 3D  /  D’APRÈS LE MANGA',
    voice:
      'Du fauteuil du roi à la scène du banquet, voilà deux manières de mettre le luxe en scène à bord du même navire. À bientôt sur le Black Whale.',
  },
]

const englishCuts = [
  [205, 'BLACK WHALE  /  EPISODE 01'],
  [244, 'THE PRINCES’ CORRIDOR'],
  [219, 'KING NASUBI’S PRIVATE SALON'],
  [168, 'THE COFFERED VAULT'],
  [236, 'THE ROYAL MANTEL'],
  [209, 'HALKENBURG’S BEDROOM'],
  [227, 'THE RECEPTION ROOM'],
  [202, 'THE BANQUET HALL'],
  [264, 'THE VIEW FROM THE THRONE'],
  [215, 'MELODY’S STAGE'],
]

const zhangLeiTour = [
  ['royal-liner-prince-view', 5, 'BLACK WHALE  /  EPISODE 02', 'Inside Suite 1003'],
  ['zhanglei-entrance-reconstruction', 5, 'THE ENTRANCE', 'Prince Zhang Lei’s apartment'],
  [
    'zhanglei-living-reconstruction',
    7,
    'THE PRIVATE SALON',
    'Where the prince receives his guests',
  ],
  ['zhanglei-bedroom-reconstruction', 7, 'THE BEDROOM'],
  ['zhanglei-bathroom-reconstruction', 5, 'THE BATHROOM'],
  ['zhanglei-kitchen-reconstruction', 5, 'THE KITCHEN'],
  ['zhanglei-servants-reconstruction', 5, 'THE STAFF QUARTERS'],
  [
    'zhanglei-dining-statue-credenza',
    7,
    'THE DINING ROOM',
    'Sculpture, a mantel clock and a framed landscape',
  ],
  ['zhanglei-dining-candelabrum', 7, 'THE TABLE SETTING', 'Candelabra, lidded jars and cups'],
  ['zhanglei-dining-audience', 9, 'THE PRINCE’S TABLE', 'Recreated from the manga'],
]

const tierThreeTour = [
  ['observation-deck-panorama', 6, 'BLACK WHALE  /  EPISODE 03', 'Life on Tier 3'],
  ['first-class-cabins-aerial-plan', 5, 'FIRST-CLASS CABINS', 'A look at the layout from above'],
  ['room-3101-bunks-storage', 6, 'INSIDE ROOM 3101', 'Bunk beds and open wall storage'],
  ['cineplex-establishing-shot', 6, 'THE CINEPLEX', 'A movie theater aboard the ship'],
  ['cineplex-ticket-windows-booths', 5, 'THE BOX OFFICE', 'Ticket windows and showtimes'],
  ['cineplex-concession-popcorn', 5, 'THE CONCESSION STAND', 'Popcorn before the show'],
  ['cineplex-hisoka-seating', 6, 'THE LOBBY', 'A familiar face is waiting'],
  ['cineplex-ceiling-coffer-marquee', 5, 'THE MARQUEE'],
  ['cineplex-screens-descending-ramp', 5, 'THE RAMP TO THE SCREENS'],
  ['cineplex-screens-hall-concourse', 5, 'THE SCREENING ROOMS', 'Eight screens on one deck'],
  ['cineplex-auditorium-screen', 8, 'INSIDE SCREEN 1', 'The projection screen and tiered seating'],
]

const tierFourTour = [
  [
    'tier-four-central-passage-tour',
    6,
    'BLACK WHALE  /  EPISODE 04',
    'Behind the Scenes on Tier 4',
  ],
  ['tier-four-passenger-corridor-tour', 5, 'THE PASSENGER BLOCK'],
  ['tier-four-passenger-cabin-door-tour', 7, 'THE CABIN DOORS', 'Along the passenger corridor'],
  [
    'tier-four-recycling-tour',
    6,
    'THE RECYCLING FACILITIES',
    'The service spaces that keep the ship running',
  ],
  [
    'royal-army-u-table-command',
    6,
    'THE ROYAL ARMY CONFERENCE ROOM',
    'A U-shaped table for the committee',
  ],
  ['royal-army-lectern-stage', 5, 'THE LECTERN'],
  ['royal-army-briefing-audience', 7, 'THE BRIEFING ROOM', 'A view from the back of the room'],
  ['xi-yu-office-aerial-plan', 6, 'THE XI-YU FAMILY OFFICE', 'A look at the floor plan from above'],
  [
    'tier-four-xiyu-office-tour',
    8,
    'INSIDE THE XI-YU MEETING ROOM',
    'The long table at the heart of the office',
  ],
]

const tierFiveTour = [
  ['tier-5-hangar-entrance-gate', 6, 'BLACK WHALE  /  TIER 5  /  EPISODE 05', 'Below Deck'],
  ['cha-r-warehouse-aerial-plan', 6, 'THE CHA-R WAREHOUSE', 'The cargo layout from above'],
  [
    'cha-r-warehouse-crate-canyon',
    7,
    'BETWEEN THE CRATE RACKS',
    'A narrow aisle leads to the double doors',
  ],
  ['cha-r-emblem-three-doors', 5, 'THE CHA-R OFFICE', 'Three doors frame the emblem room'],
  ['cha-r-bunks-bookshelves', 6, 'THE BUNK ROOM', 'Stacked beds and wall shelving'],
  ['cha-r-cctv-monitor-room', 6, 'THE MONITOR ROOM', 'A wall of surveillance screens'],
  ['central-dining-hall-ch378-service', 7, 'THE FOOD COUNTER', 'Menus hang above the service line'],
  ['central-dining-hall-franklin', 6, 'AT TABLE LEVEL', 'A familiar face in the dining hall'],
  ['central-dining-hall-catwalk', 8, 'THE CENTRAL DINING HALL', 'The view from the steel catwalk'],
]

function timedTour(cuts) {
  return cuts.map(([view, seconds, label, detail], index) => ({
    view,
    frames: seconds * 24,
    label,
    ...(index === 0 ? { title: detail } : { detail }),
  }))
}

const firstTour = episodeOne.map((source, index) => {
  if (!musicOnly) return source
  const [frames, label] = englishCuts[index]
  return {
    view: source.view,
    frames,
    label,
    title: index === 0 ? 'The Royal Quarters' : undefined,
  }
})
const shots = [
  firstTour,
  ...[zhangLeiTour, tierThreeTour, tierFourTour, tierFiveTour].map(timedTour),
][episode - 1]

async function cleanFrame(page, shot) {
  await page.evaluate(
    ({ label, title, detail, portrait }) => {
      const stage = document.querySelector('#tour-stage-container')
      const canvas = stage?.querySelector('canvas')
      const visual = canvas?.parentElement
      if (!stage || !canvas || !visual) throw new Error('Tour stage not available')
      for (const child of visual.children) if (child !== canvas) child.style.display = 'none'
      stage.replaceChildren(visual)
      Object.assign(stage.style, {
        position: 'fixed',
        inset: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '99999',
        background: '#10110f',
      })
      Object.assign(visual.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
      })
      if (!label) return
      const card = document.createElement('div')
      Object.assign(card.style, {
        position: 'absolute',
        top: portrait ? '72%' : '76%',
        left: portrait ? '8%' : '5%',
        width: '75%',
        color: '#fff0cf',
        font: portrait ? '700 32px Arial' : '700 25px Arial',
        letterSpacing: '.13em',
        textShadow: '0 3px 8px black, 0 0 12px black',
      })
      card.textContent = label
      if (title) {
        const heading = document.createElement('div')
        Object.assign(heading.style, {
          color: '#fff9e9',
          marginTop: '12px',
          font: portrait ? '700 86px Georgia' : '700 72px Georgia',
          letterSpacing: '-.04em',
        })
        heading.textContent = title
        card.append(heading)
      }
      if (detail) {
        const line = document.createElement('div')
        Object.assign(line.style, {
          marginTop: '10px',
          color: '#fff9e9',
          font: '400 32px Arial',
          letterSpacing: '0',
        })
        line.textContent = detail
        card.append(line)
      }
      stage.append(card)
    },
    { ...shot, portrait },
  )
}

async function capture(browser, shot, image) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  try {
    if (episode >= 4) {
      await page.addInitScript(() =>
        localStorage.setItem('black-whale:tour-comfort', JSON.stringify({ exposure: 1.6 })),
      )
    }
    const url = new URL('/tour', base)
    url.searchParams.set('mangaView', shot.view)
    const response = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 90_000 })
    if (!response?.ok()) throw new Error(`Tour returned ${response?.status()} at ${shot.view}`)
    await page.locator('#tour-stage-container canvas').first().waitFor({ timeout: 60_000 })
    await page.waitForTimeout(2_200)
    await cleanFrame(page, shot)
    await page.waitForTimeout(900)
    await page.screenshot({ path: image, type: 'jpeg', quality: 97, timeout: 60_000 })
  } finally {
    await page.close()
  }
}

async function makeClip(files, shot, index) {
  const { narration, image, clip } = files
  const frames = shot.frames ?? (await narrationFrames(narration))
  const left = index % 2 === 0 ? '0.43' : '0.58'
  const { width, height } = viewport
  const motion = `scale=${width * 2}:${height * 2},zoompan=z='1.012+0.061*on/${frames}':x='(iw-iw/zoom)*${left}':y='(ih-ih/zoom)*0.55':d=${frames}:s=${width}x${height}:fps=24,setsar=1`
  const duration = String(frames / 24)
  const fade = index === shots.length - 1 ? `,fade=t=out:st=${frames / 24 - 0.5}:d=0.5` : ''
  const liftShadows = (episode === 4 && (index <= 3 || index >= 7)) || (episode === 5 && index < 6)
  const grade = liftShadows ? ',eq=gamma=1.5' : ''
  const audioInput = musicOnly ? [] : ['-i', narration]
  const audioOutput = musicOnly
    ? ['-an']
    : [
        '-af',
        'highpass=f=75,alimiter=limit=0.9,adelay=280:all=1,apad',
        '-ar',
        '48000',
        '-ac',
        '2',
        '-c:a',
        'aac',
        '-b:a',
        '160k',
      ]
  await run('ffmpeg', [
    '-hide_banner',
    '-v',
    'error',
    '-y',
    '-filter_threads',
    '2',
    '-i',
    image,
    ...audioInput,
    '-vf',
    motion + grade + fade,
    ...audioOutput,
    '-t',
    duration,
    '-c:v',
    'libx264',
    '-threads',
    '3',
    '-crf',
    '18',
    '-preset',
    'veryfast',
    '-pix_fmt',
    'yuv420p',
    clip,
  ])
  process.stdout.write(`${index + 1}/${shots.length}  ${shot.view}  ${duration}s\n`)
}

async function narrationFrames(narration) {
  const { stdout } = await run('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'csv=p=0',
    narration,
  ])
  return Math.ceil((Number(stdout.trim()) + 0.95) * 24)
}

await mkdir(output, { recursive: true })
const work = await mkdtemp(path.join(tmpdir(), 'black-whale-estate-tour-'))
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: [
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--disable-gpu-shader-disk-cache',
    '--disk-cache-size=1',
  ],
})
try {
  const clips = []
  for (const [index, shot] of shots.entries()) {
    const files = {
      image: path.join(work, `${index}.jpg`),
      narration: path.join(work, `${index}.aiff`),
      clip: path.join(work, `${index}.mp4`),
    }
    await Promise.all([
      capture(browser, shot, files.image),
      musicOnly
        ? undefined
        : run('say', [
            '-v',
            process.env.BLACK_WHALE_TOUR_VOICE ?? 'Thomas',
            '-r',
            '171',
            '-o',
            files.narration,
            shot.voice,
          ]),
    ])
    await makeClip(files, shot, index)
    clips.push(`file '${files.clip}'`)
  }
  const list = path.join(work, 'shots.txt')
  await writeFile(list, clips.join('\n'))
  const duration = shots.reduce((count, shot) => count + (shot.frames ?? 0), 0) / 24
  const slug = [
    'royal-quarters',
    'suite-1003',
    'life-on-tier-3',
    'behind-the-scenes-on-tier-4',
    'below-deck-on-tier-5',
  ][episode - 1]
  const englishFile = `black-whale-ep${episodeNumber}-${slug}`
  const video = path.join(
    output,
    musicOnly
      ? `${englishFile}-${portrait ? 'tiktok' : 'youtube'}-en.mp4`
      : 'black-whale-visite-01-quartiers-royaux.mp4',
  )
  const mux = musicOnly
    ? [
        '-i',
        soundtrack,
        '-map',
        '0:v:0',
        '-map',
        '1:a:0',
        '-c:v',
        'copy',
        '-c:a',
        'aac',
        '-b:a',
        '256k',
        '-af',
        `afade=t=out:st=${duration - 2.5}:d=2.5`,
        '-t',
        String(duration),
      ]
    : ['-c', 'copy']
  await run('ffmpeg', [
    '-hide_banner',
    '-v',
    'error',
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    list,
    ...mux,
    '-movflags',
    '+faststart',
    video,
  ])
  process.stdout.write(`${video}\n`)
} finally {
  await browser.close()
  await rm(work, { recursive: true })
}
