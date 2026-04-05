import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  prospectName: text("prospect_name").notNull(),
  prospectEmail: text("prospect_email").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  status: text("status", { enum: ["confirmed", "cancelled"] })
    .notNull()
    .default("confirmed"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
