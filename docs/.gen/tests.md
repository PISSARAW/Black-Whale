<!-- généré par pnpm doc:gen — ne pas éditer -->

# Index des tests

Fichiers : 278

## `apps/admin/src/hooks.server.test.ts`

- admin handle > redirects an anonymous visitor to /login, remembering where they were going

## `apps/admin/src/lib/server/rate-limit.test.ts`

- rateLimit > allows exactly `limit` calls inside a window, then refuses
- resetRateLimit > clears the counter, which is what a successful login relies on

## `apps/admin/src/lib/server/session.test.ts`

- verifyPassword > accepts the configured password and refuses anything else
- createSession / verifySession > accepts a token it issued itself
- production secrets > refuses to run without them, and refuses weak ones
- sessionCookieOptions > keeps the cookie out of scripts and off cross-site requests

## `apps/admin/src/routes/login/page.server.test.ts`

- login action > issues a session cookie and redirects on the right password
- login load > sends an already-authenticated admin straight through

## `apps/web/src/lib/arena/adaptation.test.ts`

- Arena V3 adaptive opponents > counters the dominant habit across the five most recent bouts

## `apps/web/src/lib/arena/ai.test.ts`

- the arena opponent > closes distance without walking through the other fighter

## `apps/web/src/lib/arena/campaign.test.ts`

- Arena V3 campaign > starts with foundations and exposes deterministic mission presets

## `apps/web/src/lib/arena/challenges/evaluate.test.ts`

- Arena challenges > evaluates mastery from replay commands rather than UI state

## `apps/web/src/lib/arena/formats.test.ts`

- Arena V3 terrains and formats > derives four tactically identified arenas from attested spaces

## `apps/web/src/lib/arena/hatsu.test.ts`

- Arena Hatsu adapter > maps canonical interaction kinds onto duel mechanics

## `apps/web/src/lib/arena/hatsu/blackWhale.test.ts`

- the 24 Black Whale Arena Hatsu > registers exactly 24 distinct, canonical profiles

## `apps/web/src/lib/arena/hatsu/production.test.ts`

- production treatment for 24 Black Whale Hatsu > assigns a TourSense visual and a dedicated two-tone sound to every Hatsu

## `apps/web/src/lib/arena/profile.test.ts`

- Arena V3 profile > persists versioned progression and recovers from invalid data

## `apps/web/src/lib/arena/progression.test.ts`

- Arena progression > grades efficient wins above missed exchanges

## `apps/web/src/lib/arena/replay/library.test.ts`

- Arena V3 replay library > stores authenticated replays without duplicates

## `apps/web/src/lib/arena/replay/replay.test.ts`

- deterministic Arena replay > reconstructs player commands, movement and AI to the same checksum

## `apps/web/src/lib/arena/replay/share.test.ts`

- Arena replay URL sharing > round-trips an authenticated replay while preserving route options

## `apps/web/src/lib/arena/targeting.test.ts`

- reticle body targeting > turns camera elevation into stable body bands

## `apps/web/src/lib/arena/terrain.test.ts`

- a combat terrain from the Black Whale > is the attested banquet hall, not authored arena geometry

## `apps/web/src/lib/arena/v3-release.test.ts`

- Arena V3 release acceptance > keeps every campaign reference executable

## `apps/web/src/lib/assets/maps/localMaps.test.ts`

- the observation deck plan > draws the room the blueprint puts at the bow, corner for corner
- room appearance evidence > never changes a room layout or its occupants at random

## `apps/web/src/lib/assets/maps/sectionMap.test.ts`

- the longitudinal section > draws every room the walk holds on a deck, and no room it does not
- the decks of the section > draws every deck the reconstruction walks, from the top down
- the decks the reconstruction does not hold > bands the space between one deck and the next, and nothing else

## `apps/web/src/lib/audio/hatsu/signature.test.ts`

- Hatsu audiovisual coverage > gives every published Hatsu a stable dedicated audio signature

## `apps/web/src/lib/audio/siteHatsuAudio.test.ts`

- site Hatsu sound > gives all 85 techniques a distinct activation voice

## `apps/web/src/lib/beyondLineage.test.ts`

- Beyond lineage spoiler gating > shows both claims when the reader has no cap

## `apps/web/src/lib/combat/combat.test.ts`

- Nen perception > lets Gyo reveal a Ryu distribution concealed with In
- qualitative exchanges > resolves impacts without health or damage fields

## `apps/web/src/lib/components/map/projection/markers.test.ts`

- projectPresenceMarker > places a presence on its tier with the owner it resolves
- projectFutureMarker > labels the marker with the chapter it is projected into

## `apps/web/src/lib/components/map/projection/tierAnchors.test.ts`

- anchors > gives every reconstructed room a place of its own to stand

## `apps/web/src/lib/hunt/arena.test.ts`

- the arena > is the eight rooms of Tserriednich’s apartment

## `apps/web/src/lib/hunt/audio.test.ts`

- hunt audio controls > clamps volume and keeps mute explicit

## `apps/web/src/lib/hunt/aura.test.ts`

- the reservoir > starts full and undivided
- placed aura lowers the ceiling — invariant I2 > takes committed aura out of the body
- getting placed aura back > returns it to the body at once when it is recovered

## `apps/web/src/lib/hunt/balanceAudit.test.ts`

- V3 balance release gate > accepts a measured cell inside every threshold

## `apps/web/src/lib/hunt/balanceMatrix.test.ts`

- balance matrix > crosses every terrain, hatsu, hunter and seed

## `apps/web/src/lib/hunt/campaign.test.ts`

- persistent Hunt campaign > records attempts, mastery, best wins and consequences

## `apps/web/src/lib/hunt/contracts/contracts.test.ts`

- Hunt V3 contracts > publishes only valid bilingual contracts

## `apps/web/src/lib/hunt/contracts/progress.test.ts`

- contract objectives > combines survival and misdirection without completing early

## `apps/web/src/lib/hunt/contracts/share.test.ts`

- contract editor and sharing > round-trips a valid edited contract

## `apps/web/src/lib/hunt/contracts/transition.test.ts`

- continuous contract transitions > walks the declared terrain sequence

## `apps/web/src/lib/hunt/debriefAnalysis.test.ts`

- run explanation > calls out preparation, information and misdirection

## `apps/web/src/lib/hunt/duel/gyo.test.ts`

- Gyo against In > cannot read an aura distribution with the naked eye

## `apps/web/src/lib/hunt/duel/inherit.test.ts`

- the gauges the hunt leaves — T4.2 > opens the duel with the reservoirs the hunt ended on, not with a fixed hundred
- an entrave waiting in the room — T4.1 > finds the ones set in the contact room and no others
- the hold running down > counts towards zero and stops there

## `apps/web/src/lib/hunt/duel/recover.test.ts`

- backing into your own traps — T4.3 > finds one set in the room the duel is being fought in

## `apps/web/src/lib/hunt/duel/reducer.test.ts`

