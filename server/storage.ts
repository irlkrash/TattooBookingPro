import { User, InsertUser, BookingRequest, Inquiry, Availability } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(session);

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
  setAvailability(date: Date, isAvailable: boolean): Promise<Availability>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bookingRequests: Map<number, BookingRequest>;
  private inquiries: Map<number, Inquiry>;
  private availability: Map<number, Availability>;
  private currentId: { [key: string]: number };
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.bookingRequests = new Map();
    this.inquiries = new Map();
    this.availability = new Map();
    this.currentId = { users: 1, bookings: 1, inquiries: 1, availability: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id, isAdmin: false };
    this.users.set(id, user);
    return user;
  }

  async getBookingRequests(): Promise<BookingRequest[]> {
    return Array.from(this.bookingRequests.values());
  }

  async createBookingRequest(request: Omit<BookingRequest, "id" | "status" | "createdAt">): Promise<BookingRequest> {
    const id = this.currentId.bookings++;
    const bookingRequest: BookingRequest = {
      ...request,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.bookingRequests.set(id, bookingRequest);
    return bookingRequest;
  }

  async updateBookingStatus(id: number, status: string): Promise<BookingRequest> {
    const booking = this.bookingRequests.get(id);
    if (!booking) throw new Error("Booking not found");
    const updated = { ...booking, status };
    this.bookingRequests.set(id, updated);
    return updated;
  }

  async getInquiries(): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values());
  }

  async createInquiry(inquiry: Omit<Inquiry, "id" | "createdAt">): Promise<Inquiry> {
    const id = this.currentId.inquiries++;
    const newInquiry: Inquiry = {
      ...inquiry,
      id,
      createdAt: new Date(),
    };
    this.inquiries.set(id, newInquiry);
    return newInquiry;
  }

  async getAvailability(): Promise<Availability[]> {
    return Array.from(this.availability.values());
  }

  async setAvailability(date: Date, isAvailable: boolean): Promise<Availability> {
    const id = this.currentId.availability++;
    const availability: Availability = { id, date, isAvailable };
    this.availability.set(id, availability);
    return availability;
  }
}

export const storage = new MemStorage();
