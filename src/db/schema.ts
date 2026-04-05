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
  reminded: integer("reminded", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const availabilityWindows = sqliteTable("availability_windows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 6 = Saturday
  startTime: text("start_time").notNull(), // HH:mm format
  endTime: text("end_time").notNull(), // HH:mm format
});
