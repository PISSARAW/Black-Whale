/**
 * The English message catalogue. It is the source of truth for the shape of
 * every other locale: `fr.ts` is typed against it, so a missing or misspelled
 * key fails the type check instead of rendering a blank.
 *
 * Values that vary with the data are functions. Anything that reads as prose
 * belongs here; the archive's editorial content still lives in `data/`.
 */
export const en = {
  common: {
    search: 'Search',
    clearSearch: 'Clear search',
    resetFilters: 'Reset filters',
    resetSearch: 'Reset search',
    all: 'All',
    unknown: 'Unknown',
    home: 'Home',
    close: 'Close',
    open: 'Open',
    chapterShort: (number: number | string) => `Ch. ${number}`,
    events: (count: number): string => (count === 1 ? 'event' : 'events'),
    records: (count: number): string => (count === 1 ? 'record' : 'records'),
    results: (visible: number, total: number) =>
      `${visible} of ${total} result${visible === 1 ? '' : 's'}`,
    /** The BCP 47 tag handed to `Intl` so dates and numbers match the copy. */
    intlLocale: 'en-GB',
  },

  /**
   * Shown by `+error.svelte`. The copy stays sober on purpose: an error page is
   * the one page whose job is to say what happened and where to go next.
   */
  error: {
    backHome: 'Back to the archive',
    reference: (status: number) => `Reference ${status}`,
    reportReference: (reference: string) => `Quote ${reference} if you report this.`,
    notFound: {
      title: 'This page is not in the archive',
      body: 'The address does not match anything catalogued. It may have been renamed, or never existed.',
    },
    rateLimited: {
      title: 'Too many requests',
      body: 'The archive throttles writes so a single visitor cannot spend the whole ship. Wait a moment and try again.',
    },
    server: {
      title: 'The archive could not answer',
      body: 'Something failed on our side, not yours. The request was not recorded; retrying is safe.',
    },
    generic: {
      title: 'Something went wrong',
      body: 'The request could not be completed.',
    },
  },

  seo: {
    siteTitle: 'Black Whale — Succession Archive',
    siteDescription:
      'An interactive archive of the Hunter × Hunter Succession War: every passenger, deck, faction, Nen ability and shifting perspective aboard the Black Whale.',
  },

  nav: {
    explore: 'Explore',
    timeline: 'Timeline',
    characters: 'Characters',
    knowledge: 'Knowledge',
    abilityArchive: 'Ability Archive',
    comparePerspectives: 'Compare Perspectives',
    factionNetwork: 'Faction Network',
    simulations: 'Simulations',
    virtualTour: 'Virtual Tour',
    tourModes: 'Tour Modes',
    shipSources: 'Ship Sources',
    arena: 'Black Whale Arena',
    reconstruction: 'Living Reconstruction',
  },

  reconstruction: {
    seoTitle: 'Living Reconstruction — Follow the Black Whale timeline',
    seoDescription:
      'Walk the reconstructed Black Whale while its known canonical presences change along the manga timeline.',
    breadcrumb: 'Living reconstruction',
    title: 'Living reconstruction',
    eyebrow: 'Canonical space-time atlas',
    intro:
      'Choose a moment in the voyage, read its geography at a glance, then enter the reconstructed scene.',
    viewLabel: 'Reconstruction view',
    overview: 'Ship overview',
    scene: 'Enter scene',
    timeline: 'Voyage timeline',
    searchEvents: 'Find an event',
    searchPlaceholder: 'Chapter, event or consequence…',
    currentState: 'Reconstructed state of the Black Whale',
    loadErrorEyebrow: 'Reconstruction unavailable',
    loadErrorTitle: 'The temporal data could not be loaded',
    loadErrorBody:
      'The timeline stays hidden so an empty ship is never presented as canonical information.',
    retry: 'Try again',
    technicalDetails: 'Technical details',
    sources: 'Sources and method',
    evidenceLevels: {
      attested: 'Attested',
      derived: 'Derived',
      inferred: 'Inferred',
    },
    perspective: 'Point of view',
    canonicalPerspective: 'Objective canon',
    loadingPerspective: 'Reconstructing the character’s knowledge…',
    perspectiveUnavailable: 'This point of view cannot be reconstructed for this event.',
    perspectiveSummary: (visible: number, facts: number, beliefs: number) =>
      `${visible} visible ${visible === 1 ? 'body' : 'bodies'} · ${facts} known ${facts === 1 ? 'fact' : 'facts'} · ${beliefs} ${beliefs === 1 ? 'belief' : 'beliefs'}`,
    event: 'Selected event',
    shipState: 'Known ship state',
    exact: 'Exact room',
    approximate: 'Zone or tier',
    unlocated: 'Unlocated',
    showUnlocated: (count: number) =>
      `Show ${count} unlocated ${count === 1 ? 'presence' : 'presences'}`,
    methodNote:
      'The map shows attested knowledge, not invented omniscience. A missing position means unknown, not absent.',
    legendActive: 'In this event',
    legendKnown: 'Confirmed',
    legendProbable: 'Probable',
    legendLastKnown: 'Last known',
    filters: 'Map filters',
    allPresences: 'All presences',
    changesOnly: 'Changes only',
    certaintyFilter: 'Filter by certainty',
    allCertainties: 'All certainties',
    arrived: 'Arrived',
    departed: 'Departed',
    changes: 'Since the previous event',
    noChanges: 'No recorded spatial change.',
    changeLabels: {
      arrived: 'First located here',
      moved: 'Moved',
      departed: 'No longer located',
      unchanged: 'Unchanged',
    },
    followCharacter: (name: string) => `Follow ${name} through the voyage`,
    following: 'Following',
    followCount: (count: number) =>
      `${count} recorded ${count === 1 ? 'turning point' : 'turning points'}`,
    previousTrace: 'Previous trace',
    nextTrace: 'Next trace',
    hatsuLens: 'Nen lens',
    noHatsu: 'No technique is reading the reconstruction.',
    chooseHatsu: 'Choose a Hatsu',
    hatsuReadings: {
      future: (count: number) =>
        `${count} spatial ${count === 1 ? 'change stands' : 'changes stand'} between this state and the previous one.`,
      trace: (name: string, change: string) =>
        `${name} · ${change === 'unchanged' ? 'no spatial break at this event' : change}`,
      chooseTarget: 'Choose a passenger on the section to read their temporal trace.',
      characterTarget: 'This technique requires a body. Choose a passenger on the section.',
      sceneTarget: 'Choose a passenger or a reconstructed element to apply the technique locally.',
    },
    previous: 'Previous event',
    next: 'Next event',
    play: 'Play timeline',
    pause: 'Pause timeline',
    chooseScene: 'Choose a scene',
    sceneLabel: (chapter: number, title: string, index: number) =>
      `${index}. Ch. ${chapter} — ${title}`,
    characters: 'Characters',
    noCharacters: 'No named character is recorded for this scene.',
    watchCharacter: (name: string) => `Watch ${name}`,
    unknownPosition: 'This character’s exact position is not known in this scene.',
    roles: {
      ACTIVE: 'active',
      PASSIVE: 'present',
      OBSERVER: 'observer',
      VICTIM: 'victim',
      UNKNOWN: 'present',
    },
    visible: (count: number) => `${count} known ${count === 1 ? 'presence' : 'presences'}`,
    empty: 'No voyage event is available for the selected spoiler limit.',
    v3: {
      actionTypes: {
        MOVE_ENTITY: 'Move entity',
        SHARE_KNOWLEDGE: 'Share knowledge',
        ACTIVATE_HATSU: 'Activate Hatsu',
      },
    },
  },

  tour: {
    seoTitle: 'Virtual Tour — Walk the Black Whale',
    seoDescription:
      'A first-person walk through the reconstructed Black Whale: five tiers, every room the deck plans and the manga account for, and every corridor the reconstruction had to invent, marked as such.',
    title: 'Walk the Black Whale',
    modes: {
      seoTitle: 'Tour Modes — Choose your Black Whale experience',
      seoDescription:
        'Choose between the free tour, Morena’s table, living reconstruction, infiltration, hunt, arena, investigation and strategy modes aboard the Black Whale.',
      eyebrow: 'Black Whale experiences',
      title: 'Choose your mode',
      intro:
        'Every experience built on the Tour is gathered here. Walk freely, follow the canon through time, or enter a playable scenario.',
      open: 'Enter mode',
      free: {
        title: 'Free Tour',
        tag: 'Explore',
        description:
          'Walk the reconstructed ship at your own pace, from room to room and deck to deck.',
      },
      morena: {
        title: 'Morena',
        tag: 'Social game',
        description:
          'Sit at Morena Prudo’s table and play the card game that decides who may join Heil-Ly.',
      },
      reconstruction: {
        title: 'Living Reconstruction',
        tag: 'Canon',
        description:
          'Choose a moment in the voyage and see known presences move through the reconstructed ship.',
      },
      infiltration: {
        title: 'Infiltration',
        tag: 'Stealth',
        description:
          'Slip through hostile territory, manage detection and reach the objective without being caught.',
      },
      hunt: {
        title: 'Hunt',
        tag: 'Pursuit',
        description:
          'Track a target through the ship, spend aura carefully and survive the confrontation.',
      },
      arena: {
        title: 'Arena',
        tag: 'Combat',
        description: 'Fight a deterministic Nen duel inside an attested room of the Black Whale.',
      },
      investigation: {
        title: 'Investigation',
        tag: 'Deduction',
        description: 'Inspect a crime scene, confront the evidence and deliver a reasoned verdict.',
      },
      strategy: {
        title: 'Strategy',
        tag: 'Tactics',
        description:
          'Command a Succession War faction through eight turns of intelligence, diplomacy and conflict.',
      },
    },
    intro:
      'The ship as architecture, not as a stage: no passengers, no chapter, no timeline. Every surface says where it comes from — a panel, the deck plan, or the reconstruction itself.',
    enter: 'Click to walk',
    // Tab is named first because it is the one that works in full screen: Esc
    // releases the pointer and leaves full screen in the same press.
    engaged: 'Press Tab to release the pointer — Esc releases it and full screen with it',
    loading: 'Building the deck…',
    unsupported:
      'This walk needs WebGL, which this browser is not offering. The deck plans on the ship map remain available.',
    deck: 'Deck',
    decks: 'Decks',
    rooms: 'Rooms',
    currentRoom: 'You are in',
    outside: 'Between decks',
    source: 'Source',
    noSource: 'No source recorded',
    scale: (metres: number) =>
      `${metres.toLocaleString('en-GB')} m of reconstructed hull, bow to stern`,
    counts: (spaces: number, decks: number, interiors: number) =>
      `${spaces} reconstructed spaces across ${decks} decks, with ${interiors} room interiors drawn at their own scale`,
    minimap: (deckName: string) => `Plan of ${deckName}`,
    jumpTo: 'Jump to a space',
    takeLink: (destination: string) => `Press E to take the stairs to ${destination}`,
    takeBulkhead: (destination: string) => `Press E to pass the bulkhead to ${destination}`,
    enterInterior: (destination: string) => `Press E to step inside ${destination}`,
    leaveInterior: (destination: string) => `Press E to step back out to ${destination}`,
    insideOf: (room: string) => `Inside ${room}`,
    atFullSize: 'Drawn at its own scale',
    controls: {
      title: 'Controls',
      move: 'Move',
      moveKeys: 'W A S D or the arrow keys',
      look: 'Look',
      lookKeys: 'Move the mouse, or drag on a touchscreen',
      sprint: 'Run',
      sprintKeys: 'Shift',
      use: 'Change deck, enter a room',
      useKeys: 'E, on a stairwell or anywhere inside a room’s interior',
      plan: 'Full-screen plan',
      planKeys: 'M',
      find: 'Find a room',
      findKeys: '⌘K, or Ctrl K',
      reveal: 'Show the evidence',
      revealKeys: 'G',
      fullscreen: 'Full screen, panel and all',
      fullscreenKeys: 'V',
      release: 'Give the pointer back to the page',
      releaseKeys: 'Tab — full screen is kept, which Esc would not do',
      nen: 'Cast the active Hatsu',
      nenKeys: 'F, or click, on the room or the solid you are facing',
      nenSelf: 'Turn the active Hatsu on yourself',
      nenSelfKeys: 'R, wherever you are looking',
      nenSecond: 'Cast the second page',
      nenSecondKeys: (name: string) => `R casts ${name}, the one under the ribbon`,
      nenMoon: 'Put the moon on rather than the sun',
      nenMoonKeys: 'R marks with the moon, F with the sun',
      touch: 'On a touchscreen',
      touchKeys:
        'The stick at bottom left walks, pushed to the rim it runs; drag the view to look; the buttons take a door and cast',
    },
    /**
     * The on-screen controls a touchscreen gets instead of the keyboard. The
     * button label carries the destination, so it says what E would have said
     * without naming a key the phone has not got.
     */
    /**
     * The button that silences the walk. The walk has a voice of its own —
     * footsteps, and the room answering them — and it says what pressing it will
     * do rather than what the state is.
     */
    sound: {
      silence: 'Silence the walk',
      restore: 'Hear the walk: footsteps, and the room answering them',
    },
    touch: {
      hint: 'Drag to look · stick to walk',
      move: 'Walking stick',
      cast: 'Cast',
      takeLink: (destination: string) => `Take the stairs to ${destination}`,
      takeBulkhead: (destination: string) => `Pass through to ${destination}`,
      enterInterior: (destination: string) => `Step inside ${destination}`,
      leaveInterior: (destination: string) => `Step back out to ${destination}`,
    },
    provenance: {
      title: 'What is canon here',
      panel: 'Shown in a panel',
      plan: 'On the deck plan',
      map: 'On the /ship plan',
      inferred: 'Reconstructed',
      panelHelp: 'A chapter shows this room; its shape is read off that panel.',
      planHelp: 'It appears on the ship’s cross-section, which gives no interior.',
      mapHelp:
        'No page of the manga shows it. The room plan on /ship draws it, and the walk is that plan at walking scale.',
      inferredHelp:
        'Nothing shows it. It exists so the deck holds together, and it is lit cold so you can tell.',
      scaleHelp:
        'The deck plans are schematic. The reconstruction scales them so the rooms come out the size the panels imply, which is not a measurement of the ship.',
    },
    /**
     * The reveal. The walk already tints a surface by its provenance, which is
     * enough to notice and not enough to read; this drops the categories and
     * paints the deck in its badges alone, and names the two things the
     * reconstruction authored rather than derived.
     */
    reveal: {
      toggle: 'Evidence',
      help: 'Paint the deck in what each surface is worth as evidence, and show the walls and doors the reconstruction declared.',
      blind: 'Blind wall',
      blindHelp:
        'Two rooms share this wall and nothing goes through it. The blueprint has to say so, and say why.',
      declared: 'Door placed by hand',
      declaredHelp:
        'Every other opening in the ship follows from two footprints touching. These do not.',
      none: 'None on this level.',
    },

    sourcesLink: 'Where every room comes from',

    /**
     * The plan, and what it marks. Four stairwells and one bulkhead serve a
     * hundred and seventeen deck spaces, so the plan is where they are found —
     * and at 320 px a room's name is under four pixels tall, so the plan also
     * has a size at which it can actually be read.
     */
    plan: {
      open: 'Full-screen plan',
      close: 'Close',
      crossingUp: (destination: string) => `Up to ${destination}`,
      crossingDown: (destination: string) => `Down to ${destination}`,
      crossingAcross: (destination: string) => `Through to ${destination}`,
      legend: 'On the plan',
      doorway: 'Doorway',
      up: 'Stairs up',
      down: 'Stairs down',
      across: 'Door on this level',
    },

    /** Finding a place by name, across every level at once. */
    find: {
      open: 'Find a room',
      title: 'Find a room or a level',
      placeholder: 'Banquet hall, 1004, kitchen, cell…',
      showing: (shown: number, total: number) => `Showing ${shown} of ${total}`,
      noMatch: 'Nothing of that name in the ship',
      level: 'Level',
      close: 'Esc',
      hint: '↑ ↓ to choose · Enter to go · Esc to close',
    },

    /** The two verbs a room can be clicked with, so no widget has both. */
    goTo: (room: string) => `Walk to ${room}`,
    aimAt: (room: string) => `Aim at ${room}`,

    viewpoint: {
      copy: 'Copy this viewpoint',
      copied: 'Link copied',
      failed: 'Could not reach the clipboard',
    },

    /**
     * The walk at the size of the screen.
     *
     * Full screen here is not the walk with its page taken away: the decks, the
     * plan, the index, the Hatsu panel and the comfort dials all come with it,
     * over the ship rather than beside it. What the panel costs is a strip of
     * the view, so it folds away — and the ship is what stays.
     */
    fullscreen: {
      enter: 'Full screen',
      exit: 'Leave full screen',
      hidePanel: 'Fold the panel away',
      showPanel: 'Bring the panel back',
    },

    /**
     * How the walk is driven. None of it has a right answer, so all of it is the
     * visitor's — and `prefers-reduced-motion` sets where it starts rather than
     * overriding what they choose.
     */
    comfort: {
      title: 'Comfort',
      fov: 'Field of view',
      sensitivity: 'Look speed',
      snapTurn: 'Turn in steps',
      snapAngle: 'Step',
      jumpOnly: 'Do not walk — jump between rooms',
      /**
       * The one light aboard that is not the ship's. The ship lights itself; this
       * is for the stairwell no plan puts a lamp over, and it goes to nothing for
       * the visitor who would rather have the ship exactly as lit as it is.
       */
      nightLight: 'Light you carry',
      nightLightOff: 'Off — the ship as it is lit',
      /**
       * The ship is dark because it says so, and that is not up for adjustment.
       * The screen it is being read on is a different question, and this is the
       * only one of the two the reconstruction has any business answering.
       */
      exposure: 'Exposure',
      exposureHelp: 'Opens the eye, not the ship: no room is lit that was not.',
      /**
       * The hour behind the two openings this ship has. The walk already
       * projects an event and knows what time it happens at, so the default is
       * that hour — and `noon` is the way back to the one state ch. 380 draws,
       * for whoever wants the sourced picture and nothing derived from it.
       */
      shipHour: 'Time aboard',
      hourCanon: 'As projected',
      hourMorning: 'Morning',
      hourNoon: 'Noon',
      hourEvening: 'Evening',
      hourNight: 'Night',
      shipHourHelp: 'Only the two windows show an outside. Nothing else changes.',
      /**
       * The walk is slow because the ship is enormous and nothing else on screen
       * can say so. But that is an argument about the ship rather than about
       * somebody's afternoon, and the plan and the index still put anyone in any
       * room without walking a step.
       */
      walkPace: 'Walking pace',
      /**
       * A few centimetres, below the threshold anyone would name — which is
       * exactly why it is a dial. The visitors it makes ill are not the ones who
       * can tell you in advance how much of it they can take.
       */
      headBob: 'Head movement',
      headBobOff: 'None — the eye stays level',
      /**
       * The tier, said as what it costs rather than as a number of stars. The
       * detection only picks the default: a laptop that reports a discrete card
       * and then throttles, or one whose driver string the browser has masked,
       * are both cases no detection can get right and the visitor can.
       */
      quality: 'Picture',
      qualityAuto: 'Match this machine',
      qualityLow: 'Lighter',
      qualityHigh: 'Fuller',
      qualityHelp: 'Takes effect on the next load of the walk.',
      reset: 'Back to this system’s defaults',
      calm: 'Your system asks for reduced motion, so this starts calm.',
      degrees: (angle: number) => `${angle}°`,
      metres: (distance: number) => `${distance} m`,
      metresASecond: (speed: number) => `${speed.toFixed(1)} m/s`,
      times: (factor: number) => `×${factor.toFixed(2)}`,
    },

    /**
     * A room said in words, for whoever is not looking at it. Everything here is
     * read off the blueprint: the footprint, the ceiling, the ways out, and what
     * the panels put in the room.
     */
    room: {
      size: (long: number, wide: number, ceiling: number) =>
        `${long} × ${wide} m under ${ceiling} m`,
      exits: (count: number) => `${count} ${count === 1 ? 'exit' : 'exits'}`,
      bare: 'nothing drawn in it',
      /** What is standing in the room, by kind, once there are more than two. */
      solids: {
        spring: (count: number) => `${count} ${count === 1 ? 'spring' : 'springs'}`,
        casket: (count: number) => `${count} ${count === 1 ? 'coffin' : 'coffins'}`,
        platform: (count: number) => `${count} ${count === 1 ? 'platform' : 'platforms'}`,
        counter: (count: number) => `${count} ${count === 1 ? 'counter' : 'counters'}`,
        table: (count: number) => `${count} ${count === 1 ? 'table' : 'tables'}`,
        bed: (count: number) => `${count} ${count === 1 ? 'bed' : 'beds'}`,
        seat: (count: number) => `${count} ${count === 1 ? 'seat' : 'seats'}`,
        cabinet: (count: number) => `${count} ${count === 1 ? 'cabinet' : 'cabinets'}`,
        basin: (count: number) => `${count} ${count === 1 ? 'basin' : 'basins'}`,
        painting: (count: number) => `${count} ${count === 1 ? 'canvas' : 'canvases'}`,
        window: (count: number) => `${count} ${count === 1 ? 'window' : 'windows'}`,
        lifeboat: (count: number) => `${count} ${count === 1 ? 'lifeboat' : 'lifeboats'}`,
        pillar: (count: number) => `${count} ${count === 1 ? 'pillar' : 'pillars'}`,
        bars: (count: number) => `${count} ${count === 1 ? 'run of bars' : 'runs of bars'}`,
        manacle: (count: number) => `${count} ${count === 1 ? 'manacle' : 'manacles'}`,
        camera: (count: number) => `${count} ${count === 1 ? 'camera' : 'cameras'}`,
        telephone: (count: number) => `${count} ${count === 1 ? 'telephone' : 'telephones'}`,
        duct: (count: number) => `${count} ${count === 1 ? 'run of ducting' : 'runs of ducting'}`,
        vent: (count: number) => `${count} ${count === 1 ? 'vent' : 'vents'}`,
      },
    },

    /**
     * Aim at a thing and be handed its proof.
     *
     * The card is not a description — `describe` already writes those — it is an
     * exhibit: where this object comes from, how sure the reconstruction is, and
     * what putting it here asserts about the ship. `claims` is the doctrinal
     * half, and it is keyed by kind rather than by object because what a pillar
     * claims is a property of being a pillar here: a deckhead with nothing under
     * it would be a false statement, and the same statement stands under every
     * one of them.
     */
    examine: {
      title: 'Evidence',
      open: 'Examine',
      close: 'Put it back',
      nothing: 'Nothing in front of you the blueprint has a source for.',
      claimHeading: 'What this asserts',
      sourceHeading: 'Where it comes from',
      measured: (long: number, wide: number, height: number) =>
        `${long} × ${wide} m, ${height} m tall`,
      standingIn: (room: string) => `Stands in ${room}`,
      room: 'A room the deck plans draw, walked at the size they give it.',
      /**
       * The card for a person, which the walk owed the moment it had any.
       *
       * The same three questions as a coffin's: what is it, where does it come
       * from, and what does putting it here assert. A silhouette that could not
       * answer them would be a figure the reconstruction had invented.
       */
      person: {
        since: (chapter: string) => `Here since ch. ${chapter}`,
        sinceUnknown: 'The catalogue dates this position to no chapter.',
        claim:
          'A named character of the canon, standing where the archive puts them at this chapter.',
        role: (role: string) => `Aboard as: ${role}.`,
      },
      beast: {
        claim:
          'A Guardian Spirit Beast, present and dormant: it keeps its prince’s room and does nothing else here.',
        owner: (owner: string) => `Belongs to ${owner}`,
        since: (chapter: string) => `Read off ch. ${chapter}`,
      },
      claims: {
        spring: 'The ship carries its own water: a spring drawn in the panel, at the size drawn.',
        casket: 'Someone is being kept here. The coffins are counted, not decorated.',
        platform: 'The floor rises. A stage or a dais is a level the room is read from.',
        counter: 'This room serves. A counter is where the ship faces its passengers.',
        table: 'People sit here, and how many is the count of the tables.',
        bed: 'Someone sleeps here, and the berth is the width the plan gives it.',
        seat: 'Someone sits here, facing the way the panel faces them.',
        cabinet: 'Something is stowed here, against the wall it is drawn against.',
        basin: 'Water is drawn here. Plumbing the deck plans put in the room.',
        painting: 'A wall was hung. The canvas is the panel’s, not ours.',
        window:
          'There is an outside, and this is where it is seen from — one of two openings on the ship.',
        lifeboat: 'The ship expects to be left. A boat is a count of the people it would take.',
        pillar:
          'The deckhead is held up. A roof with nothing under it would be a claim the ship cannot make.',
        bars: 'This side of the room is not open. Bars are a wall you can see through.',
        manacle: 'Someone was held here, at the point the panel draws the iron.',
        camera: 'This room is watched, and from this corner of it.',
        telephone: 'This room can be called. The ship’s internal line reaches here.',
        duct: 'The ship breathes. Ducting is the run of air between two rooms.',
        vent: 'The air enters or leaves here — the one place a duct meets the room.',
      },
    },

    /**
     * Nen in the walk. The archive's other pages let a technique work on what is
     * written; here it works on the ship, and nothing else — so the copy talks
     * about rooms and decks throughout, never about sections or controls.
     */
    hatsu: {
      title: 'Nen in the walk',
      reach: 'Any room in the ship, from anywhere in the ship',
      aiming: (room: string) => `Facing ${room}`,
      aimingNothing: 'Facing nothing the aura can hold',
      castHint: 'Or pick any room in the ship below',
      // Every key the technique in hand answers to, listed the moment it is
      // taken up: which keys a technique uses changes from aura to aura, and a
      // visitor who has just picked one out of the dock cannot be expected to
      // press them all to find out.
      keys: {
        title: 'Controls',
        click: 'click',
        touch: 'The buttons in the corner of the walk',
        actions: {
          cast: 'Cast on the room you are facing',
          castSolid: 'Cast on the solid you are facing',
          castSelf: 'Cast on yourself, wherever you are aiming',
          castOnSelfInstead: 'Cast on yourself rather than on what is in front of you',
          sun: 'Put the sun ☀ on it',
          moon: 'Put the moon ☾ on it',
          alternate: 'Alternate the sun ☀ and the moon ☾',
          openPage: 'Cast the open page',
          markedPage: 'Cast the page under the ribbon',
          airDance: 'Play the lively air',
          airBloom: 'Play the soft air',
          airScatter: 'Play the sharp air',
          doubleWatch: 'Change the double’s watch',
          owlFlight: 'Change which bird is sent',
          insectOrders: 'Change the insect’s orders',
        },
      },
      inert: (name: string, carried: number) =>
        `${name} works on what a page says, and the walk has only rooms: it does nothing here. ${carried} techniques answer to the ship — Emperor Time, Blinky, the Hideout Doors and the rest.`,
      inertShort: 'Inert in the walk',
      targets: 'Cast on a room',
      allDecks: 'The whole ship',
      holding: 'What the aura is holding',
      release: 'Let the ship go',
      nothingHeld: 'Nothing yet',
      copy: 'Empty copy',
      copySource: 'An empty duplicate of the room. Nothing in it is the ship.',
      // The double takes orders rather than being three abilities: R walks
      // through them, and the button says the same thing without a keyboard.
      double: {
        watch: 'The double’s watch',
        follow: 'At your shoulder',
        wander: 'Loose in the room',
        scout: 'Out ahead',
      },
      // Secret Window takes the same key, and sends one of three birds.
      owl: {
        watch: 'The owl’s flight',
        wander: 'Working the ship',
        shoulder: 'On your shoulder',
        random: 'Let go unaimed',
        /** How long the materialized bird has left of its twenty seconds. */
        left: (seconds: number) => `${seconds} s left`,
      },
      // And Little Eye's insect, which takes the same key and Sayird's own
      // three verbs: flown by hand, sent on ahead, or left to record.
      insect: {
        orders: 'The insect is',
        pilot: 'Flown by hand',
        scout: 'Working the deck',
        film: 'Filming where it is',
      },
      // Enchanting Music's three airs, which are played rather than aimed: the
      // room the visitor is standing in is the only one that can hear them.
      // Chosen at the moment of playing rather than cycled beforehand, which is
      // why each has a key of its own.
      tunes: {
        title: 'The flute plays',
        hint: 'F, R and C · each air is heard by the room you are standing in',
        dance: 'The lively air',
        bloom: 'The soft air',
        scatter: 'The sharp air',
      },
      reports: {
        noTarget: 'Nothing in reach to cast on',
        teleported: (room: string) => `Sent to ${room} — you did not choose where you landed`,
        doorArmed: (room: string) => `First frame installed in ${room} · arm a second to join them`,
        doorsPaired: (a: string, b: string) =>
          `${a} and ${b} are one threshold now · step into either and come out at the other`,
        doorsRearmed: (room: string) => `The old pair is down · first frame installed in ${room}`,
        phasingOn: 'Walls stopped being walls · walk through the ship',
        phasingOff: 'Back inside the geometry · the walls hold again',
        eyeSent: (room: string) => `The sphere is on a host in ${room} · its feed is in the corner`,
        eyeRecalled: (rooms: number) =>
          `The insect is back with you · ${rooms} room${rooms === 1 ? '' : 's'} filmed`,
        eyeModeChanged: (order: string) => `The insect has new orders · ${order}`,
        eyePiloted: (room: string) => `Flown through to ${room} · the feed follows it`,
        eyeFlown: (room: string) => `The insect has taken a door · it is in ${room} now`,
        eyeFilmed: (room: string, seen: number) =>
          `${room} recorded · ${seen} thing${seen === 1 ? '' : 's'} standing in it`,
        sealedSight: 'Sight sealed · the decks are still there and you cannot see them',
        sealedHearing: 'Hearing sealed as well · the ship has gone quiet',
        sealedSpeech: 'Speech sealed too · the walk will not say what room you are in',
        sealedReleased: 'The three released · sight, hearing and speech return',
        dowsed: (room: string, metres: number, decks: number) =>
          decks
            ? `${room} · ${metres} m away, ${decks} level${decks > 1 ? 's' : ''} off`
            : `${room} · ${metres} m away, on this level`,
        watching: (room: string) => `A paper doll is in ${room}, counting every arrival`,
        isolatedInside: (room: string) =>
          `${room} is isolated around you · you may leave, and you will not get back in`,
        isolatedOutside: (room: string) =>
          `${room} is isolated · from out here you can only reach an empty copy of it`,
        stripped: (room: string, count: number) =>
          count
            ? `${count} hold${count > 1 ? 's' : ''} blown off ${room} · nothing was moved`
            : `Nothing was holding ${room}`,
        laidOpen: (spaces: number, decks: number) =>
          `Every category at 100% · ${spaces} rooms across ${decks} levels held open at once`,
        emptied: (room: string, structures: number) =>
          structures
            ? `${structures} solid${structures > 1 ? 's' : ''} swallowed out of ${room}`
            : `${room} was already bare`,
        swallowed: (solid: string, held: number) => `${solid} goes into the bag · ${held} held`,
        coughedUp: (solid: string, room: string, held: number) =>
          `${solid} comes back out in ${room} · ${held} left in the bag`,
        bagEmpty: 'The bag is empty · aim at something to swallow it',
        refused: (room: string) =>
          `Blinky refuses ${room} · Nen is holding it, which is how the trap shows`,
        dispatched: (room: string) => `A bird is back from ${room} with what the room rests on`,

        // On the solids. A room is a place and a solid is a thing: these all
        // say what happened to a thing, and never what happened to a page.
        nothingToSteal: (room: string) =>
          `Nothing is holding ${room}, so there is nothing in it to take`,
        takenIntoTheBook: (room: string, technique: string) =>
          `${technique} is in the book · ${room} is let go of, because its owner cannot use it while it is held`,
        needsTwoPages: 'One page is not two · take a second before marking one',
        bookmarked: (technique: string) => `${technique} kept live beside the open page`,
        acquisitionFailed: (room: string) =>
          `${room} has been through the arrow · nothing acquires anything from it`,
        carded: (room: string, technique: string) =>
          `${technique} acquired as a card · ${room} keeps it too, and the card is spent by playing it`,
        notEligible: (room: string) =>
          `${room} is not dead · only what was killed passes anything on`,
        inherited: (room: string, technique: string) =>
          `${room} was killed by ${technique}, and that is what it hands over`,
        drained: (room: string, technique: string) =>
          `${technique} pulled out of ${room} · nothing reaches that room until the book returns it`,
        needsEmperorTime: 'The dolphin exists during Emperor Time and not otherwise',
        nothingToLend: 'The book is empty · there is nothing to explain and nothing to lend',
        lent: (technique: string) =>
          `${technique} explained and opened · the next cast consumes the loan`,
        pageSpent: (technique: string) => `${technique} is spent`,
        inZetsu: (room: string) => `${room} has no aura left to reach · the chain drained it`,
        owlAttached: (rooms: number) =>
          `The owl is with you · ${rooms} room${rooms === 1 ? '' : 's'} already on the trail, and it keeps them`,
        owlRecalled: (rooms: number) =>
          `The owl is off · ${rooms} kept anyway, as the walk always does`,
        foreseen: (room: string) => `Ten seconds on: ${room} · the vision does not revise itself`,
        diverged: (room: string, went: string) =>
          `The prediction still reads ${room}; you went to ${went}`,
        written: (room: string) => `The pen has written ${room} down`,
        lineTaken: (room: string, lines: number) => `${room} taken · line ${lines} of 3`,
        poemRead: (strength: number) =>
          strength
            ? `The three read as one route · ${strength} of them actually adjoin, and it carries`
            : `Three lines that do not meet · it will carry you, and badly`,
        dialSet: (room: string) => `The dial is set to ${room}`,
        dialRead: (room: string, reading: number) => `${room} · reading ${reading}`,
        dropletSent: (room: string, metres: number) =>
          `A droplet found ${room}, ${metres} m off — nowhere the walk has been`,
        dropletsDry: 'Every room has been walked into · there is nothing left to look for',
        dropletExpired: (room: string) => `The droplet on ${room} has dried up`,
        nameTaken: (room: string) => `${room} has the cat's name · kill it and it answers`,
        counterattack: (room: string, released: number) =>
          `${room} was killed, and answered · ${released} hold${released === 1 ? '' : 's'} taken off whoever did it`,
        markedVictim: (room: string) =>
          `${room} is marked · the sacrifice was chosen among its own and hidden from you`,
        sacrificeFound: (room: string) => `The sacrifice is in ${room}`,
        curseFell: (victim: string, sacrifice: string) =>
          `The sacrifice was spent in ${sacrifice} · ${victim} is gone with it`,
        soulsSwapped: (a: string, b: string) =>
          `${a} and ${b} woke as each other · both walls stand where they stood`,
        arrowDrawn: (room: string) => `The bow is drawn on ${room} · strike a second`,
        reinforced: (committed: number) =>
          `Aura committed · ${committed} of 6 · you go further and faster for it`,
        boarded: 'Boarded · load up to five and they are what fuels the run',
        alighted: (room: string, passengers: number) =>
          passengers
            ? `Set down in ${room} · ${passengers} put down with you`
            : `Set down in ${room}`,
        loaded: (solid: string, passengers: number) => `${solid} aboard · ${passengers} of 5`,
        holdFull: 'The hold takes five, and it has five',
        projected: (room: string) => `The body stays in ${room} · the double goes on without it`,
        returned: (room: string) => `Back in the body, in ${room}`,
        bodyDisturbed: (room: string) =>
          `Something reached the body in ${room} · you are pulled back into it`,
        reshaped: (metres: number) =>
          `Eyes at ${metres.toFixed(2)} m · the shape changed and nothing underneath did`,
        rested: (hours: number) =>
          `${hours} hours of rest in a short treatment · the strain is gone`,
        mended: (room: string, solids: number) =>
          solids
            ? `${solids} mended${room ? ` in ${room}` : ' across the whole ship'}`
            : `Nothing here was hurt`,
        dancePlayed: (bars: number) =>
          `The prologue, bar ${bars} · the music is what the rest runs on`,
        danceNeeded: 'No music yet · play the prologue first',
        mimicked: (solid: string) => `You are ${solid}, to the eye`,
        unmimicked: 'Your own shape again',
        soothed: (opened: boolean): string =>
          opened ? 'The three open again, and the music holds them open' : 'The music plays on',
        tunePlayed: (air: string, room: string, on: boolean, solids: number): string => {
          if (!on) return `${air} ends · ${room} is as it was`
          return solids
            ? `${air} in ${room} · ${solids} thing${solids === 1 ? '' : 's'} took it up and danced`
            : `${air} in ${room} · the room heard it and kept it`
        },
        // The Guardian Spirit Beasts. Each says what its animal did, never that
        // an animal turned up: the visitor is looking at it.
        beastRaised: (room: string, solids: number) =>
          solids
            ? `The beast hangs over ${room} · ${solids} thing${solids === 1 ? '' : 's'} off the deck and turning`
            : `The beast hangs over ${room} · nothing in it to lift`,
        beastDismissed: (room: string, solids: number) =>
          solids
            ? `The beast lets ${room} go · ${solids} thing${solids === 1 ? '' : 's'} back on the floor`
            : `The beast lets ${room} go`,
        wheelRaised: (room: string, coin: number) =>
          `The wheel is turning over ${room} · a coin worth ${coin} at its mouth, and worth nothing until somebody takes it`,
        wheelDismissed: (room: string) => `The wheel goes out of ${room}, coin and all`,
        coinTaken: (value: number, gilded: number) =>
          `Taken: ${value} · you carry ${gilded} of it now, and the next one out is worth ten times this`,
        liePushed: (solid: string, metres: number) =>
          metres
            ? `First contact · ${solid} is shoved, and marked for a second`
            : `First contact · ${solid} had nowhere to be shoved to, and is marked anyway`,
        lieGreened: (solid: string) => `Second contact · the green is in ${solid} and stays there`,
        lieTransformed: (solid: string) =>
          `Third contact · whatever is standing there, it is not ${solid} any more`,
        gasLoosed: (room: string, solids: number) =>
          solids
            ? `The beast is squatting in ${room} · ${solids} thing${solids === 1 ? '' : 's'} in the gas with it`
            : `The beast is squatting in ${room} · nothing in there to take`,
        gasLifted: (room: string) =>
          `The beast leaves ${room} · what it had already taken it keeps`,
        melted: (room: string, melting: number, gone: number) =>
          gone
            ? `${gone} gone in ${room}, ${melting} still going down`
            : `${melting} going down in ${room}`,
        roomBrightened: (room: string, levied: number) =>
          levied
            ? `${levied} taken off you, and ${room} is lit with it`
            : `${room} is lit · you had nothing committed, and it was returned anyway`,
        haloRaised: (levied: number, halo: number) =>
          `The room is already light, so it goes on you: ${levied} taken, ${halo} carried`,
        reeled: (pulled: number, eaten: number) =>
          eaten
            ? `${eaten} reached you and ${eaten === 1 ? 'was' : 'were'} swallowed${pulled ? ` · ${pulled} still coming` : ''}`
            : `${pulled} thing${pulled === 1 ? '' : 's'} being dragged towards you`,
        smokeLoosed: (room: string) =>
          `Every mouth on it opens · ${room} begins to fill, a colour at a time`,
        smokeLifted: (room: string, filled: number) =>
          `The beast leaves ${room} · it was ${filled} parts of the way through it`,
        smokeSpread: (room: string, filled: number, full: boolean) =>
          full
            ? `${room} is full · the mouths close`
            : `${room} takes another part · ${filled} of them in it now`,
        flockLoosed: (rooms: number, beasts: number) =>
          `${beasts} of them, over ${rooms} rooms · they do not stay in the rooms`,
        flockCalledIn: (rooms: number) => `Called back in from ${rooms} rooms · the ship is quiet`,
        isolationLifted: (room: string) =>
          `The beast stands out of the doorway · ${room} lets you leave`,
        crushedOne: (solid: string, left: number) =>
          left
            ? `${solid} goes under its paws · ${left} left in the room`
            : `${solid} goes under its paws · nothing left standing`,

        deduced: (what: string, strength: number) =>
          `Condition read — ${what} · ${strength} named, and stronger for each`,
        nothingToDeduce: 'Nothing left to read: every hold has been named',
        armourWorn:
          'The wrapping is on · what the ship would do to you from here is kept in it, not undone',
        armourHolding: (packed: number) =>
          packed
            ? `The wrapping holds ${packed} blow${packed === 1 ? '' : 's'} · nothing comes back until the sun rises on them`
            : 'The wrapping holds nothing yet · walk into what the aura has set against you',
        packedAway: (room: string, packed: number) =>
          `${room} did nothing to you: it went into the wrapping · ${packed} packed away`,
        sunRisen: (metres: number, solids: number) =>
          `The sun rose where you stand · ${metres} m of it, and ${solids} thing${solids === 1 ? '' : 's'} burnt with no regard for whose they were`,
        jailed: (room: string, doors: number) =>
          `${room} is chained shut · ${doors} way${doors === 1 ? '' : 's'} in, and none of them open`,
        jailRefused: (room: string) =>
          `Nothing is holding ${room} · the chain is for what Nen is already in`,
        fishLoosed: (room: string) => `The fish are in ${room} · nothing will show while you are`,
        fishFed: (room: string, solid: string) =>
          `${solid} was not there when you looked back into ${room}`,
        guardsPosted: (room: string) => `Guards on ${room} · an intruder is put out, not hurt`,
        expelled: (room: string, back: string) => `Put out of ${room}, back into ${back}`,
        cardBlue: (room: string) => `Blue: ${room} is admitted, and warned`,
        cardYellow: (room: string) => `Yellow: ${room} holds you where you stand`,
        cardRed: (room: string) => `Red: ${room} is dismissed and shut behind you`,
        vowDeclared: (room: string) => `The rule is set: you will not enter ${room}`,
        vowBroken: (room: string) =>
          `You entered ${room} knowing · the chain takes the aura for it`,
        pactTaken: (room: string) => `The terms are taken: reach ${room}`,
        pactMet: (room: string, released: number) =>
          released
            ? `${room} reached · the contract closes and lets ${released} hold${released === 1 ? '' : 's'} go`
            : `${room} reached · the contract closes with nothing owed`,
        baitSet: (room: string) => `What you wanted is standing in ${room}`,
        trapped: (room: string) => `You took it · ${room} does not let you back out`,
        heldFast: (room: string) => `${room} will not let you leave`,
        snakesLoosed: (rooms: number) =>
          `Four snakes, ${rooms} rooms in range · one of them has to be entered`,
        snakesFed: (room: string) => `The curse found its victim in ${room}`,
        snakesRebound: 'Dismissed with no victim · the curse comes back on the one who set it',
        puppeted: (solid: string) => `The antenna is planted · ${solid} is now under control`,
        puppetReleased: (solid: string) =>
          `The antenna is withdrawn · ${solid} is no longer controlled`,
        autopilotStarted: 'Autopilot engaged · the body moves on its own to complete the task',
        wormSet: (room: string) => `One end of the tunnel in ${room} · name the other`,
        wormOpen: (a: string, b: string) =>
          `${a} and ${b} are a night's route, and it is meant to be walked once`,
        wormCrossed: (room: string, crossings: number) =>
          `Out in ${room} · crossing ${crossings} of 3, and the worm is tiring`,
        wormSpent: 'The tunnel collapses · it was never meant to be asked three times',
        doublePosted: (room: string) => `The double stands in ${room}, beside whoever is left`,
        doubleSpent: (room: string) => `The double took it in your place, and is gone from ${room}`,
        doubleModeChanged: (watch: string) => `The double changes her watch · ${watch}`,
        owlModeChanged: (flight: string) => `The owl is sent differently · ${flight}`,
        owlFlown: (room: string) => `The owl has taken a door · it is in ${room} now`,
        owlExpired: (rooms: number) =>
          `The owl is gone · the last ten seconds of it, over ${rooms} room${rooms === 1 ? '' : 's'}, are playing in the corner`,
        noSolid: 'Nothing solid down the reticle',
        boundFast: (solid: string) => `${solid} is held fast · nothing but the chain gets it back`,
        gumSet: (solid: string) =>
          `Gum on ${solid} · take hold of a second thing to pull them together`,
        gumPulled: (solid: string, other: string) => `${solid} snapped across to ${other}`,
        gumTrapSet: (room: string) =>
          `Gum strung across ${room} · nothing shows it but Gyo, and it is still there`,
        gumRebound: (room: string) =>
          `${room} threw you back the way you came · the gum gave, and then it took`,
        gumPropulsion: 'The gum pulls you along · you walk the ship faster than you can',
        gumHealed: (healed: number) =>
          `The gum closes what was open · ${healed} blow${healed === 1 ? '' : 's'} out of the armour`,
        forged: (solid: string) =>
          `${solid} is wearing another surface · what it is, and what it stops, are unchanged`,
        wrapped: (solid: string) => `${solid} wrapped small · nothing about it is damaged`,
        unwrapped: (solid: string) => `${solid} is out of the cloth, the size it was`,
        pushed: (solid: string, metres: number) =>
          metres
            ? `${solid} pushed ${metres} m · it is a thing, so it moves like one`
            : `${solid} is against the wall of its room and goes no further`,
        stamped: (solid: string, puppets: number) =>
          `人 on ${solid} · ${puppets}/20 puppets · click it again to lock it`,
        stampLocked: (solid: string, locked: boolean, locks: number) =>
          locked
            ? `${solid} locked · ${locks} puppet${locks === 1 ? '' : 's'} will hear the next order`
            : `${solid} unlocked · it hears nothing until it is locked again`,
        ordered: (room: string, puppets: number) =>
          `“Go to ${room}” · simple enough for all ${puppets} locked puppet${puppets === 1 ? '' : 's'} to follow it`,
        noLock: (stamped: number) =>
          stamped
            ? `None of the ${stamped} puppets is locked · the order is spoken to nobody`
            : `Nothing is stamped · the order is spoken to nobody`,
        copied: (solid: string) =>
          `A copy of ${solid} stands beside it · it is drawn cold, because no page supports it`,
        crushed: (solid: string) => `${solid} is flat under the weight`,
        volley: (solid: string, hits: number) => `${solid} driven back · volley ${hits} of 3`,
        shattered: (solid: string) => `${solid} does not stand any more`,
        woundUp: (turns: number) =>
          `${turns} rotation${turns > 1 ? 's' : ''} wound into the next punch`,
        launched: (solid: string, metres: number) =>
          metres ? `${solid} sent ${metres} m across the room` : `${solid} had nowhere to go`,
        struck: (solid: string) => `The staff comes down on ${solid} and turns it`,
        lashed: (solid: string, hits: number) =>
          hits > 1
            ? `The chain cracks across ${solid} · ${hits} times now`
            : `The chain cracks across ${solid} and comes back`,
        bound: (solid: string) => `The snake has ${solid} · nothing else moves it now`,
        released: (solid: string) => `${solid} is let go`,
        armsFull: (solids: string) =>
          `Both snakes are out · they have ${solids}, and you have two arms`,
        cameUpUnder: (solid: string, other: string) =>
          `The aura ran out of ${solid} along the floor and came up under ${other}`,
        cameUpEmpty: (room: string) =>
          `The aura ran along the floor and came up out of the deck in ${room}`,
        stitched: (solid: string) => `${solid} is back as the blueprint has it`,
        nothingToStitch: (solid: string) => `Nothing was done to ${solid} to undo`,
        animated: (solid: string) => `${solid} is awake, and no less solid for it`,
        shredStuck: (solid: string) =>
          `The confetti sticks in ${solid} · every volley now goes there`,
        shredCut: (solid: string, left: number) => `${solid} is cut down to ${left}% of itself`,
        hammered: (solid: string) => `The arm was a hammer · ${solid} is driven into the deck`,
        bored: (solid: string) =>
          `The arm was a drill · there is a hole through ${solid}, and you can walk it`,
        halved: (solid: string, apart: boolean) =>
          apart
            ? `The arm was an axe · ${solid} is in two pieces, side by side`
            : `The arm was an axe · ${solid} is in two pieces, with nowhere to lay the second`,
        grown: (solid: string) => `${solid} has grown out of all proportion`,
        growthRefused: (solid: string) => `${solid} barely stirs · Nen is already in it`,
        marked: (solid: string, sun: boolean) => `${sun ? '☀' : '☾'} on ${solid}`,
        detonated: (solid: string, other: string) =>
          `${solid} and ${other} met, and neither is left`,
        swapped: (solid: string, other: string) =>
          `${solid} and ${other} have exchanged appearances, and nothing else`,
        cargoTaken: (solid: string) => `${solid} is loaded · name the relay it comes out at`,
        cargoLanded: (solid: string, room: string) => `${solid} is standing in ${room}`,
      },
      /** The techniques whose target is whoever is walking. */
      body: {
        reach: 'It works on you, wherever in the ship you are',
        castHint: 'The target is you: there is nothing in the ship to pick.',
        noTarget: 'Nothing to aim at: the target is you',
      },
      /** The read-out over the canvas, and the index, when a solid is the target. */
      solids: {
        reach: 'Any solid in the ship, from anywhere in it',
        castHint: 'Or pick any solid in the ship below',
        aiming: (solid: string) => `Facing ${solid}`,
        aimingNothing: 'Nothing solid in front of you',
        targets: 'Cast on a solid',
        relayTargets: 'Name the relay it comes out at',
        pairing: (solid: string) => `Holding ${solid}`,
        of: (solid: string, room: string) => `${solid} — ${room}`,
        copy: 'copy',
      },
      /**
       * The automatic writing. Four lines, each drawn off something the room's
       * own record actually says, so the prophecy is cryptic and never false.
       */
      verse: {
        provenance: [
          'A page holds it up, and the page does not blink.',
          'The cross-section swears to it, and shows no inside.',
          "Only this archive's own hand draws it.",
          'Nothing draws it. It stands so the deck can.',
        ],
        ways: [
          'No way leads in. It waits to be reached.',
          'One threshold, and everything passes through it.',
          'Few doors, and each of them chosen.',
          'Many ways in, and none of them quiet.',
        ],
        standing: [
          'Nothing stands here. That is the claim.',
          'A little stands, and it is what the room is.',
          'What stands here fills it before you do.',
          'You will walk around more than you walk through.',
        ],
        level: [
          'Above, someone is still asleep.',
          'Below, the springs take the weight.',
          'The hull is closer than it looks.',
          'It is not the deck that decides this one.',
        ],
      },
      /** The pages the visitor can cast from, which is the whole of wave five. */
      book: {
        title: 'The book',
        cast: 'Cast this page',
        hint: 'A page is cast where you are aiming, like anything else',
        card: 'card',
        loan: 'loan',
        // Double Face: the bookmark is not cast at anything, it is what keeps a
        // second page live beside the open one — so the panel offers two things
        // rather than one, and says which key plays each.
        bothLive: 'The book is open at two',
        bothHint: 'F casts the open page · R casts the one under the ribbon',
        turn: 'Move the ribbon',
      },
      holds: {
        book: 'In the book',
        openPage: 'Open at',
        bookmark: 'Kept beside it',
        hand: 'Cards in hand',
        zetsu: 'Drained',
        loan: 'On loan',
        trail: 'The trail',
        owl: 'The owl keeps',
        film: 'The film it brought back',
        foreseen: 'Ten seconds on',
        verses: 'Written down',
        poem: 'The poem',
        dial: 'The dial reads',
        droplets: 'Droplets out',
        ninelives: "The cat's name on",
        curse: 'Marked',
        souls: 'Woke as',
        enhance: 'Aura committed',
        riding: 'Aboard',
        eyes: 'Eyes at',
        projected: 'The body is in',
        dance: 'The prologue',
        mimic: 'Wearing',
        soothed: 'The music holds',
        playing: 'The flute is playing',
        flowered: 'In flower',
        scattered: 'Notes hanging in',
        dancing: 'Dancing to it',
        // The Guardian Spirit Beasts: where each animal is, and what it has
        // taken so far. The two that leave something on the visitor are read as
        // a figure, because that is what they leave.
        medusa: 'The beast holds',
        chimera: 'The beast is beside',
        toad: 'The gas is in',
        centipede: 'The secretion is in',
        cat: 'The cat is in',
        dragon: 'The doorway of',
        wheel: 'The wheel turns over',
        smoke: 'Filling',
        menagerie: 'Rooms they are loose in',
        lit: 'Lit',
        gilded: 'Coin carried',
        halo: 'The bubble',
        deduced: 'Conditions read',
        packed: 'The wrapping holds',
        packedHits: (packed: number) => `${packed} blow${packed === 1 ? '' : 's'}`,
        shut: 'Chained shut',
        guarded: 'Guarded',
        pinned: 'Held in',
        vow: 'The rule',
        pact: 'The terms',
        devouring: 'The fish are in',
        cards: 'Cards laid',
        double: 'The double',
        worm: 'The tunnel',
        snakes: 'Snakes loose in',
        trap: 'The bait is in',
        gumTrap: 'Gum strung across',
        crossings: (n: number) => `${n} of 3 crossings`,
        solid: 'Solids held',
        wound: 'The confetti is in',
        windup: (turns: number) => `${turns} rotation${turns === 1 ? '' : 's'} wound up`,
        laidOpen: 'The whole ship, laid open',
        isolated: 'Isolated room',
        doors: 'Hideout doors',
        eye: 'Remote eye',
        eyeFilm: 'The insect filmed',
        watched: 'Paper dolls',
        emptied: 'Swallowed',
        dowsing: 'The chain points at',
        phasing: 'Walking through walls',
        sealed: 'Senses sealed',
        // Named rather than drawn: the panel used three emoji here, which said
        // "eye, ear, mouth" only to a reader whose font drew them in colour.
        sealedSenses: (count: number) =>
          ['', 'sight', 'sight · hearing', 'sight · hearing · speech'][count] ?? '',
        dispatches: 'Dispatches',
        visits: (count: number) => `${count} arrival${count === 1 ? '' : 's'}`,
        armed: 'armed',
      },
    },
    /**
     * The one room of the walk you sit down in: Morena Prudo's negotiation
     * game, played across the table in the Heil-Ly hideout.
     */
    morena: {
      seoTitle: "Morena's Game — The negotiation table aboard the Black Whale",
      seoDescription:
        'Sit down opposite Morena Prudo in the Heil-Ly hideout and play the twelve-card negotiation game she puts Borksen through in ch. 407-410: seven questions against five answers, and one of them marked.',
      breadcrumb: "Morena's Game",
      title: "Morena's Game",
      intro:
        'Ch. 407-410 sits Borksen down in the leader’s office of the Heil-Ly hideout and deals twelve cards between them. Seven of them are questions, and they are Morena’s. Five are answers, and they are yours. You spend a question a round to learn what you are agreeing to; she takes an answer a round at random. Whatever is left when the questions run out is the answer you gave.',
      source:
        'Ch. 407-410 — the negotiation game, its twelve cards, the kiss traded for a card out of the graveyard, and the card Morena marked before dealing.',
      seat: 'The room is the hideout the deck plans draw. The table, and the chair on each side of it, are what the chapters put in it.',
      loading: 'Laying out the table…',
      unsupported:
        'This table needs WebGL, which this browser is not offering. The rules below are the whole of the game and can be read without it.',

      menu: {
        play: 'Sit down',
        rules: 'Read the rules',
        back: 'Back to the table',
        leave: 'Leave the table',
        deck: 'The deal',
        marked: 'As she deals it — one card marked',
        markedNote:
          'Morena cheats. One of your five answers is marked before it reaches you, and reaching for it at the end is what lets the manipulative half of Contagion in.',
        clean: 'A clean deal — nothing marked',
        cleanNote:
          'The same twelve cards with the marking taken out: the game as it would be if the restriction were kept. Not a hand she has ever played.',
        walk: 'Walk the hideout instead',
      },

      table: {
        fan: 'Her questions',
        asked: 'Asked',
        hand: 'Your answers',
        graveyard: 'Graveyard',
        empty: 'Nothing yet',
        markedCard: 'Marked',
      },

      round: (spent: number, left: number) =>
        `Round ${spent + 1} — ${left} answer${left === 1 ? '' : 's'} still in your hand`,
      askTitle: 'Spend a question',
      askHint: 'She answers it, and then she takes one of your cards. You do not choose which.',
      askedLabel: 'You asked',
      answerLabel: 'She said',

      // The table played with the hands: what the card under the reticle would
      // do if it were taken hold of. Every one of these is a move the panel
      // beside it also offers — the room is a second pair of hands on the same
      // game, not a second game.
      // Emperor Time, which is the one seat with a clock on it.
      scarlet: {
        watching: 'She is watching you spend it',
      },

      reach: {
        hint: 'Look at a card and click it.',
        cast: (effect: string) => `F — ${effect}`,
        /** The book's other page, on the walk's own second key. */
        castSecond: (effect: string) => `R — ${effect}`,
        ask: (question: string) => `Ask — ${question}`,
        kiss: (card: string) => `Kiss her, and take the ${card} back`,
        decline: 'Refuse the kiss, and play the hand you have',
        point: (card: string) => `Point the Joker at ${card}`,
        reachFor: (card: string) => `Reach into the graveyard for the ${card}`,
        play: (card: string) => `Put the ${card} down`,
      },

      questions: {
        goal: {
          title: 'What do you actually want?',
          short: 'Aim',
          morena:
            'A world where nobody is anybody’s subject. I was born to a mistress of the King and I have been nothing my whole life. I intend to take the throne apart and hand out what is inside it.',
        },
        power: {
          title: 'What is it you would put in me?',
          short: 'Power',
          morena:
            'Contagion. Twenty-two of you at most, and I know where each one is, how they are, and what they are worth. You go up a level for a life you take. Ten for a Nen user. Fifty for a prince.',
        },
        'if-yes': {
          title: 'What happens if I say yes?',
          short: 'If yes',
          morena:
            'I kiss you, and then you watch me kill somebody. Until both of those are done you are level zero and you are nothing. After them you are mine, and at level twenty you get an ability nobody else in the world has.',
        },
        'if-no': {
          title: 'What happens if I say no?',
          short: 'If no',
          morena:
            'You walk out. The game is my restriction and I would lose the ability if I broke it, so a no costs me and costs you nothing. That is the honest half of this, and it is the only honest half.',
        },
        contract: {
          title: 'What binds you to any of it?',
          short: 'Contract',
          morena:
            'The game itself. It ends when one of us dies or when the last card is played, and until then I cannot touch you. That is the whole contract. You are holding it.',
        },
        origin: {
          title: 'Where did you come from?',
          short: 'Origin',
          morena:
            'Out of wedlock, into a family that had a use for me and no name to give me. Member Zero is a title I made up because nobody had given me one of those either.',
        },
        price: {
          title: 'What am I worth to you?',
          short: 'Price',
          morena:
            'You are a soldier, a Hunter, and a Specialist who does not know it yet. You are worth more to me than the last four people who sat there put together — which is why you are getting answers and they got a kiss.',
        },
      },

      cards: {
        yes: { name: 'Yes', rule: 'The contract. Contagion, and level zero until you kill.' },
        no: { name: 'No', rule: 'The refusal. She honours it: the game is her own restriction.' },
        back: {
          name: 'Back',
          rule: 'Not an answer. Reaches into the graveyard and pulls one back out.',
        },
        joker: { name: 'Joker', rule: 'Becomes Yes or No, decided the moment it is played.' },
        x: { name: 'X', rule: 'Cancels the negotiation. Neither of you gets anything.' },
      },

      deal: {
        title: 'She leans across the table',
        body: 'One kiss, and you may take any card back out of the graveyard. She does not say that the kiss is one of the three conditions of Contagion in its own right. It is.',
        take: 'Take the deal',
        refuse: 'Refuse it',
        pick: 'And take back',
      },

      settle: {
        title: 'One card left',
        play: 'Play it',
        joker: 'Point the Joker',
        jokerHint: 'It is whichever of the two you say it is.',
        back: 'Reach into the graveyard',
        backHint: 'Whatever you pull out is the answer you gave.',
        backEmpty: 'There is nothing in the graveyard to reach for.',
      },

      verdicts: {
        infected: {
          title: 'Yes',
          body: 'You said it, and you said it knowing what it was. Contagion, level zero — one of twenty-two, and she can feel exactly where you are from anywhere on the ship.',
        },
        refused: {
          title: 'No',
          body: 'She sits back and lets you stand up. The game was her restriction and she keeps it: breaking it would cost her the ability, and the ability is the only thing she has.',
        },
        cancelled: {
          title: 'X',
          body: 'The negotiation is cancelled. No contract, no infection, and no answer — which is the one outcome the table cannot be made to give her.',
        },
        forced: {
          title: 'Yes — and you did not say it',
          body: 'You reached for the card she marked before she dealt it. The marking is the cheat, and cheating is what lets the manipulative half of Contagion in: the answer is narrowed to Yes or No, and she is the one who picks.',
        },
      },

      /**
       * What a Hatsu can do to twelve cards.
       *
       * The names come off the registry, so only what each one is worth *at
       * this table* is written here: one line for what it buys, one for what it
       * costs. That is the whole argument of the feature — nothing overrules
       * the canon, and everything plays on the holes the canon leaves.
       */
      hatsu: {
        title: 'The aura in your hands',
        none: 'Nothing in hand. Pick a technique up from the Nen dock and sit down again — some of them have a great deal to say to twelve cards.',
        useless: (name: string) =>
          `${name} has nothing to do at a card table. The dock will hand you something else.`,
        /**
         * Why the dock stops offering the other seventy while a hand is live.
         * Shown by the dock, which is why it has to read as a sentence on its
         * own rather than as a label on this page.
         */
        sealed:
          'A hand is in play at Morena Prudo’s table. Only what has something to say to twelve cards can be picked up here.',
        play: 'Play it',
        spent: (used: number, of: number) => `${used} of ${of} used`,
        exhausted: 'Spent',
        legal: 'Legal',
        fraud: 'Fraud',
        exposure: (percent: number) =>
          percent === 0 ? 'The room cannot see this' : `About ${percent}% chance the room sees it`,
        watching: 'LSDF is standing in this room. What it sees, she is told.',
        unwatched: 'Nothing in this room is watching any more.',
        buys: 'Buys',
        /** The one that is not pressed for: it writes when the table moves. */
        unbidden: 'Nobody plays this one. It writes when she reaches into your hand.',
        costs: 'Costs',
        seen: 'She saw that.',
        unseen: 'Nobody saw that.',

        /** What the visitor now knows, shown while it is still worth knowing. */
        read: 'Her fan is face up. You can see what she has left to ask.',
        foreseen: (card: string) => `She is going to take the ${card} next.`,
        forged: (card: string) =>
          `The ${card} in your hand is not yours. Nothing at this table can tell — but the kiss is a touch.`,
        shielded:
          'The vow is spoken. Nothing can narrow your answer now, and giving the Yes anyway would kill you.',
        proxied: 'You are not the person in this chair.',

        /**
         * Double Face, which is the one thing at this table that is two things.
         *
         * Chrollo's ribbon holds a second stolen page live beside the open one,
         * so what sits down is not a technique — it is a pair of them, drawn
         * fresh every deal out of what the archive has him carrying.
         */
        book: {
          title: 'The book, open at two pages',
          body: 'Double Face is not a move. It holds two of what Chrollo has stolen live at once — these two, drawn when the cards were — and each is played on its own key and spent out of its own purse.',
        },

        /**
         * The room while it is behind itself.
         *
         * Shown only while it is true. What a reader can see for themselves is
         * that the light has gone wrong; this is the sentence that says why,
         * and it goes away the moment the ten seconds are paid back.
         */
        rewound: {
          title: 'Ten seconds ago',
          body: (cards: number) =>
            `You have been here before, and only you know it. Morena is spending these seconds exactly as she spent them the first time — ${cards === 1 ? 'one card' : `${cards} cards`} she has no choice about — and your own hand is free. The room is her colour of blue until she has caught up.`,
        },

        /**
         * The quatrain the beast writes, and what it is about.
         *
         * Automatic writing: nobody asks for it and its subject is never shown
         * their own, so what the page can honestly print is a poem rather than
         * a card name. It is about the branch that loses — which at this table
         * was decided before the deal, by whichever card she marked.
         */
        ghost: {
          title: 'The quatrain the beast wrote',
          body: 'It was writing while Morena reached into your hand. Nobody asked it to, and it will not write again — a prophecy that revised itself would be worth nothing. What it is about is the branch that loses.',
          verse: {
            yes: [
              'The small red word costs nothing to say',
              'and cannot be unsaid afterwards.',
              'The hand that comes down to it comes down',
              'on a mouth that has already agreed.',
            ],
            no: [
              'The blue one is honoured. She says so,',
              'and she is made of the promises she keeps.',
              'Watch, then, the card she never reaches for:',
              'a door left open was left open on purpose.',
            ],
            back: [
              'One card fetches the others back,',
              'and this one was opened before it was dealt.',
              'The green is not the way out of the hand.',
              'It is the hand, waiting for your arm.',
            ],
            joker: [
              'The yellow one wears either face',
              'and is told which at the last moment.',
              'Ask whose mouth does the telling',
              'once everything else has left the table.',
            ],
            x: [
              'The violet one ends the negotiation',
              'and leaves nothing signed on either side.',
              'It is the branch she cannot spend —',
              'so it is the branch she prepared.',
            ],
          },
        },

        /**
         * The owl's footage, which is the one thing here that is a past tense.
         *
         * Every other read-out on this page says what is true now. This says
         * what was true when a bird on the bulkhead happened to be looking, and
         * the difference is the whole technique: the questions she has spent
         * since are still in the picture.
         */
        owl: {
          title: 'What the owl had already filmed',
          body: 'It was on the bulkhead before you sat down. This is her fan at the moment you thought to look back at the tape — greyed where she has spent the card since.',
        },

        leave: 'Walk out',
        leaveWarning:
          'The canon puts leaving under the same sanction as cheating: the answer is narrowed to Yes or No. There is no door out of this game that is not through it.',

        narrowed: {
          title: 'The Manipulation',
          cheating:
            'She saw it. The manipulative half of Contagion closes on your hand and takes the wider words out of it: Back, Joker and X leave the table. What you have left is Yes and No, which is what she was always going to accept.',
          leaving:
            'You stood up, and standing up is cheating. Back, Joker and X leave the table. You are still sitting here, and the answer is now Yes or No.',
        },

        effects: {
          read: 'Read her hand',
          foresee: 'See the card she takes next',
          pass: 'Suspend the exchange',
          recover: 'Take a card back',
          forge: 'Slip a card in',
          shield: 'Speak the vow',
          hide: 'Put the room’s eyes out',
          proxy: 'Sit somebody else down',
          evict: 'Empty her chair',
          blind: 'Take her senses',
          rider: 'Lay the clause',
          rewind: 'Take the ten seconds back',
        },

        techniques: {
          dowsing: {
            buys: 'A yes-or-no question aimed at the card she is about to take. Every refusal you give afterwards is a refusal you can back.',
            costs:
              'The chain is a chain: it hangs off your hand and it does not go into Zetsu. Good for one round, ruinous over five.',
          },
          future: {
            buys: 'The last exchange, taken back. The question returns to her fan and the card she took returns to your hand — and she has to spend those seconds exactly as she spent them, whatever you do with yours.',
            costs:
              'Everyone in the room except you goes on living the prediction, so nothing you do in those seconds is a thing anybody can react to. One exchange, once, and the room is visibly not itself until she has caught up.',
          },
          divination: {
            buys: 'A number dialled under the table, and an answer that is true.',
            costs: 'It is a telephone call, and a call is a thing somebody can walk in on.',
          },
          prophecy: {
            buys: 'A quatrain drawn before you sit down, naming the branch that loses.',
            costs:
              'It will not read its own bearer’s future: somebody else has to draw for you, which puts a third person in your game.',
          },
          surveillance: {
            buys: 'Owls at the bulkhead. You know the questions before they are asked.',
            costs:
              'Nothing at the table — it is all pre-game. Getting them in here is a break-in, and LSDF grades its guards on how serious the offence was.',
          },
          scout: {
            buys: 'A hamster on the table. It costs almost no aura, it survives your going under, and it does not look like Nen at all.',
            costs: 'It is still an animal nobody invited, and this is a room with eyes.',
          },
          'paper-spy': {
            buys: 'A doll stuck where it can see her hand, reporting everything it sees.',
            costs: 'Paper on a wall, in a room built to be searched.',
          },
          'truth-punch': {
            buys: 'One blow, one question, one answer out of the body itself — even when the mouth is lying.',
            costs:
              'Throwing a punch at the table is leaving the table. Keep it for the last exchange, when the Manipulation has nothing left to narrow.',
          },
          disguise: {
            buys: 'A card that is not yours: the right texture, the right weight, no aura to find.',
            costs:
              'The canon undoing of it is touch, and this game ends in a kiss. You win a hand you cannot conclude.',
          },
          melody: {
            buys: 'A round that costs you no answer. Three minutes of held attention, and nobody left the room.',
            costs:
              'Nothing at all. It is the only legal pause in the game — which is exactly why it is the only one.',
          },
          senses: {
            buys: 'Her sight, her hearing and her voice. She cannot ask the last question, so no Yes can be taken off you.',
            costs:
              'A game she cannot play is a game abandoned, and abandonment is punished on both sides. You buy a draw and you pay full price for it.',
          },
          'coin-growth': {
            buys: 'A card back out of the graveyard, paid for with a coin instead of with a kiss.',
            costs:
              'A coin is worth what it has been kept, and spending a year-old one spends the year. Nothing about it is hidden: this is honest money.',
          },
          clone: {
            buys: 'A copy of the stake, close enough that nothing at this table can tell.',
            costs:
              'The copy is inert and gone inside a day. She is not paid in smoke until tomorrow — by which time the game is closed and you are not in the room.',
          },
          growth: {
            buys: 'Something grown on the spot and put up as the stake.',
            costs: 'It grows in front of her.',
          },
          'drug-synthesis': {
            buys: 'A compound worth a card, synthesized and put on the table.',
            costs:
              'It cannot be made alone. The stake needs an ally, so the table is two heads against one — and she can see both of them.',
          },
          contract: {
            buys: 'Terms, a duration, penalties, and a Manipulation to enforce them. The answer stops being a word.',
            costs:
              'Nothing, and it binds you exactly as hard as it binds her. That is what makes it legal.',
          },
          'heart-vow': {
            buys: '“I will not answer Yes.” The only true immunity to the Manipulation there is.',
            costs:
              'You die if you give it anyway. She needs the Yes and has no use for the body, so she is the one who has to give way.',
          },
          polarity: {
            buys: 'The moon, put on her by contact — and the contact is the kiss she is going to ask you for.',
            costs:
              'Marking her means hands moving over a table she is watching. And it pays nothing at all unless she takes her second condition.',
          },
          curse: {
            buys: 'Your death made expensive: the mark takes one of her own with it.',
            costs:
              'It answers a clause she was never going to use. She does not kill her candidates, she recruits them.',
          },
          scarlet: {
            buys: 'Her fan face up and every card in the room accounted for. Nothing is hidden from these eyes and nothing about them is a fraud.',
            costs:
              'An hour of your life a second, and a negotiation is not short. She watches the candidate she is buying being spent, and stands up long before the year is out.',
          },
          resurrection: {
            buys: 'A cat in the corner that does nothing at all — until you die, and then it kills whoever did it.',
            costs:
              'It answers a direct killer and nothing else, and she does not kill her candidates. Telling her is the only part of it you can play.',
          },
          solicitation: {
            buys: 'The beast at your shoulder asks, and asks again, and a yes hands it the controls. This whole game, with the negotiation taken out.',
            costs:
              'What it collects is not the Yes on this table. It is a manifestation in a small room, and she can see it asking.',
          },
          'desire-trap': {
            buys: 'Her own opening, played back at her: what she wants, named out loud and set down as bait.',
            costs:
              'It is a beast, in a small room, on her floor. Half the time she watches it come up.',
          },
          'lie-marks': {
            buys: 'The bluff taxed, at both ends of the table. The only arrangement here under which playing honestly is strictly better.',
            costs:
              'It cuts both ways — and she has answered every question truthfully all game, because the game is her restriction.',
          },
          theft: {
            buys: 'Contagion itself. The ability seen in action, its owner questioned and answering, the imprint touched — inside an hour, and this game is all three at once.',
            costs:
              'You have to play the hand to its end and take the kiss to get the touch. Which is, exactly, how Morena loses it.',
          },
          puppet: {
            buys: 'Somebody else in the chair, saying somebody else’s answer.',
            costs:
              'A puppet has no desire for her to name and nothing of its own to stake. It cannot lose you the game and it cannot win it: the best-hidden fraud is the one capped at a draw.',
          },
          command: {
            buys: 'A stamped head in the chair, doing what it was told to do.',
            costs:
              'A puppet has no desire for her to name and nothing of its own to stake. It cannot lose you the game and it cannot win it: the best-hidden fraud is the one capped at a draw.',
          },
          needle: {
            buys: 'A needled head in the chair, playing the part to the letter.',
            costs:
              'A puppet has no desire for her to name and nothing of its own to stake. It cannot lose you the game and it cannot win it: the best-hidden fraud is the one capped at a draw.',
          },
          'identity-swap': {
            buys: 'Somebody else’s hands on your cards, and yours on theirs.',
            costs:
              'A swap is a swap: whatever the game does, it does to a body that is not yours — and the answer belongs to whoever is wearing it.',
          },
          guardian: {
            buys: 'A beast with no shape of its own, wearing a dead woman’s identity, her memory and her manner. It can sit, it can play, and it can say Yes.',
            costs:
              'Whoever it says it as does not exist, so there is nobody for the infection to land on. Catch it, though, and what is in the chair is you.',
          },
          mimicry: {
            buys: 'A borrowed face and a borrowed voice, taken from somebody you have spoken to.',
            costs:
              'It holds for as long as you spent with them and not a minute more — and seven questions in a closed room is exactly that budget being spent. Every round makes it likelier to slip.',
          },
          projection: {
            buys: 'A body in the chair that is not the one you are in. The kiss reaches nothing at all.',
            costs:
              'Yours is asleep somewhere else in this ship, and one word spoken to it ends the whole thing. This is a hideout full of people who could go and speak it.',
          },
          teleport: {
            buys: 'Her chair, emptied. She is not walking out — she is taken out, and a negotiation she did not finish is one nobody has to answer.',
            costs:
              'The only exit from this game that is not through the Manipulation, and it is theft in her own hideout. Seen doing it, you are the one who cheated and the game goes on without the trick.',
          },
          tribunal: {
            buys: 'The red card. It expels, it is legal, and it comes after a warning she cannot pretend she did not get.',
            costs:
              'A red card is earned. Two questions have to have been asked before there is anything to expel her over — and expelling her ends the negotiation without an answer, which is a draw and not a win.',
          },
          'room-isolation': {
            buys: 'The room taken out of the ship. Whatever you do next, there is nothing left that could report it.',
            costs: 'Being sealed in with her is being sealed in with her.',
          },
          'door-network': {
            buys: 'The doors decide what “leaving” even means, and the room stops being a place with witnesses.',
            costs:
              'They are her doors. They were built for this room, by her people, before you got here.',
          },
        },

        aftermath: {
          title: 'What it was worth',
          bound:
            'Moonlight Act holds the answer. It is a contract now, with terms and a penalty, and it binds whichever of you tries to walk away from it.',
          moon: 'She took the kiss, and the moon went on with it. She cannot touch anything wearing the sun again without both of them going off.',
          stolen:
            'Seen in action, questioned and answered, and touched — all three, inside the hour. Contagion is in the book. This is how Morena loses it.',
          'sworn-struck':
            'You gave the Yes with the chain in your heart. The vow does not negotiate: it was never a threat to her, it was a price on you.',
          smoke:
            'Tomorrow the copy is gone and she has been paid in nothing. The game is closed by then, and closed is closed.',
          taxed:
            'Every lie told across this table was marked as it was told. Honesty was the better play, and it was the better play for both of you.',
          trapped: 'She was made to answer her own opening. Nobody has done that to her before.',
          deterred:
            'Killing you costs her one of her own. She was never going to, but now she cannot afford to have been going to.',
          unaffordable:
            'She stood up. A recruit worth twenty-two levels is worth nothing at all if there is no life left in them to spend, and she was watching the meter run the whole time. Nobody said Yes, and nobody had to.',
          'burnt-out':
            'The year ran out with the cards still on the table. The eyes were open the whole hand, and they were always going to be paid for.',
          'stood-in':
            'Somebody was already sitting there. Kacho’s double takes the chair the moment the guest dies in it — indistinguishable, and dedicated to a person who is no longer at the table. The infection has nobody to be about.',
          solicited:
            'The beast got its yes. Nobody was infected by it, nobody was kissed, and nobody had to watch a murder — which is exactly what it is worth, and exactly why she asks for all three.',
          avenged:
            'You died at this table, and the cat crossed the room. Cat’s Name does not need to be told, believed or cast: it needed you dead, and she is the one who made that happen.',
          evicted:
            'She was taken out of her own chair before the last card came down. Nobody said Yes, so nobody was recruited — and a negotiation she did not finish is the one thing the canon has no answer for.',
          proxied:
            'It was not you in that chair. Nothing that happened here happened to you — and nothing that happened here could ever have been a win.',
        },
      },

      /**
       * The Heil-Ly dashboard: `docs/jeu-de-morena.md` §4.3.
       *
       * Under `tour.morena` rather than beside it because everything it names is
       * this game — the network it fills, the rounds it counts, and the frieze
       * of what was played under an aura to get there.
       */
      dashboard: {
        title: 'Heil-Ly — recruitment',
        unrevealed:
          'Recruitment procedure unknown. Nobody outside the hideout has seen how a candidate is turned, and the archive does not guess in front of a reader who has not got there yet.',
        network: 'The network',
        empty: 'Empty slot',
        noMembers: 'Nobody infected yet. Twenty-two is the ceiling, and it is a hard one.',
        level: (level: number) => `Level ${level}`,
        game: 'The negotiation',
        noGame: 'No game running.',
        round: 'Round',
        questions: 'Her questions',
        answers: 'Your answers',
        watch: 'Watched',
        verdict: 'Answer',
        narrowed: 'Back, Joker and X are off the table.',
        frieze: 'The frieze of frauds',
        noFrauds: 'Nothing was played across this table but cards.',
        caught: 'Seen',
        unseen: 'Missed',
        at: (round: number) => `R${round}`,
        steps: {
          'game-won-yes': 'A yes, won at the table',
          kiss: 'The kiss',
          'witnessed-murder': 'A murder, witnessed',
        },
      },

      conditions: {
        title: 'The three conditions of Contagion',
        said: 'A yes, won at the table',
        kissed: 'The kiss',
        witnessed: 'A murder, witnessed',
        met: 'met',
        unmet: 'not met',
        level: (level: number) => `Level ${level}`,
        none: 'Not infected',
        kissedAnyway:
          'You took the kiss and you still walked out. One of the three conditions is met and the other two never will be — which is the whole of what the deal actually cost you.',
      },

      log: {
        title: 'What happened',
        marked: (card: string) => `Morena marks the ${card} before she deals.`,
        asked: (round: number, question: string) => `Round ${round} — you ask: ${question}`,
        taken: (round: number, card: string) => `Round ${round} — she takes the ${card}.`,
        offered: 'She offers the kiss.',
        kissed: (card: string) => `You take the deal, and the ${card} back with it.`,
        declined: 'You refuse the deal.',
        recovered: (card: string) => `The ${card} comes back out of the graveyard.`,
        settled: (card: string) => `The last card is the ${card}.`,
        played: (round: number, technique: string, seen: boolean) =>
          `Round ${round} — ${technique}. ${seen ? 'She saw it.' : 'Nobody saw it.'}`,
        narrowed: (because: 'cheating' | 'leaving'): string =>
          because === 'cheating'
            ? 'Caught. Back, Joker and X leave the table.'
            : 'You stood up, which is cheating. Back, Joker and X leave the table.',
        exposed: (card: string) => `The kiss finds the forged ${card}.`,
        /**
         * The ten seconds, taken back.
         *
         * Said in the transcript rather than cut out of it: the exchange
         * happened, and then it happened again. A record with the erased
         * stretch quietly missing would be the page pretending the vision
         * never took place.
         */
        rewound: (cards: number) =>
          `The room goes back ten seconds. She still has ${cards === 1 ? 'a card' : `${cards} cards`} to take again, and no choice about which.`,
      },

      again: 'Deal again',

      rules: {
        title: 'The twelve cards',
        lines: [
          'Twelve cards, dealt between the two of you. Morena holds seven questions; you hold five answers — Yes, No, Back, Joker and X.',
          'Each round you spend one question. She answers it truthfully, because the game is a restriction on her own ability and lying in it would cost her Contagion.',
          'Then she reaches into your hand and takes a card at random. It goes to the graveyard, and you do not get to say which one it was.',
          'That is four rounds. Four questions asked, four answers gone, and one card left in your hand. That card is your answer.',
          'Back is not an answer — it pulls a card back out of the graveyard, and whatever comes out is what you said. Joker is whichever of Yes and No you point it at. X ends the negotiation outright.',
          'Somewhere around the third round she offers a kiss for a card out of the graveyard. The kiss is one of the three conditions of Contagion in its own right, so the card is not free and she does not mention the price.',
          'And she cheats. One of your five answers was marked before it reached you. Reaching for that one at the end hands her the manipulative half of Contagion, and the answer stops being yours.',
        ],
      },
    },
  },

  infiltration: {
    seoTitle: 'Infiltration — A mission aboard the Black Whale',
    seoDescription:
      'Enter a deck 1 apartment under cover, copy a report, and leave before witnesses can connect the evidence.',
    title: 'Infiltration',
    briefing: 'Mission order · Deck 1',
    chooseMission: 'Choose a mission',
    missions: {
      'missing-report': {
        name: 'The missing report',
        goal: 'Copy the report, confirm its author, and reach extraction.',
      },
      courier: {
        name: 'The watched courier',
        goal: 'Identify and follow the right courier without losing your cover.',
      },
      'listening-device': {
        name: 'The listening device',
        goal: 'Plant the device in the right room and leave without being detained.',
      },
      'compromised-shift': {
        name: 'The compromised shift',
        goal: 'Perform the expected duty and replace the register before relief arrives.',
      },
      'impossible-witness': {
        name: 'The impossible witness',
        goal: 'Gain their trust, extract them, and establish an alternative explanation.',
      },
      'three-princes': {
        name: 'The three princes meeting',
        goal: 'Place several sources and separate truth from prepared intelligence.',
      },
    },
    objectiveLabels: {
      copy: 'Copy the target without moving the original.',
      identify: 'Confirm the target identity.',
      follow: 'Follow the target to the handoff point.',
      plant: 'Plant the listening device in the target area.',
      extract: 'Reach the extraction point.',
    },
    v3: {
      campaign: 'Campaign',
      operations: 'operations',
      knownAreas: 'known areas',
      documentChecks: 'Document checks active',
      objectiveAxis: 'Objective',
      informationAxis: 'Information',
      coverAxis: 'Cover',
    },
    hatsuInteractive: {
      recall: 'Recall scout',
      surfaces: {
        'work-order': 'Work order',
        'door-sign': 'Door sign',
        'register-copy': 'Registry copy',
      },
      identities: {
        maintenance: 'Maintenance',
        security: 'Security',
        service: 'Service',
        messenger: 'Messenger',
      },
    },
    intro:
      'You enter as a maintenance aide. Copy the report at the far end of the apartment, confirm its true author if possible, then return to the entrance. Being seen is not losing: being understood is.',
    cover: 'Cover · Maintenance',
    integrity: 'Integrity',
    alert: 'Shared alert',
    objective: 'Objective',
    copied: 'Report copied',
    copy: 'Copy the report',
    verify: 'Verify the author',
    extract: 'Extract',
    divert: 'Diversion',
    challenge: 'Cover check',
    challengePrompt:
      'Your presence does not match the announced round. What explanation do you give?',
    workOrder: 'Present the maintenance order',
    bluff: 'Claim an urgent verbal instruction',
    taskCopy: 'Copy the report without moving it.',
    taskVerify: 'Identify its true author (optional).',
    taskLeave: 'Return to the entrance with a coherent story.',
    begin: 'Begin mission',
    debrief: 'Reconstruction after you left',
    score: 'Discretion',
    traces: 'Traces left',
    reports: 'Reports transmitted',
    discoveredTraces: 'Traces discovered',
    runStyle: 'Mission profile',
    styles: { ghost: 'Ghost', operator: 'Operator', exposed: 'Exposed' },
    chooseHatsu: 'Ability carried',
    castHatsu: 'Use Hatsu',
    uses: 'use(s)',
    hatsuRoles: {
      scout: 'Remote reconnaissance',
      forge: 'Mission-order forgery',
      disguise: 'Temporary social disguise',
      surveillance: 'Attached surveillance',
      tracker: 'Target tracking',
      interrogate: 'Forced interrogation',
      analyse: 'Information analysis',
      cleanup: 'Trace cleanup',
      mobility: 'Mobility and traps',
      theft: 'Borrowed ability',
    },
    hatsuConditions: {
      ten: 'Ten must be active',
      conscious: 'You must be able to act',
      aura: 'Not enough aura',
      uses: 'No uses remaining',
      uninterrupted: 'Unavailable during a cover check',
      target: 'Choose a target present in the room',
    },
    truth: 'Intelligence returned',
    confirmed: 'Author confirmed',
    uncertain: 'Author still uncertain',
    again: 'Try again',
    reported: 'Observation reported',
    unreported: 'Observation remained local',
    witnesses: { steward: 'The steward', guard: 'The guard', nenGuard: 'The Nen guard' },
    beliefs: {
      maintenance: 'Saw a maintenance worker',
      intruder: 'Suspects an intrusion',
      unknown: 'Established nothing',
    },
    outcomes: {
      playing: 'Mission in progress',
      escaped: 'Extraction successful',
      identified: 'Cover compromised',
      timeUp: 'Relief arrived',
    },
  },

  hunt: {
    seoTitle: 'The hunt — A game in Tserriednich’s apartment',
    seoDescription:
      'A prototype played inside the reconstruction: eight attested rooms of deck 1, one hunter, one reservoir of aura spent on knowing, preparing or surviving, and a duel decided by which zone rather than by how much.',
    breadcrumb: 'The hunt',
    title: 'The hunt',
    intro:
      'Eight rooms, ten minutes, and one hundred points of aura that have to cover knowing where he is, preparing the ground, and staying up when he finds you. Against an intact hunter you lose. The game is what you do about that beforehand.',
    enter: 'Click to walk',
    engaged: 'Tab releases the pointer',
    briefing: {
      eyebrow: 'HUNT PROTOTYPE',
      title: 'The hunter is already here.',
      premise:
        'Cross the apartment and reach the marked room. Listen to him, mislead him, and choose where contact happens.',
      rule: 'Your aura pays for knowing, preparing, and surviving. Against an intact hunter, you lose.',
      objective: 'Reach the target room — or prepare an encounter he cannot win.',
      hatsu: 'Equipped Hatsu',
      chooseHatsu: 'Choose your Hatsu',
      role: {
        prepare: 'Prepare the ground',
        foresee: 'Read future intent',
        locate: 'Locate probably',
      },
      hatsuRule:
        'Lays an elastic connection on a surface, concealed with In. It restrains without dealing damage.',
      begin: 'Enter the apartment',
    },
    actions: {
      hint: 'Hunt actions',
      sweep: 'Sense',
      zetsu: 'Go quiet',
      ten: 'Raise Ten',
      lay: 'Bungee Gum trap',
      take: 'Recover',
      hatsu: {
        'bungee-gum': 'Bungee Gum trap',
        'parallel-future': 'Open the future',
        'dowsing-chain': 'Dowse',
      },
    },
    hatsu: {
      future: (room: string, seconds: number) => `intent: ${room || 'elsewhere'} · ${seconds}s`,
      probable: 'probable direction, not a confirmed position',
    },
    controls: {
      walk: 'WASD — walk',
      look: 'Mouse — look',
      sweep: 'F — sweep with En (15)',
      zetsu: 'X — Zetsu: unseen, and unwarned',
      lay: 'V — lay an entrave (25)',
      take: 'R — take one back',
    },
    hud: {
      room: 'You are in',
      nowhere: 'Between rooms',
      target: 'Make for',
      aura: 'Aura',
      available: 'In hand',
      committed: 'Laid down',
      ten: 'Ten',
      zetsu: 'Zetsu',
      entraves: 'Entraves set',
      elapsed: 'Elapsed',
    },
    feel: {
      swept: 'Something passed over you.',
      footsteps: 'Footsteps.',
      muffled: 'Footsteps, through a wall.',
      sprung: 'Something of yours has gone off.',
      found: 'One of yours has been found.',
    },
    outcome: {
      title: 'The game is over',
      reached: 'You reached the room. He never had you.',
      timeUp: 'Ten minutes. He never found you, and you never got there.',
      eliminated: 'He had nothing left to hold his Ten with, and walked into what you left him.',
      caught: 'He had enough left to answer you.',
    },
    duel: {
      title: 'Contact',
      you: 'You',
      hunter: 'The hunter',
      zone: { head: 'Head', torso: 'Torso', arms: 'Arms', legs: 'Legs' },
      verb: {
        ryu: 'Ryu',
        gyo: 'Gyo',
        in: 'In',
        ko: 'Ko',
        ken: 'Ken',
        zetsu: 'Zetsu',
      },
      controls: {
        zone: '1–4 — where the aura sits',
        forward: '− = — forward, or held back',
        gyo: 'G — Gyo: read where his is',
        in: 'I — In: be unreadable',
        ken: 'K — Ken: covered everywhere, going nowhere',
        ko: 'Space — gather and strike',
        zetsu: 'X — drop it all and break away',
        take: 'R — take back what you laid here',
      },
      action: {
        guard: 'Guarded zone',
        reserve: 'Reserve',
        press: 'Pressure',
        observe: 'Observe',
        conceal: 'Conceal',
        endure: 'Endure',
        strike: 'Commit Ko',
        breakAway: 'Break away',
        recover: 'Recover entrave',
      },
      state: {
        held: 'Held',
        broken: 'His Ten no longer holds',
        breaking: 'Breaking away…',
        hidden: 'Unreadable',
        covered: 'Covered',
        forward: 'Forward',
        back: 'Held back',
      },
    },
    debrief: {
      title: 'What each of you believed',
      hunt: 'The hunt',
      duel: 'The contact',
      duration: 'Ran for',
      seconds: 'seconds',
      laid: 'Entraves laid',
      sprung: 'Sprung',
      recovered: 'Taken back',
      spent: 'Aura spent',
      remaining: 'Aura left',
      condition: 'The hunter, at the end',
      intact: 'Intact',
      journal: 'The record',
      nothing: 'Nothing was written down.',
      again: 'Again',
      actor: { player: 'You', hunter: 'The hunter' },
      kind: {
        sweptEn: 'swept with En',
        feltEn: 'felt a sweep pass',
        wentZetsu: 'dropped into Zetsu',
        wentTen: 'took the aura back up',
        laidEntrave: 'laid an entrave',
        tookEntraveBack: 'took an entrave back',
        sprungEntrave: 'walked into an entrave',
        spottedEntrave: 'spotted an entrave',
        inspected: 'searched the floor',
        believed: 'believed you were here',
        lostTheTrail: 'lost the trail',
        duelOpened: 'came within arm’s length',
        duelClosed: 'broke off',
      },
    },
  },

  arena: {
    seoTitle: 'Black Whale Arena — Nen combat in the banquet hall',
    seoDescription:
      'A deterministic combat mode built on Nen principles and fought inside an attested Black Whale room rather than an invented arena.',
    breadcrumb: 'Black Whale Arena',
    eyebrow: 'Banquet hall · Exhibition match',
    title: 'Black Whale Arena',
    intro:
      'The room, its tables, stage and bulkheads come directly from the ship reconstruction. Control aura flow, use the environment and commit only when the opening is real.',
    firstTo: 'First to 10',
    you: 'You',
    opponent: 'Floor fighter',
    aura: 'Aura',
    score: 'Score',
    distance: 'Distance',
    source: 'Attested room',
    enter: 'Click inside the scene to take control',
    zone: { head: 'Head', torso: 'Torso', arms: 'Arms', legs: 'Legs' },
    mode: { ten: 'Ten', ren: 'Ren', zetsu: 'Zetsu' },
    condition: { ready: 'Ready', staggered: 'Staggered', down: 'Down', ko: 'KO' },
    impact: {
      miss: 'Out of range',
      blocked: 'Blocked',
      clean: 'Clean hit · 1 point',
      critical: 'Critical hit · 2 points',
      knockdown: 'Knockdown · 3 points',
      ko: 'Knockout',
    },
    controls: {
      move: 'WASD / arrows — move through the room',
      modes: 'T / R / X — Ten, Ren, Zetsu',
      zone: '1–4 — move Ryu to a body zone',
      flow: '− / = — hold aura back or push it forward',
      perception: 'G / I — Gyo and In',
      defence: 'K — Ken',
      strike: 'Space — strike',
      ko: 'C — gather Ko',
    },
    keys: {
      label: 'Combat controls',
      strike: 'Click · F · Space',
      ko: 'C',
      ryu: '1–4',
      modes: 'T · R · X',
    },
    action: {
      strike: 'Strike',
      ko: 'Gather Ko',
      guard: 'Active guard',
      feint: 'Feint',
      restart: 'Fight again',
    },
    training: 'Nen initiation',
    auraDistribution: 'Ryu distribution',
    lesson: [
      { title: 'Shift your Ryu', body: 'Choose a zone with 1–4. Aura takes a moment to arrive.' },
      {
        title: 'Close your guard',
        body: 'Hold your read, then press Shift as the attack arrives.',
      },
      { title: 'Force a reaction', body: 'Press V to feint toward the zone you are targeting.' },
      { title: 'Punish the opening', body: 'Strike while your opponent is recovering.' },
    ],
    state: { gyo: 'Gyo', in: 'In', ken: 'Ken', ko: 'Ko gathering', concealed: 'Aura concealed' },
    outcome: { won: 'Match won', lost: 'Match lost' },
    roadmap:
      'The banquet hall is the first terrain drawn from the Black Whale. The same engine can now host other rooms from the plan without rebuilding their geometry.',
  },

  tourSources: {
    seoTitle: 'Sources — Where every room of the Black Whale comes from',
    seoDescription:
      'The evidence behind the reconstructed Black Whale, room by room: which chapter or plan each of the 314 spaces rests on, which corridors the reconstruction invented, and which walls were sealed on purpose.',
    breadcrumb: 'Sources',
    title: 'Where every room comes from',
    intro:
      'The reconstruction makes a claim about the ship for every surface it draws, so it publishes the evidence for each one. Nothing here is a summary: this is the whole of what the tour is built on, room by room, and every space the manga does not show is listed as invented.',
    counts: (spaces: number, sources: number) =>
      `${spaces} spaces, resting on ${sources} distinct sources`,
    tally: (label: string, count: number) => `${count} ${label.toLowerCase()}`,

    /**
     * The figure the page leads with. Counted off the blueprint rather than
     * written down, so it cannot go stale: a room may be reconstructed, but
     * nothing standing in a room ever is.
     */
    nothingInvented: (solids: number, invented: number) =>
      invented === 0
        ? `Not one of the ${solids} solids the tour stands in the ship is invented. Every bed, coffin, spring and grille is drawn on a plan or shown in a panel, and carries the source it comes from. What the reconstruction does invent is circulation — corridors that make a deck contiguous — and it says so on the wall.`
        : `${invented} of the ${solids} solids the tour stands in the ship rest on nothing drawn, and are marked as such.`,
    onThisPage: 'On this page',
    sections: {
      chapters: 'Chapters',
      method: 'Method',
      departures: 'Departures',
      rooms: 'Rooms',
      levels: 'Levels',
      solids: 'Solids',
      unfurnished: 'Left bare',
      joins: 'Joins',
      walls: 'Walls',
    },

    chapters: {
      title: 'Which chapters the ship is read out of',
      help: (count: number) =>
        `${count} chapters carry the whole reconstruction. The count is the number of claims — a room, a level, a solid, a stairwell — that name that chapter as their source. Pick one to see what rests on it.`,
      chapter: (chapter: number) => `Ch. ${chapter}`,
      filter: (chapter: number) => `Show what rests on ch. ${chapter}`,
    },

    levels: {
      title: 'The levels the rooms stand on',
      help: (decks: number, interiors: number) =>
        `${decks} decks and ${interiors} interiors drawn at their own scale. These are the claims everything else rests on: a room is on a deck because one cross-section puts it there, and an interior is the inside of one room because a plan or a panel draws it.`,
    },

    unfurnished: {
      title: 'What the reconstruction does not furnish',
      help: (count: number) =>
        `${count} rooms whose walls are attested and whose contents are not are left empty. That is the same rule as the rest of this page, running the other way: the eight VVIP suites, the bare floor of 37564, the auditoriums the cineplex plan names without drawing a seat. A chair invented to fill them would be a claim about the story rather than about the ship.`,
      bare: (count: number) => `${count} ${count === 1 ? 'room left bare' : 'rooms left bare'}`,
    },

    method: {
      title: 'What the drawings actually give',
      crossSection:
        'The cross-section in ch. 349 is the backbone. It stacks the five tiers and names what sits on each, which is what most of the ship rests on — but it is a diagram of adjacency, not a survey: it says what adjoins what, never how big anything is and never what is inside a room.',
      apartmentPlan:
        'The prince apartment plan gives the seven rooms behind one door, and ch. 362 onward shows those rooms furnished for Benjamin, Tserriednich and Luzurus. The deck plan draws the same apartment as a small box, because the two drawings are not to the same scale and never were. The tour keeps both rather than distorting either: the deck holds the footprint the plan draws, and the interior is a separate level at its own size.',
      scale:
        'One unit of the deck plans is read as 0.35 m, a factor set by the size of the rooms and not by the hull. Read at face value the plans give a 450 m banquet hall nobody could cross. The 175 m the reconstruction comes out at is a property of the reconstruction, not a measurement of the Black Whale.',
      doorways:
        'Doorways are not authored. Two spaces that share a stretch of wall open onto each other, derived from the geometry alone, so a footprint nudged by two metres cannot leave a door hanging in mid-air — a room that becomes unreachable fails the test suite instead.',
    },

    /**
     * The other half of the method: where the reconstruction departs from the
     * drawing it rests on. The order of authority puts the manga first, so a
     * departure is a debt — and an undeclared one reads as an oversight rather
     * than a decision. Written here rather than counted off the blueprint,
     * because what is missing from a file is exactly what the file cannot say.
     */
    departures: {
      title: 'What the cross-section says and the tour does not take',
      help: 'The order of authority puts the manga above everything, this page included: where a drawing and the reconstruction disagree, the drawing wins and it is the reconstruction that has to be redone. Four places depart from ch. 349 anyway, because a ship you walk cannot hold everything that drawing holds. That is the only ground a departure can stand on, and each one is declared here rather than left to be caught.',
      drawn: 'The cross-section draws',
      kept: 'The tour keeps',
      items: [
        {
          drawn:
            'Each of the five tiers as a stack of thin intermediate floors. A tier is a band of the hull in that drawing, not a storey.',
          kept: 'One walked floor per tier. A deck has 4.5 to 6 m of headroom and the tiers stand 27 m of ship apart, so six decks separate a ceiling from the floor above it: that gap is where those intermediate floors are. The tour does not visit them and does not deny them. One plan per tier is what keeps /ship and the tour the same ship, and that correspondence is the whole point of the reconstruction. The spacing is counted rather than chosen: the ship has 41 decks, the reconstruction holds seven of them and the liner carries ten above, which leaves six to a gap at 4.5 m each. The cross-section gives the order the tiers stack in, never the distance.',
        },
        {
          drawn:
            'A superstructure above tier 1 — the bridge and its funnel, standing clear of the hull.',
          kept: 'Nothing. No drawing gives its inside, and a shell that cannot be entered would be scenery. The ship the tour holds stops at the deck the apartments are on.',
        },
        {
          drawn:
            'The hull in elevation: the profile of the bow and the stern, and the bulb tier 5 sits inside.',
          kept: 'One closed outline per deck, sampled from the curves of the /ship deck plans, which are drawn from above. The reconstructed ship narrows deck by deck, but the wall of each deck rises vertical. A hull curving through the floor would move a wall by metres at the one place the deck plans say nothing.',
        },
        {
          drawn: 'A waterline, with tiers 4 and 5 below it.',
          kept: 'No field: nothing in the walk changes with it. It is recorded here because it bears on the strongest claim the blueprint makes — that of 314 spaces exactly two can see out. Two decks under water is why the other 312 are lit by what somebody switched on.',
        },
      ],
    },

    controls: {
      search: 'Search a room or a source',
      searchPlaceholder: 'Burial chamber, ch. 358, corridor…',
      evidence: 'Evidence',
      groupBy: 'Group by',
      bySource: 'Source',
      byDeck: 'Deck',
    },

    spaces: (count: number) => `${count} ${count === 1 ? 'space' : 'spaces'}`,
    walkThere: (name: string) => `Walk to ${name}`,
    insideOf: (room: string) => `inside ${room}`,
    noMatch: 'No space matches that.',

    links: {
      title: 'How the decks are joined',
      help: 'Stairs, lifts and bulkheads are the only connections the blueprint stores by hand, because the two spaces they join share no wall to derive an opening from.',
      stair: 'Stairwell',
      lift: 'Lift',
      bulkhead: 'Bulkhead',
      door: 'Door',
    },

    structures: {
      title: 'What stands in the rooms',
      help: 'The tour does not decorate: it never invents where a chair stood. It draws a solid in two cases only. When a drawing puts it there — the prince apartment plan draws the beds, the sofas, the dining table and the kitchen, which is survey rather than furnishing. And when what a panel shows is what the room is: the ring of coffins is the burial chamber, the springs are what the hull carries the ship on, and the grille across its front is the cell. Each is solid, and each carries its own source, which is not always the source of the room around it.',
      standingIn: (room: string) => `in ${room}`,
      count: (count: number) => `${count} ${count === 1 ? 'solid' : 'solids'}`,
    },

    seals: {
      title: 'Walls left blind on purpose',
      help: 'Since a doorway follows from a shared wall, a wall meant to stay solid has to be declared — and a declaration is a claim about the ship, so it carries its reason.',
    },

    doors: {
      title: 'Doors placed by hand',
      help: 'A door is placed by hand when the room plan draws it somewhere other than the middle of the shared wall, and when it is the single entrance to an apartment, which nothing else could open. It is also how a wall is opened over its whole length, for the fronts the plans draw in bars rather than in wall: a cell is shut by the grille standing in the opening, not by the wall the tour would otherwise have built there.',
      walls: (count: number) => `${count} ${count === 1 ? 'wall' : 'walls'}`,
    },

    data: {
      title: 'Check it yourself',
      help: 'Every line on this page is a field in the blueprint the tour loads. It is a single hand-edited file, and the test suite fails if a space carries no source, if an inferred space claims a chapter, or if any room of the ship becomes unreachable.',
      file: 'data/ship/blueprint.json',
      walkIt: 'Walk the ship',
    },
  },

  layout: {
    skipToContent: 'Skip to main content',
    brandHome: 'Black Whale — Home',
    brandTagline: 'Succession Archive',
    primaryNavigation: 'Primary navigation',
    quickFind: 'Quick find',
    openQuickNavigation: 'Open quick navigation',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
    siteNavigation: 'Site navigation',
    menuDossier: 'Navigation dossier',
    menuClassified: 'CLASSIFIED / 05 SECTIONS',
    mainSections: 'Main sections',
    archiveSections: 'Archive sections',
    menuFooterExpedition: 'Dark Continent Expedition',
    menuFooterStatus: 'Archive status: active',
    footerTagline: 'Succession Archive · Kakin Royal Expedition',
    footerSections: 'Sections',
    copyright: (year: number) => `© ${year} Black Whale Archive`,
    disclaimer: 'Unofficial fan project · Hunter × Hunter is © Yoshihiro Togashi / Shueisha',
    // LICENSE-DATA puts the catalogue and the hand-drawn maps under CC BY 4.0
    // and requires the credit to be visible in the deployed interface, not only
    // in the source. The three fragments wrap two links, so they are separate
    // strings rather than one sentence with markup in it.
    dataCreditPrefix: 'Catalogue and ship maps by Ginks —',
    dataCreditRepository: 'source repository',
    dataCreditLicensedUnder: '— licensed under',
    chooseLanguage: 'Choose a language',
    spoiler: {
      label: 'Spoiler filter',
      summaryFull: 'Spoilers · full canon',
      summaryLimited: (chapter: number | string) => `Spoilers · to ch. ${chapter}`,
      intro: 'Set the last chapter you have read. The archive hides everything after it.',
      chapterField: 'Last chapter read',
      rangeHint: (first: number | string, last: number | string) =>
        `Indexed chapters ${first}–${last}`,
      apply: 'Apply',
      clear: 'Show full canon',
    },
  },

  home: {
    seoDescription:
      'Navigate the people, decks, knowledge and Nen systems of the Black Whale Succession War — an interactive Hunter × Hunter archive.',
    eyebrow: 'Kakin Royal Expedition · Voyage 001',
    titleLead: 'Enter the',
    titleBrand: 'Black Whale',
    lede: 'An archive of the Succession War arc. It records where every passenger is, which body holds which consciousness, what Nen is in play, and what each character believes at that moment of the voyage.',
    exploreShip: 'Explore the ship',
    walkTheShip: 'Take the virtual tour',
    openRegistry: 'Open passenger registry',
    latestChapter: 'Latest indexed chapter',
    published: (date: string) => `Published ${date}`,
    metricsLabel: 'Archive metrics',
    metrics: {
      tiers: 'Ship tiers',
      passengers: 'Passengers catalogued',
      rooms: 'Rooms charted',
      abilities: 'Nen abilities',
    },
    manifestEyebrow: 'Intelligence architecture',
    manifestTitleLine1: 'One voyage.',
    manifestTitleLine2: 'Many realities.',
    manifestCopy:
      'The archive never treats information as absolute. Every record belongs to a time, a source, and a point of view.',
    dossierExplore: 'Explore ↗',
    dossiers: {
      ship: {
        title: 'The ship, deck by deck',
        copy: 'Navigate five tiers and inspect who is where at any point in the voyage.',
        tag: 'LIVE MAP',
      },
      timeline: {
        title: 'Every event, in order',
        copy: 'Trace each confrontation, alliance, and transfer in narrative order.',
        tag: 'EVENT LOG',
      },
      perspectives: {
        title: 'What each character knows',
        copy: 'See the same world through different minds, memories, and assumptions.',
        tag: 'KNOWLEDGE',
      },
    },
    closingEyebrow: 'Where to begin',
    closingTitleLine1: 'Start at the first',
    closingTitleLine2: 'recorded event.',
    openTimeline: 'Open the timeline',
  },

  registry: {
    seoTitle: 'Passenger Registry',
    seoDescription: (count: number) =>
      `Browse all ${count} passengers of the Black Whale: princes, guards, mafia, Hunters and Phantom Troupe members, with faction, deck and first appearance.`,
    collectionName: 'Black Whale passenger registry',
    collectionDescription:
      'Every catalogued passenger aboard the Black Whale, with faction and identity records.',
    eyebrow: 'Manifest 02 · Identity records',
    titleLine1: 'Passenger',
    titleLine2: 'Registry',
    note: 'Every identity is a moving target. Browse confirmed passengers, aliases, affiliations, and first recorded appearances.',
    totalRecords: 'Total records',
    visible: 'Visible',
    filtersLabel: 'Registry filters',
    searchPassengers: 'Search passengers',
    searchPlaceholder: 'Search by name, alias, or keyword…',
    filterByAffiliation: 'Filter by affiliation',
    independent: 'Independent',
    factionPrefix: 'Faction ',
    canonical: 'Canonical',
    secondary: 'Secondary',
    aka: 'AKA',
    noIntelligence: 'No public intelligence is currently available.',
    appearanceUnknown: 'Appearance unknown',
    emptyTag: 'NO MATCH',
    emptyTitle: 'The registry returned no identity.',
    emptyCopy: 'Change the affiliation or try a broader search.',
    beyondLineage: {
      filterLabel: 'Filter by Beyond’s lineage',
      all: 'Everyone',
      any: 'Beyond’s children',
      confirmed: 'Marked',
      suspected: 'Suspected',
      badgeConfirmed: 'Child of Beyond · marked',
      badgeSuspected: 'Child of Beyond · suspected',
      emptyCopy: 'No record matches Beyond’s lineage at your reading limit.',
    },
    categories: {
      intruderCell: 'Intruder cell',
      mafiaFamily: 'Mafia family',
      hunterAssociation: 'Hunter Association',
      stateAuthority: 'State authority',
      royalHousehold: 'Royal household',
      unaligned: 'Unaligned record',
    },
  },

  timeline: {
    seoTitle: 'Succession War Timeline',
    seoDescription:
      'An interactive chapter-by-chapter timeline of the Succession War arc: every confrontation, alliance and Nen transfer in canonical order.',
    breadcrumb: 'Timeline',
    eyebrow: 'Narrative dossier · Succession War',
    title: 'Timeline',
    intro:
      'Follow the Black Whale events chapter by chapter, replay them in the order they actually happened, and open the map at any point in the story.',
    summaryLabel: 'Timeline summary',
    chapters: 'Chapters',
    events: 'Events',
    latestRecord: 'Latest record',
    searchLabel: 'Search the timeline',
    searchPlaceholder: 'Search by event, chapter, or keyword…',
    orderLabel: 'Timeline order',
    storyOrder: 'Story order',
    storyOrderHint: 'Events grouped by chapter, in reading order',
    chronological: 'Chronological',
    chronologicalHint: 'Events in the order they happened aboard the ship',
    spoilerHint: 'Later events are hidden',
    spoilerLimited: (chapter: number | string) => `Spoilers limited to chapter ${chapter}`,
    fullCanon: 'Full canon',
    quickChapterAccess: 'Quick chapter access',
    index: 'Index',
    chapterAbbrev: 'CH.',
    chronologyEyebrow: 'Voyage chronology',
    chronologyTitle: 'In the order it happened',
    chapterLabel: (number: number | string) => `Chapter ${number}`,
    untitled: 'Untitled',
    openOnMap: (title: string) => `${title} — open on the map`,
    revealedIn: (chapter: number | string) => `↶ Revealed in chapter ${chapter}`,
    flashbackOccurrence: (ordinal: number | string | null) =>
      `↶ Flashback · occurrence #${ordinal}`,
    sequenceShort: (sequence: number | string) => `Seq. ${sequence}`,
    timeOnEvent: 'Time recorded on the event itself',
    undated: 'Undated',
    undatedHint: 'Happens off the voyage, so the ship’s clock says nothing about it',
    communitySourced: 'Dated by Hunterpedia',
    precision: {
      stated: 'Time stated by the manga',
      derived: 'Time worked out from a stated one',
      bracketed: 'Undated: the interval between the anchors around it',
    },
    emptyTitle: 'No events found',
    emptyCopy: 'Try another title, chapter number, or keyword.',
  },

  compare: {
    seoTitle: 'Perspective Comparison',
    seoDescription:
      'Put two characters side by side and see exactly where their knowledge of the Black Whale diverges — who is misinformed, and since which chapter.',
    breadcrumb: 'Compare perspectives',
    eyebrow: 'Investigation room · Synchronized intelligence',
    titleLine1: 'Truth is',
    titleLine2: 'relative.',
    intro:
      'Compare what two observers believe at the same event, location, and scale—then reveal the canonical record when clearance allows.',
    activeEvent: 'Active event',
    detectedGaps: 'Detected gaps',
    subjectsInView: 'Subjects in view',
    hideCanonical: 'Hide Reader Truth column',
    showCanonical: 'Compare with canonical reality',
    canonicalWarning:
      'Warning: this comparison reveals errors and illusions in the selected perspective.',
    canonicalBlocked: 'Canonical view unavailable beyond the permitted spoiler limit.',
    relatedViews: 'Related intelligence views',
    perspectiveSetup: 'Perspective setup',
    returnToMap: 'Return to ship map',
    event: 'Event',
    eventOption: (chapter: number | string, title: string) => `Ch.${chapter} - ${title}`,
    perspectiveA: 'Perspective A',
    perspectiveB: 'Perspective B',
    viewSynchronized: 'View synchronized maps',
    differencesOnly: 'Differences only',
    synchronizedZoom: 'Synchronized zoom',
    synchronizedTier: 'Synchronized tier',
    synchronizedZone: 'Synchronized zone',
    allZonesInTier: 'All zones in this tier',
    eventReadout: (chapter: number | string, title: string) => `Ch.${chapter} / ${title}`,
    noEventSelected: 'No event selected',
    activeComparison: 'Active comparison',
    versus: 'VERSUS',
    columnA: (name: string) => `Perspective A - ${name}`,
    columnB: (name: string) => `Perspective B - ${name}`,
    scopeReadout: (zoom: number | string, tier: string, zone: string) =>
      `Zoom ${zoom} · ${tier} · ${zone}`,
    allZones: 'all zones',
    syncedWithA: 'Synchronized with A (tier / zoom / zone / subject)',
    mapTitleA: (tier: string) => `Perspective A · ${tier}`,
    mapTitleB: (tier: string) => `Perspective B · ${tier}`,
    mapTitleReader: (tier: string) => `Reader truth · ${tier}`,
    readerTruthTitle: 'Reader Truth — Canonical reality',
    spoilerLimit: (chapter: number | string) => `Spoiler limit: chapter ${chapter}`,
    unlimited: 'unlimited',
    noCanonicalInfo: 'No specific canonical information for this subject at this time.',
    differencesMobile: 'Differences only (mobile)',
    noDifferencesForFilter: 'No differences for this filter.',
    assumedIdentity: 'Assumed identity',
    unknownIndividual: 'Unknown individual',
    unknownLocation: 'Unknown location',
    unknownValue: 'unknown',
    rowTypes: {
      canonicalFact: 'canonical fact',
      actualPosition: 'actual position',
      contestedBelief: 'contested belief',
      fact: 'fact',
      belief: 'belief',
    },
    filters: {
      all: 'All',
      identities: 'Identities',
      positions: 'Positions',
      statuses: 'Statuses',
      abilities: 'Abilities',
      affiliations: 'Affiliations',
      events: 'Events',
    },
  },

  factions: {
    seoTitle: 'Faction Intelligence',
    seoDescription:
      'Inspect the alliances, conflicts and known members shaping the Black Whale succession war — prince factions, mafia families, Hunters and the Phantom Troupe.',
    breadcrumb: 'Factions',
    eyebrow: 'Strategic intelligence · Black Whale',
    title: 'Faction Network',
    intro:
      'Trace who cooperates, who is being used, and where open conflict has begun. Every connection is tied to the chapter that establishes it.',
    factions: 'Factions',
    knownTies: 'Known ties',
    affiliatedPeople: 'Affiliated people',
    spoilerNotice: (chapter: number | string) =>
      `Intelligence limited to chapter ${chapter}. Later connections remain concealed.`,
    indexLabel: 'Faction index',
    chooseFaction: 'Choose a faction',
    searchFactions: 'Search factions',
    searchPlaceholder: 'Search the network…',
    factionSummary: (members: number, ties: number) => `${members} personnel · ${ties} ties`,
    emptyIndex: 'No faction matches this search.',
    selectedDossier: (index: string) => `Selected dossier · ${index}`,
    knownConnections: 'Known connections',
    filterConnections: 'Filter connections',
    relationTypes: {
      all: 'all',
      alliance: 'alliance',
      cooperation: 'cooperation',
      conflict: 'conflict',
      control: 'control',
      patronage: 'patronage',
    },
    establishedIn: (chapter: number | string) => `Established ch. ${chapter}`,
    signalAbsent: 'Signal absent',
    noConnection: 'No documented connection',
    noConnectionCopy:
      'This does not mean the faction is neutral—only that the current dossier has no chapter-backed tie matching this filter.',
    knownPersonnel: 'Known personnel',
    recordCount: (count: number) => `${count} records`,
    affiliationConfirmed: 'Affiliation confirmed',
    noPersonnel: 'No named personnel are confirmed in the current catalogue.',
  },

  palette: {
    dialogLabel: 'Quick navigation',
    searchLabel: 'Search site destinations',
    placeholder: 'Where do you want to go?',
    empty: (query: string) => `No destination matches “${query}”.`,
    enterHint: 'Enter to open first result',
    shortcutHint: '⌘K anywhere',
    groups: {
      primary: 'Primary',
      dossier: 'Dossier',
    },
    destinations: {
      ship: 'Explore the Black Whale',
      timeline: 'Open the timeline',
      characters: 'Search the passenger registry',
      perspectives: 'Inspect character knowledge',
      abilities: 'Browse the ability archive',
      compare: 'Compare perspectives',
      relationships: 'View the faction network',
      simulations: 'Run simulations',
    },
  },

  voyage: {
    label: 'Black Whale voyage progress',
    shipTime: 'Ship time · Latest canon record',
    day: (day: number | string) => `Day ${day}`,
    daysRemaining: 'days remaining',
    progressLabel: 'Voyage progress',
    valueText: (day: number | string, total: number | string) => `Day ${day} of ${total}`,
    departure: 'Departure',
    finalCheck: 'Final check',
    newContinent: 'New Continent',
    territorialWaters: 'Territorial waters',
    waterSplit: '3 weeks known waters · 5 weeks uncharted',
  },

  prophecy: {
    sheetCode: 'LOVELY GHOSTWRITER · APOCRYPHAL SHEET',
    covers: 'Covers',
    foretells: 'Foretells',
    desireLabel: 'What the subject wants',
    unwritten:
      'The page for this subject was never written — the ability cannot predict the future of whoever is holding it.',
    glossSummary: 'Read the gloss — names the events the poem only gestures at',
    footer:
      "Written in the style of Neon Nostrade's poems. Lovely Ghostwriter had already vanished from Skill Hunter when the Black Whale sailed: this sheet is a reconstruction, not a record.",
  },

  audio: {
    sealedOff: 'Voyage theme sealed by Three Monkeys — turn off',
    turnOff: 'Turn off the voyage theme',
    turnOn: 'Play the voyage theme',
    sealed: 'Sealed',
    theme: 'Theme',
  },

  voyageArt: {
    vessel: 'Black Whale 1',
    route: 'Kakin → New Continent',
    title: 'Black Whale 1 at sea',
    description:
      'The colossal whale-shaped expedition vessel carries the Tier 1 royal ship above its five decks while moving through dark ocean swells.',
    specsHull: 'Semi-submersible · 41 decks',
    specsPassengers: '200,000 passengers',
  },

  nen: {
    forcedZetsu: 'FORCED ZETSU',
    nenSealed: (remaining: string) => `Nen sealed · ${remaining}`,
    zetsuCost: 'Emperor Time exhausted one year of life.',
    changeHatsu: 'Change Hatsu',
    activeHatsu: (owner: string) => `ACTIVE HATSU · ${owner}`,
    release: 'Zetsu · release',
    activateAHatsu: 'Activate a Hatsu',
    pickerLabel: 'Hatsu selection',
    globalAura: 'GLOBAL AURA SYSTEM',
    activateTechnique: 'Activate a technique',
    searchHatsu: 'Search Hatsu',
    searchPlaceholder: 'Technique or user…',
    pickerFooter: (count: number) =>
      `${count} known techniques · the activation persists across navigation`,
    /**
     * What the dock says where only some techniques work. The room supplies
     * the reason — the dock is site-wide and knows nothing about card tables.
     */
    gateBadge: 'Nothing to do here',
    gateFooter: (usable: number, reason: string) => `${usable} usable here · ${reason}`,
    why: 'WHY?',
    projectedEffects: 'PROJECTED EFFECTS',
    noProjectedEffects: 'No effect can be projected in this state.',
    noTarget: 'no target',
    masked: 'masked',
    maskedTitle: 'In: real but invisible outside Gyo',
    postMortem: 'post-mortem',
    postMortemTitle: "Survives the user's death",
    cost: (label: string) => `Cost: ${label}`,
    planStatus: {
      AVAILABLE: 'Action available',
      LOCKED: 'Action locked',
      UNKNOWN: 'Conditions not revealed by canon',
      FORBIDDEN: 'Action refused by the engine',
    },
    parallelFuture: 'PARALLEL FUTURE',
    ended: 'ENDED',
    replayLastEvents: 'Replay the last five events',
    guardianLabel: 'KACHO · NEN POST-MORTEM',
    portalStart: 'START',
    portalReturn: 'RETURN',
    enterTunnel: 'Enter tunnel',
    crossBack: 'Cross back',
    culdceptAcquiring: 'CULDCEPT · ACQUIRING',
    skillHunter: 'SKILL HUNTER',
    useStolenControl: 'Use stolen control',
    astralDouble: 'ASTRAL DOUBLE',
    bodyRemains: 'Body remains behind',
    followAsDouble: 'Follow route as the double →',
    activateCaptured: 'Activate captured Hatsu',
    noKnownHatsu: 'No known Hatsu',
    lifeConsumed: (hours: number | string) => `LIFE CONSUMED · ${hours} / 8,760 H`,
    trays: {
      pocket: 'FUN FUN CLOTH',
      vacuum: 'BLINKY STORAGE',
      relay: 'TRANSPORT RELAY',
      hidden: 'HIDDEN SPACE',
    },
    captured: {
      inherit: 'BENJAMIN BATON',
      capture: 'CULDCEPT CARD',
      abilityLoan: 'STEALTH DOLPHIN · SINGLE-USE LOAN',
      steal: 'STEAL CHAIN · INDEX DOLPHIN',
    },
  },

  mapUi: {
    regionLabel: 'Interactive deck map',
    unmappedArea: 'Unmapped area',
    gapEyebrow: 'Cartographic gap · local scan unavailable',
    gapCopy:
      'This zone is indexed in the archive, but no verified local floor plan has been recovered.',
    returnToTierMap: 'Return to tier map',
    mapNotFound: (tier: string) => `Map for ${tier} not found`,
    backToTier: '← Back to tier',
    canonNote: 'Canon zones · schematic geometry',
    canonNoteTitle:
      'Named zones and fixtures follow published manga panels; distances and unshown geometry are schematic.',
    zoomControls: 'Map zoom controls',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetView: 'Reset map view',
    keyboardZoom: 'zoom',
    keyboardReset: 'reset',
    locationDetails: 'Location details',
    closeLocationDetails: 'Close location details',
    charactersHere: 'Characters at this location',
    noCharacterHere: 'No tracked character is present at the selected event.',
    walkThere: 'Walk this room',
    derivedFrom: 'Derived from presence records for the selected event.',
    unknownLocationTitle: 'Unknown location',
    closeUnknownPositions: 'Close unknown positions',
    bodiesWithoutLocation: (count: number) => `${count} bodies without a mapped location`,
    identifiedSplit: (identified: number, unknown: number) =>
      `${identified} identified · ${unknown} unknown`,
    everyBodyMapped: 'Every tracked body has a mapped location at this event.',
    directObservation: 'Direct observation',
  },

  perspectiveUi: {
    selectorLabel: 'Perspective selector',
    perspective: 'Perspective',
    tracking: 'Tracking',
    chooseTrackingMode: 'Choose tracking mode',
    followOptions: {
      consciousness: 'Follow consciousness',
      body: 'Follow body',
      appearance: 'Follow public appearance',
    },
    whyLabel: 'Why this information',
    whyTitle: 'Why am I seeing this?',
    character: 'Character',
    displayedValue: 'Displayed value',
    source: 'Source',
    observation: 'Observation',
    freshness: 'Freshness',
    knowledgeStatus: 'Knowledge status',
    knowledgeSource: 'Knowledge source',
    canonicalReality: 'Canonical reality',
    statusAria: (label: string, state: string) => `${label}: ${state}`,
    differenceType: 'Difference type',
    staleAria: (lastConfirmed: string) => `Information outdated since ${lastConfirmed}`,
    staleLabel: (lastConfirmed: string) => `Latest information: ${lastConfirmed}`,
    streamsLabel: 'Multi-stream timeline',
    streams: {
      reality: 'Reality',
      body: 'Body',
      consciousness: 'Consciousness',
      knowledge: 'Knowledge',
    },
    transferLabel: 'Consciousness transfer transition',
    originBody: 'Origin body',
    destinationBody: 'Destination body',
    contextLabel: 'Perspective context',
    spoilersUpTo: (limit: number | string) => `Spoilers <= ${limit}`,
    allChapters: 'all',
    apparentIdentity: 'Apparent identity',
    mode: 'Mode:',
    comparisonLabel: 'Perspective comparison',
    legendLabel: 'Comparison legend',
    codes: 'Codes',
    codeLegend: {
      same: 'consistent between A and B',
      leftOnly: 'information only in A',
      rightOnly: 'information only in B',
      contradiction: 'explicit contradiction',
      confidenceGap: 'certainty gap',
      temporal: 'temporal divergence',
    },
    markerAria: (label: string, certainty: string) => `${label} (${certainty})`,
    markerPosition: (identity: string, location: string, status: string) =>
      `${identity}, ${location}, ${status}`,
    unknownPosition: 'unknown position',
    unknownStatusLower: 'unknown status',
    unknownStatus: 'Unknown status',
    unspecifiedLocation: 'Unspecified location',
    outsideTier: 'Outside tier',
    transferredConsciousness: 'Transferred consciousness',
    assumedIdentity: 'Assumed identity',
  },

  map: {
    unknownBody: 'Unknown body',
    outsideTier: 'Outside tier',
    unknownPosition: 'Unknown position',
    unknownFuturePosition: 'Unknown future position',
    parallelFuture: 'Parallel future',
    positionInChapter: (chapter: number | string | undefined) => `Position in chapter ${chapter}`,
    futureIdentity: (name: string, chapter: number | string | undefined) =>
      `${name} · Ch. ${chapter}`,
    assumedIdentity: 'Assumed identity',
    unknownIndividual: 'Unknown individual',
    activeSuspicion: 'Active suspicion',
    structuralPresence: 'Structural presence',
    factSource: (predicate: string) => `Fact: ${predicate}`,
    beliefSource: (predicate: string) => `Belief: ${predicate}`,
    roomConfirmed: 'Room confirmed · position in room not depicted',
    spotInferred: 'Position in room inferred from the scene, not depicted',
    sinceEvent: (eventId: string) => `since ${eventId}`,
    unknownEvent: 'unknown event',
    unidentifiedIndividual: 'Unidentified individual',
    knownIdentity: 'known identity',
    unknownIdentity: 'unknown identity',
    temporal: {
      assumedPosition: 'Assumed position',
      assumedDetail: 'Likely presence, unconfirmed',
      lastKnown: 'Last known position',
      lastKnownDetail: 'Potentially outdated information',
      unknownStatus: 'Unknown status',
      unknownDetail: 'Certainty level not provided',
      confirmedPeriod: 'Confirmed over a period',
      periodDetail: (from: number | string, until: number | string) => `Events ${from} to ${until}`,
      confirmedAtEvent: 'Confirmed at this event',
      eventDetail: (sequence: number | string) => `Event ${sequence}`,
      confirmedInChapter: 'Confirmed during this chapter',
      confirmedPresence: 'Confirmed presence',
      sinceDetail: (sequence: number | string) => `Since event ${sequence}`,
    },
  },

  ship: {
    seoTitle: 'Black Whale Map — Hunter × Hunter',
    seoDescription:
      'Explore the five tiers of the Black Whale deck by deck: rooms, known character positions and the perspective of anyone aboard, chapter by chapter.',
    breadcrumb: 'Ship map',
    eyebrow: 'Dark Continent Expedition',
    intro: 'Tactical mapping of decks, presences, and zones of influence.',
    statusLabel: 'Map status',
    event: 'Event',
    eventValue: (chapter: number | string, sequence: number | string) =>
      `Ch. ${chapter} · Ev. ${sequence}`,
    activeZone: 'Active zone',
    perspective: 'Perspective',
    canonVisible: 'Canon visible',
    compareWithCanon: 'Compare with canon',
    comparePerspectives: 'Compare perspectives',
    navigation: 'Navigation',
    shipDecks: 'Ship decks',
    decksNavLabel: 'Black Whale decks',
    overview: 'Overview',
    shipStructure: 'Longitudinal section',
    tierLabel: (tier: number | string) => `Tier ${tier}`,
    /**
     * The band between two modelled decks on the section. The ship has 41
     * decks and the reconstruction walks 5, so this says what the gap is
     * rather than letting it read as empty ship.
     */
    unmodelledDecks: (metres: number) => `${metres} m of decks not reconstructed`,
    /**
     * The band over tier 1 on the section, open at the top edge. Tier 1 is a
     * liner and the reconstruction holds one floor of it, so the label has to
     * say the ship goes on rather than let the drawing stop.
     */
    superstructure: (decks: number) => `Liner superstructure — ${decks} decks not reconstructed`,
    tierSummaries: [
      'Royalty & VVIP',
      'VIP & amenities',
      'Public & medical',
      'Crew & cargo',
      'Machinery & storage',
    ],
    factionsLabel: 'Factions',
    factionsActive: (count: number) => `${count} active`,
    clearFactionFilters: 'Clear faction filters',
    beyondLineage: {
      label: 'Beyond’s lineage',
      filterLabel: 'Filter the map by Beyond’s lineage',
      aboard: (count: number) => `${count} aboard`,
      all: 'Everyone',
      any: 'His children',
      confirmed: 'Marked',
      suspected: 'Suspected',
      note: 'Crosses the faction filters: marked carry the birthmark, suspected are only claimed to.',
    },
    factions: {
      princes: 'Royal houses',
      guards: 'Royal guard',
      hunters: 'Hunters',
      spider: 'Phantom Troupe',
      mafia: 'Mafia families',
    },
    intelligenceLabel: 'Current map intelligence',
    currentSignal: 'Current signal',
    tracked: 'Tracked',
    zones: 'Zones',
    clearanceLabel: 'Archive clearance',
    accessLevel: 'Access level',
    withheld: 'Portions withheld by order of the Kakin Crown',
    track: 'Track',
    trackAria: 'Quickly track a perspective',
    liveData: 'Live data synchronized',
    mapHint: 'Drag to navigate · Scroll to zoom',
    mapRegion: 'Interactive Black Whale map',
    unresolved: 'UNRESOLVED',
    structuralLevel: 'STRUCTURAL LEVEL',
    activeScan: 'ACTIVE SCAN',
    scanReadout: (zones: number, presences: number) =>
      `${zones} mapped zones · ${presences} tracked presences`,
    assessmentLabel: 'Current intelligence assessment',
    activeEnvironment: 'Active environment',
    humanDensity: 'Human density',
    threatAssessment: 'Threat assessment',
    incidentMarker: 'Incident marker',
    surveillance: 'Surveillance',
    nenPhenomenon: 'Nen phenomenon',
    unverified: 'UNVERIFIED',
    anomalyCaveat: 'Do not assign intent · observer contamination possible',
    interceptedReport: 'Intercepted report',
    /** Split around the redaction blocks so they keep their own markup. */
    interceptCopy: {
      lead: 'Source',
      mid: 'reports that',
      tail: 'crossed the secured boundary without a matching body record.',
    },
    chainOfCustody: 'CHAIN OF CUSTODY DISPUTED',
    level: (level: string) => `LEVEL ${level}`,
    pointOfView: 'Point of view',
    observationFilter: 'Observation filter',
    mapLegend: 'Map legend',
    temporalCertainty: 'Temporal certainty',
    legendLabel: 'Colors by temporal certainty',
    legend: {
      currentEvent: 'Current event',
      confirmedPeriod: 'Confirmed period',
      currentChapter: 'Current chapter',
      confirmed: 'Confirmed',
      assumed: 'Assumed',
      lastKnown: 'Last known position',
      unknown: 'Unknown',
    },
    unknownPositions: (count: number) => `Unknown positions (${count})`,
    timeline: 'Timeline',
    currentState: 'Current state',
    flashbackBadge: '↶ FLASHBACK ·',
    chapterBadge: 'CH',
    eventBadge: 'EV',
    timelineEvent: 'Timeline event',
    noEvents: 'No events available.',
    readerView: 'Reader view',
    localArea: 'Local area',
    followLabels: {
      consciousness: 'follow consciousness',
      body: 'follow body',
      appearance: 'follow public appearance',
    },
    timelinePoints: {
      canonicalEvent: 'Canonical event',
      bodyMovement: 'Body movement',
      biologicalState: 'Biological state',
      mentalAnchor: 'Mental anchor',
      transfer: 'Transfer',
      informationReceived: 'Information received',
      perspectiveUpdate: 'Perspective update',
      spoilerFiltered: 'Spoiler-filtered canon',
      subjectiveView: 'Subjective point of view',
    },
    deckClearance: {
      overview: 'Global scan',
      'tier-1': 'Royal clearance',
      'tier-1-b': 'Royal clearance',
      'tier-1-c': 'Royal clearance',
      'tier-2': 'VIP clearance',
      'tier-3': 'Public access',
      'tier-3-b': 'Public access',
      'tier-3-c': 'Public access',
      'tier-4': 'Crew clearance',
      'tier-4-b': 'Crew clearance',
      'tier-5': 'Restricted systems',
      'tier-5-b': 'Restricted systems',
    },
    tiers: {
      overview: {
        title: 'Ship overview',
        subtitle: 'Five societies under one hull',
        clearance: 'ARCHIVE / GLOBAL',
        pressure: 'Layered control',
        danger: 'ELEVATED',
        signal: 'Cross-deck surveillance active',
        anomaly: 'Parasitic aura signatures remain unresolved',
        report: 'Passenger manifests disagree with security counts on the lower decks.',
      },
      'tier-1': {
        title: 'Royal precinct',
        subtitle: 'Ceremonial calm · concealed succession war',
        clearance: 'KAKIN / ROYAL',
        pressure: 'Silent hostility',
        danger: 'SEVERE',
        signal: 'Private armies monitoring all corridors',
        anomaly: 'Multiple guardian entities inferred · direct observation impossible',
        report: 'Four deaths in Room 1014. Cause redacted by royal authority.',
      },
      'tier-1-b': {
        title: 'Garrison Deck',
        subtitle: 'Quarters, cells and the court · one deck above the royal deck',
        clearance: 'KAKIN / ROYAL',
        pressure: 'Standing garrison',
        danger: 'SEVERE',
        signal: 'Watch relieved between the cells and the barracks',
        anomaly: 'Which deck holds these blocks is the reconstruction’s, no page gives it',
        report: 'The high-security prisoner remains under permanent Zodiac guard.',
      },
      'tier-1-c': {
        title: 'Guest Deck',
        subtitle: 'Casino and the queens’ block · two decks above the royal deck',
        clearance: 'KAKIN / ROYAL',
        pressure: 'Watched leisure',
        danger: 'HIGH',
        signal: 'Listening reported around the gaming tables',
        anomaly: 'Which deck holds these blocks is the reconstruction’s, no page gives it',
        report: 'No plan assigns any of the eight rooms of the queens’ block.',
      },
      'tier-2': {
        title: 'VVIP district',
        subtitle: 'Privilege behind controlled access',
        clearance: 'VVIP / BLUE',
        pressure: 'Controlled access',
        danger: 'GUARDED',
        signal: 'Detention and transit channels monitored',
        anomaly: 'Residual aura detected near restricted suites',
        report: 'Intercepted routing order references an unregistered holding area.',
      },
      'tier-3': {
        title: 'Civic deck',
        subtitle: 'Hospitals, courts and public movement',
        clearance: 'CIVIL / AMBER',
        pressure: 'Information overload',
        danger: 'UNSTABLE',
        signal: 'Justice Bureau feeds partially synchronized',
        anomaly: 'Unattributed Nen activity reported through civilian channels',
        report: 'Witness statements conflict after a disappearance near the medical district.',
      },
      'tier-3-b': {
        title: 'First-class deck',
        subtitle: 'Cabins and one trap room · a floor over the civic deck',
        clearance: 'CIVIL / AMBER',
        pressure: 'Paid quiet',
        danger: 'GUARDED',
        signal: 'Corridor watch thinner than the manifest asks for',
        anomaly: 'Which floor holds these cabins is read off the cross-section, not drawn',
        report: 'Room 3101 answers to a booking no line of the register accounts for.',
      },
      'tier-3-c': {
        title: 'Ordinary cabin deck',
        subtitle: 'The level 3 general cabins · the top floor of the tier',
        clearance: 'CIVIL / AMBER',
        pressure: 'Crowding',
        danger: 'UNSTABLE',
        signal: 'Assembly-point corridor announced twice a day',
        anomaly: 'Which floor holds these cabins is read off the cross-section, not drawn',
        report: 'Cabin counts on this floor exceed the berths the block is drawn with.',
      },
      'tier-4': {
        title: 'Industrial passage',
        subtitle: 'Cargo routes contested by three families',
        clearance: 'CREW / RED',
        pressure: 'Faction friction',
        danger: 'CRITICAL',
        signal: 'Blind corridors and mafia relays detected',
        anomaly: 'Spatial discontinuities reported by multiple teams',
        report: 'Three intercepted transmissions use mutually exclusive location codes.',
      },
      'tier-4-b': {
        title: 'Ei-I floor',
        subtitle: 'One family office, and a deck that carries nothing else',
        clearance: 'CREW / RED',
        pressure: 'Faction friction',
        danger: 'CRITICAL',
        signal: 'Relay traffic without a registered terminal',
        anomaly: 'The height of this office is read off the cross-section, not drawn',
        report: 'The office is declared at an address the deck plan does not list.',
      },
      'tier-5': {
        title: 'Lower machinery',
        subtitle: 'Crowding, scarcity and failing oversight',
        clearance: 'RESTRICTED / BLACK',
        pressure: 'Systemic collapse',
        danger: 'EXTREME',
        signal: 'Official surveillance coverage below threshold',
        anomaly: 'Hostile aura bloom · classification unavailable',
        report: 'Casualty ledger sealed. Seventeen passenger IDs no longer resolve.',
      },
      'tier-5-b': {
        title: 'Fifth-class cabin deck',
        subtitle: 'The general cabins and bay 37564 · a floor over the hangar door',
        clearance: 'RESTRICTED / BLACK',
        pressure: 'Crowding without oversight',
        danger: 'EXTREME',
        signal: 'No patrol logged on this floor since departure',
        anomaly: 'Which floor holds these cabins is read off the cross-section, not drawn',
        report: 'A bay off the cabin corridor is numbered and appears on no berth list.',
      },
    },
  },

  characterDetail: {
    seoTitle: (name: string) => `${name} · Role & movement`,
    fallbackDescription: (name: string) =>
      `Ship role, faction and chapter-by-chapter movement record for ${name} aboard the Black Whale.`,
    breadcrumbLabel: 'Breadcrumb',
    registryLink: 'Passenger registry',
    subjectPrefix: 'SUBJECT',
    eyebrow: 'Ship role · Movement record',
    alsoKnownAs: 'Also known as',
    roleAboard: 'Role aboard',
    noConfirmedRole: 'No confirmed role',
    locateOnShip: 'Locate on ship',
    firstRecord: 'First record',
    chapterUpper: (chapter: number | string) => `CH. ${chapter}`,
    latestPosition: 'Latest position',
    reportedStatus: 'Reported status',
    unconfirmed: 'Unconfirmed',
    latestTransition: 'Latest transition',
    noneRecorded: 'None recorded',
    unknownLocation: 'Unknown / possibly off ship',
    fileIndex: 'File index',
    dossierSections: 'Dossier sections',
    scope: 'Scope',
    scopeNote:
      'Only operational role, body location, consciousness location and continuity states are retained.',
    sections: {
      role: 'Role aboard',
      identity: 'Identity continuity',
      biography: 'Biography',
      nen: 'Nen & abilities',
      prophecy: 'Ghostwriter sheet',
      appearances: 'Manga appearances',
      trajectory: 'Chapter trajectory',
    },
    codes: {
      operationalPosition: 'OPERATIONAL POSITION',
      identityContinuity: 'IDENTITY / CONTINUITY',
      characterRecord: 'CHARACTER RECORD',
      auraProfile: 'AURA PROFILE',
      apocryphal: 'APOCRYPHAL · LOVELY GHOSTWRITER',
      sourceIndex: 'SOURCE INDEX',
      trajectory: 'BODY · CONSCIOUSNESS · SPECIAL SPACE',
    },
    currentFunction: 'Current function',
    currentArea: 'Current / last-known area',
    statusUnconfirmed: 'Status unconfirmed',
    catalogueAffiliation: 'Catalogue affiliation',
    identityTitle: 'Body and identity differ',
    relatedRecord: 'Related record',
    abilitiesAndPowers: 'ABILITIES & POWERS',
    primaryType: 'PRIMARY TYPE',
    activateAbility: (name: string, description: string) => `Activate ${name}: ${description}`,
    hatsuActive: 'HATSU ACTIVE',
    clickToActivate: 'CLICK DESCRIPTION TO ACTIVATE',
    noAppearanceRecord: 'No individual appearance record documented.',
    noAppearanceCopy:
      'Hunterpedia does not provide a dedicated Succession Contest appearance template for this character.',
    battles: 'BATTLES',
    competitions: 'COMPETITIONS',
    trajectoryIntro:
      'The body and consciousness are tracked independently. “Unknown” is kept as a meaningful position; transfers, death, copies, dimensional passages and possible exits from the ship remain explicit.',
    positionsCount: (count: number) => (count > 1 ? `${count} POSITIONS` : '1 POSITION'),
    routeWithinChapter: 'ROUTE WITHIN CHAPTER',
    bodyConsciousnessPositions: 'BODY / CONSCIOUSNESS POSITIONS',
    positionInChapter: 'POSITION IN CHAPTER',
    noTransition: 'No chapter transition recorded.',
    lastKnownPosition: (location: string) => `Current or last-known position: ${location}.`,
    /** Body/consciousness state values as the engine emits them. */
    states: {
      ALIVE: 'Alive',
      INJURED: 'Injured',
      UNCONSCIOUS: 'Unconscious',
      DEAD: 'Dead',
      DESTROYED: 'Destroyed',
      PRESERVED: 'Body preserved',
      UNKNOWN: 'Unknown',
      ACTIVE: 'Consciousness active',
      TRANSFERRED: 'Consciousness transferred',
      SUPPRESSED: 'Consciousness suppressed',
      DORMANT: 'Consciousness dormant',
      DISCONNECTED: 'Consciousness disconnected',
      death: 'Death',
      corpse: 'Corpse located',
      soul: 'Soul / consciousness',
      clone: 'Clone or Nen copy',
      impersonated: 'Identity impersonated',
      disguised: 'Disguised presence',
      absent: 'Position unknown',
      debut: 'First located',
      appears: 'Located in chapter',
      pictured: 'Position depicted',
    },
    kinds: {
      'body-location': 'Body movement',
      'body-state': 'Body state',
      'consciousness-state': 'Consciousness state',
      'consciousness-location': 'Consciousness location',
      appearance: 'Reported presence',
    },
  },

  abilities: {
    seoTitle: 'Nen Ability Archive',
    seoDescription:
      "Every Nen ability documented aboard the Black Whale — conditions, limitations and owners, from Bungee Gum to the princes' guardian spirit beasts.",
    breadcrumb: 'Abilities',
    title: 'Nen Ability Archive',
    subtitle: 'Abilities registered in the narrative engine.',
    unknownCategory: 'Unknown',
    noDescription: 'No description available.',
    activate: 'Activate across the site',
    activateAria: (name: string) => `Activate ${name} across the site`,
    cost: (cost: string | number) => `Cost: ${cost}`,
    empty: 'No abilities found.',
  },

  simulations: {
    seoTitle: 'Simulation Lab',
    seoDescription:
      'Fork the canonical Black Whale timeline, execute Nen rules against a branch, and inspect the projected world without altering canon.',
    breadcrumb: 'Simulations',
    eyebrow: 'WORLD KERNEL / BRANCH LAB',
    title: 'Simulation Lab',
    intro:
      'Fork canon, execute Nen rules and inspect the projected world without altering the canonical timeline.',
    branchUnavailable: 'Branch unavailable',
    forkTitle: 'Fork canonical state',
    canonicalEvent: 'Canonical event',
    eventOption: (chapter: number | string, sequence: number | string, title: string) =>
      `Ch. ${chapter} · ${sequence} — ${title}`,
    rulePolicy: 'Rule policy',
    policies: {
      ruleCompatible: 'Rule compatible',
      strictCanon: 'Strict canon',
      sandbox: 'Sandbox',
    },
    createBranch: 'Create branch',
    branchStateTitle: 'Branch state',
    id: 'ID',
    policy: 'Policy',
    fork: 'Fork',
    forkValue: (chapter: number | string, ordinal: number | string) =>
      `Ch. ${chapter} / ordinal ${ordinal}`,
    currentCursor: 'Current cursor',
    entities: 'Entities',
    activeEffects: 'Active effects',
    executeTitle: 'Execute an ability',
    executeCopy:
      "Pick an ability, one of its actions and a target to plan against this branch. The conditions and effects below are the module's own — the same ones the server runs on activation.",
    ability: 'Ability',
    action: 'Action',
    noActions: 'No action available',
    actorReference: 'Actor reference',
    targetEntity: 'Target entity',
    selectTarget: 'No target',
    planAction: 'Plan action',
    runAction: (label: string) => `Run: ${label}`,
    moveTitle: 'Move an entity',
    moveCopy:
      "The kernel's other branch action: putting someone somewhere canon does not. The move is applied to this branch only.",
    moveEntity: 'Entity',
    moveDestination: 'Destination',
    moveSubmit: 'Move in this branch',
    noMarkers: 'This branch places no entity on the deck plans.',
    markersElsewhere: (count: number) =>
      count === 1 ? '1 entity stands on another deck.' : `${count} entities stand on other decks.`,
    sceneTitle: 'Projected MapScene',
    markers: 'markers',
    effectLinks: 'effect links',
    auraLayers: 'aura layers',
    noEffects: 'No branch-specific effect has been emitted yet.',
  },

  perspectives: {
    seoTitle: 'Perspectives & Comparison',
    seoDescription:
      "See the Succession War through each character's eyes: what they know, what they only believe, and where their information has gone stale.",
    breadcrumb: 'Perspectives',
    title: 'Perspectives & Comparison',
    intro:
      "Explore a character's subjective world at a precise moment, or compare the beliefs of two protagonists.",
    openSubjectiveMap: 'Open subjective map',
    openKnowledgeMap: 'Open knowledge map',
    openComparison: 'Perspective Comparison',
    pointInTime: 'Point in time (event)',
    searchEventPlaceholder: 'Search by title or chapter...',
    eventOption: (chapter: number | string, title: string) => `Ch. ${chapter} — ${title}`,
    noEvents: 'No events found.',
    observerA: 'Observer A (required)',
    observerB: 'Observer B (comparison)',
    chooseCharacter: 'Choose a character',
    noneSingleView: '(None — single view)',
    selectPrompt: 'Select an event and at least one observer to view the data.',
    identityState: 'Identity state (V2)',
    occupiedBody: 'Occupied body',
    activeConsciousness: 'Active consciousness',
    subjectiveFacts: 'Subjective facts & beliefs',
    factSubject: (predicate: string, subject: string) => `${predicate} (Subject: ${subject})`,
    noKnownFacts: 'No known facts retrieved.',
    differencesTitle: 'Contradictions & Perspective Differences',
    knowsButNot: (knower: string, other: string) => `${knower} knows this, but ${other} does not.`,
    contradiction: 'Contradiction',
    versus: 'VS',
    value: (value: string) => `Value: ${value}`,
    noDifferences: 'No differences found in the information known by both characters.',
    perspectiveOf: (name: string) => `${name}'s perspective`,
    apparentIdentity: 'Apparent identity & physical state (V2 engine)',
    notFound: 'Not found',
    consciousness: 'Consciousness',
    knowledgeBase: 'Knowledge & belief base',
    contestedBelief: 'Contested belief',
    verifiedFact: 'Verified fact',
    subjectPrefix: 'Subject:',
    noVerifiedKnowledge: 'This character has no verified knowledge at this point in time.',
    retrieving: 'Retrieving perspective data from the engine...',
  },

  perspectiveDetail: {
    seoTitle: (character: string) => `Perspective — ${character}`,
    seoDescription: (character: string) =>
      `The Black Whale as ${character} understands it: their timeline, their sources, and where their information has gone stale.`,
    title: (character: string) => `${character}'s perspective`,
    intro:
      'Subjective map and timeline: what this character knows, believes, suspects, or ignores.',
    subjectiveMap: 'Subjective map',
    confirmedPosition: 'Confirmed position',
    likelyPosition: 'Likely position',
    lastKnownPosition: 'Last known position',
    activeKnowledge: 'Active knowledge',
    apparentIdentity: 'Apparent identity',
    dissonant: 'identity dissonance',
    cursor: 'Point in time',
    apply: 'Apply',
    noEvents: 'No canonical event is available at your spoiler limit.',
    noKnowledge: 'The archive records no knowledge for this character at this point.',
    noPositions: 'The archive places no body this character could see at this point.',
    markersElsewhere: (count: number) =>
      count === 1 ? '1 body seen on another deck.' : `${count} bodies seen on other decks.`,
  },

  knowledgeDetail: {
    seoTitle: (character: string) => `Knowledge — ${character}`,
    seoDescription: (character: string) =>
      `What ${character} knows, believes and has not yet learned about the events aboard the Black Whale.`,
    title: (character: string) => `Knowledge Map: ${character}`,
    intro: 'An archive of knowledge, suspicions, rumors, and outdated information.',
    informationState: 'Information state',
    graphTitle: 'Knowledge graph',
    since: (chapter: number) => `since ch. ${chapter}`,
    between: (from: number, until: number) => `ch. ${from} → ch. ${until}`,
    toldBy: (source: string) => `told by ${source}`,
    confidence: (percent: number) => `${percent}% confidence`,
    noKnowledge: (character: string) =>
      `The archive records no fact or belief held by ${character} within your spoiler limit.`,
    openPerspective: 'Open perspective',
    openProfile: 'Open profile',
  },

  bodyDetail: {
    seoTitle: (label: string) => `Body — ${label}`,
    seoDescription: (label: string) =>
      `Continuity record for ${label}: observed positions, reported states and consciousness occupancy aboard the Black Whale.`,
    title: (label: string) => `Body history: ${label}`,
    intro: 'Biological timeline, consciousness occupancy, and public appearance.',
    bodyType: 'Body type',
    owner: 'Original owner',
    occupants: 'Consciousnesses recorded inside',
  },

  consciousnessDetail: {
    seoTitle: (label: string) => `Consciousness — ${label}`,
    seoDescription: (label: string) =>
      `Transfer record for ${label}: which body it occupies, when it moved, and how certain each observation is.`,
    title: (label: string) => `Consciousness history: ${label}`,
    intro: 'Tracking transfers, suppressions, and mental anchors.',
    consciousnessType: 'Consciousness type',
    origin: 'Origin character',
    bodiesOccupied: 'Bodies occupied',
  },

  /**
   * Wording for the identity archive: the enum values the schema stores, and the
   * few sentences the continuity list needs around them. Each dictionary is a
   * `Record<string, string>` so a value the catalogue has no wording for can fall
   * back to the stored one instead of rendering blank.
   */
  identity: {
    continuityTitle: 'Continuity record',
    noEntries: 'The archive holds no record for this entity within your spoiler limit.',
    firstVisible: 'First visible',
    interval: (
      fromChapter: number,
      fromSequence: number,
      untilChapter: number,
      untilSequence: number,
    ) => `ch. ${fromChapter}·${fromSequence} → ch. ${untilChapter}·${untilSequence}`,
    intervalOpen: (chapter: number, sequence: number) => `from ch. ${chapter}·${sequence}`,
    fromEvent: (title: string) => `Event: ${title}`,
    certaintyLabel: (certainty: string) => `Certainty: ${certainty}`,
    entryKind: {
      OCCUPANCY: 'Occupancy',
      BODY_STATE: 'Body state',
      PRESENCE: 'Position',
      APPEARANCE: 'Appearance',
      CONSCIOUSNESS_STATE: 'Consciousness state',
    } as Record<string, string>,
    enums: {
      bodyType: {
        ORIGINAL: 'Original body',
        CLONE: 'Clone',
        COPY: 'Copy',
        CONSTRUCT: 'Nen construct',
        UNKNOWN: 'Unknown',
      } as Record<string, string>,
      consciousnessType: {
        ORIGINAL: 'Original consciousness',
        COPIED: 'Copied consciousness',
        ARTIFICIAL: 'Artificial consciousness',
        NEN_ENTITY: 'Nen entity',
        UNKNOWN: 'Unknown',
      } as Record<string, string>,
      occupancyType: {
        ORIGINAL: 'Occupies its own body',
        TRANSFERRED: 'Transferred into this body',
        POSSESSED: 'Possessing this body',
        CONTROLLED: 'Controlling this body',
        EMPTY: 'Body left empty',
        UNKNOWN: 'Occupancy unknown',
      } as Record<string, string>,
      certainty: {
        CONFIRMED: 'confirmed',
        PROBABLE: 'probable',
        UNKNOWN: 'unknown',
      } as Record<string, string>,
      bodyState: {
        ALIVE: 'Alive',
        INJURED: 'Injured',
        UNCONSCIOUS: 'Unconscious',
        DEAD: 'Dead',
        DESTROYED: 'Destroyed',
        PRESERVED: 'Preserved',
        UNKNOWN: 'State unknown',
      } as Record<string, string>,
      consciousnessState: {
        ACTIVE: 'Active',
        UNCONSCIOUS: 'Unconscious',
        TRANSFERRED: 'Transferred',
        SUPPRESSED: 'Suppressed',
        DORMANT: 'Dormant',
        DISCONNECTED: 'Disconnected',
        DESTROYED: 'Destroyed',
        UNKNOWN: 'State unknown',
      } as Record<string, string>,
      presencePrecision: {
        EXACT_ROOM: 'Located in a room',
        ZONE: 'Located in a zone',
        TIER: 'Located on a deck',
        UNKNOWN: 'Position unknown',
      } as Record<string, string>,
      presenceCertainty: {
        CONFIRMED: 'confirmed',
        PROBABLE: 'probable',
        LAST_KNOWN: 'last known',
      } as Record<string, string>,
      appearanceCause: {
        NATURAL: 'Natural appearance',
        TRANSFORMATION: 'Transformed appearance',
        DISGUISE: 'Disguise',
        NEN_ABILITY: 'Appearance changed by Nen',
        UNKNOWN: 'Cause unknown',
      } as Record<string, string>,
      acquisitionMethod: {
        DIRECT_OBSERVATION: 'seen first-hand',
        TOLD_BY_OTHER: 'told by someone',
        DEDUCTION: 'deduced',
        NEN_ABILITY: 'learned through Nen',
        DOCUMENT: 'read in a document',
        RUMOR: 'heard as a rumour',
        UNKNOWN: 'source unknown',
      } as Record<string, string>,
      /** Graph edge labels: the visual state a knowledge row resolves to. */
      epistemicRelation: {
        known: 'knows',
        confirmed: 'confirms',
        reported: 'was told',
        believed: 'believes',
        suspected: 'suspects',
        rumor: 'has heard',
        rejected: 'rejects',
        outdated: 'knew',
        contradicted: 'doubts',
        unknown: 'ignores',
      } as Record<string, string>,
    },
  },

  strategy: {
    hatsu: {
      canOnlyActivateInOwnZone: (name: string) =>
        `${name} can only be activated in the zone occupied by its user.`,
      requiresConfirmedHostile: (name: string) =>
        `${name} requires a confirmed hostile presence in the targeted zone.`,
      catsNamePassive:
        "Cat's Name is a passive post-mortem counter and cannot receive activation orders.",
      chainJailRequiresSpider: 'Chain Jail is forbidden: no confirmed Spider in this zone.',
      benjaminBatonRequiresDeath:
        'Benjamin Baton requires the prior death of an eligible loyal soldier.',
    },
    errors: {
      oneOrderPerTurn: 'A unit can only receive one order per turn.',
      eliminatedUnitCannotReceiveOrders: 'An eliminated unit can no longer receive orders.',
      hatsuCannotBeActivated: 'This Hatsu cannot be activated.',
      unknownAction: 'An order uses an unknown action.',
      orderTargetsNonOwnedUnit: 'An order targets a unit that does not belong to you.',
      unknownDestination: 'Unknown destination in this world state.',
      unitDoesNotExist: 'This unit does not exist in this world state.',
    },
  },

  investigation: {
    replay: {
      dollAppears: {
        title: 'Doll appears',
        description: 'Loberry alone sees the masked figure behind Furykov.',
      },
      allEyesDiverge: {
        title: 'All eyes diverge',
        description: 'Loberry screams and points to a presence that nobody else can find.',
      },
      fourCreaturesStrike: {
        title: 'Four creatures strike',
        description: 'The materialized tsuchibokko attach themselves to Barrigen’s neck.',
      },
      simultaneousDrain: {
        title: 'Simultaneous drain',
        description: 'The guards see the creatures and try to pull them off; time is running out.',
      },
      barrigenIsDead: {
        title: 'Barrigen is dead',
        description: 'The four creatures reduced forty-four seconds to about eleven.',
      },
    },
    hatsu: {
      noGrip: 'No grip',
      cannotEstablishInfo: (name: string) =>
        `${name} cannot establish any information on this target.`,
      usageDenied: 'Usage denied',
      impossibleCost: 'Cost unaffordable',
      corroboratedSignal: 'Corroborated signal',
      conclusiveAnalysis: 'Conclusive analysis',
      limitedResult: 'Limited result',
      requiresLifeHours: (hours: number) => `This analysis requires ${hours} life hours available.`,
      ethicalOrProceduralConditions: 'Ethical or procedural conditions forbid this usage.',
      confirmsLimits: 'The ability confirms its own limits without producing new evidence.',
      reinforcesInfo:
        'The ability reinforces existing information without turning it into absolute truth.',
      revealsCompatibleElements:
        'The ability reveals the elements compatible with its conditions and cost.',
      cannotEstablishNewInfo: (name: string) =>
        `${name} cannot establish anything new about this target under the present conditions.`,
    },
  },
}
