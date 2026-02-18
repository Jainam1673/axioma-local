import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { CreateWithdrawalDto } from "./withdrawals.dto.js";
import { WithdrawalsService } from "./withdrawals.service.js";

@Controller("withdrawals")
@UseGuards(JwtAuthGuard, RolesGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @Roles("OWNER", "ADMIN")
  create(@Body() payload: CreateWithdrawalDto) {
    return this.withdrawalsService.create(payload);
  }

  @Get()
  @Roles("OWNER", "ADMIN", "MEMBER")
  list() {
    return this.withdrawalsService.list();
  }
}
