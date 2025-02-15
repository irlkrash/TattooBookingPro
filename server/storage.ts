import { users, bookingRequests, inquiries, availability, designConfig, galleryImages } from "@shared/schema";
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
  GalleryImage,
  InsertGalleryImage,
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

  // New gallery image methods
  getGalleryImages(): Promise<GalleryImage[]>;
  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
  updateGalleryImage(id: number, image: Partial<InsertGalleryImage>): Promise<GalleryImage>;
  deleteGalleryImage(id: number): Promise<void>;
  reorderGalleryImages(imageOrders: { id: number; order: number }[]): Promise<GalleryImage[]>;

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
    const formattedDate = date.toISOString().split('T')[0];

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
    try {
      const existing = await this.getDesignConfigByKey(config.key);

      if (existing) {
        // If config exists, update it
        const [updated] = await db
          .update(designConfig)
          .set({
            value: config.value,
            type: config.type,
            section: config.section,
            updatedAt: new Date(),
          })
          .where(eq(designConfig.key, config.key))
          .returning();
        return updated;
      } else {
        // If config doesn't exist, create it
        const [created] = await db
          .insert(designConfig)
          .values({
            ...config,
            updatedAt: new Date(),
          })
          .returning();
        return created;
      }
    } catch (error) {
      console.error('Error in upsertDesignConfig:', error);
      throw new Error(`Failed to update design configuration: ${error.message}`);
    }
  }

  async getGalleryImages(): Promise<GalleryImage[]> {
    return await db
      .select()
      .from(galleryImages)
      .orderBy(galleryImages.order);
  }

  async createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage> {
    const [created] = await db
      .insert(galleryImages)
      .values({
        ...image,
        createdAt: new Date(),
      })
      .returning();
    return created;
  }

  async updateGalleryImage(id: number, image: Partial<InsertGalleryImage>): Promise<GalleryImage> {
    const [updated] = await db
      .update(galleryImages)
      .set(image)
      .where(eq(galleryImages.id, id))
      .returning();

    if (!updated) {
      throw new Error("Gallery image not found");
    }

    return updated;
  }

  async deleteGalleryImage(id: number): Promise<void> {
    await db
      .delete(galleryImages)
      .where(eq(galleryImages.id, id));
  }

  async reorderGalleryImages(imageOrders: { id: number; order: number }[]): Promise<GalleryImage[]> {
    const updates = imageOrders.map(({ id, order }) =>
      db
        .update(galleryImages)
        .set({ order })
        .where(eq(galleryImages.id, id))
        .returning()
    );

    const results = await Promise.all(updates);
    return results.map(result => result[0]);
  }
}

export const storage = new DatabaseStorage();