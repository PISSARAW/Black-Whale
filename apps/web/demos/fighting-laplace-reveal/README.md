# Laplace Demon: an apparent round victory

Run `pnpm --filter @black-whale/web exec node scripts/render-laplace-reveal.mjs`.
The MP4, audit report and sampled frames are written to `output/laplace-reveal/`.
Use `--inspect` to verify the simulation and render a few stills without encoding.

This is an authored late-round demonstration, rendered with the production
`FightStage`, victory cinematic, result screen and combat audio. The initial
setup gives Tserriednich 18 HP and places both fighters in the hold with 38 seconds
remaining. After setup, native inputs alone control the fighters: Tserriednich
closes and opens his eyes, walks and jumps behind Theta, and avoids her shot.
The shot kills only his perceived image. The normal victory cinematic is skipped
with its native button so the recording can linger on the false round result.
The real ten-second window then expires, revealing the living prince behind her.
He fires an actual shot after the reveal. No position, damage or verdict is edited
during the sequence.

The renderer checks that the apparent KO precedes the reveal, the real prince
retains his initial 18 HP, no real round is awarded, and the match is still live.
Video is captured at 30 fps from the continuously advancing native scene. Its
audio uses the game sound director plus the normal Theta victory recording.
