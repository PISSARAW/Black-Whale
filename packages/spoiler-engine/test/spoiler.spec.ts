import { filterVisible, filterTemporalRecords, maskFutureEnds } from '../src/index';

describe('Spoiler Engine', () => {
  describe('filterVisible', () => {
    it('should remove entities that appear after maxChapter', () => {
      const entities = [
        { id: '1', firstVisibleChapter: 380 },
        { id: '2', firstVisibleChapter: 385 },
        { id: '3', firstVisibleChapter: 390 },
      ];

      const result = filterVisible(entities, { maxChapter: 385 });
      expect(result).toHaveLength(2);
      expect(result.map(e => e.id)).toEqual(['1', '2']);
    });
  });

  describe('filterTemporalRecords', () => {
    it('should remove records originating from events after maxChapter', () => {
      const presences = [
        { id: '1', fromEvent: { firstVisibleChapter: 380 } },
        { id: '2', fromEvent: { firstVisibleChapter: 385 } },
        { id: '3', fromEvent: { firstVisibleChapter: 390 } },
      ];

      const result = filterTemporalRecords(presences, { maxChapter: 385 });
      expect(result).toHaveLength(2);
      expect(result.map(p => p.id)).toEqual(['1', '2']);
    });
  });

  describe('maskFutureEnds', () => {
    it('should mask the untilEvent if it occurs after maxChapter', () => {
      const presences = [
        // Ended before maxChapter - should remain untouched
        { id: '1', untilEvent: { firstVisibleChapter: 380 } },
        // Ended at maxChapter - should remain untouched
        { id: '2', untilEvent: { firstVisibleChapter: 385 } },
        // Ended after maxChapter - should be masked (nullified)
        { id: '3', untilEvent: { firstVisibleChapter: 390 } },
        // No end yet
        { id: '4', untilEvent: null },
      ];

      const result = maskFutureEnds(presences, { maxChapter: 385 });
      expect(result).toHaveLength(4);
      expect(result[0].untilEvent).toBeDefined();
      expect(result[1].untilEvent).toBeDefined();
      expect(result[2].untilEvent).toBeNull();
      expect(result[3].untilEvent).toBeNull();
    });
  });
});
