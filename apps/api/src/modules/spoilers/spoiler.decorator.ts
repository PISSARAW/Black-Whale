import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SpoilerProfile } from '@black-whale/spoiler-engine';

/**
 * Both the header and the query parameter are client-controlled. `parseInt`
 * accepts leading garbage ("12abc", "0x10") and arrays, so the value is matched
 * strictly against a digit run before it reaches the spoiler engine.
 */
function parseLimit(raw: unknown): number | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!/^\d{1,6}$/.test(trimmed)) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export const GetSpoilerProfile = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SpoilerProfile => {
    const request = ctx.switchToHttp().getRequest();

    // Check header first
    const headerLimit = parseLimit(request.headers?.['x-spoiler-limit']);
    if (headerLimit !== null) return { maxChapter: headerLimit };

    // Check query parameter fallback
    const queryLimit = parseLimit(request.query?.maxChapter);
    if (queryLimit !== null) return { maxChapter: queryLimit };

    // Default: no spoiler filtering when the caller expresses no preference.
    return { maxChapter: Infinity };
  },
);
