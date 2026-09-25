// src/elections/election.dto.ts
import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CandidateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class CreateElectionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CandidateDto)
  candidates!: CandidateDto[];
}

export class AddEligibilityDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  voterIds!: string[];
}