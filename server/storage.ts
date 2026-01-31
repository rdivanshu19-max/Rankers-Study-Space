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
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfile(userId: string): Promise<typeof profiles.$inferSelect | undefined>;
  createProfile(profile: InsertProfile): Promise<typeof profiles.$inferSelect>;
  updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<typeof profiles.$inferSelect>;

  // Library
  getLibraryItems(category?: string): Promise<typeof libraryItems.$inferSelect[]>;
  createLibraryItem(item: InsertLibraryItem): Promise<typeof libraryItems.$inferSelect>;
  deleteLibraryItem(id: number): Promise<void>;

  // Vault
  getVaultItems(userId: string): Promise<typeof studyVaultItems.$inferSelect[]>;
  createVaultItem(item: InsertStudyVaultItem): Promise<typeof studyVaultItems.$inferSelect>;
  deleteVaultItem(id: number, userId: string): Promise<void>;

  // Community
  getCommunityPosts(): Promise<any[]>; // Complex join return type
  createCommunityPost(post: InsertCommunityPost): Promise<typeof communityPosts.$inferSelect>;
  createReply(reply: InsertCommunityReply): Promise<typeof communityReplies.$inferSelect>;
  addReaction(postId: number, userId: string, emoji: string): Promise<void>;
  createReport(report: InsertReport): Promise<typeof reports.$inferSelect>;
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
}

export const storage = new DatabaseStorage();
