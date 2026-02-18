import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { CreateExpenseDto } from "./expenses.dto.js";
import { ExpensesService } from "./expenses.service.js";

@Controller("expenses")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles("OWNER", "ADMIN")
  create(@Body() payload: CreateExpenseDto) {
    return this.expensesService.create(payload);
  }

  @Get()
  @Roles("OWNER", "ADMIN", "MEMBER")
  list() {
    return this.expensesService.list();
  }
}
