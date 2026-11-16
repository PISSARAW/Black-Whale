# Luini spatial passage verification

Run `pnpm --filter @black-whale/web test:luini`.

The fixture uses the production engine, WebGL scene and preparation status.
It verifies anchoring without displacement, departure to a visited destination,
return from an arbitrary position and permanent room invalidation when the
opponent opens the door. It covers both local players, French and English,
and widths of 1100, 390 and 320 pixels, including horizontal overflow.

Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an installed Chrome and
`LUINI_CHECK_OUTPUT` to choose the screenshot and report directory
(default: `/tmp/black-whale-luini-ui`). Engine prerequisites, borrowed passages
and round reset are also covered by `src/lib/fighting/luini.test.ts`.
