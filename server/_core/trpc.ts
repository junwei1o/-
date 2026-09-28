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
 * 教師專用（計劃 A Phase 1）：ctx.user 必須是教師哨兵身份
 * （createContext 由 TEACHER_OPEN_ID session 映射而來）。
 *
 * 注意：User.role 的 mysqlEnum 不含 "teacher"（不動 DB＝陷阱 4），
 * 故以結構型別讀取 role，避免編譯期 union 不合。
 */
export const teacherProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const role = (ctx.user as { role?: string } | null)?.role;

    if (!ctx.user || role !== "teacher") {
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

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
