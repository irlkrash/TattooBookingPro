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
  email: text("email"),
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

export const designConfig = pgTable("design_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), 
  value: text("value").notNull().default(''),
  type: text("type", { 
    enum: ['text', 'font', 'color', 'background_image', 'background_color'] 
  }).notNull(),
  section: text("section", {
    enum: ['theme', 'home', 'hero', 'about', 'booking', 'contact', 'gallery', 'header', 'footer']
  }).notNull(), 
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const galleryImages = pgTable("gallery_images", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  alt: text("alt"),
  credit: text("credit"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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

export const insertDesignConfigSchema = createInsertSchema(designConfig)
  .pick({
    key: true,
    value: true,
    type: true,
    section: true,
  })
  .extend({
    key: z.string().min(1, "Key is required"),
    value: z.string().default(''),
    type: z.enum(['text', 'font', 'color', 'background_image', 'background_color']),
    section: z.enum(['theme', 'home', 'hero', 'about', 'booking', 'contact', 'gallery', 'header', 'footer']),
  });

export const insertGalleryImageSchema = createInsertSchema(galleryImages)
  .pick({
    url: true,
    alt: true,
    credit: true,
    order: true,
  })
  .extend({
    url: z.string().url("Must be a valid URL"),
    alt: z.string().optional(),
    credit: z.string().optional(),
    order: z.number().int().min(0),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type BookingRequest = typeof bookingRequests.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type Availability = typeof availability.$inferSelect;
export type DesignConfig = typeof designConfig.$inferSelect;
export type InsertDesignConfig = z.infer<typeof insertDesignConfigSchema>;
export type GalleryImage = typeof galleryImages.$inferSelect;
export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;