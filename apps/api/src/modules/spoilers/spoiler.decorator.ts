import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SpoilerProfile } from '@black-whale/spoiler-engine';

export const GetSpoilerProfile = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SpoilerProfile => {
    const request = ctx.switchToHttp().getRequest();
    
    // Check header first
    const headerLimit = request.headers['x-spoiler-limit'];
    if (headerLimit && !isNaN(parseInt(headerLimit))) {
      return { maxChapter: parseInt(headerLimit, 10) };
    }
    
    // Check query parameter fallback
    const queryLimit = request.query.maxChapter;
    if (queryLimit && !isNaN(parseInt(queryLimit))) {
      return { maxChapter: parseInt(queryLimit, 10) };
    }

    // Default: return Infinity, meaning no spoilers are filtered
    // Alternatively, default could be 0, but for V1 let's assume no limit if not provided
    return { maxChapter: Infinity };
  },
);