- the continuous principles > charge Gyo, In and Ken at their own rates
- gathering a Ko > takes twenty, once Ryu is pushed forward
- breaking away — T3.7 > takes three unread seconds of Zetsu
- a finished duel > stops answering actions

## `apps/web/src/lib/hunt/duel/resolve.test.ts`

- what a guard covers > covers a second zone when the aura is held back
- a Ko that is thrown > lands on a zone the other one is not covering
- a hunter who has been held — the junction, as the duel sees it > cannot answer anything, so the blow lands wherever it is aimed
- exhaustion — invariant I3 > ends the duel when a reservoir reaches zero, with no blow struck
- no statistics anywhere — invariant I1 > has no field on a duelist that could be a quantity of harm

## `apps/web/src/lib/hunt/environment.test.ts`

- Hunt V3 environment > makes blackout visual rather than omniscient and reverb louder

## `apps/web/src/lib/hunt/feedback.test.ts`

- nothing to report > is quiet by default
- signals that ring rather than fire > go on being felt long enough to be read
- footsteps > carry across the room you share, and get quieter with distance
- what the player is told about their own traps > passes both signals through while they are still ringing

## `apps/web/src/lib/hunt/ghost.test.ts`

- replay ghost > interpolates the recorded body without simulating hidden state

## `apps/web/src/lib/hunt/hatsu.test.ts`

- Hunt hatsu adapters > takes its identity from the authoritative ability module

## `apps/web/src/lib/hunt/hatsuPresentation.test.ts`

- Hunt Hatsu presentation through TourScene > projects live Bungee Gum placements as native gum traps

## `apps/web/src/lib/hunt/hunter/belief.test.ts`

- what the hunter believes > believes nothing to begin with
- going cold > ages while nothing new comes in
- rooms already searched > drops the belief and remembers the room was empty
- invariant I5, as a property of the type > has no way in for a position that is not a percept

## `apps/web/src/lib/hunt/hunter/duel.test.ts`

- an intact hunter — invariant I4 > is not beaten by a player swinging at him from the first second
- a hunter the hunt has already emptied > is beaten by the same player doing the same thing
- winning without ever attacking — invariant I3 > is possible against a hunter the hunt left short, by holding Ken
- the hunter’s own economy > stops looking when he cannot afford to

## `apps/web/src/lib/hunt/hunter/inspect.test.ts`

- the odds of spotting one > are best underfoot and nil across the room
- an inspection > costs five when there is something in the room to look at

## `apps/web/src/lib/hunt/hunter/profiles.test.ts`

- hunter profiles > make aggression faster but more expensive than caution

## `apps/web/src/lib/hunt/hunter/strategy.test.ts`

- strategic hunter planner > contains the map by sealing only an exit it can see

## `apps/web/src/lib/hunt/lifecycle.test.ts`

- hunt lifecycle resilience > caps debt after a suspended tab

## `apps/web/src/lib/hunt/loop.test.ts`

- the loop > advances its own clock and nothing else’s
- regeneration > gives aura back at a standstill only
- what the hunter is allowed to know — invariant I5 > never identifies a player in Zetsu, however often he sweeps
- the hunter’s reservoir — T4.4 > falls as he looks, and the journal says what it went on
- the junction > opens the duel on contact, with the reservoirs the hunt left
- strategic exit sealing > closes one perceived exit when the contract permits it
- the endings > stops at ten minutes

## `apps/web/src/lib/hunt/metrics.test.ts`

- hunt run metrics > measures decisions instead of frames

## `apps/web/src/lib/hunt/navmesh.test.ts`

- the navigation graph > has a node per room and an edge per doorway
- shortest path > walks the rooms in between

## `apps/web/src/lib/hunt/nen/advanced.test.ts`

- advanced Nen for Hunt V3 > makes Ren a continuous claim on the single aura pool

## `apps/web/src/lib/hunt/nen/en.test.ts`

- a sweep of En > costs fifteen and finds what is inside the radius
- Zetsu against a sweep > is found as a physical intrusion without exposing an aura signature

## `apps/web/src/lib/hunt/nen/entrave.test.ts`

- walking into an entrave > springs one at the walker’s feet
- being held > spends the aura and holds for six seconds

## `apps/web/src/lib/hunt/nen/placed.test.ts`

- the ledger of placed aura > moves aura out of the body when it is laid
- the accounting invariant > holds through every sequence of laying, firing and recovering
- what the hunter has spotted > marks only the ids given, and leaves the aura where it is

## `apps/web/src/lib/hunt/outcome.test.ts`

- how a game ends > is still being played when nothing has happened
- elimination without contact — T4.4 > needs both: a hunter with nothing left, held by an entrave
- reading an outcome > treats contact as the one ending that is not an ending

## `apps/web/src/lib/hunt/replay.test.ts`

- Hunt V3 replay > records typed commands and round-trips a share payload

## `apps/web/src/lib/hunt/sighting.test.ts`

- what he looks like he is doing > walks his round by default
- the aura he is visibly holding — the tell T4.4 turns on > is up while there is anything left in him
- the figure handed to the scene > stands where he stands, with his feet on the floor of the room
- what it deliberately does not do > says nothing about what he believes

## `apps/web/src/lib/hunt/state.test.ts`

- the game state > starts full, in Ten, with nothing laid down
- distinct Hatsu loadouts > opens Parallel Future only from Zetsu and records intended space
- the player’s own En > costs fifteen and is written down
- Ten and Zetsu > toggles, and both directions are on the journal
- laying and taking back > lays an entrave for twenty-five out of the body
- advanced Nen actions > charges Shu from the same pool and toggles Ren
- purity > never mutates the state it was given

## `apps/web/src/lib/hunt/telemetry.test.ts`

- the journal > extracts each actor room trajectory without frame noise
- the ceiling on it > holds a whole game and then stops rather than dropping the opening

## `apps/web/src/lib/hunt/tutorial.test.ts`

- the playable Hunt initiation > advances from movement through principles by observing actual actions

## `apps/web/src/lib/hunt/veil.test.ts`

- turning a world bearing into a relative one > puts a cue dead ahead when the player is facing it
- the fade > is full at the moment it rings and nothing once it has run out
- what the hunt shows > shows nothing but the standing state when nothing has happened
- what the duel shows > shows each principle exactly while it is held
- the layer is a second reading and not the only one > says nothing the state does not already say

## `apps/web/src/lib/i18n/hatsu.test.ts`

- localising a hatsu > translates the prose

## `apps/web/src/lib/i18n/translation-regression.test.ts`

- translation regressions > localizes strategy scenarios and their dynamic objectives in French

## `apps/web/src/lib/importantObjects.test.ts`

- important object tracking > catalogues TSK-17 and the Seed Urn

## `apps/web/src/lib/infiltration/actors/memory.test.ts`

- actor memory > tracks repeated exposure without duplicating observations

## `apps/web/src/lib/infiltration/alerts.test.ts`

