import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { isAuthenticated } from "./replit_integrations/auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup integrations
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);
  registerObjectStorageRoutes(app);

  // Profile Routes
  app.get(api.profiles.me.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    let profile = await storage.getProfile(userId);
    if (!profile) {
      // Create default profile if not exists
      profile = await storage.createProfile({
        userId,
        username: req.user.claims.firstName || "Student",
        role: "student",
      });
    }
    res.json(profile);
  });

  app.put(api.profiles.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const input = api.profiles.update.input.parse(req.body);
    const updated = await storage.updateProfile(userId, input);
    res.json(updated);
  });

  app.post(api.profiles.verifyAdmin.path, isAuthenticated, async (req: any, res) => {
    const { passcode } = req.body;
    if (passcode === "2009") {
      const userId = req.user.claims.sub;
      await storage.updateProfile(userId, { role: "admin" });
      res.json({ success: true });
    } else {
      res.status(403).json({ message: "Invalid passcode" });
    }
  });

  // Library Routes
  app.get(api.library.list.path, isAuthenticated, async (req, res) => {
    const category = req.query.category as string | undefined;
    const items = await storage.getLibraryItems(category);
    res.json(items);
  });

  app.post(api.library.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    
    if (profile?.role !== "admin") {
      return res.status(403).json({ message: "Only admins can upload to library" });
    }

    const input = api.library.create.input.parse(req.body);
    const item = await storage.createLibraryItem({ ...input, uploadedBy: userId });
    res.status(201).json(item);
  });

  app.delete(api.library.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    
    if (profile?.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete from library" });
    }

    await storage.deleteLibraryItem(Number(req.params.id));
    res.status(204).send();
  });

  // Vault Routes
  app.get(api.studyVault.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const items = await storage.getVaultItems(userId);
    res.json(items);
  });

  app.post(api.studyVault.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const input = api.studyVault.create.input.parse(req.body);
    const item = await storage.createVaultItem({ ...input, userId });
    res.status(201).json(item);
  });

  app.delete(api.studyVault.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    await storage.deleteVaultItem(Number(req.params.id), userId);
    res.status(204).send();
  });

  // Community Routes
  app.get(api.community.list.path, isAuthenticated, async (req, res) => {
    const posts = await storage.getCommunityPosts();
    res.json(posts);
  });

  app.post(api.community.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const input = api.community.create.input.parse(req.body);
    const post = await storage.createCommunityPost({ ...input, userId });
    res.status(201).json(post);
  });

  app.post(api.community.reply.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const postId = Number(req.params.postId);
    const input = api.community.reply.input.parse(req.body);
    const reply = await storage.createReply({ ...input, userId, postId });
    res.status(201).json(reply);
  });

  app.post(api.community.react.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const postId = Number(req.params.postId);
    const { emoji } = req.body;
    await storage.addReaction(postId, userId, emoji);
    res.json({ success: true });
  });

  app.post(api.community.report.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const input = api.community.report.input.parse(req.body);
    const report = await storage.createReport({ ...input, reportedBy: userId });
    res.status(201).json(report);
  });

  app.delete(api.community.deletePost.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    
    if (profile?.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete posts" });
    }

    await storage.deleteCommunityPost(Number(req.params.id));
    res.status(204).send();
  });

  // Admin Routes
  app.get(api.admin.users.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    
    if (profile?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const users = await storage.getAllProfiles();
    res.json(users);
  });

  app.post(api.admin.banUser.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    
    if (profile?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    await storage.banUser(req.params.userId);
    res.json({ success: true });
  });

  app.post(api.admin.unbanUser.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    
    if (profile?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    await storage.unbanUser(req.params.userId);
    res.json({ success: true });
  });

  app.get(api.admin.reports.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    
    if (profile?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const reports = await storage.getReports();
    res.json(reports);
  });

  app.post(api.admin.resolveReport.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    
    if (profile?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { status } = req.body;
    await storage.updateReportStatus(Number(req.params.id), status);
    res.json({ success: true });
  });

  app.put(api.admin.updateLibraryItem.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    
    if (profile?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const input = api.admin.updateLibraryItem.input.parse(req.body);
    const updated = await storage.updateLibraryItem(Number(req.params.id), input);
    res.json(updated);
  });

  return httpServer;
}
