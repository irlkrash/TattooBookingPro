import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertBookingRequestSchema, insertInquirySchema, TimeSlot } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.get("/api/booking-requests", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }
    const requests = await storage.getBookingRequests();
    res.json(requests);
  });

  app.post("/api/booking-requests", async (req, res) => {
    try {
      const data = insertBookingRequestSchema.parse(req.body);
      // Convert the Date object to ISO string for storage
      const request = await storage.createBookingRequest({
        ...data,
        requestedDate: data.requestedDate.toISOString().split('T')[0],
      });
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json(error);
    }
  });

  app.patch("/api/booking-requests/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const request = await storage.updateBookingStatus(id, status);
      res.json(request);
    } catch (error) {
      res.status(400).json(error);
    }
  });

  app.get("/api/inquiries", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }
    const inquiries = await storage.getInquiries();
    res.json(inquiries);
  });

  app.post("/api/inquiries", async (req, res) => {
    try {
      const data = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(data);
      res.status(201).json(inquiry);
    } catch (error) {
      res.status(400).json(error);
    }
  });

  app.get("/api/availability", async (req, res) => {
    const availability = await storage.getAvailability();
    res.json(availability);
  });

  app.post("/api/availability", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }
    try {
      const { date, timeSlot, isAvailable } = req.body;

      // Validate time slot
      if (!Object.values(TimeSlot).includes(timeSlot)) {
        return res.status(400).json({ message: "Invalid time slot" });
      }

      const availability = await storage.setAvailability(new Date(date), timeSlot, isAvailable);
      res.status(201).json(availability);
    } catch (error) {
      res.status(400).json(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
