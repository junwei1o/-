import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // 🏴‍☠️ 訪客船長模式：繞過 Manus OAuth，強制以訪客身份登入
  const guestUser = {
    id: 1, 
    openId: "guest_captain",
    name: "訪客船長",
    email: "guest@local",
    loginMethod: "guest",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  } as unknown as User;

  return {
    req: opts.req,
    res: opts.res,
    user: guestUser,
  };
}
