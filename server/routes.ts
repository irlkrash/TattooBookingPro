import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertBookingRequestSchema, insertInquirySchema, TimeSlot, insertDesignConfigSchema, insertGalleryImageSchema } from "@shared/schema";

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

      // Convert date string to Date object and format it properly
      const formattedDate = new Date(date);
      if (isNaN(formattedDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      const availability = await storage.setAvailability(formattedDate, timeSlot, isAvailable);
      res.status(201).json(availability);
    } catch (error: any) {
      console.error('Error setting availability:', error);
      res.status(400).json({ 
        message: "Failed to update availability",
        error: error.message 
      });
    }
  });

  // Design configuration routes
  app.get("/api/design-config", async (req, res) => {
    try {
      const configs = await storage.getDesignConfigs();
      res.json(configs);
    } catch (error: any) {
      console.error('Error fetching design configs:', error);
      res.status(500).json({
        message: "Failed to fetch design configurations",
        error: error.message
      });
    }
  });

  app.post("/api/design-config", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }
    try {
      const data = insertDesignConfigSchema.parse(req.body);
      const config = await storage.upsertDesignConfig(data);
      res.json(config);
    } catch (error: any) {
      console.error('Error updating design config:', error);
      res.status(400).json({
        message: "Failed to update design configuration",
        error: error.message
      });
    }
  });

  // Gallery image routes
  app.get("/api/gallery-images", async (req, res) => {
    try {
      const images = await storage.getGalleryImages();
      res.json(images);
    } catch (error: any) {
      console.error('Error fetching gallery images:', error);
      res.status(500).json({
        message: "Failed to fetch gallery images",
        error: error.message
      });
    }
  });

  app.post("/api/gallery-images", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }
    try {
      const data = insertGalleryImageSchema.parse(req.body);
      const image = await storage.createGalleryImage(data);
      res.status(201).json(image);
    } catch (error: any) {
      console.error('Error creating gallery image:', error);
      res.status(400).json({
        message: "Failed to create gallery image",
        error: error.message
      });
    }
  });

  app.patch("/api/gallery-images/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }
    try {
      const id = parseInt(req.params.id);
      const data = insertGalleryImageSchema.partial().parse(req.body);
      const image = await storage.updateGalleryImage(id, data);
      res.json(image);
    } catch (error: any) {
      console.error('Error updating gallery image:', error);
      res.status(400).json({
        message: "Failed to update gallery image",
        error: error.message
      });
    }
  });

  app.delete("/api/gallery-images/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGalleryImage(id);
      res.sendStatus(204);
    } catch (error: any) {
      console.error('Error deleting gallery image:', error);
      res.status(400).json({
        message: "Failed to delete gallery image",
        error: error.message
      });
    }
  });

  app.post("/api/gallery-images/reorder", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }
    try {
      const { orders } = req.body;
      const images = await storage.reorderGalleryImages(orders);
      res.json(images);
    } catch (error: any) {
      console.error('Error reordering gallery images:', error);
      res.status(400).json({
        message: "Failed to reorder gallery images",
        error: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}