import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service.js";
import { UpsertSalarySettingDto } from "./salary-settings.dto.js";

@Injectable()
export class SalarySettingsService {
  constructor(private readonly prismaService: PrismaService) {}

  async upsert(payload: UpsertSalarySettingDto): Promise<{
    id: string;
    monthlyTotal: string;
    effectiveFrom: Date;
  }> {
    const existing = await this.prismaService.salarySetting.findFirst({
      where: { effectiveFrom: new Date(payload.effectiveFrom) },
      orderBy: { createdAt: "desc" },
    });

    const data = {
      monthlyTotal: payload.monthlyTotal,
      effectiveFrom: new Date(payload.effectiveFrom),
    };

    const record = existing
      ? await this.prismaService.salarySetting.update({
          where: { id: existing.id },
          data,
        })
      : await this.prismaService.salarySetting.create({ data });

    return {
      id: record.id,
      monthlyTotal: record.monthlyTotal.toString(),
      effectiveFrom: record.effectiveFrom,
    };
  }

  async latest(): Promise<{
    id: string;
    monthlyTotal: string;
    effectiveFrom: Date;
  } | null> {
    const record = await this.prismaService.salarySetting.findFirst({
      orderBy: { effectiveFrom: "desc" },
    });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      monthlyTotal: record.monthlyTotal.toString(),
      effectiveFrom: record.effectiveFrom,
    };
  }
}
