/**
 * TSOAM Church Management System - Tithe Service
 *
 * Specialized service for tithe recording, tracking, and reporting
 * Integrates with member data and provides financial insights
 *
 * @author TSOAM Development Team
 * @version 1.0.0
 */

import { databaseService, TitheRecord, FullMember } from "./DatabaseService";

export interface TitheAnalytics {
  totalAmount: number;
  totalRecords: number;
  averageAmount: number;
  memberStats: {
    totalMembers: number;
    membersWithTithes: number;
    membersWithRegularTithes: number;
    averageTitheFrequency: number;
  };
  periodStats: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  topContributors: Array<{
    memberId: string;
    memberName: string;
    totalAmount: number;
    recordCount: number;
    lastTitheDate: string;
  }>;
  paymentMethodBreakdown: Record<string, { count: number; amount: number }>;
  categoryBreakdown: Record<string, { count: number; amount: number }>;
}

export interface QuickTitheRecord {
  memberId: string;
  memberName: string;
  titheNumber: string;
  amount: number;
  paymentMethod: "Cash" | "M-Pesa" | "Bank Transfer" | "Cheque" | "Card";
  paymentReference?: string;
  notes?: string;
  category?: "Tithe" | "Offering" | "Building Fund" | "Mission" | "Welfare";
  titheType?:
    | "Regular"
    | "Special Offering"
    | "Thanksgiving"
    | "First Fruits"
    | "Harvest";
}

class TitheService {
  private static instance: TitheService;

  public static getInstance(): TitheService {
    if (!TitheService.instance) {
      TitheService.instance = new TitheService();
    }
    return TitheService.instance;
  }

  /**
   * Record a new tithe
   */
  public recordTithe(titheData: QuickTitheRecord, receivedBy: string): string {
    const titheId = this.generateTitheId();
    const currentDate = new Date().toISOString().split("T")[0];
    const currentSunday = this.getCurrentSunday();

    const titheRecord: Omit<
      TitheRecord,
      keyof import("./DatabaseService").BaseEntity
    > = {
      titheId,
      memberId: titheData.memberId,
      titheNumber: titheData.titheNumber,
      memberName: titheData.memberName,
      amount: titheData.amount,
      currency: "KSH", // Default currency
      paymentMethod: titheData.paymentMethod,
      paymentReference: titheData.paymentReference,
      titheDate: currentDate,
      serviceDate: currentSunday,
      notes: titheData.notes,
      receivedBy,
      verifiedBy: undefined,
      isVerified: false,
      titheType: titheData.titheType || "Regular",
      category: titheData.category || "Tithe",
    };

    const id = databaseService.saveTithe(titheRecord);

    // Update member statistics
    this.updateMemberTitheStats(titheData.memberId);

    return id;
  }

  /**
   * Get all tithes for a specific member
   */
  public getMemberTithes(memberId: string): TitheRecord[] {
    return databaseService
      .getMemberTithes(memberId)
      .filter((tithe) => tithe.isActive)
      .sort(
        (a, b) =>
          new Date(b.titheDate).getTime() - new Date(a.titheDate).getTime(),
      );
  }

  /**
   * Get tithe analytics for a specific period
   */
  public getTitheAnalytics(
    startDate?: string,
    endDate?: string,
  ): TitheAnalytics {
    const tithes = databaseService.getTithes().filter((t) => t.isActive);
    const members = databaseService.getFullMembers().filter((m) => m.isActive);

    // Filter by date range if provided
    const filteredTithes = tithes.filter((tithe) => {
      if (startDate && tithe.titheDate < startDate) return false;
      if (endDate && tithe.titheDate > endDate) return false;
      return true;
    });

    const totalAmount = filteredTithes.reduce((sum, t) => sum + t.amount, 0);
    const totalRecords = filteredTithes.length;
    const averageAmount = totalRecords > 0 ? totalAmount / totalRecords : 0;

    // Member statistics
    const membersWithTithes = new Set(filteredTithes.map((t) => t.memberId))
      .size;
    const memberTitheFrequencies =
      this.calculateMemberFrequencies(filteredTithes);
    const membersWithRegularTithes = memberTitheFrequencies.filter(
      (f) => f.frequency >= 4,
    ).length; // 4+ times per year

    // Period statistics
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const periodStats = {
      daily: filteredTithes
        .filter((t) => t.titheDate === today)
        .reduce((sum, t) => sum + t.amount, 0),
      weekly: filteredTithes
        .filter((t) => t.titheDate >= weekAgo)
        .reduce((sum, t) => sum + t.amount, 0),
      monthly: filteredTithes
        .filter((t) => t.titheDate >= monthAgo)
        .reduce((sum, t) => sum + t.amount, 0),
      yearly: filteredTithes
        .filter((t) => t.titheDate >= yearAgo)
        .reduce((sum, t) => sum + t.amount, 0),
    };

    // Top contributors
    const memberContributions =
      this.calculateMemberContributions(filteredTithes);
    const topContributors = memberContributions
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    // Payment method breakdown
    const paymentMethodBreakdown: Record<
      string,
      { count: number; amount: number }
    > = {};
    filteredTithes.forEach((tithe) => {
      if (!paymentMethodBreakdown[tithe.paymentMethod]) {
        paymentMethodBreakdown[tithe.paymentMethod] = { count: 0, amount: 0 };
      }
      paymentMethodBreakdown[tithe.paymentMethod].count++;
      paymentMethodBreakdown[tithe.paymentMethod].amount += tithe.amount;
    });

    // Category breakdown
    const categoryBreakdown: Record<string, { count: number; amount: number }> =
      {};
    filteredTithes.forEach((tithe) => {
      if (!categoryBreakdown[tithe.category]) {
        categoryBreakdown[tithe.category] = { count: 0, amount: 0 };
      }
      categoryBreakdown[tithe.category].count++;
      categoryBreakdown[tithe.category].amount += tithe.amount;
    });

    return {
      totalAmount,
      totalRecords,
      averageAmount,
      memberStats: {
        totalMembers: members.length,
        membersWithTithes: membersWithTithes,
        membersWithRegularTithes: membersWithRegularTithes,
        averageTitheFrequency:
          memberTitheFrequencies.length > 0
            ? memberTitheFrequencies.reduce((sum, f) => sum + f.frequency, 0) /
              memberTitheFrequencies.length
            : 0,
      },
      periodStats,
      topContributors,
      paymentMethodBreakdown,
      categoryBreakdown,
    };
  }

