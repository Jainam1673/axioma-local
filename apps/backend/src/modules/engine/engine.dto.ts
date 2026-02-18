import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

class PartnerInputDto {
  @IsString()
  partnerId!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  shareRatio!: number;

  @IsNumber()
  @Min(0)
  alreadyWithdrawn!: number;
}

class ClientInputDto {
  @IsString()
  clientId!: string;

  @IsNumber()
  @Min(0)
  realizedRevenue!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidExpense?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  directExpenses?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  allocatedSalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  proportionalOverhead?: number;
}

export class FinancialEngineInputDto {
  @IsNumber()
  @Min(0)
  realizedRevenue!: number;

  @IsNumber()
  @Min(0)
  paidExpenses!: number;

  @IsNumber()
  @Min(0)
  salaries!: number;

  @IsNumber()
  @Min(0)
  fixedMonthlyExpense!: number;

  @IsNumber()
  @Min(0)
  bufferMonths!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  recurringExpenses?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  avgFixedCosts?: number;

  @IsOptional()
  @IsNumber()
  totalWithdrawn?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cashBalance?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PartnerInputDto)
  partners!: PartnerInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientInputDto)
  clients?: ClientInputDto[];
}

export class WithdrawalSimulationInputDto {
  @IsNumber()
  @Min(0)
  requestedAmount!: number;

  @IsString()
  partnerId!: string;

  @IsNumber()
  currentCashBalance!: number;

  @IsNumber()
  @Min(0)
  monthlyBurn!: number;

  @IsNumber()
  remainingPool!: number;
}
