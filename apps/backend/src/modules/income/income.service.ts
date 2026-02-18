import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service.js";
import { CreateInvoiceDto, CreatePaymentDto } from "./income.dto.js";

@Injectable()
export class IncomeService {
  constructor(private readonly prismaService: PrismaService) {}

  async createInvoice(payload: CreateInvoiceDto): Promise<{ id: string; clientId: string; amount: string; issuedAt: Date }> {
    const invoice = await this.prismaService.invoice.create({
      data: {
        clientId: payload.clientId,
        amount: payload.amount,
        issuedAt: new Date(payload.issuedAt),
        dueAt: payload.dueAt ? new Date(payload.dueAt) : null,
      },
    });

    return {
      id: invoice.id,
      clientId: invoice.clientId,
      amount: invoice.amount.toString(),
      issuedAt: invoice.issuedAt,
    };
  }

  async createPayment(payload: CreatePaymentDto): Promise<{ id: string; invoiceId: string; amount: string; receivedAt: Date }> {
    const payment = await this.prismaService.payment.create({
      data: {
        invoiceId: payload.invoiceId,
        amount: payload.amount,
        receivedAt: new Date(payload.receivedAt),
      },
    });

    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      amount: payment.amount.toString(),
      receivedAt: payment.receivedAt,
    };
  }

  async paymentsSummary(): Promise<{ realizedRevenue: string }> {
    const aggregate = await this.prismaService.payment.aggregate({
      _sum: { amount: true },
    });

    return {
      realizedRevenue: aggregate._sum.amount?.toString() ?? "0",
    };
  }
}
