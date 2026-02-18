import { IsDateString, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateInvoiceDto {
  @IsString()
  clientId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsDateString()
  issuedAt!: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

export class CreatePaymentDto {
  @IsString()
  invoiceId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsDateString()
  receivedAt!: string;
}
