import { Module } from "@nestjs/common";
import { BufferSettingsController } from "./buffer-settings.controller.js";
import { BufferSettingsService } from "./buffer-settings.service.js";

@Module({
  controllers: [BufferSettingsController],
  providers: [BufferSettingsService],
})
export class BufferSettingsModule {}
