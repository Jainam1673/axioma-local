import { IsDateString, IsNumber, IsString, Min } from "class-validator";

export class CreateWithdrawalDto {
  @IsString()
  partnerId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsDateString()
  withdrawnAt!: string;
}
