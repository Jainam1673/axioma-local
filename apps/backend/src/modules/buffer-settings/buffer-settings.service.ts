import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service.js";
import { UpsertBufferSettingDto } from "./buffer-settings.dto.js";

@Injectable()
export class BufferSettingsService {
  constructor(private readonly prismaService: PrismaService) {}

  async upsert(payload: UpsertBufferSettingDto): Promise<{
    id: string;
    fixedMonthlyExpense: string;
    bufferMonths: string;
    effectiveFrom: Date;
  }> {
    const existing = await this.prismaService.bufferSetting.findFirst({
      where: { effectiveFrom: new Date(payload.effectiveFrom) },
      orderBy: { createdAt: "desc" },
    });

    const data = {
      fixedMonthlyExpense: payload.fixedMonthlyExpense,
      bufferMonths: payload.bufferMonths,
      effectiveFrom: new Date(payload.effectiveFrom),
    };

    const record = existing
      ? await this.prismaService.bufferSetting.update({
          where: { id: existing.id },
          data,
        })
      : await this.prismaService.bufferSetting.create({ data });

    return {
      id: record.id,
      fixedMonthlyExpense: record.fixedMonthlyExpense.toString(),
      bufferMonths: record.bufferMonths.toString(),
      effectiveFrom: record.effectiveFrom,
    };
  }

  async latest(): Promise<{
    id: string;
    fixedMonthlyExpense: string;
    bufferMonths: string;
    effectiveFrom: Date;
  } | null> {
    const record = await this.prismaService.bufferSetting.findFirst({
      orderBy: { effectiveFrom: "desc" },
    });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      fixedMonthlyExpense: record.fixedMonthlyExpense.toString(),
      bufferMonths: record.bufferMonths.toString(),
      effectiveFrom: record.effectiveFrom,
    };
  }
}
