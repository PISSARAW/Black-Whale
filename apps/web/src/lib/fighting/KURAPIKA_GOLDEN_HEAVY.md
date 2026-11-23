# Kurapika — golden Standing Heavy

`standingHeavy` is a compact rear-hand body hook. The lead chain hand keeps the
guard while the rear foot pivots and the lead foot remains planted. It is the
golden reference used to qualify Black Whale Clash's presentation pipeline.

## Frozen gameplay contract

- 8 startup, 4 active and 14 recovery frames (Kurapika's effective tuning);
- torso target, 11 units of reach and the existing damage/stun values;
- first visual contact on the first active frame;
- no presentation pass may change simulation position, collision or frame data.

## Body order

Rear-foot pressure drives the pelvis, the chest follows, then the rear shoulder,
elbow, wrist and fist. The head tracks the opponent. Hit, block and whiff may
branch only after the shared contact pose.

## Review

Review frames are `0, 2, 4, 6, 7, 8, 11, 14, 19, 25`. The move must remain
convincing without camera, VFX or audio at 25%, 50%, 100% and 200% playback.

## Certification gate

The automated matrix covers both facings, hit/block/whiff, small/medium/large
opponents, four playback rates and entry from idle/advance/retreat/dash: 288
scenarios and 2,880 deterministic review draws. The browser gate additionally
renders all 60 combinations of review frame, facing and outcome, reports both
foot trajectories and rejects an active fist more than 4 cm away from its
authored contact.
