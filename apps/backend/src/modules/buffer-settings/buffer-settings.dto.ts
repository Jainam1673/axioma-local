import { IsDateString, IsNumber, Min } from "class-validator";

export class UpsertBufferSettingDto {
  @IsNumber()
  @Min(0)
  fixedMonthlyExpense!: number;

  @IsNumber()
  @Min(0)
  bufferMonths!: number;

  @IsDateString()
  effectiveFrom!: string;
}
