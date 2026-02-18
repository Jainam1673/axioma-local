import { SetMetadata } from "@nestjs/common";
import type { AppUserRole } from "../auth.types.js";

export const ROLES_KEY = "roles";
export const Roles = (...roles: AppUserRole[]) => SetMetadata(ROLES_KEY, roles);
