import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { db, notes } from '../../../db';
import { eq } from 'drizzle-orm';

export const noteRouter = router({
  create: publicProcedure
    .input(
      z.object({
        note: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await db
        .insert(notes)
        .values({
          note: input.note,
        })
        .returning();
      return result[0];
    }),
  list: publicProcedure.query(async () => {
    return await db.select().from(notes);
  }),
  remove: publicProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await db.delete(notes).where(eq(notes.id, input.id));
    }),
});
