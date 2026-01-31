import { db } from "./db";
import {
  profiles,
  libraryItems,
  studyVaultItems,
  communityPosts,
  communityReplies,
  postReactions,
  reports,
  type InsertProfile,
  type InsertLibraryItem,
  type InsertStudyVaultItem,
  type InsertCommunityPost,
  type InsertCommunityReply,
  type InsertReport,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { users as authUsers } from "@shared/schema";

export interface IStorage {
  // Profiles
  getProfile(userId: string): Promise<typeof profiles.$inferSelect | undefined>;
  createProfile(profile: InsertProfile): Promise<typeof profiles.$inferSelect>;
  updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<typeof profiles.$inferSelect>;

  // Library
  getLibraryItems(category?: string): Promise<typeof libraryItems.$inferSelect[]>;
  getLibraryItem(id: number): Promise<typeof libraryItems.$inferSelect | undefined>;
  createLibraryItem(item: InsertLibraryItem): Promise<typeof libraryItems.$inferSelect>;
  updateLibraryItem(id: number, updates: Partial<InsertLibraryItem>): Promise<typeof libraryItems.$inferSelect>;
  deleteLibraryItem(id: number): Promise<void>;

  // Vault
  getVaultItems(userId: string): Promise<typeof studyVaultItems.$inferSelect[]>;
  createVaultItem(item: InsertStudyVaultItem): Promise<typeof studyVaultItems.$inferSelect>;
  deleteVaultItem(id: number, userId: string): Promise<void>;

  // Community
  getCommunityPosts(): Promise<any[]>;
  createCommunityPost(post: InsertCommunityPost): Promise<typeof communityPosts.$inferSelect>;
  createReply(reply: InsertCommunityReply): Promise<typeof communityReplies.$inferSelect>;
  addReaction(postId: number, userId: string, emoji: string): Promise<void>;
  createReport(report: InsertReport): Promise<typeof reports.$inferSelect>;
  deleteCommunityPost(id: number): Promise<void>;
  deleteCommunityReply(id: number): Promise<void>;

  // Admin
  getAllProfiles(): Promise<any[]>;
  banUser(userId: string): Promise<void>;
  unbanUser(userId: string): Promise<void>;
  getReports(): Promise<typeof reports.$inferSelect[]>;
  updateReportStatus(id: number, status: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProfile(userId: string) {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(profile: InsertProfile) {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  async updateProfile(userId: string, updates: Partial<InsertProfile>) {
    const [updated] = await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.userId, userId))
      .returning();
    return updated;
  }

  async getLibraryItems(category?: string) {
    if (category) {
      return db.select().from(libraryItems).where(eq(libraryItems.category, category)).orderBy(desc(libraryItems.createdAt));
    }
    return db.select().from(libraryItems).orderBy(desc(libraryItems.createdAt));
  }

  async createLibraryItem(item: InsertLibraryItem) {
    const [newItem] = await db.insert(libraryItems).values(item).returning();
    return newItem;
  }

  async deleteLibraryItem(id: number) {
    await db.delete(libraryItems).where(eq(libraryItems.id, id));
  }

  async getVaultItems(userId: string) {
    return db.select().from(studyVaultItems).where(eq(studyVaultItems.userId, userId)).orderBy(desc(studyVaultItems.createdAt));
  }

  async createVaultItem(item: InsertStudyVaultItem) {
    const [newItem] = await db.insert(studyVaultItems).values(item).returning();
    return newItem;
  }

  async deleteVaultItem(id: number, userId: string) {
    await db.delete(studyVaultItems).where(eq(studyVaultItems.id, id), eq(studyVaultItems.userId, userId));
  }

  async getCommunityPosts() {
    // This is a simplified fetch. In a real app, you'd join with profiles, replies, reactions.
    const posts = await db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt));
    
    // Fetch related data manually to construct the view (efficient enough for small scale)
    const postsWithData = await Promise.all(posts.map(async (post) => {
      const [author] = await db.select().from(profiles).where(eq(profiles.userId, post.userId));
      const replies = await db.select().from(communityReplies).where(eq(communityReplies.postId, post.id));
      const repliesWithAuthors = await Promise.all(replies.map(async (r) => {
        const [rAuthor] = await db.select().from(profiles).where(eq(profiles.userId, r.userId));
        return { ...r, author: rAuthor };
      }));
      const reactions = await db.select().from(postReactions).where(eq(postReactions.postId, post.id));
      
      return {
        ...post,
        author,
        replies: repliesWithAuthors,
        reactions
      };
    }));
    
    return postsWithData;
  }

  async createCommunityPost(post: InsertCommunityPost) {
    const [newItem] = await db.insert(communityPosts).values(post).returning();
    return newItem;
  }

  async createReply(reply: InsertCommunityReply) {
    const [newItem] = await db.insert(communityReplies).values(reply).returning();
    return newItem;
  }

  async addReaction(postId: number, userId: string, emoji: string) {
    await db.insert(postReactions).values({ postId, userId, emoji });
  }

  async createReport(report: InsertReport) {
    const [newItem] = await db.insert(reports).values(report).returning();
    return newItem;
  }

  async getLibraryItem(id: number) {
    const [item] = await db.select().from(libraryItems).where(eq(libraryItems.id, id));
    return item;
  }

  async updateLibraryItem(id: number, updates: Partial<InsertLibraryItem>) {
    const [updated] = await db
      .update(libraryItems)
      .set(updates)
      .where(eq(libraryItems.id, id))
      .returning();
    return updated;
  }

  async deleteCommunityPost(id: number) {
    await db.delete(communityReplies).where(eq(communityReplies.postId, id));
    await db.delete(postReactions).where(eq(postReactions.postId, id));
    await db.delete(communityPosts).where(eq(communityPosts.id, id));
  }

  async deleteCommunityReply(id: number) {
    await db.delete(communityReplies).where(eq(communityReplies.id, id));
  }

  async getAllProfiles() {
    const allProfiles = await db.select().from(profiles).orderBy(desc(profiles.joinedAt));
    const profilesWithUsers = await Promise.all(
      allProfiles.map(async (profile) => {
        const [user] = await db.select().from(authUsers).where(eq(authUsers.id, profile.userId));
        return { ...profile, user };
      })
    );
    return profilesWithUsers;
  }

  async banUser(userId: string) {
    await db.update(profiles).set({ isBanned: true }).where(eq(profiles.userId, userId));
  }

  async unbanUser(userId: string) {
    await db.update(profiles).set({ isBanned: false }).where(eq(profiles.userId, userId));
  }

  async getReports() {
    return db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async updateReportStatus(id: number, status: string) {
    await db.update(reports).set({ status }).where(eq(reports.id, id));
  }
}

export const storage = new DatabaseStorage();