- alert state machine > requires reports rather than an isolated percentage

## `apps/web/src/lib/infiltration/balance.test.ts`

- infiltration balance telemetry > distinguishes a ghost run from an exposed run

## `apps/web/src/lib/infiltration/campaign.test.ts`

- persistent campaign consequences > persists knowledge and compromised covers without duplicates

## `apps/web/src/lib/infiltration/debrief.test.ts`

- causal debrief > keeps material success, information and cover independent

## `apps/web/src/lib/infiltration/expandedHatsu.test.ts`

- Black Whale infiltration Hatsu > exposes only the thirteen supported onboard abilities

## `apps/web/src/lib/infiltration/hatsuSpatial.test.ts`

- spatial Hatsu consequences > makes Little Eye observable and signal-bound

## `apps/web/src/lib/infiltration/missions/missions.test.ts`

- infiltration V2 missions > defines three valid missions with three variants each

## `apps/web/src/lib/infiltration/patrol.test.ts`

- infiltration patrol > walks to the shared doorway before entering the next room

## `apps/web/src/lib/infiltration/persistence.test.ts`

- versioned infiltration saves > round-trips a V2 mission
- versioned infiltration saves > rejects corrupt saves and migrates V2

## `apps/web/src/lib/infiltration/replay.test.ts`

- deterministic replay log > preserves action order per simulation frame

## `apps/web/src/lib/infiltration/security.test.ts`

- collective security > changes concrete procedures during lockdown

## `apps/web/src/lib/infiltration/social/cover.test.ts`

- composable cover > explains permissions and contradictions independently

## `apps/web/src/lib/infiltration/sound.test.ts`

- infiltration sound > makes running louder than walking

## `apps/web/src/lib/infiltration/state.test.ts`

- infiltration > requires the document before extraction

## `apps/web/src/lib/infiltration/vision.test.ts`

- infiltration vision > sees inside its oriented field

## `apps/web/src/lib/investigation/appearance.test.ts`

- investigation scene appearance > keeps the victim larger, brighter and above the floor

## `apps/web/src/lib/investigation/case.test.ts`

- investigation verdict > includes the central witnesses and declared Nen users

## `apps/web/src/lib/investigation/catalog.test.ts`

- investigation case registry > loads a localized case by stable slug

## `apps/web/src/lib/investigation/confrontation.test.ts`

- witness confrontation > deduces separate visibility rules from Loberry and Furykov

## `apps/web/src/lib/investigation/definition.test.ts`

- investigation definition schema > has an explicit publication schema version

## `apps/web/src/lib/investigation/flow.test.ts`

- complete investigation flow > solves the case through observation, interrogation and confrontation

## `apps/web/src/lib/investigation/geometry.test.ts`

- room 1014 geometry > places every investigation subject on the scene plan

## `apps/web/src/lib/investigation/hatsu.test.ts`

- investigation Hatsu > uses Dowsing Chain to corroborate without granting omniscience

## `apps/web/src/lib/investigation/hatsuSystem.test.ts`

- investigation V3 systemic Hatsu > resolves effects entirely from case rules

## `apps/web/src/lib/investigation/interrogation.test.ts`

- investigation interrogations > offers opening questions immediately

## `apps/web/src/lib/investigation/interview.test.ts`

- investigation V3 interviews > rewards a stance suited to the witness

## `apps/web/src/lib/investigation/knowledge.test.ts`

- investigation V3 knowledge ledger > combines independent claims into an established proposition

## `apps/web/src/lib/investigation/portfolio.test.ts`

- investigation portfolio > uses an isolated save key for every case

## `apps/web/src/lib/investigation/progress.test.ts`

- investigation progress > round-trips a valid save

## `apps/web/src/lib/investigation/reasoning.test.ts`

- investigation V3 nonlinear reasoning > reports a partial conclusion and the missing proposition

## `apps/web/src/lib/investigation/replay.test.ts`

- eleven-second replay > clamps the replay to the canonical window

## `apps/web/src/lib/investigation/report.test.ts`

- final investigation report > separates established facts, deductions and testimony

## `apps/web/src/lib/investigation/v3Runtime.test.ts`

- investigation V3 runtime adapter > exposes partial progress before a hypothesis is established

## `apps/web/src/lib/investigation/validate.test.ts`

- investigation editorial validator > accepts the complete Eleven seconds definition

## `apps/web/src/lib/map/mapAssetRegistry.test.ts`

- resolveRegionLocationSlug > translates regions whose name is not a suffix of their slug

## `apps/web/src/lib/nen/abilityComponents.test.ts`

- the map from a componentKey to the thing that draws it > resolves every key it holds, and nothing it does not

## `apps/web/src/lib/nen/controls.test.ts`

- canonical Arena Nen controls > keeps direct, Mac-safe technique keys

## `apps/web/src/lib/nen/domTargets.test.ts`

- the DOM layer and the entity kinds the modules declare > gives every technique it handles a manifest to be checked against

## `apps/web/src/lib/nen/hatsuGate.test.ts`

- a room that only admits some techniques > lets anything through when no room has asked for one

## `apps/web/src/lib/nen/hatsuInteractions.test.ts`

- Hatsu interaction table > routes every registered kind to a handler or to the component

## `apps/web/src/lib/nen/hatsuRegistry.test.ts`

- global Hatsu interaction registry > provides an interaction for every catalogued Hatsu

## `apps/web/src/lib/nen/siteHatsuTargets.test.ts`

- global site Hatsu targets > keeps every character-only interaction backed by a body target

## `apps/web/src/lib/nen/targeting.test.ts`

- what a technique may be aimed at > declares one manifest for every ability the site casts

## `apps/web/src/lib/reconstruction/claimIndex.test.ts`

- reconstruction claim index > maps a temporal presence with its interval and sources

## `apps/web/src/lib/reconstruction/claims.test.ts`

- ReconstructionClaim > normalizes identifiers and deduplicates sources

## `apps/web/src/lib/reconstruction/evidence.test.ts`

- reconstruction evidence > always anchors a scene to its chapter and deduplicates transition sources

## `apps/web/src/lib/reconstruction/perspective.test.ts`

- reconstruction perspective projection > keeps the canonical view intact

## `apps/web/src/lib/reconstruction/sceneEntry.test.ts`

- living reconstruction scene entry > opens an apartment event in its main living room

## `apps/web/src/lib/reconstruction/sceneLocation.test.ts`

- catalogue scene locations > accepts a precise scene whose wording changed

## `apps/web/src/lib/reconstruction/sourceView.test.ts`

- ReconstructionSourceView > projects a manga source without inventing a missing page

## `apps/web/src/lib/reconstruction/trajectory.test.ts`

- reconstruction trajectories > draws a curved route between different decks

## `apps/web/src/lib/reconstruction/urlState.test.ts`

- reconstruction URL state > uses stable defaults for a bare URL

## `apps/web/src/lib/reconstruction/v3/causalGraph.test.ts`

