import { SetMetadata } from "@nestjs/common";
import { ROLES_KEY, type ROLE } from "../constants.js";

export function Roles(...roles: ROLE[]) {
    return SetMetadata(ROLES_KEY, roles);
}

