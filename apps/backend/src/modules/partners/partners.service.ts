import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service.js";
import { CreatePartnerDto } from "./partners.dto.js";

@Injectable()
export class PartnersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(payload: CreatePartnerDto): Promise<{ id: string; name: string; shareRatio: string }> {
    const partner = await this.prismaService.partner.create({
      data: {
        userId: payload.userId,
        name: payload.name,
        shareRatio: payload.shareRatio,
      },
    });

    return {
      id: partner.id,
      name: partner.name,
      shareRatio: partner.shareRatio.toString(),
    };
  }

  async list(): Promise<Array<{ id: string; userId: string; name: string; shareRatio: string; isActive: boolean }>> {
    const partners = (await this.prismaService.partner.findMany({
      orderBy: { createdAt: "desc" },
    })) as Array<{
      id: string;
      userId: string;
      name: string;
      shareRatio: { toString(): string };
      isActive: boolean;
    }>;

    return partners.map((partner) => ({
      id: partner.id,
      userId: partner.userId,
      name: partner.name,
      shareRatio: partner.shareRatio.toString(),
      isActive: partner.isActive,
    }));
  }
}
