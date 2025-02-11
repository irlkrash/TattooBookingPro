import { users, bookingRequests, inquiries, availability, designConfig } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import type {
  User,
  InsertUser,
  BookingRequest,
  Inquiry,
  Availability,
  TimeSlot,
  DesignConfig,
  InsertDesignConfig,
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getBookingRequests(): Promise<BookingRequest[]>;
  createBookingRequest(request: Omit<BookingRequest, "id" | "status" | "createdAt">): Promise<BookingRequest>;
  updateBookingStatus(id: number, status: string): Promise<BookingRequest>;

  getInquiries(): Promise<Inquiry[]>;
  createInquiry(inquiry: Omit<Inquiry, "id" | "createdAt">): Promise<Inquiry>;

  getAvailability(): Promise<Availability[]>;
  setAvailability(date: Date, timeSlot: TimeSlot, isAvailable: boolean): Promise<Availability>;

  getDesignConfigs(): Promise<DesignConfig[]>;
  getDesignConfigByKey(key: string): Promise<DesignConfig | undefined>;
  upsertDesignConfig(config: InsertDesignConfig): Promise<DesignConfig>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getBookingRequests(): Promise<BookingRequest[]> {
    return await db.select().from(bookingRequests);
  }

  async createBookingRequest(
    request: Omit<BookingRequest, "id" | "status" | "createdAt">,
  ): Promise<BookingRequest> {
    const [booking] = await db
      .insert(bookingRequests)
      .values({
        ...request,
        status: "pending",
        createdAt: new Date(),
      })
      .returning();
    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<BookingRequest> {
    const [booking] = await db
      .update(bookingRequests)
      .set({ status })
      .where(eq(bookingRequests.id, id))
      .returning();

    if (!booking) {
      throw new Error("Booking not found");
    }

    return booking;
  }

  async getInquiries(): Promise<Inquiry[]> {
    return await db.select().from(inquiries);
  }

  async createInquiry(
    inquiry: Omit<Inquiry, "id" | "createdAt">,
  ): Promise<Inquiry> {
    const [created] = await db
      .insert(inquiries)
      .values({
        ...inquiry,
        createdAt: new Date(),
      })
      .returning();
    return created;
  }

  async getAvailability(): Promise<Availability[]> {
    return await db.select().from(availability);
  }

  async setAvailability(date: Date, timeSlot: TimeSlot, isAvailable: boolean): Promise<Availability> {
    // Format date to YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];

    // First try to find existing availability
    const [existing] = await db
      .select()
      .from(availability)
      .where(
        and(
          eq(availability.date, formattedDate),
          eq(availability.timeSlot, timeSlot)
        )
      );

    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(availability)
        .set({ isAvailable })
        .where(
          and(
            eq(availability.date, formattedDate),
            eq(availability.timeSlot, timeSlot)
          )
        )
        .returning();
      return updated;
    } else {
      // Create new record
      const [created] = await db
        .insert(availability)
        .values({
          date: formattedDate,
          timeSlot,
          isAvailable,
        })
        .returning();
      return created;
    }
  }

  async getDesignConfigs(): Promise<DesignConfig[]> {
    return await db.select().from(designConfig);
  }

  async getDesignConfigByKey(key: string): Promise<DesignConfig | undefined> {
    const [config] = await db
      .select()
      .from(designConfig)
      .where(eq(designConfig.key, key));
    return config;
  }

  async upsertDesignConfig(config: InsertDesignConfig): Promise<DesignConfig> {
    // Try to find existing config
    const existing = await this.getDesignConfigByKey(config.key);

    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(designConfig)
        .set({
          ...config,
          updatedAt: new Date(),
        })
        .where(eq(designConfig.key, config.key))
        .returning();
      return updated;
    } else {
      // Create new record
      const [created] = await db
        .insert(designConfig)
        .values({
          ...config,
          updatedAt: new Date(),
        })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();