- Reconstruction V3 causal graph > marks a decision executable only when every condition holds

## `apps/web/src/lib/reconstruction/v3/comparison.test.ts`

- canon and branch comparison > reports changes on every world axis

## `apps/web/src/lib/reconstruction/v3/executor.test.ts`

- V3 scenario executor > executes movement, knowledge and real Hatsu ports in causal order

## `apps/web/src/lib/reconstruction/v3/knowledge.test.ts`

- V3 knowledge propagation > propagates a known fact and records its complete path

## `apps/web/src/lib/reconstruction/v3/replay.test.ts`

- Reconstruction V3 replay > is deterministic and round-trips through JSON

## `apps/web/src/lib/reconstruction/v3/report.test.ts`

- Reconstruction V3 explainable report > explains a causal divergence and its decisive Hatsu

## `apps/web/src/lib/reconstruction/v3/scenario.test.ts`

- Reconstruction V3 scenario > creates a versioned deterministic scenario

## `apps/web/src/lib/roster.test.ts`

- factionTagsForMembershipType > maps both royal army flavours to the guard chip
- resolveFactionTags > tags only the heirs as princes, not their camp
- beyondLineageStatusFor > reports the catalogued status when the reader is past the reveal
- hatsuNamesFor > collects every ability of one owner

## `apps/web/src/lib/server/ability-visibility.test.ts`

- abilityFirstVisibleChapter > prefers the chapter the catalogue declares
- loadAbilityVisibility > withholds nothing when the reader has no cap

## `apps/web/src/lib/server/character-profile.test.ts`

- buildCharacterProfile > normalises every missing list to an empty array
- buildRoleHistory > merges roles and official assignments
- buildAffiliations > flattens a membership to the chapters it spans
- readFirstAppearanceChapter > reads the number out of a chapter id
- isVisibleAtSpoilerLimit > hides a character who debuts after the reader stopped

## `apps/web/src/lib/server/character-timeline.test.ts`

- buildLocationPaths > joins a location to its parents
- buildTimeline > orders entries by chapter then sequence
- buildChapterTrajectory > falls back to an explicit unknown position

## `apps/web/src/lib/server/co-presence.test.ts`

- canon co-presence > finds characters shown in the same atomic scene

## `apps/web/src/lib/server/compare-selection.test.ts`

- resolveComparisonSelection > defaults a bare URL to the latest event and the first two characters

## `apps/web/src/lib/server/event-log.test.ts`

- data/events/events.json > gives every chapter of the arc at least one curated event
- data/chapters/chapters.json > only involves characters the catalogue knows

## `apps/web/src/lib/server/httpCache.test.ts`

- what may be cached > never lets a cache mix two readers, whatever the route

## `apps/web/src/lib/server/identity-records.test.ts`

- buildBodyRecord > orders every kind of entry by chapter then sequence
- buildConsciousnessRecord > links each occupancy to the body it occupies

## `apps/web/src/lib/server/knowledge-map.test.ts`

- visualStateFor > reads a closed interval as outdated whatever the observer held
- beliefStateFor > grades a bare belief by the confidence the archive stored

## `apps/web/src/lib/server/log.test.ts`

- log > writes one parseable JSON object per line
- describeError > names an Error and keeps its stack outside production
- errorReference > is short and effectively unique

## `apps/web/src/lib/server/mapPayload.test.ts`

- what the projection leaves alone > leaves scalars and collections it does not know alone

## `apps/web/src/lib/server/nen-registry.test.ts`

- ability module registry > registers exactly the abilities whose moduleKey is filled in

## `apps/web/src/lib/server/reconstruction-v3.test.ts`

- Reconstruction V3 SimulationStore adapter > creates a real rule-compatible branch at the fork

## `apps/web/src/lib/strategy/balance.test.ts`

- complete strategy campaign balance > makes every doctrine achievable by a three-unit faction

## `apps/web/src/lib/strategy/campaign/engine.test.ts`

- Strategy campaign V3 > progresses deterministically through three scenarios

## `apps/web/src/lib/strategy/campaign/persistence.test.ts`

- Strategy campaign persistence V3 > round-trips a checksummed campaign

## `apps/web/src/lib/strategy/conflict.test.ts`

- strategy conflicts > turns wounds into eliminations

## `apps/web/src/lib/strategy/diplomacy.test.ts`

- strategy diplomacy > builds trust before accepting a pact

## `apps/web/src/lib/strategy/hatsu.test.ts`

- Strategy Hatsu adapters > provides individual adapters for every V3 roster Hatsu

## `apps/web/src/lib/strategy/hatsuPresentation.test.ts`

- Strategy Hatsu audiovisual presentation > gives every playable Hatsu a manifestation, sound and lifetime

## `apps/web/src/lib/strategy/rules.test.ts`

- strategy rules > prices a mixed plan against the command budget

## `apps/web/src/lib/strategy/scenario.test.ts`

- strategy scenario > builds a closed three-faction roster around the player

## `apps/web/src/lib/strategy/scenario/scenario-v2.test.ts`

- StrategyScenarioV2 > registers the versioned guards scenario

## `apps/web/src/lib/strategy/tacticalAI.test.ts`

- strategy AI personalities > assigns a stable personality to every faction

## `apps/web/src/lib/tour/TourAtmosphereView.test.ts`

- TourAtmosphereView > starts on the reference hour the palette holds, and not on a copy of it

## `apps/web/src/lib/tour/ambientOcclusion.test.ts`

- the occlusion pass > measures its disc in metres of ship, not in pixels

## `apps/web/src/lib/tour/apparitions.test.ts`

- what a quiet ship shows > shows nothing at all
- Silent Majority in the tour > uses the shared ritual human instead of the legacy puppet
- the book > is held open in front of whoever is carrying the bookmark
- the chains > puts one on the hand for every one of the five, each with its own end
- the owl > perches in the room Secret Window was cast on, and nowhere else
- the cards > lays one card per stage of the tribunal, in the stage’s own colour
- the curse > marks the victim openly and hides the sacrifice until the ship is laid open
- the baton > leaves a star over the room whose Hatsu it took, and nothing over a living one
- the double > stands in the room it was left in
- the fish > swims a shoal in the room it was loosed in, spread over the room itself
- the paper dolls > sticks one to everything standing in the room, and throws a few more besides
- the relay > shows the cargo only while the relay is the aura being held
- the two that happen rather than stand > blows the gust from the visitor to the room the blast was aimed at
- Air Blow > blows off what the later waves hung on a room, not only the early ones

## `apps/web/src/lib/tour/atmosphere.test.ts`

- the air of a room > thickens as the room shrinks
- settling from one room into the next > closes about 95% of the gap over the settling time
- how long a room rings > follows Sabine on the volume and surface the blueprint gives
- the first reflection off the nearest wall > is the round trip at the speed of sound
- the impulse response a room is convolved with > is as long as the tail is worth convolving
- the pace the ship is walked at > walks at a human speed, so the published measurements mean something
- the rumble of the hull > gives each deck the level and the cutoff it is written for

