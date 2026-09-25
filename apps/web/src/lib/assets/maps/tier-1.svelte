<script lang="ts">
  /**
   * Tier 1-A, generated from `data/ship/blueprint.json`.
   *
   * The authored plan uses a 1000 x 600 coordinate frame at 0.35 m per unit,
   * with the ship's midpoint at (500, 300). Every tier uses the same landscape
   * frame; the walkthrough geometry remains in the shared ship axes.
   * Every room in the blueprint is drawn rather than leaving unnamed deck.
   *
   * Rooms the catalogue has a record for are clickable and zoom into their own
   * plan. Corridors and the spaces the reconstruction invented to keep the deck
   * contiguous are drawn dimmer and are not: there is nothing to open.
   *
   * Do not hand-edit — regenerate from the blueprint and annotations.
   */
  import { mapState } from '$lib/state/mapState.svelte'

  type Region = {
    id: string
    region: string | null
    points: string
    label: string
    size: number
    at: [number, number]
    turned: boolean
    through: boolean
    inferred: boolean
  }

  const regions: Region[] = [
    {
      id: 'tier-1-vvip-corridor',
      region: 'vvip-living-quarters',
      points: '260.77,200.0 264.75,200.0 264.75,400.0 260.77,400.0',
      label: '',
      size: 0,
      at: [262.8, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-queens-corridor',
      region: 'queens-living-quarters',
      points: '280.0,157.14 294.29,157.14 294.29,442.86 280.0,442.86',
      label: '',
      size: 0,
      at: [287.1, 300.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-royal-residential-corridor-port',
      region: 'tier-1-royal-residential-sector',
      points: '688.57,180.0 794.29,180.0 794.29,211.43 688.57,211.43',
      label: 'Aft U Corridor (port)',
      size: 9,
      at: [741.4, 198.7],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-corridor-starboard',
      region: 'tier-1-royal-residential-sector',
      points: '688.57,388.57 794.29,388.57 794.29,420.0 688.57,420.0',
      label: '',
      size: 0,
      at: [741.4, 404.3],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-corridor-aft',
      region: 'tier-1-royal-residential-sector',
      points: '794.29,180.0 811.43,180.0 811.43,420.0 794.29,420.0',
      label: '',
      size: 0,
      at: [802.9, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-approach-1001',
      region: 'tier-1-royal-residential-sector',
      points: '554.9,245.91 554.9,237.14 577.05,237.14 577.05,245.91',
      label: '',
      size: 0,
      at: [566.0, 241.5],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-approach-1002',
      region: 'tier-1-royal-residential-sector',
      points: '554.9,362.86 554.9,354.09 577.05,354.09 577.05,362.86',
      label: '',
      size: 0,
      at: [566.0, 358.5],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-approach-1003',
      region: 'tier-1-royal-residential-sector',
      points: '584.81,245.91 584.81,237.14 606.97,237.14 606.97,245.91',
      label: '',
      size: 0,
      at: [595.9, 241.5],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-approach-1004',
      region: 'tier-1-royal-residential-sector',
      points: '584.81,362.86 584.81,354.09 606.97,354.09 606.97,362.86',
      label: '',
      size: 0,
      at: [595.9, 358.5],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-approach-1005',
      region: 'tier-1-royal-residential-sector',
      points: '614.72,245.91 614.72,237.14 636.88,237.14 636.88,245.91',
      label: '',
      size: 0,
      at: [625.8, 241.5],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-approach-1006',
      region: 'tier-1-royal-residential-sector',
      points: '614.72,362.86 614.72,354.09 636.88,354.09 636.88,362.86',
      label: '',
      size: 0,
      at: [625.8, 358.5],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-approach-1007',
      region: 'tier-1-royal-residential-sector',
      points: '644.63,245.91 644.63,237.14 666.79,237.14 666.79,245.91',
      label: '',
      size: 0,
      at: [655.7, 241.5],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-approach-1008',
      region: 'tier-1-royal-residential-sector',
      points: '644.63,362.86 644.63,354.09 666.79,354.09 666.79,362.86',
      label: '',
      size: 0,
      at: [655.7, 358.5],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-approach-1009',
      region: 'tier-1-royal-residential-sector',
      points: '674.55,245.91 674.55,237.14 696.71,237.14 696.71,245.91',
      label: '',
      size: 0,
      at: [685.6, 241.5],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-approach-1010',
      region: 'tier-1-royal-residential-sector',
      points: '674.55,362.86 674.55,354.09 696.71,354.09 696.71,362.86',
      label: '',
      size: 0,
      at: [685.6, 358.5],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-approach-1011',
      region: 'tier-1-royal-residential-sector',
      points: '704.46,245.91 704.46,237.14 726.62,237.14 726.62,245.91',
      label: '',
      size: 0,
      at: [715.5, 241.5],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-approach-1012',
      region: 'tier-1-royal-residential-sector',
      points: '704.46,362.86 704.46,354.09 726.62,354.09 726.62,362.86',
      label: '',
      size: 0,
      at: [715.5, 358.5],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-approach-1013',
      region: 'tier-1-royal-residential-sector',
      points: '734.37,245.91 734.37,237.14 756.53,237.14 756.53,245.91',
      label: '',
      size: 0,
      at: [745.5, 241.5],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-approach-1014',
      region: 'tier-1-royal-residential-sector',
      points: '734.37,362.86 734.37,354.09 756.53,354.09 756.53,362.86',
      label: '',
      size: 0,
      at: [745.5, 358.5],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-cross-gap-1',
      region: 'tier-1-royal-residential-sector',
      points: '547.14,362.86 547.14,237.14 554.9,237.14 554.9,362.86',
      label: '',
      size: 0,
      at: [551.0, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-cross-gap-2',
      region: 'tier-1-royal-residential-sector',
      points: '577.05,362.86 577.05,237.14 584.81,237.14 584.81,362.86',
      label: '',
      size: 0,
      at: [580.9, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-cross-gap-3',
      region: 'tier-1-royal-residential-sector',
      points: '606.97,362.86 606.97,237.14 614.72,237.14 614.72,362.86',
      label: '',
      size: 0,
      at: [610.9, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-cross-gap-4',
      region: 'tier-1-royal-residential-sector',
      points: '636.88,362.86 636.88,237.14 644.63,237.14 644.63,362.86',
      label: '',
      size: 0,
      at: [640.8, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-cross-gap-5',
      region: 'tier-1-royal-residential-sector',
      points: '666.79,362.86 666.79,237.14 674.55,237.14 674.55,362.86',
      label: '',
      size: 0,
      at: [670.7, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-cross-gap-6',
      region: 'tier-1-royal-residential-sector',
      points: '696.71,362.86 696.71,237.14 704.46,237.14 704.46,362.86',
      label: '',
      size: 0,
      at: [700.6, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-cross-gap-7',
      region: 'tier-1-royal-residential-sector',
      points: '726.62,362.86 726.62,237.14 734.37,237.14 734.37,362.86',
      label: '',
      size: 0,
      at: [730.5, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-cross-gap-8',
      region: 'tier-1-royal-residential-sector',
      points: '756.53,362.86 756.53,237.14 764.29,237.14 764.29,362.86',
      label: '',
      size: 0,
      at: [760.4, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-back-passage-1',
      region: 'tier-1-royal-residential-sector',
      points: '554.9,304.39 554.9,295.61 577.05,295.61 577.05,304.39',
      label: '',
      size: 0,
      at: [566.0, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-back-passage-2',
      region: 'tier-1-royal-residential-sector',
      points: '584.81,304.39 584.81,295.61 606.97,295.61 606.97,304.39',
      label: '',
      size: 0,
      at: [595.9, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-back-passage-3',
      region: 'tier-1-royal-residential-sector',
      points: '614.72,304.39 614.72,295.61 636.88,295.61 636.88,304.39',
      label: '',
      size: 0,
      at: [625.8, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-back-passage-4',
      region: 'tier-1-royal-residential-sector',
      points: '644.63,304.39 644.63,295.61 666.79,295.61 666.79,304.39',
      label: '',
      size: 0,
      at: [655.7, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-back-passage-5',
      region: 'tier-1-royal-residential-sector',
      points: '674.55,304.39 674.55,295.61 696.71,295.61 696.71,304.39',
      label: '',
      size: 0,
      at: [685.6, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-back-passage-6',
      region: 'tier-1-royal-residential-sector',
      points: '704.46,304.39 704.46,295.61 726.62,295.61 726.62,304.39',
      label: '',
      size: 0,
      at: [715.5, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-back-passage-7',
      region: 'tier-1-royal-residential-sector',
      points: '734.37,304.39 734.37,295.61 756.53,295.61 756.53,304.39',
      label: '',
      size: 0,
      at: [745.5, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-royal-approach',
      region: null,
      points: '428.57,214.29 428.57,385.71 457.14,385.71 457.14,214.29',
      label: '',
      size: 0,
      at: [442.9, 300.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-main-corridor',
      region: null,
      points: '568.57,177.14 665.71,177.14 665.71,191.43 568.57,191.43',
      label: 'VIP Stair Passage A',
      size: 9,
      at: [617.1, 187.3],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-port-promenade',
      region: null,
      points: '165.71,174.29 204.29,174.29 204.29,231.75 242.86,231.75 242.86,425.71 165.71,425.71',
      label: 'Port Promenade',
      size: 9,
      at: [201.8, 315.5],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-starboard-corridor',
      region: null,
      points: '831.43,265.71 845.71,265.71 845.71,334.29 831.43,334.29',
      label: '',
      size: 0,
      at: [838.6, 300.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-aft-promenade',
      region: null,
      points: '165.71,425.71 242.86,425.71 242.86,442.86 165.71,442.86',
      label: '',
      size: 0,
      at: [204.3, 434.3],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-main-corridor-starboard',
      region: null,
      points: '568.57,408.57 665.71,408.57 665.71,422.86 568.57,422.86',
      label: '',
      size: 0,
      at: [617.1, 415.7],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-route-b-landing',
      region: null,
      points: '568.57,422.86 665.71,422.86 665.71,477.14 568.57,477.14',
      label: '',
      size: 0,
      at: [617.1, 450.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-route-c-landing',
      region: null,
      points: '811.43,265.71 811.43,334.29 831.43,334.29 831.43,265.71',
      label: '',
      size: 0,
      at: [821.4, 300.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-route-a-landing',
      region: null,
      points: '568.57,122.86 665.71,122.86 665.71,177.14 568.57,177.14',
      label: 'VIP Passage A',
      size: 12,
      at: [617.1, 154.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-aft-blank-approach',
      region: null,
      points: '685.71,211.43 697.14,211.43 697.14,388.57 685.71,388.57',
      label: '',
      size: 0,
      at: [691.4, 300.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-banquet-side-corridor-port',
      region: null,
      points: '485.71,197.14 508.57,197.14 508.57,214.29 485.71,214.29',
      label: '',
      size: 0,
      at: [497.1, 205.7],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-banquet-side-corridor-starboard',
      region: null,
      points: '485.71,385.71 508.57,385.71 508.57,402.86 485.71,402.86',
      label: '',
      size: 0,
      at: [497.1, 394.3],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-king-living-quarters',
      region: 'king-quarters',
      points: '294.29,254.29 428.57,254.29 428.57,345.71 294.29,345.71',
      label: 'King\'s Living Quarters',
      size: 9,
      at: [361.4, 303.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-banquet-hall',
      region: 'banquet-hall',
      points: '457.14,214.29 457.14,359.59 537.14,359.59 537.14,258.37 524.08,258.37 524.08,251.84 537.14,251.84 537.14,214.29',
      label: 'Banquet Hall',
      size: 12,
      at: [496.9, 291.2],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-banquet-hall-service-end',
      region: 'banquet-hall',
      points: '457.14,359.59 457.14,385.71 537.14,385.71 537.14,359.59',
      label: '',
      size: 0,
      at: [497.1, 372.6],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-restricted-royal-01',
      region: null,
      points: '242.86,200.0 260.77,200.0 260.77,250.0 242.86,250.0',
      label: '',
      size: 0,
      at: [251.8, 225.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-restricted-royal-02',
      region: null,
      points: '242.86,250.0 260.77,250.0 260.77,300.0 242.86,300.0',
      label: '',
      size: 0,
      at: [251.8, 275.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-suite-01',
      region: null,
      points: '242.86,300.0 260.77,300.0 260.77,350.0 242.86,350.0',
      label: '',
      size: 0,
      at: [251.8, 325.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-suite-02',
      region: null,
      points: '242.86,350.0 260.77,350.0 260.77,400.0 242.86,400.0',
      label: '',
      size: 0,
      at: [251.8, 375.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-suite-03',
      region: null,
      points: '264.75,200.0 280.0,200.0 280.0,250.0 264.75,250.0',
      label: '',
      size: 0,
      at: [272.4, 225.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-suite-04',
      region: null,
      points: '264.75,250.0 280.0,250.0 280.0,300.0 264.75,300.0',
      label: '',
      size: 0,
      at: [272.4, 275.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-mafia-suite',
      region: null,
      points: '264.75,300.0 280.0,300.0 280.0,350.0 264.75,350.0',
      label: '',
      size: 0,
      at: [272.4, 325.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-v5-suite',
      region: null,
      points: '264.75,350.0 280.0,350.0 280.0,400.0 264.75,400.0',
      label: '',
      size: 0,
      at: [272.4, 375.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-queens-living-quarters-room-01',
      region: 'queens-living-quarters',
      points: '294.29,157.14 325.71,157.14 325.71,242.86 294.29,242.86',
      label: '',
      size: 0,
      at: [310.0, 200.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-queens-living-quarters-room-02',
      region: 'queens-living-quarters',
      points: '328.57,157.14 360.0,157.14 360.0,242.86 328.57,242.86',
      label: '',
      size: 0,
      at: [344.3, 200.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-queens-living-quarters-room-03',
      region: 'queens-living-quarters',
      points: '362.86,157.14 394.29,157.14 394.29,242.86 362.86,242.86',
      label: '',
      size: 0,
      at: [378.6, 200.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-queens-living-quarters-room-04',
      region: 'queens-living-quarters',
      points: '397.14,157.14 428.57,157.14 428.57,242.86 397.14,242.86',
      label: '',
      size: 0,
      at: [412.9, 200.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-queens-living-quarters-room-05',
      region: 'queens-living-quarters',
      points: '294.29,357.14 325.71,357.14 325.71,442.86 294.29,442.86',
      label: '',
      size: 0,
      at: [310.0, 400.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-queens-living-quarters-room-06',
      region: 'queens-living-quarters',
      points: '328.57,357.14 360.0,357.14 360.0,442.86 328.57,442.86',
      label: '',
      size: 0,
      at: [344.3, 400.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-queens-living-quarters-room-07',
      region: 'queens-living-quarters',
      points: '362.86,357.14 394.29,357.14 394.29,442.86 362.86,442.86',
      label: '',
      size: 0,
      at: [378.6, 400.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-queens-living-quarters-room-08',
      region: 'queens-living-quarters',
      points: '397.14,357.14 428.57,357.14 428.57,442.86 397.14,442.86',
      label: '',
      size: 0,
      at: [412.9, 400.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1001',
      region: 'tier-1-royal-residential-sector-room-1001',
      points: '554.9,295.61 554.9,245.91 577.05,245.91 577.05,295.61',
      label: '',
      size: 0,
      at: [566.0, 270.8],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1002',
      region: 'tier-1-royal-residential-sector-room-1002',
      points: '554.9,354.09 554.9,304.39 577.05,304.39 577.05,354.09',
      label: '',
      size: 0,
      at: [566.0, 329.2],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1003',
      region: 'tier-1-royal-residential-sector-room-1003',
      points: '584.81,295.61 584.81,245.91 606.97,245.91 606.97,295.61',
      label: '',
      size: 0,
      at: [595.9, 270.8],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1004',
      region: 'tier-1-royal-residential-sector-room-1004',
      points: '584.81,354.09 584.81,304.39 606.97,304.39 606.97,354.09',
      label: '',
      size: 0,
      at: [595.9, 329.2],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1005',
      region: 'tier-1-royal-residential-sector-room-1005',
      points: '614.72,295.61 614.72,245.91 636.88,245.91 636.88,295.61',
      label: '',
      size: 0,
      at: [625.8, 270.8],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1006',
      region: 'tier-1-royal-residential-sector-room-1006',
      points: '614.72,354.09 614.72,304.39 636.88,304.39 636.88,354.09',
      label: '',
      size: 0,
      at: [625.8, 329.2],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1007',
      region: 'tier-1-royal-residential-sector-room-1007',
      points: '644.63,295.61 644.63,245.91 666.79,245.91 666.79,295.61',
      label: '',
      size: 0,
      at: [655.7, 270.8],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1008',
      region: 'tier-1-royal-residential-sector-room-1008',
      points: '644.63,354.09 644.63,304.39 666.79,304.39 666.79,354.09',
      label: '',
      size: 0,
      at: [655.7, 329.2],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1009',
      region: 'tier-1-royal-residential-sector-room-1009',
      points: '674.55,295.61 674.55,245.91 696.71,245.91 696.71,295.61',
      label: '',
      size: 0,
      at: [685.6, 270.8],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1010',
      region: 'tier-1-royal-residential-sector-room-1010',
      points: '674.55,354.09 674.55,304.39 696.71,304.39 696.71,354.09',
      label: '',
      size: 0,
      at: [685.6, 329.2],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1011',
      region: 'tier-1-royal-residential-sector-room-1011',
      points: '704.46,295.61 704.46,245.91 726.62,245.91 726.62,295.61',
      label: '',
      size: 0,
      at: [715.5, 270.8],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1012',
      region: 'tier-1-royal-residential-sector-room-1012',
      points: '704.46,354.09 704.46,304.39 726.62,304.39 726.62,354.09',
      label: '',
      size: 0,
      at: [715.5, 329.2],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1013',
      region: 'tier-1-royal-residential-sector-room-1013',
      points: '734.37,295.61 734.37,245.91 756.53,245.91 756.53,295.61',
      label: '',
      size: 0,
      at: [745.5, 270.8],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1014',
      region: 'tier-1-royal-residential-sector-room-1014',
      points: '734.37,354.09 734.37,304.39 756.53,304.39 756.53,354.09',
      label: '',
      size: 0,
      at: [745.5, 329.2],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-princes-quarters-gate',
      region: null,
      points: '537.14,281.17 547.14,281.17 547.14,318.83 537.14,318.83',
      label: '',
      size: 0,
      at: [542.1, 300.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-garrison-void',
      region: null,
      points: '697.14,211.43 794.29,211.43 794.29,388.57 697.14,388.57',
      label: 'Unnamed Aft Room',
      size: 9,
      at: [745.7, 303.0],
      turned: false,
      through: false,
      inferred: true,
    },
    {
      id: 'tier-1-detention-void',
      region: null,
      points: '685.71,142.86 794.29,142.86 794.29,180.0 685.71,180.0',
      label: '',
      size: 0,
      at: [740.0, 161.4],
      turned: false,
      through: false,
      inferred: true,
    },
    {
      id: 'tier-1-court-void',
      region: null,
      points: '685.71,420.0 794.29,420.0 794.29,457.14 685.71,457.14',
      label: 'Starboard Aft Floor',
      size: 9,
      at: [740.0, 441.6],
      turned: false,
      through: false,
      inferred: true,
    },
    {
      id: 'tier-1-casino-void',
      region: null,
      points: '242.86,162.86 280.0,162.86 280.0,200.0 242.86,200.0',
      label: '',
      size: 0,
      at: [261.4, 181.4],
      turned: false,
      through: false,
      inferred: true,
    },
    {
      id: 'tier-1-banquet-hall-vestibule',
      region: 'banquet-hall',
      points: '524.08,251.84 524.08,258.37 537.14,258.37 537.14,251.84',
      label: '',
      size: 0,
      at: [530.6, 255.1],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-banquet-side-room-port',
      region: null,
      points: '457.14,157.14 537.14,157.14 537.14,197.14 457.14,197.14',
      label: '',
      size: 0,
      at: [497.1, 177.1],
      turned: false,
      through: false,
      inferred: true,
    },
    {
      id: 'tier-1-banquet-side-room-starboard',
      region: null,
      points: '457.14,402.86 537.14,402.86 537.14,442.86 457.14,442.86',
      label: '',
      size: 0,
      at: [497.1, 422.9],
      turned: false,
      through: false,
      inferred: true,
    },
  ]

  function select(regionId: string | null) {
    if (regionId) mapState.selectLocation(regionId)
  }

  function selectWithKeyboard(event: KeyboardEvent, regionId: string | null) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    event.stopPropagation()
    select(regionId)
  }
</script>

<svg viewBox="0 0 1000 600" class="w-full h-full text-[#FFFFF0]">
  <defs>
    <style>
      .hull {
        fill: #1a0f0f;
        stroke: #ffd700;
        stroke-width: 4;
      }
      .zone {
        fill: #2a1515;
        stroke: #fffff0;
        stroke-width: 1.5;
        transition: fill 0.2s;
      }
      .zone.clickable {
        cursor: pointer;
      }
      .zone.clickable:hover {
        fill: #3d1c1c;
      }
      .zone.selected {
        stroke: #ffd700;
        stroke-width: 2.5;
        fill: #4d2020;
      }
      .zone.through {
        fill: #150b0b;
        stroke: #ffd700;
        stroke-opacity: 0.35;
        stroke-width: 1;
        stroke-dasharray: 4 4;
      }
      .zone.inferred {
        fill: #16171c;
        stroke: #9dc4e0;
        stroke-opacity: 0.4;
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
  </defs>


  <polygon class="hull" points="250.0,100.0 209.51,111.2 178.0,141.6 155.51,186.4 142.0,240.8 137.51,300.0 142.0,359.2 155.51,413.6 178.0,458.4 209.51,488.8 250.0,500.0 700.0,500.0 754.0,488.8 796.0,458.4 826.0,413.6 844.0,359.2 850.0,300.0 844.0,240.8 826.0,186.4 796.0,141.6 754.0,111.2 700.0,100.0" />
  <text class="label" x="361.4" y="300" font-size="14" text-anchor="middle">KING AND QUEEN'S QUARTERS</text>
  <text class="label" x="655.7" y="300.0" font-size="13" text-anchor="middle">PRINCES' QUARTERS</text>
  <text class="label" x="617.1" y="150" font-size="12" text-anchor="middle">A → TIER 2 · VIP</text>
  <text class="label" x="617.1" y="450" font-size="12" text-anchor="middle">B → TIER 2 · MAFIA LEADERS</text>
  <text class="label" x="821.4" y="300" font-size="12" text-anchor="middle">C → TIER 2 · PASSENGERS</text>
  <text class="label" x="875" y="300" font-size="12" text-anchor="middle">LIFEBOAT DECK · TIER 1-C · AT C</text>

  <g id="tier-1-zones">
    {#each regions as zone (zone.id)}
      {#if zone.region}
        <g
          role="button"
          tabindex="0"
          aria-label={`Open ${zone.label || zone.id}`}
          onclick={() => select(zone.region)}
          onkeydown={(event) => selectWithKeyboard(event, zone.region)}
        >
          <polygon
            class="zone clickable"
            class:through={zone.through}
            class:inferred={zone.inferred}
            class:selected={mapState.selectedLocationId === zone.region}
            points={zone.points}
          />
        </g>
      {:else}
        <polygon
          class="zone"
          class:through={zone.through}
          class:inferred={zone.inferred}
          points={zone.points}
        />
      {/if}
    {/each}

    {#each regions.filter((zone) => zone.size > 0) as zone (zone.id)}
      <text
        class="label"
        x={zone.at[0]}
        y={zone.at[1]}
        font-size={zone.size}
        transform={zone.turned ? `rotate(-90 ${zone.at[0]} ${zone.at[1]})` : ''}>{zone.label}</text
      >
    {/each}
  </g>

</svg>
