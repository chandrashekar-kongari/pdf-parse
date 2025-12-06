import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { parseRouter } from "./parse";

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string().optional() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input?.text ?? "world"}!`,
      };
    }),
  parse: parseRouter,
});

export type AppRouter = typeof appRouter;
