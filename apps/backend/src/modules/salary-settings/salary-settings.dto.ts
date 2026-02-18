import { IsDateString, IsNumber, Min } from "class-validator";

export class UpsertSalarySettingDto {
  @IsNumber()
  @Min(0)
  monthlyTotal!: number;

  @IsDateString()
  effectiveFrom!: string;
}
