import { db } from "./db";
import {
  profiles,
  libraryItems,
  libraryRatings,
  libraryComments,
  studyVaultItems,
  communityPosts,
  communityReplies,
  postReactions,
  reports,
  warnings,
  announcements,
  type InsertProfile,
  type InsertLibraryItem,
  type InsertStudyVaultItem,
  type InsertCommunityPost,
  type InsertCommunityReply,
  type InsertReport,
  type InsertWarning,
  type InsertAnnouncement,
  type InsertLibraryRating,
  type InsertLibraryComment,
} from "@shared/schema";
import { eq, desc, and, sql, avg } from "drizzle-orm";
import { users as authUsers } from "@shared/schema";

export interface IStorage {
  // Profiles
  getProfile(userId: string): Promise<typeof profiles.$inferSelect | undefined>;
  createProfile(profile: InsertProfile): Promise<typeof profiles.$inferSelect>;
  updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<typeof profiles.$inferSelect>;

  // Library
  getLibraryItems(category?: string): Promise<any[]>;
  getLibraryItem(id: number): Promise<typeof libraryItems.$inferSelect | undefined>;
  createLibraryItem(item: InsertLibraryItem): Promise<typeof libraryItems.$inferSelect>;
  updateLibraryItem(id: number, updates: Partial<InsertLibraryItem>): Promise<typeof libraryItems.$inferSelect>;
  deleteLibraryItem(id: number): Promise<void>;
  
  // Library Ratings & Comments
  addLibraryRating(rating: InsertLibraryRating): Promise<typeof libraryRatings.$inferSelect>;
  getLibraryItemRating(itemId: number): Promise<{ average: number; count: number }>;
  getUserRating(itemId: number, userId: string): Promise<typeof libraryRatings.$inferSelect | undefined>;
  getLibraryComments(itemId: number): Promise<any[]>;
  addLibraryComment(comment: InsertLibraryComment): Promise<typeof libraryComments.$inferSelect>;
  deleteLibraryComment(id: number): Promise<void>;
  pinLibraryComment(id: number): Promise<void>;
  unpinLibraryComment(id: number): Promise<void>;

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
  muteUser(userId: string): Promise<void>;
  unmuteUser(userId: string): Promise<void>;
  warnUser(userId: string, reason: string, issuedBy: string): Promise<{ autoBanned: boolean }>;
  getReports(): Promise<any[]>;
  updateReportStatus(id: number, status: string): Promise<void>;
  
  // Post pinning
  pinPost(postId: number): Promise<void>;
  unpinPost(postId: number): Promise<void>;
  
  // Announcements
  getAnnouncements(): Promise<typeof announcements.$inferSelect[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<typeof announcements.$inferSelect>;
  deleteAnnouncement(id: number): Promise<void>;
  
  // Warnings
  getUserWarnings(userId: string): Promise<typeof warnings.$inferSelect[]>;
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
    let items;
    if (category) {
      items = await db.select().from(libraryItems).where(eq(libraryItems.category, category)).orderBy(desc(libraryItems.createdAt));
    } else {
      items = await db.select().from(libraryItems).orderBy(desc(libraryItems.createdAt));
    }
    
    // Add ratings to each item
    const itemsWithRatings = await Promise.all(items.map(async (item) => {
      const ratingData = await this.getLibraryItemRating(item.id);
      return { ...item, averageRating: ratingData.average, ratingCount: ratingData.count };
    }));
    
    return itemsWithRatings;
  }

  async createLibraryItem(item: InsertLibraryItem) {
    const [newItem] = await db.insert(libraryItems).values(item).returning();
    return newItem;
  }

  async deleteLibraryItem(id: number) {
    await db.delete(libraryRatings).where(eq(libraryRatings.libraryItemId, id));
    await db.delete(libraryComments).where(eq(libraryComments.libraryItemId, id));
    await db.delete(libraryItems).where(eq(libraryItems.id, id));
  }

  async addLibraryRating(rating: InsertLibraryRating) {
    // Check if user already rated, update if so
    const existing = await this.getUserRating(rating.libraryItemId, rating.userId);
    if (existing) {
      const [updated] = await db.update(libraryRatings)
        .set({ rating: rating.rating })
        .where(eq(libraryRatings.id, existing.id))
        .returning();
      return updated;
    }
    const [newRating] = await db.insert(libraryRatings).values(rating).returning();
    return newRating;
  }

