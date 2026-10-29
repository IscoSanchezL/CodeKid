import { register } from "./core";
import { common } from "./parts/common";
import { landing } from "./parts/landing";
import { auth } from "./parts/auth";
import { classAccess } from "./parts/class";
import { game } from "./parts/game";
import { map } from "./parts/map";
import { shop } from "./parts/shop";
import { teacher } from "./parts/teacher";
import { admin } from "./parts/admin";
import { levels } from "./parts/levels";
import { server } from "./parts/server";

export const PARTS = { common, landing, auth, classAccess, game, map, shop, teacher, admin, levels, server };
register(...Object.values(PARTS));

export * from "./core";
export * from "./content";
export { T, TX } from "./t";
