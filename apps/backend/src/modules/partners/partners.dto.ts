import { IsNumber, IsString, Max, Min } from "class-validator";

export class CreatePartnerDto {
  @IsString()
  userId!: string;

  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  shareRatio!: number;
}