  async getLibraryItemRating(itemId: number) {
    const ratings = await db.select().from(libraryRatings).where(eq(libraryRatings.libraryItemId, itemId));
    if (ratings.length === 0) return { average: 0, count: 0 };
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return { average: sum / ratings.length, count: ratings.length };
  }

  async getUserRating(itemId: number, userId: string) {
    const [rating] = await db.select().from(libraryRatings)
      .where(and(eq(libraryRatings.libraryItemId, itemId), eq(libraryRatings.userId, userId)));
    return rating;
  }

  async getLibraryComments(itemId: number) {
    const comments = await db.select().from(libraryComments)
      .where(eq(libraryComments.libraryItemId, itemId))
      .orderBy(desc(libraryComments.isPinned), desc(libraryComments.createdAt));
    
    // Get author info for each comment
    const commentsWithAuthors = await Promise.all(comments.map(async (comment) => {
      const [author] = await db.select().from(profiles).where(eq(profiles.userId, comment.userId));
      return { ...comment, author };
    }));
    
    return commentsWithAuthors;
  }

  async addLibraryComment(comment: InsertLibraryComment) {
    const [newComment] = await db.insert(libraryComments).values(comment).returning();
    return newComment;
  }

  async deleteLibraryComment(id: number) {
    await db.delete(libraryComments).where(eq(libraryComments.id, id));
  }

  async pinLibraryComment(id: number) {
    await db.update(libraryComments).set({ isPinned: true }).where(eq(libraryComments.id, id));
  }

  async unpinLibraryComment(id: number) {
    await db.update(libraryComments).set({ isPinned: false }).where(eq(libraryComments.id, id));
  }

  async getVaultItems(userId: string) {
    return db.select().from(studyVaultItems).where(eq(studyVaultItems.userId, userId)).orderBy(desc(studyVaultItems.createdAt));
  }

  async createVaultItem(item: InsertStudyVaultItem) {
    const [newItem] = await db.insert(studyVaultItems).values(item).returning();
    return newItem;
  }

  async deleteVaultItem(id: number, userId: string) {
    await db.delete(studyVaultItems).where(and(eq(studyVaultItems.id, id), eq(studyVaultItems.userId, userId)));
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
    const allReports = await db.select().from(reports).orderBy(desc(reports.createdAt));
    const reportsWithUsers = await Promise.all(
      allReports.map(async (report) => {
        let targetUser = null;
        if (report.targetUserId) {
          const [profile] = await db.select().from(profiles).where(eq(profiles.userId, report.targetUserId));
          targetUser = profile;
        }
        return { ...report, targetUser };
      })
    );
    return reportsWithUsers;
  }

  async updateReportStatus(id: number, status: string) {
    await db.update(reports).set({ status }).where(eq(reports.id, id));
  }

  async muteUser(userId: string) {
    await db.update(profiles).set({ isMuted: true }).where(eq(profiles.userId, userId));
  }

  async unmuteUser(userId: string) {
    await db.update(profiles).set({ isMuted: false }).where(eq(profiles.userId, userId));
  }

  async warnUser(userId: string, reason: string, issuedBy: string) {
    await db.insert(warnings).values({ userId, reason, issuedBy });
    
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    const newWarningCount = (profile?.warningCount || 0) + 1;
    
    await db.update(profiles)
      .set({ warningCount: newWarningCount })
      .where(eq(profiles.userId, userId));
    
    if (newWarningCount >= 3) {
      await this.banUser(userId);
      return { autoBanned: true };
    }
    
    return { autoBanned: false };
  }

  async pinPost(postId: number) {
    await db.update(communityPosts).set({ isPinned: true }).where(eq(communityPosts.id, postId));
  }

  async unpinPost(postId: number) {
    await db.update(communityPosts).set({ isPinned: false }).where(eq(communityPosts.id, postId));
  }

  async getAnnouncements() {
    return db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(announcement: InsertAnnouncement) {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async deleteAnnouncement(id: number) {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  async getUserWarnings(userId: string) {
    return db.select().from(warnings).where(eq(warnings.userId, userId)).orderBy(desc(warnings.createdAt));
  }
}

export const storage = new DatabaseStorage();
