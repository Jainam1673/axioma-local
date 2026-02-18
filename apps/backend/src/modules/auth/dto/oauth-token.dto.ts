import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class OAuthTokenDto {
  @IsString()
  @IsIn(["password", "refresh_token"])
  grant_type!: "password" | "refresh_token";

  @IsString()
  client_id!: string;

  @IsOptional()
  @IsString()
  client_secret?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(16)
  refresh_token?: string;

  @IsOptional()
  @IsString()
  scope?: string;
}