## `apps/web/src/lib/tour/auraRefraction.test.ts`

- how much aura is out > bends nothing when there is no scene to read
- the shell an aura is seen as from outside > gives a body in Zetsu nothing to wear

## `apps/web/src/lib/tour/blueprint.test.ts`

- the ship blueprint > satisfies every reconstruction invariant
- interiors > draws an interior for every prince, at its own scale
- the cells > opens the whole front of every cell, and stands a grille in it
- what stands in the rooms > stands everything it draws in a room that exists
- the link back to the catalogue > only points at locations that exist
- walking there from the map > finds a space for every location the map can select
- placing the visitor > spawns inside the space it was asked for
- ceilings > falls back to the tier when a space does not set one
- spawnFacing > looks down the long axis of a hall, away from the near end

## `apps/web/src/lib/tour/cast/address.test.ts`

- the six questions > asks every one of them, in the order they are asked
- the route as an answer > reads the steps in order, named in the visitor’s own language
- what Body and Soul takes > gives the two undated lines when the reader was sent them

## `apps/web/src/lib/tour/cast/bodies.test.ts`

- what the walk is holding on whom > lays a hold that already carries its own end
- nothing survives its own end > drops a hold the moment its clock runs out

## `apps/web/src/lib/tour/cast/conduite.test.ts`

- the conduct > casts nothing while the visitor is nowhere near

## `apps/web/src/lib/tour/cast/distribution.test.ts`

- the distribution > stands a named body in the room the catalogue puts it in
- what the scene is handed > draws one avatar per body, keyed on the character
- the guardian beasts > stands a declared beast in its owner’s room, and nowhere else

## `apps/web/src/lib/tour/cast/dossier.test.ts`

- what one body can be asked > reads the role, the faction and the declared category out of the catalogue
- the route, cut at the reader’s chapter > travels whole to a reader who has set no cap

## `apps/web/src/lib/tour/cast/hearing.test.ts`

- what the ear picks up in the room > counts the hearts in the room and nobody else’s

## `apps/web/src/lib/tour/cast/hostility.test.ts`

- which rooms are dangerous to stand in > finds none in a ship nothing has been done to

## `apps/web/src/lib/tour/cast/nen.test.ts`

- who carries an aura > gives nothing at all to a body the catalogue does not call a user
- the conduct at a post > holds Ten and nothing else where nothing has happened
- the conduct when something happens > raises Ren, looks with Gyo and covers with Ryu when the visitor casts here

## `apps/web/src/lib/tour/cast/pain.test.ts`

- physical injuries in the tour > survive Zetsu while Pain Packer aura and its committed charge disappear

## `apps/web/src/lib/tour/cast/provenance.test.ts`

- the provenance of a body > answers who, since when, and in what role

## `apps/web/src/lib/tour/cast/reach.test.ts`

- the list of what reaches a body is closed > holds the five that had nowhere to land until the walk was peopled
- the refusals, which are canon conditions and not budgets > holds Kurapika to his vow: the Troupe, and nobody else
- the three that ask rather than hold > reports a Zetsu that held under the shot, and an aura that did not
- what a hold looks like > draws the thread, the order and the mark by what they do
- the flock, which carries rather than holds > puts what a bird carried into a Zodiac’s hand, and holds nobody
- the blow that comes out of the deck, aimed at a person > takes a man off his feet through the bulkhead between you

## `apps/web/src/lib/tour/cast/reading.test.ts`

- what an aura tells you about a body > tells a visitor who has put their own aura away nothing at all
- whether the body can tell it is being read > is felt from a raised aura, and from the two that impose one

## `apps/web/src/lib/tour/cast/roster.test.ts`

- the roster > reads a body out of the world state, with its room and its chapter

## `apps/web/src/lib/tour/cast/wardrobe.test.ts`

- the wardrobe > dresses every role the catalogue uses

## `apps/web/src/lib/tour/cast/worldState.test.ts`

- the world state, in slug space > turns a body’s owner into the id the catalogue files them under

## `apps/web/src/lib/tour/comfort.test.ts`

- comfortDefaults > starts the walk wide and continuous by default
- readComfort > falls back to the defaults with nothing stored

## `apps/web/src/lib/tour/contactShadow.test.ts`

- contact shadow > multiplies the floor rather than painting over it

## `apps/web/src/lib/tour/decipher.test.ts`

- the three durations the archive gives, and no fourth > reads them off the ability module rather than restating them
- deciphering, which banks co-presence > advances a day for a day spent in the room
- fabrication, which walking out destroys > advances a day for a day spent at the bench
- the lock, which is the character rather than a gap > holds while a reading is unfinished

## `apps/web/src/lib/tour/describe.test.ts`

- extentOf > reads the long and the short side off the footprint
- exitsFrom > counts the doorways and links the blueprint actually derives
- solidsIn > counts a long run rather than naming each of it
- describeSpace > says what a room is, where it is, how big and what is in it

## `apps/web/src/lib/tour/dust.test.ts`

- which rooms hold dust > asks for height and room, not one or the other
- how the dust moves > rises, and puts a mote that reaches the deckhead back on the floor
- the dust registering that someone went through it > moves the motes a shove reaches and leaves the rest alone

## `apps/web/src/lib/tour/emperor.test.ts`

- the ledger, which is the ability > starts at nothing and spends the canon’s own rate
- what a hundred per cent in every category finds > finds what In is hiding without being aimed at it
- the second, which is where the price is actually paid > does nothing at all while the eyes are their own colour

## `apps/web/src/lib/tour/exhibit.test.ts`

- the exhibit for a solid > carries the badge, the chapter and the claim of its kind
- the exhibit for a room > says what a room asserts, and gives its ceiling as the third figure
- what the visitor is handed for asking > prefers the solid: aiming at a thing is how you say which you meant
- the claims table covers the ship > states what every kind of solid actually on board asserts

## `apps/web/src/lib/tour/floorPattern.test.ts`

- audited floor patterns > draws the four treatments the audit names

## `apps/web/src/lib/tour/footing.test.ts`

- what the deck is made of > gives every category of room a floor

## `apps/web/src/lib/tour/geometry.test.ts`

- polygon basics > measures area regardless of winding
- collinearOverlap > finds the shared stretch of two touching walls
- deriveDoorways > opens a doorway where two rooms share a wall
- wallSegments > leaves a sealed room with one wall per edge
- triangulate > covers a convex room exactly
- polygonsOverlap > accepts rooms that only share a wall
- structureFootprint > draws a rectangle the size it was given
- grilleBars > fills the run with uprights at the spacing a cell is barred at
- interiorPoint > lands inside a concave room rather than in its notch
- ceilingLamps > lights two rooms of a shape alike wherever either of them stands
- the measurements the fog and the reverberation are read from > measures the perimeter a room presents to sound
- clipSegment > keeps the stretch that crosses the room and drops the rest
- plateSeams > lays a course about every stride, both ways across the deck
- subdivideTriangle > leaves a small triangle alone

