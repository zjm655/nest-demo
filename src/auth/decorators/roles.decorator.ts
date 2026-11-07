import { SetMetadata } from "@nestjs/common";
import { type ROLE } from "../constants.js";
export const ROLES_KEY = 'roles';

export function Roles(...roles: ROLE[]) {
    return SetMetadata(ROLES_KEY, roles);
}

