import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator'

const MAX_ID_LENGTH = 128

class AnchorPointDto {
  @IsNumber()
  x!: number

  @IsNumber()
  y!: number

  @IsString()
  @MaxLength(64)
  coordinateSpace!: string
}

class AnchorDto {
  @IsOptional()
  @IsString()
  @MaxLength(MAX_ID_LENGTH)
  entityId?: string

  @IsOptional()
  @IsString()
  @MaxLength(MAX_ID_LENGTH)
  locationId?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => AnchorPointDto)
  point?: AnchorPointDto
}

/**
 * Nen validation is reachable without authentication, so the request shape is
 * pinned down here rather than trusted from the caller.
 */
export class NenValidateRequestDto {
  @IsString()
  @MaxLength(MAX_ID_LENGTH)
  actorId!: string

  @IsString()
  @MaxLength(64)
  interaction!: string

  @IsArray()
  @ArrayMaxSize(16)
  @IsString({ each: true })
  @MaxLength(MAX_ID_LENGTH, { each: true })
  targets!: string[]

  @IsString()
  @MaxLength(MAX_ID_LENGTH)
  eventId!: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  actionId?: string

  @IsOptional()
  @IsObject()
  parameters?: Record<string, unknown>

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(16)
  @ValidateNested({ each: true })
  @Type(() => AnchorDto)
  anchors?: AnchorDto[]
}
