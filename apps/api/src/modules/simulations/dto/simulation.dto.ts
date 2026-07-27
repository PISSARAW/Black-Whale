import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator'

/**
 * The simulation endpoints accept unauthenticated writes from the public site,
 * so every field is bounded here: identifiers are length-capped and the free-form
 * action payload is limited in both key count and serialised size.
 */
const MAX_ID_LENGTH = 128
const MAX_PAYLOAD_KEYS = 32
const MAX_PAYLOAD_BYTES = 8 * 1024

@ValidatorConstraint({ name: 'boundedPayload', async: false })
class BoundedPayloadConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
    if (Object.keys(value).length > MAX_PAYLOAD_KEYS) return false
    try {
      return Buffer.byteLength(JSON.stringify(value)) <= MAX_PAYLOAD_BYTES
    } catch {
      return false
    }
  }

  defaultMessage(): string {
    return `payload must be a plain object with at most ${MAX_PAYLOAD_KEYS} keys and ${MAX_PAYLOAD_BYTES} bytes`
  }
}

export class CreateSimulationDto {
  @IsString()
  @MaxLength(MAX_ID_LENGTH)
  parentEventId!: string

  @IsIn(['strict-canon', 'rule-compatible', 'sandbox'])
  mode!: 'strict-canon' | 'rule-compatible' | 'sandbox'

  @IsOptional()
  @IsString()
  @MaxLength(MAX_ID_LENGTH)
  ownerId?: string
}

export class SimulationActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(MAX_ID_LENGTH)
  branchId?: string

  @IsIn(['ACTIVATE_ABILITY', 'MOVE_ENTITY'])
  actionType!: string

  @IsObject()
  @Validate(BoundedPayloadConstraint)
  payload!: Record<string, unknown>
}

export class SimulationTargetsDto {
  @IsArray()
  @ArrayMaxSize(16)
  @IsString({ each: true })
  @MaxLength(MAX_ID_LENGTH, { each: true })
  targets!: string[]
}