## `apps/web/src/lib/tour/godRays.test.ts`

- where the light is taken to come from > anchors on the middle of the opening in plan
- which decks have shafts at all > finds the two openings the manga draws, and no third
- how hard the shafts blow > is at full strength with the window dead ahead

## `apps/web/src/lib/tour/gum.test.ts`

- what a strand is holding > reads nothing until the visitor has moved off what they stuck
- where a thing comes to rest when the gum brings it in > stops it short of the visitor rather than inside them

## `apps/web/src/lib/tour/hatsu.test.ts`

- the technique roster > names only kinds the archive actually holds
- the keys a technique answers to > gives every Hatsu carried by the tour at least one unambiguous interaction
- casting reaches the whole ship > takes a room on another deck without asking where the visitor stands
- the hideout doors > arms one frame, then pairs the second
- Blinky and what refuses to be swallowed > empties a room of what stands in it
- the isolated room > is cast from anywhere and leaves you inside it, with the beast in the doorway
- Air Blow > strips every hold another technique put on the room, and moves nothing
- the senses > seals sight, then hearing, then speech, and the fourth releases
- what the aura draws through the hull > lights every room in the ship under Emperor Time
- planWithout > takes both the solid and the faces the visitor would have walked around
- aiming down the reticle > reaches past the room underfoot to the one being faced
- aiming at a solid > routes the solid techniques to a solid and leaves the rest on the rooms
- what a technique does to a solid > crushes it flat without moving it
- the rules solids hold each other to > holds a solid fast against every technique but the chain that undoes damage
- the solids as the walk has to draw and collide with them > lifts a touched solid out of the baked deck and hands it over on its own
- shutting a room > takes the doorway out of the geometry rather than drawing a lock on it
- what waits at a threshold > expels an intruder back where they came from, and does not injure them
- Silent Majority > takes the ten rooms nearest the visitor, and remembers whether it fed
- what the techniques make of the visitor > buys speed and reach with the aura committed, and stops buying
- the wrapping and the sun > turns a physical injury into a single-use packet without healing it
- leaving the body behind > goes on without it, and comes back to it
- the music, the chain and the deduction > needs the prologue before it can take a shape, and gives it back
- what the walk remembers of itself > keeps the trail whether or not anything is watching, and never counts it as a hold
- the three birds of Secret Window > walks R round the three and back to the first
- the twenty seconds a bird holds, and the ten it hands back > materializes for twenty seconds and opens a film on the room it landed in
- the arrow, the cat and the curse > exchanges the archer and what it fell on, and carries the archer there
- taking a technique off the ship > reads back exactly the hold the panel would list
- Bungee Gum (elastic) > the filament on a solid > goes out of the wrist and remembers how far it reached
- what the walk draws for each of them > puts a body in the room for every beast that is up
- the barrage, aimed and swept > puts a burst into everything standing in the room
- the limb, which becomes the tool > transforms with nothing under the reticle, and does not let you pick

## `apps/web/src/lib/tour/hatsuSound.test.ts`

- tour Hatsu sound > gives every Hatsu carried by the tour its own voice and its result accent

## `apps/web/src/lib/tour/hour.test.ts`

- shipHourOf > takes the hour canon states

## `apps/web/src/lib/tour/humanAnimation.test.ts`

- humanAnimation > changes a combatant pose without rebuilding its rig

## `apps/web/src/lib/tour/humanFigure.test.ts`

- shared human figure > draws Morena as one seated silhouette at the negotiation table

## `apps/web/src/lib/tour/humanHair.test.ts`

- the hair, which is what the reader recognises first > draws a shape for every style in the closed vocabulary
- the three gabarits > gives a baby a head that is a quarter of it and an adult one a seventh
- the second tone > bakes exactly two values into every mass, in the geometry

## `apps/web/src/lib/tour/humanProfiles.test.ts`

- shared human profiles > keeps one identity visually stable

## `apps/web/src/lib/tour/humanSignature.test.ts`

- the signature pieces > draws something for every piece of the closed vocabulary

## `apps/web/src/lib/tour/light.test.ts`

- the class grid > lights the royal deck closer, warmer and harder than the hold

## `apps/web/src/lib/tour/likenessGrid.test.ts`

- the reference grid > draws every declared likeness the way it drew it last time

## `apps/web/src/lib/tour/mesh.test.ts`

- the reveal > changes what every level says and not one triangle of it
- buildTierMesh > builds a mesh for every deck
- the solids standing in the rooms > raises the springs to their own height, not the room floor
- which way the surfaces face > faces every wall of a room into the room it belongs to
- the deck plating > lays a course under every room with a floor
- the depth of a doorway > gives every opening two cheeks, in the list collision reads
- the ceiling fittings > hangs one over every room, on the grid the bake pools from
- the two windows > types two of them on the whole ship, and both are drawn by a panel

## `apps/web/src/lib/tour/morena.test.ts`

- the deal > puts seven questions on her side and five answers on yours
- spending a question > answers it first and takes a card afterwards
- the card she marked > hands her the answer the moment you reach for it
- a whole hand, played the way ch. 410 plays it > ends on the card she marked, with a Yes that was not given
- what the walk lays on the table > stands the room, the table and both chairs where the game needs them
- the woman opposite > deals, leans in for the kiss, and sits back when it is played out
- the roster of what can be played across the table > names an ability that exists for every one of them
- Lovely Ghostwriter, which nobody plays > sits the beast at the guest’s elbow from the deal
- Parallel Future, which is ten seconds twice > has nothing to take back before anything has happened
- the Manipulation, which is the only sanction the game has > takes Back, Joker and X off the table and leaves Yes and No
- reading her hand > turns the fan face up, and the table draws it face up
- hiding your own > suspends an exchange without it counting as walking out
- making stakes > takes a card back out of the graveyard without the kiss
- changing what the answer is worth > binds the verdict rather than changing it
- not being the person sitting > caps the game at a draw and keeps the answer off you
- the room, which is the thing that catches you > watches by default, because LSDF is standing in it
- the five seats the table opened last > empties her chair rather than yours, and does not narrow you for it

## `apps/web/src/lib/tour/morenaHands.test.ts`

- what the hands can reach > offers her seven questions while there are questions to spend
- playing by hand > spends the question the card in her fan is
- the table, marked for a pair of hands > marks exactly the cards the rules say are moves

## `apps/web/src/lib/tour/navigation.test.ts`

- resolveMovement > lets the visitor walk where nothing is in the way
- wallsNear > keeps the walls within reach and drops the rest
- linkUnderfoot > offers the other end when the visitor stands on it
- wayOutOfInterior > offers the way out from every room of an interior, not only its vestibule
- crossingsOn > places a stairwell on both of the levels it joins
- the on-screen stick > reads the middle of its base as standing still
- walkInput > stands still with nothing held and no finger on the stick
- walking the reconstruction itself > keeps the visitor inside the ship from every spawn point
- leaning into a walk > does not reach the pace in the frame the key goes down
- the breath at a stand > lifts the eye by millimetres and comes back

