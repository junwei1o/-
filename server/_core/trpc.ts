import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

/**
 * 角色層級表（2026-10-01）。
 *
 * 為什麼用「層級」而不是逐一列舉：本站的角色會持續增加（目前已有學生／教師／
 * 站長），若每個 procedure 都寫 `role === "teacher" || role === "admin"`，
 * 之後每次新增角色都要回頭改好幾處、很容易漏。改成登記層級後，
 * **新增角色只需在這裡加一筆**，並用 `hasRoleAtLeast` 表達「至少要有某權限」。
 *
 * 學生（未登入的一般使用者）不在此表：他們一律是 `user = null`。
 */
const ROLE_RANK: Record<string, number> = {
  teacher: 1,
  admin: 2,
};

/** 是否具備「至少」required 等級的角色（站長 ⊇ 教師）。 */
export function hasRoleAtLeast(user: unknown, required: "teacher" | "admin"): boolean {
  const role = (user as { role?: string } | null | undefined)?.role;
  if (!role) return false;
  const rank = ROLE_RANK[role] ?? 0;
  return rank >= (ROLE_RANK[required] ?? Number.POSITIVE_INFINITY);
}

/**
 * 教師（含以上）專用：ctx.user 必須是教師或站長哨兵身份
 * （createContext 由 session 哨兵映射而來）。
 *
 * 站長（admin）層級高於教師，因此可通行教師端點——避免站長還要另外登入一次
 * 教師端才能管理班級。
 */
export const teacherProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!hasRoleAtLeast(ctx.user, "teacher")) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "需要教師身分" });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * 站長專用。站長＝網站擁有者，管全站營運與基礎設施（資源監控、部署、內容健康…），
 * 與教師的「班級／教學」定位分開。以專屬 `ADMIN_PASSPHRASE` 登入取得。
 */
export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!hasRoleAtLeast(ctx.user, "admin")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "需要站長身分" });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
