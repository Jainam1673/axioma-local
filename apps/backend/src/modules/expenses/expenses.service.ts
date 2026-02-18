import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service.js";
import { CreateExpenseDto } from "./expenses.dto.js";

@Injectable()
export class ExpensesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(payload: CreateExpenseDto): Promise<{
    id: string;
    amount: string;
    category: string;
    paidAt: Date;
  }> {
    const expense = await this.prismaService.expense.create({
      data: {
        clientId: payload.clientId,
        category: payload.category,
        amount: payload.amount,
        paidAt: new Date(payload.paidAt),
        notes: payload.notes,
      },
    });

    return {
      id: expense.id,
      amount: expense.amount.toString(),
      category: expense.category,
      paidAt: expense.paidAt,
    };
  }

  async list(): Promise<Array<{ id: string; amount: string; category: string; paidAt: Date }>> {
    const expenses = (await this.prismaService.expense.findMany({
      orderBy: { paidAt: "desc" },
    })) as Array<{ id: string; amount: { toString(): string }; category: string; paidAt: Date }>;

    return expenses.map((expense) => ({
      id: expense.id,
      amount: expense.amount.toString(),
      category: expense.category,
      paidAt: expense.paidAt,
    }));
  }
}
