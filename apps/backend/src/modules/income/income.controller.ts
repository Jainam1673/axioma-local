import { Body, Controller, Get, Post } from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { CreateInvoiceDto, CreatePaymentDto } from "./income.dto.js";
import { IncomeService } from "./income.service.js";
import { UseGuards } from "@nestjs/common";

@Controller("income")
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Post("invoices")
  @Roles("OWNER", "ADMIN")
  createInvoice(@Body() payload: CreateInvoiceDto) {
    return this.incomeService.createInvoice(payload);
  }

  @Post("payments")
  @Roles("OWNER", "ADMIN")
  createPayment(@Body() payload: CreatePaymentDto) {
    return this.incomeService.createPayment(payload);
  }

  @Get("summary")
  @Roles("OWNER", "ADMIN", "MEMBER")
  summary() {
    return this.incomeService.paymentsSummary();
  }
}
