import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const bookingRequests = pgTable("booking_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"), // Make nullable initially
  bodyPart: text("body_part").notNull(),
  size: text("size").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
  requestedDate: date("requested_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  timeSlot: text("time_slot", { enum: ['morning', 'afternoon', 'evening'] }).notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

// Add new type to represent the time slots
export const TimeSlot = {
  Morning: 'morning' as const,
  Afternoon: 'afternoon' as const,
  Evening: 'evening' as const,
} as const;

export type TimeSlot = typeof TimeSlot[keyof typeof TimeSlot];

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBookingRequestSchema = createInsertSchema(bookingRequests)
  .pick({
    name: true,
    email: true,
    bodyPart: true,
    size: true,
    description: true,
    requestedDate: true,
  })
  .extend({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    bodyPart: z.string().min(1, "Body part is required"),
    size: z.string().min(1, "Size is required"),
    description: z.string().min(1, "Description is required"),
    requestedDate: z.coerce.date({
      required_error: "Please select a date",
      invalid_type_error: "That's not a date!",
    }),
  });

export const insertInquirySchema = createInsertSchema(inquiries)
  .pick({
    name: true,
    email: true,
    message: true,
  })
  .extend({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    message: z.string().min(1, "Message is required"),
  });

export const insertAvailabilitySchema = createInsertSchema(availability).pick({
  date: true,
  timeSlot: true,
  isAvailable: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type BookingRequest = typeof bookingRequests.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type Availability = typeof availability.$inferSelect;