  /**
   * Get all active members for tithe recording
   */
  public getActiveMembers(): FullMember[] {
    return databaseService
      .getFullMembers()
      .filter(
        (member) => member.isActive && member.membershipStatus === "Active",
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  /**
   * Search members by name, member ID, or tithe number
   */
  public searchMembers(query: string): FullMember[] {
    if (!query || query.length < 2) return [];

    const searchTerm = query.toLowerCase();
    return this.getActiveMembers().filter(
      (member) =>
        member.fullName.toLowerCase().includes(searchTerm) ||
        member.memberId.toLowerCase().includes(searchTerm) ||
        member.titheNumber.toLowerCase().includes(searchTerm) ||
        member.phoneNumber.includes(searchTerm),
    );
  }

  /**
   * Verify a tithe record
   */
  public verifyTithe(titheId: string, verifiedBy: string): boolean {
    const tithes = databaseService.getTithes();
    const index = tithes.findIndex((t) => t.titheId === titheId);

    if (index === -1) return false;

    tithes[index] = {
      ...tithes[index],
      isVerified: true,
      verifiedBy,
      updatedAt: new Date().toISOString(),
      version: tithes[index].version + 1,
    };

    // Note: This would need to be integrated with the database service update method
    return true;
  }

  /**
   * Get recent tithes for dashboard display
   */
  public getRecentTithes(limit: number = 10): TitheRecord[] {
    return databaseService
      .getTithes()
      .filter((t) => t.isActive)
      .sort(
        (a, b) =>
          new Date(b.titheDate).getTime() - new Date(a.titheDate).getTime(),
      )
      .slice(0, limit);
  }

  /**
   * Generate unique tithe ID
   */
  private generateTitheId(): string {
    const year = new Date().getFullYear();
    const existingTithes = databaseService.getTithes();
    const count = existingTithes.length + 1;
    return `TITHE-${year}-${count.toString().padStart(6, "0")}`;
  }

  /**
   * Get the current Sunday date
   */
  private getCurrentSunday(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const sunday = new Date(today);

    if (dayOfWeek === 0) {
      // Today is Sunday
      return sunday.toISOString().split("T")[0];
    } else {
      // Get last Sunday
      sunday.setDate(today.getDate() - dayOfWeek);
      return sunday.toISOString().split("T")[0];
    }
  }

  /**
   * Update member tithe statistics
   */
  private updateMemberTitheStats(memberId: string): void {
    // This is handled by the database service when saving tithes
    // Additional logic can be added here if needed
  }

  /**
   * Calculate member tithe frequencies
   */
  private calculateMemberFrequencies(
    tithes: TitheRecord[],
  ): Array<{ memberId: string; frequency: number }> {
    const memberTithes: Record<string, TitheRecord[]> = {};

    tithes.forEach((tithe) => {
      if (!memberTithes[tithe.memberId]) {
        memberTithes[tithe.memberId] = [];
      }
      memberTithes[tithe.memberId].push(tithe);
    });

    return Object.entries(memberTithes).map(([memberId, memberTitheList]) => ({
      memberId,
      frequency: memberTitheList.length,
    }));
  }

  /**
   * Calculate member total contributions
   */
  private calculateMemberContributions(tithes: TitheRecord[]): Array<{
    memberId: string;
    memberName: string;
    totalAmount: number;
    recordCount: number;
    lastTitheDate: string;
  }> {
    const memberContributions: Record<
      string,
      {
        memberName: string;
        totalAmount: number;
        recordCount: number;
        lastTitheDate: string;
      }
    > = {};

    tithes.forEach((tithe) => {
      if (!memberContributions[tithe.memberId]) {
        memberContributions[tithe.memberId] = {
          memberName: tithe.memberName,
          totalAmount: 0,
          recordCount: 0,
          lastTitheDate: tithe.titheDate,
        };
      }

      memberContributions[tithe.memberId].totalAmount += tithe.amount;
      memberContributions[tithe.memberId].recordCount++;

      // Update last tithe date if this tithe is more recent
      if (tithe.titheDate > memberContributions[tithe.memberId].lastTitheDate) {
        memberContributions[tithe.memberId].lastTitheDate = tithe.titheDate;
      }
    });

    return Object.entries(memberContributions).map(([memberId, data]) => ({
      memberId,
      ...data,
    }));
  }

  /**
   * Export tithe data for reporting
   */
  public exportTitheData(startDate?: string, endDate?: string): TitheRecord[] {
    const tithes = databaseService.getTithes().filter((t) => t.isActive);

    return tithes.filter((tithe) => {
      if (startDate && tithe.titheDate < startDate) return false;
      if (endDate && tithe.titheDate > endDate) return false;
      return true;
    });
  }
}

export const titheService = TitheService.getInstance();
