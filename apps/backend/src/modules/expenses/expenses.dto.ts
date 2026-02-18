import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

export enum ExpenseCategory {
  PAYROLL = "PAYROLL",
  SOFTWARE = "SOFTWARE",
  RENT = "RENT",
  MARKETING = "MARKETING",
  CONTRACTOR = "CONTRACTOR",
  OTHER = "OTHER",
}

export class CreateExpenseDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsDateString()
  paidAt!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
