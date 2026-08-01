/**
 * One infected member of the Heil-Ly network, as the effect carries them.
 *
 * A type of its own rather than a `<script module>` export on the dashboard,
 * because the shape is the *ability's*: `contagion` writes one `CUSTOM` effect
 * per member with exactly these attributes, and anything reading a branch can
 * hand a list of them straight to the view.
 */
export interface CohortMember {
  memberId: string
  /** What to call them, when the entity is known. Falls back to the id. */
  label?: string
  level: number
  kills: number
}
