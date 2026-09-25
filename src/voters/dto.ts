// src/voters/dto.ts
import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class RegisterVoterDto {
  @IsString()
  @IsNotEmpty()
  voterId!: string; // e.g., "V001"

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(1)
  fingerprintId!: number;

  @IsString()
  @IsNotEmpty()
  deviceId!: string; // Associated device/sensor ID to prevent fingerprint ID collisions
}