## `apps/web/src/lib/tour/nenCreatureFigure.test.ts`

- Nen creature figure > covers beasts used by the tour and Morena without styling props or people

## `apps/web/src/lib/tour/outputPass.test.ts`

- the colour management flag > is off unless this visit asked for it

## `apps/web/src/lib/tour/pageBodyReadout.test.ts`

- the one line a cast at a body comes back with > names the body and what is now on it

## `apps/web/src/lib/tour/pageKeyboard.test.ts`

- tour shortcuts > maps unmodified navigation keys

## `apps/web/src/lib/tour/pageWorldSteps.test.ts`

- the reading, which counts the room rather than the person > banks a day for a day in the room the reading was opened in
- the bench, which walking out destroys > advances in the room it was started in

## `apps/web/src/lib/tour/pageWorldTicker.test.ts`

- Emperor Time on the beat > spends the hour without touching the read-out

## `apps/web/src/lib/tour/punch.test.ts`

- the line the blow takes through the matter > runs the whole way when there is deck the whole way

## `apps/web/src/lib/tour/quality.test.ts`

- detecting the palier > puts a coarse pointer on the light palier whatever its GPU says
- the visitor overruling the detection > defers to the detection on auto
- what a palier switches on > turns off everything that costs a second pass over the frame, on low

## `apps/web/src/lib/tour/reachSound.test.ts`

- what a cast at a person sounds like > gives Bungee Gum on a body the same voice it has on a cabinet

## `apps/web/src/lib/tour/regime.test.ts`

- regimeOf > lands exactly on the four hours the panel offers

## `apps/web/src/lib/tour/ripper.test.ts`

- the one figure ch. 92 gives > carries fifteen, which is what the blow that killed an ant was wound to
- the calibration, which its own bearer calls the weak point > has nothing to let go of before the arm has turned

## `apps/web/src/lib/tour/search.test.ts`

- searchTerms > cuts a query into lowercase terms
- matchesTerms > matches when every term appears, in any order
- placeOf > gives the deck for a space on a deck
- filterSpaces > keeps everything when nothing is asked
- findPlaces > offers every space and every interior when nothing is typed

## `apps/web/src/lib/tour/sheen.test.ts`

- applySheen > reads the eye and the normal the material already carries

## `apps/web/src/lib/tour/sky.test.ts`

- skyOf > is the drawn state, to the digit, at overcast noon
- shipTimeOfDay > follows the projection when the visitor has not overruled it
- timeOfDayOf > puts the horn at noon and chapter 374 in the small hours

## `apps/web/src/lib/tour/texture.test.ts`

- the limit stated with the technique > refuses the round solids, which offer no flat face
- the plaque, which is a flat limited surface with writing on it > puts a neighbour’s number on the door

## `apps/web/src/lib/tour/visibility.test.ts`

- the door graph > is symmetric: a door is a door from either side
- what is drawn from where the visitor stands > always holds the room underfoot and everything it opens onto

## `apps/web/src/lib/tour/walkTargets.test.ts`

- where the walk opens for a location on the map > answers what spaceForLocation would have answered, for every slug it holds

## `apps/web/src/routes/abilities/page.server.test.ts`

- the abilities page and the reader who asked not to be spoiled > lists the whole catalogue when no cap is set

## `apps/web/src/routes/spoiler-limit/spoiler-limit.test.ts`

- POST /spoiler-limit > stores the cap the reader submitted

## `packages/ability-modules/test/action-wheels.spec.ts`

- roues d’action > keeps the median at four or more across the catalogue

## `packages/ability-modules/test/bungee-gum.spec.ts`

- Bungee Gum ability contract > uses the same conditions to plan and execute an activation

## `packages/ability-modules/test/canon-limits.spec.ts`

- Bungee Gum, as the module enforces it > lets a detached filament hold at ten metres

## `packages/ability-modules/test/every-module.spec.ts`

- every ability module, on every action it offers > offers more than one action to test

## `packages/ability-modules/test/identity-and-network.spec.ts`

- Grimmel the Dissonance > swaps two consciousnesses in a single indivisible activation
- Contagion > refuses an infection until the three canonical conditions are met

## `packages/ability-modules/test/kurapika-chain.spec.ts`

- Emperor Time > prices an activation in hours of life and accumulates them
- Holy Chain > soigne un garde blessé (ch. 380)

## `packages/ability-modules/test/morena-game.spec.ts`

- opening the negotiation > puts twelve cards on the table and says what the rules are
- one move, one event > spends a question and writes the whole hand back
- the branch, replayed > reduces a whole negotiation and leaves the hand readable in world state
- what the game hands back to the infection > ticks the first condition when the hand was won, and only then
- the game on the action wheel > offers every move the negotiation has

## `packages/ability-modules/test/p2-modules.spec.ts`

- Benjamin Baton > declares a roster the world engine inherits from without a further action
- Predator > refuses to devour when somebody else shares the analysis
- Cross Game > will not restrain somebody who was never warned
- Sun and Moon > keeps its marks alive after their creator dies
- Guardian coins > resets the accrued value when the coin changes hands
- Love Dial 6700 > answers with a probable tier, never a confirmed room
- Silent Majority > says its user is unknown without blocking the ability

## `packages/ability-modules/test/p3-modules.spec.ts`

- catalogue coverage > gives every module a manifest, a UI key and an interaction contract
- Double Machine Gun > states the mutilation as a condition and a price
- Gallery Fake > creates a copy that dies with the day and with its creator
- Body and Soul > separates what the body answers from what the mouth claimed
- Saiyu — three monkeys > cuts one perception channel per monkey

## `packages/ability-sdk/test/ability-sdk.spec.ts`

- condition builders > reports UNKNOWN rather than guessing when there is no world state
- effect builders > anchors an elastic connection to both ends

## `packages/ability-sdk/test/uses.spec.ts`

- grammaire d’emploi > shows the source of a use the manga draws

## `packages/canon-compiler/test/arena-contracts.spec.ts`

- compiling the arena contracts > joins the module contract to the id the arena selects it by

## `packages/canon-compiler/test/coverage.spec.ts`

- appearances the map has to cover > accepts a passenger whose presence spans the chapter they appear in
- what the projection wrote > refuses a presence parked on a deck

## `packages/canon-compiler/test/decisions.spec.ts`

- chapter references > reads a bare chapter and a pinned event
- death > reads the chapter a character dies in
- how firmly a position may be drawn > marks a databook room as a deduction
- the shape of a record > grades importance by canon status
- resolving a room name > numbers the princes by their sector rooms

## `packages/canon-compiler/test/hatsu-registry.spec.ts`

- compiling the hatsu registry > joins the catalogue, the owner and the module presentation

## `packages/canon-compiler/test/hatsu-skeleton.spec.ts`

