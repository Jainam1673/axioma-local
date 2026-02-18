import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service.js";
import { CreateWithdrawalDto } from "./withdrawals.dto.js";

@Injectable()
export class WithdrawalsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(payload: CreateWithdrawalDto): Promise<{ id: string; partnerId: string; amount: string; withdrawnAt: Date }> {
    const withdrawal = await this.prismaService.withdrawal.create({
      data: {
        partnerId: payload.partnerId,
        amount: payload.amount,
        withdrawnAt: new Date(payload.withdrawnAt),
      },
    });

    return {
      id: withdrawal.id,
      partnerId: withdrawal.partnerId,
      amount: withdrawal.amount.toString(),
      withdrawnAt: withdrawal.withdrawnAt,
    };
  }

  async list(): Promise<Array<{ id: string; partnerId: string; amount: string; withdrawnAt: Date }>> {
    const withdrawals = (await this.prismaService.withdrawal.findMany({
      orderBy: { withdrawnAt: "desc" },
    })) as Array<{ id: string; partnerId: string; amount: { toString(): string }; withdrawnAt: Date }>;

    return withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      partnerId: withdrawal.partnerId,
      amount: withdrawal.amount.toString(),
      withdrawnAt: withdrawal.withdrawnAt,
    }));
  }
}
