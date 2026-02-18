import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { CreatePartnerDto } from "./partners.dto.js";
import { PartnersService } from "./partners.service.js";

@Controller("partners")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post()
  @Roles("OWNER", "ADMIN")
  create(@Body() payload: CreatePartnerDto) {
    return this.partnersService.create(payload);
  }

  @Get()
  @Roles("OWNER", "ADMIN", "MEMBER")
  list() {
    return this.partnersService.list();
  }
}