- the locale skeleton > says nothing when the catalogue is complete

## `packages/canon-compiler/test/hunterpedia.spec.ts`

- reading the markup > strips links, refs and bold down to the sentence
- the post is not the employer > reads the prince someone is stationed with
- dating a debut > prefers a chapter the character is shown in over one they are named in
- a chapter cast list > reads one entry per bullet, ignoring everything else
- matching a name to a catalogue entry > ignores accents, punctuation and case
- adding the passengers the catalogue is missing > skips whoever is already known under any name
- enriching a template entry > files the employer and stations the body in the prince it guards

## `packages/canon-compiler/test/presence-choice.spec.ts`

- picking the presence a catalogue position means > has nothing to pick from an empty history

## `packages/canon-engine/src/timeline/affiliations.test.ts`

- activeFactionTypesAt > includes a membership already started and not yet ended

## `packages/canon-engine/src/timeline/presence.test.ts`

- latestPresencePerEntity > leaves one presence per entity untouched

## `packages/canon-engine/src/timeline/selection.test.ts`

- selectEvent > selects by event id
- readLegacySequence > reads an integer

## `packages/canon-engine/src/timeline/snapshot.test.ts`

- resolveVisibleBodyIds > keeps the bodies of visible characters
- filterPresencesByBodies > keeps only presences of visible bodies
- buildCanonicalPositions > keys a position by the owner of the occupied body

## `packages/canon-engine/src/timeline/snapshotStore.test.ts`

- the snapshot store > answers a point it has already been asked

## `packages/canon-engine/test/flashback.spec.ts`

- flashback chronology > orders an event by occurrence rather than its revealing chapter

## `packages/canon-engine/test/identity-engine.spec.ts`

- IdentityEngine.resolveIdentity > reports an empty body as perceived by its original owner
- IdentityEngine.findBodyOf > returns the body a consciousness currently occupies

## `packages/canon-engine/test/knowledge-engine.spec.ts`

- KnowledgeEngine.getKnowledgeOf > returns what the observer knows at that point
- KnowledgeEngine.getBeliefsOf > returns a belief that still holds, false or not

## `packages/canon-engine/test/perspective-engine.spec.ts`

- PerspectiveEngine spoiler handling > refuses to build a perspective past the reader’s limit
- PerspectiveEngine subjective facts > hides a true fact the observer does not know
- PerspectiveEngine direct perception > sees the bodies sharing its location

## `packages/canon-engine/test/post-mortem.spec.ts`

- post-mortem invariant > ends the effects a dead source was sustaining
- effect state and counters > moves an effect from dormant to triggered and records the end
- ability revocation > takes an ability away from its owner
- Gyo and apparent identity > hides a masked effect from a character and shows it under Gyo

## `packages/canon-engine/test/spoiler.spec.ts`

- Spoiler Engine > filterVisible > should remove entities that appear after maxChapter
- filterTemporalRecords > should remove records originating from events after maxChapter
- maskFutureEnds > should mask the untilEvent if it occurs after maxChapter

## `packages/canon-engine/test/world-engine.spec.ts`

- world engine > builds a global cursor across chapter-local sequences

## `packages/canon-engine/test/world-state.spec.ts`

- TimelineEngine.getWorldState visibility > refuses a point it cannot resolve
- TimelineEngine.getWorldState temporal records > keeps an open-ended presence
- TimelineEngine.getWorldState query bounds > bounds every table it reads by the revealed chapter

## `packages/contracts/test/canon-lint.spec.ts`

- the archive as it stands > parses
- unique-ids > refuses two characters with the same id
- references-resolve > refuses an ability whose owner is not a character
- chapter-references-are-well-formed > accepts the explicit ch-unknown
- events-are-ordered > refuses two events in the same place in the story
- ranked-claims-cite-a-source > refuses a panel-ranked space with no source
- structures-fit-their-space > refuses a structure that reaches through the ceiling
- links-join-real-spaces > refuses a door to nowhere
- positions-name-a-room > refuses a passenger standing on a bare deck
- spoiler-coverage > refuses an undated character that is not a databook entry
- trajectories-reach-the-ship > refuses a leg the blueprint has no room under
- placed-bodies-declare-a-role > refuses a placed body with no role to dress it in
- nen-claims-say-what > refuses an aura claimed with neither a category nor a confirmation
- guardian-beasts-are-sourced > refuses a beast sourced past the end of the arc
- what the schemas are allowed to drop > keeps the fields the voyage clock reads
- likeness-names-somebody-real > refuses a likeness for somebody the catalogue has never heard of
- likeness-covers-the-roster > refuses an annexe A id that is neither declared nor deferred
- what a likeness may and may not say > refuses a hairstyle nobody can draw

## `packages/domain/src/voyage-clock.test.ts`

- the voyage scale > counts the departure day as day 1, from noon
- bracketing > leaves a stated time exactly where canon puts it
- curated chronology > orders by chapter and sequence by default
- voyage membership > starts at the horn and skips the flashbacks

## `packages/domain/test/ordering.spec.ts`

- compareEventOrder > orders by chapter first when no ordinals are known
- isRevealed > reveals an event at or before the reader is
- isActiveAt > holds from the event that opens it
- isActiveAt with an explicit reveal limit > defaults to the target event’s own chapter

## `packages/nen-engine/test/engine.spec.ts`

- NenEngine.getActiveAbilities > derives one activation per ability still standing
- NenEngine.buildActionWheel > merges every ability the actor owns, not only the one in context
- NenEngine.explainAction > explains a base action with the predicate that gates it

## `packages/nen-engine/test/presentation.spec.ts`

- shared Nen presentation > defines one complete audiovisual signature per technique

## `packages/nen-engine/test/runtime.spec.ts`

- parseNenActionRequest > accepts a well-formed action
- NenRuntime.listAbilities > exposes the catalogue with owner renamed for the UI
- NenRuntime context building > grants the actor the ability it canonically owns
- NenRuntime.execute > refuses an ability with no registered module

## `packages/nen-engine/test/techniques.spec.ts`

- standard Nen techniques > starts in Ten and Zetsu closes every aura-fed technique

## `packages/simulation-engine/test/ai.spec.ts`

- strategy AI > resolves a character membership to the body tracked on the map

## `packages/simulation-engine/test/selective-merge.spec.ts`

- Parallel Future — selective branch merge > replays the predicted window for everyone except the seer

## `packages/simulation-engine/test/store.spec.ts`

- parseCreateSimulationInput > accepts a canonical fork request
- parseSimulationActionInput > rejects an unsupported action type
- SimulationStore.applyAction > rejects a move targeting an entity absent from the branch

## `scripts/doc-lint.test.ts`

- doc-lint > passes on the real docs tree

## `scripts/likeness.test.ts`

- every declared likeness is drawable > uses no hairstyle, attire or piece the walk cannot draw

## `scripts/silhouettes.test.ts`

- the Nen creature silhouettes > are the same shapes in the contracts and in the walk

