# Fighting HUD regression check

Run `pnpm --filter @black-whale/web test:hud` after installing Playwright Chromium.
For an existing browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable.
Set `HUD_CHECK_OUTPUT` to choose the report and screenshot directory (default:
`/tmp/black-whale-hud-roster`).

The isolated Vite fixture renders the production HUD, resource panels and training
readout, with the real fonts. It checks all 40 fighters on both sides at 130% HUD
scale, in French and English, in compact and detailed views, at widths of 320,
390, 640, 844 and 1440 pixels. This is a presentation check, without the WebGL scene.

Additional cases combine Chrollo's full page list, bookmark and marks; Kurapika's
Emperor Time, loaded Dolphin and chain restrictions; and Benjamin's captured card
and observed target. Suspended Nen is covered too. These deliberately crowded
fixtures exercise layout and information retention, rather than simulation rules.

The check rejects overflowing or overlapping visible text, verifies that training
data stays below the HUD, and asserts that the critical warnings remain present.
Screenshots for the three complex fighters are saved with the JSON report.
