import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { UpsertBufferSettingDto } from "./buffer-settings.dto.js";
import { BufferSettingsService } from "./buffer-settings.service.js";

@Controller("buffer-settings")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BufferSettingsController {
  constructor(private readonly bufferSettingsService: BufferSettingsService) {}

  @Post()
  @Roles("OWNER", "ADMIN")
  upsert(@Body() payload: UpsertBufferSettingDto) {
    return this.bufferSettingsService.upsert(payload);
  }

  @Get("latest")
  @Roles("OWNER", "ADMIN", "MEMBER")
  latest() {
    return this.bufferSettingsService.latest();
  }
}
