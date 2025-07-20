/**
 * TSOAM Church Management System - Visitor Tracking Service
 *
 * Manages visitor attendance, retention analytics, and automatic promotion
 * to new member status based on church-defined criteria.
 *
 * Key Features:
 * - Track visitor attendance across multiple Sundays
 * - Automatic promotion after 3 consecutive Sundays
 * - Retention rate calculations and statistics
 * - Born again conversion tracking
 * - Monthly/yearly analytics and reports
 *
 * Church Targets:
 * - Retain 50% of visitors
 * - 50% of retained visitors get born again
 *
 * @author TSOAM Development Team
 * @version 2.0.0
 */

export interface VisitorAttendance {
  id: string;
  visitorId: string;
  date: string; // Sunday date
  serviceType: "Morning Service" | "Evening Service" | "Midweek Service";
  isFirstTime: boolean;
  bornAgain: boolean;
  followUpRequired: boolean;
  notes?: string;
  createdAt: string;
}

export interface Visitor {
  id: string;
  visitorId: string; // V2025-001
  fullName: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth?: string;
  gender: "Male" | "Female";
  maritalStatus?: "Single" | "Married" | "Divorced" | "Widowed";
  address?: string;
  firstVisitDate: string;
  lastVisitDate: string;
  totalVisits: number;
  consecutiveSundays: number;
  status: "Active Visitor" | "Promoted to New Member" | "Inactive" | "Lost";
  bornAgain: boolean;
  bornAgainDate?: string;
  howHeardAboutChurch: string;
  followUpNotes: string;
  promotedToNewMember: boolean;
  promotionDate?: string;
  retentionScore: number; // 0-100
  attendanceHistory: VisitorAttendance[];
  createdAt: string;
  updatedAt: string;
}

export interface RetentionStats {
  period: "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate: string;
  totalVisitors: number;
  newVisitors: number;
  returnVisitors: number;
  retainedVisitors: number; // Visited 3+ times
  retentionRate: number; // percentage
  targetRetentionRate: number; // 50%
  bornAgainCount: number;
  bornAgainRate: number; // percentage
  targetBornAgainRate: number; // 50% of retained
  promotedToNewMembers: number;
  lostVisitors: number;
  isOnTrack: boolean;
}

export interface ConversionFunnel {
  totalVisitors: number;
  firstTimeVisitors: number;
  secondTimeVisitors: number;
  thirdTimeVisitors: number; // Promoted to New Members
  retainedVisitors: number; // 3+ visits
  bornAgainVisitors: number;
  conversionRates: {
    firstToSecond: number;
    secondToThird: number;
    thirdToRetained: number;
    retainedToBornAgain: number;
  };
}

class VisitorTrackingService {
  private static instance: VisitorTrackingService;
  private visitors: Visitor[] = [];
  private attendanceRecords: VisitorAttendance[] = [];
  private subscribers: Array<(visitors: Visitor[]) => void> = [];

  // Church targets and thresholds
  private readonly TARGET_RETENTION_RATE = 50; // 50%
  private readonly TARGET_BORN_AGAIN_RATE = 50; // 50% of retained
  private readonly CONSECUTIVE_SUNDAYS_FOR_PROMOTION = 3;
  private readonly INACTIVE_THRESHOLD_DAYS = 30; // Mark as inactive after 30 days

  public static getInstance(): VisitorTrackingService {
    if (!VisitorTrackingService.instance) {
      VisitorTrackingService.instance = new VisitorTrackingService();
    }
    return VisitorTrackingService.instance;
  }

  public initialize(): void {
    this.loadMockData();
    this.updateVisitorStatuses();
  }

  private loadMockData(): void {
    // Mock visitor data with varying attendance patterns
    this.visitors = [
      {
        id: "vis_001",
        visitorId: "V2025-001",
        fullName: "Mary Wanjiku",
        phoneNumber: "+254 712 345 678",
        email: "mary.wanjiku@email.com",
        gender: "Female",
        maritalStatus: "Single",
        firstVisitDate: "2025-01-05", // 3 Sundays ago
        lastVisitDate: "2025-01-19", // Last Sunday
        totalVisits: 3,
        consecutiveSundays: 3,
        status: "Promoted to New Member",
        bornAgain: true,
        bornAgainDate: "2025-01-12",
        howHeardAboutChurch: "Friend Invitation",
        followUpNotes: "Very engaged, interested in baptism",
        promotedToNewMember: true,
        promotionDate: "2025-01-19",
        retentionScore: 95,
        attendanceHistory: [],
        createdAt: "2025-01-05T10:00:00Z",
        updatedAt: "2025-01-19T10:30:00Z",
      },
      {
        id: "vis_002",
        visitorId: "V2025-002",
        fullName: "James Mwangi",
        phoneNumber: "+254 722 456 789",
        gender: "Male",
        maritalStatus: "Married",
        firstVisitDate: "2025-01-12", // 2 Sundays ago
        lastVisitDate: "2025-01-19", // Last Sunday
        totalVisits: 2,
        consecutiveSundays: 2,
        status: "Active Visitor",
        bornAgain: false,
        howHeardAboutChurch: "Social Media",
        followUpNotes: "Interested but still seeking",
        promotedToNewMember: false,
        retentionScore: 70,
        attendanceHistory: [],
        createdAt: "2025-01-12T10:00:00Z",
        updatedAt: "2025-01-19T10:30:00Z",
      },
      {
        id: "vis_003",
        visitorId: "V2025-003",
        fullName: "Grace Akinyi",
        phoneNumber: "+254 733 567 890",
        email: "grace.akinyi@email.com",
        gender: "Female",
        maritalStatus: "Single",
        firstVisitDate: "2025-01-05", // 3 Sundays ago
        lastVisitDate: "2025-01-05", // Only visited once
        totalVisits: 1,
        consecutiveSundays: 1,
        status: "Inactive",
        bornAgain: false,
        howHeardAboutChurch: "Website",
        followUpNotes: "Needs follow-up call",
        promotedToNewMember: false,
        retentionScore: 20,
        attendanceHistory: [],
        createdAt: "2025-01-05T10:00:00Z",
        updatedAt: "2025-01-05T10:30:00Z",
      },
    ];

    // Mock attendance records
    this.attendanceRecords = [
      {
        id: "att_001",
        visitorId: "V2025-001",
        date: "2025-01-05",
        serviceType: "Morning Service",
        isFirstTime: true,
        bornAgain: false,
        followUpRequired: true,
        notes: "First visit, very engaged during service",
        createdAt: "2025-01-05T10:00:00Z",
      },
      {
        id: "att_002",
        visitorId: "V2025-001",
        date: "2025-01-12",
        serviceType: "Morning Service",
        isFirstTime: false,
        bornAgain: true,
        followUpRequired: false,
        notes: "Accepted Christ during altar call",
        createdAt: "2025-01-12T10:00:00Z",
      },
      {
        id: "att_003",
        visitorId: "V2025-001",
        date: "2025-01-19",
        serviceType: "Morning Service",
        isFirstTime: false,
        bornAgain: true,
        followUpRequired: false,
        notes: "Automatic promotion to New Member after 3 consecutive visits",
        createdAt: "2025-01-19T10:00:00Z",
      },
    ];

    this.notifySubscribers();
  }

  public subscribe(callback: (visitors: Visitor[]) => void): void {
    this.subscribers.push(callback);
  }

  public unsubscribe(callback: (visitors: Visitor[]) => void): void {
    this.subscribers = this.subscribers.filter((sub) => sub !== callback);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => callback(this.visitors));
  }

  /**
   * Record visitor attendance for a Sunday service
   */
  public recordAttendance(
    attendance: Omit<VisitorAttendance, "id" | "createdAt">,
  ): void {
    const newAttendance: VisitorAttendance = {
      ...attendance,
      id: `att_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    this.attendanceRecords.push(newAttendance);
    this.updateVisitorFromAttendance(newAttendance);
    this.notifySubscribers();
  }

  /**
   * Update visitor record based on attendance
   */
  private updateVisitorFromAttendance(attendance: VisitorAttendance): void {
    const visitor = this.visitors.find(
      (v) => v.visitorId === attendance.visitorId,
    );
    if (!visitor) return;

    // Update last visit date and total visits
    visitor.lastVisitDate = attendance.date;
    visitor.totalVisits += 1;

    // Update born again status
    if (attendance.bornAgain && !visitor.bornAgain) {
      visitor.bornAgain = true;
      visitor.bornAgainDate = attendance.date;
    }

    // Calculate consecutive Sundays
    visitor.consecutiveSundays = this.calculateConsecutiveSundays(
      visitor.visitorId,
    );

    // Update retention score
    visitor.retentionScore = this.calculateRetentionScore(visitor);

    // Update status
    visitor.status = this.determineVisitorStatus(visitor);
    visitor.updatedAt = new Date().toISOString();
  }

  /**
   * Calculate consecutive Sunday attendance
   */
  private calculateConsecutiveSundays(visitorId: string): number {
    const visitorAttendance = this.attendanceRecords
      .filter(
        (a) => a.visitorId === visitorId && a.serviceType === "Morning Service",
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (visitorAttendance.length === 0) return 0;

    let consecutive = 1;
    const lastSunday = new Date(visitorAttendance[0].date);

    for (let i = 1; i < visitorAttendance.length; i++) {
      const currentSunday = new Date(visitorAttendance[i].date);
      const daysDiff =
        (lastSunday.getTime() - currentSunday.getTime()) /
        (1000 * 60 * 60 * 24);

      if (daysDiff === 7) {
        // Exactly one week apart
        consecutive++;
        lastSunday.setTime(currentSunday.getTime());
      } else {
        break;
      }
    }

    return consecutive;
  }

  /**
   * Manually transfer visitor to new member registration
   */
  public transferVisitorToNewMember(
    visitorId: string,
  ): { visitorId: string; fullName: string } | null {
    const visitor = this.visitors.find((v) => v.visitorId === visitorId);
    if (!visitor || visitor.promotedToNewMember) return null;

    // Check if visitor has attended 3 consecutive Sundays
    if (visitor.consecutiveSundays < this.CONSECUTIVE_SUNDAYS_FOR_PROMOTION) {
      console.log(
        `❌ Visitor ${visitor.fullName} (${visitor.visitorId}) cannot be promoted. Only ${visitor.consecutiveSundays} consecutive Sundays attended. Minimum ${this.CONSECUTIVE_SUNDAYS_FOR_PROMOTION} required.`,
      );
      return null;
    }

    // Mark visitor as promoted but don't auto-create member record
    visitor.promotedToNewMember = true;
    visitor.promotionDate = new Date().toISOString().split("T")[0];
    visitor.status = "Promoted to New Member";

    console.log(
      `✅ Visitor ${visitor.fullName} (${visitor.visitorId}) manually transferred to new member registration`,
    );

    this.notifySubscribers();

    // Return minimal data for new member form
    return {
      visitorId: visitor.visitorId,
      fullName: visitor.fullName,
    };
  }

  /**
   * Create new member record (mock implementation)
   */
  private createNewMemberRecord(visitor: Visitor): void {
    const newMemberData = {
      visitorId: visitor.visitorId,
      fullName: visitor.fullName,
      phoneNumber: visitor.phoneNumber,
      email: visitor.email,
      dateOfBirth: visitor.dateOfBirth,
      gender: visitor.gender,
      maritalStatus: visitor.maritalStatus,
      address: visitor.address,
      visitDate: visitor.firstVisitDate,
      baptized: false,
      bibleStudyCompleted: false,
      employmentStatus: "Unknown",
      howHeardAboutUs: visitor.howHeardAboutChurch,
      bornAgain: visitor.bornAgain,
      eligibilityForTransfer: false,
      status: "Active",
    };

    console.log("New Member Record Created:", newMemberData);
    // In production, this would call an API to create the new member record
  }

  /**
   * Calculate retention score based on various factors
   */
  private calculateRetentionScore(visitor: Visitor): number {
    let score = 0;

    // Base score from visit frequency
    if (visitor.totalVisits >= 3) score += 40;
    else if (visitor.totalVisits >= 2) score += 25;
    else score += 10;

    // Consecutive visits bonus
    score += Math.min(visitor.consecutiveSundays * 10, 30);

    // Born again bonus
    if (visitor.bornAgain) score += 20;

    // Engagement bonus (has email, phone)
    if (visitor.email) score += 5;
    if (visitor.phoneNumber) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Determine visitor status based on current data
   */
  private determineVisitorStatus(visitor: Visitor): Visitor["status"] {
    if (visitor.promotedToNewMember) return "Promoted to New Member";

    const daysSinceLastVisit = Math.floor(
      (new Date().getTime() - new Date(visitor.lastVisitDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (daysSinceLastVisit > this.INACTIVE_THRESHOLD_DAYS) {
      return daysSinceLastVisit > 60 ? "Lost" : "Inactive";
    }

    return "Active Visitor";
  }

  /**
   * Update all visitor statuses based on current date
   */
  private updateVisitorStatuses(): void {
    this.visitors.forEach((visitor) => {
      visitor.status = this.determineVisitorStatus(visitor);
      visitor.retentionScore = this.calculateRetentionScore(visitor);
    });
  }

  /**
   * Get retention statistics for a specific period
   */
  public getRetentionStats(
    period: "weekly" | "monthly" | "yearly",
    date?: string,
  ): RetentionStats {
    const targetDate = date ? new Date(date) : new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case "weekly":
        startDate = new Date(targetDate);
        startDate.setDate(targetDate.getDate() - targetDate.getDay()); // Start of week (Sunday)
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // End of week (Saturday)
        break;
      case "monthly":
        startDate = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          1,
        );
        endDate = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth() + 1,
          0,
        );
        break;
      case "yearly":
        startDate = new Date(targetDate.getFullYear(), 0, 1);
        endDate = new Date(targetDate.getFullYear(), 11, 31);
        break;
    }

    const visitorsInPeriod = this.visitors.filter((v) => {
      const firstVisit = new Date(v.firstVisitDate);
      return firstVisit >= startDate && firstVisit <= endDate;
    });

    const totalVisitors = visitorsInPeriod.length;
    const newVisitors = visitorsInPeriod.filter(
      (v) => v.totalVisits === 1,
    ).length;
    const returnVisitors = visitorsInPeriod.filter(
      (v) => v.totalVisits > 1,
    ).length;
    const retainedVisitors = visitorsInPeriod.filter(
      (v) => v.totalVisits >= 3,
    ).length;
    const bornAgainCount = visitorsInPeriod.filter((v) => v.bornAgain).length;
    const promotedToNewMembers = visitorsInPeriod.filter(
      (v) => v.promotedToNewMember,
    ).length;
    const lostVisitors = visitorsInPeriod.filter(
      (v) => v.status === "Lost",
    ).length;

    const retentionRate =
      totalVisitors > 0 ? (retainedVisitors / totalVisitors) * 100 : 0;
    const bornAgainRate =
      retainedVisitors > 0 ? (bornAgainCount / retainedVisitors) * 100 : 0;

    return {
      period,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      totalVisitors,
      newVisitors,
      returnVisitors,
      retainedVisitors,
      retentionRate,
      targetRetentionRate: this.TARGET_RETENTION_RATE,
      bornAgainCount,
      bornAgainRate,
      targetBornAgainRate: this.TARGET_BORN_AGAIN_RATE,
      promotedToNewMembers,
      lostVisitors,
      isOnTrack:
        retentionRate >= this.TARGET_RETENTION_RATE &&
        bornAgainRate >= this.TARGET_BORN_AGAIN_RATE,
    };
  }

  /**
   * Get conversion funnel data
   */
  public getConversionFunnel(): ConversionFunnel {
    const totalVisitors = this.visitors.length;
    const firstTimeVisitors = this.visitors.filter(
      (v) => v.totalVisits === 1,
    ).length;
    const secondTimeVisitors = this.visitors.filter(
      (v) => v.totalVisits === 2,
    ).length;
    const thirdTimeVisitors = this.visitors.filter(
      (v) => v.totalVisits === 3,
    ).length;
    const retainedVisitors = this.visitors.filter(
      (v) => v.totalVisits >= 3,
    ).length;
    const bornAgainVisitors = this.visitors.filter((v) => v.bornAgain).length;

    return {
      totalVisitors,
      firstTimeVisitors,
      secondTimeVisitors,
      thirdTimeVisitors,
      retainedVisitors,
      bornAgainVisitors,
      conversionRates: {
        firstToSecond:
          firstTimeVisitors > 0
            ? (secondTimeVisitors / firstTimeVisitors) * 100
            : 0,
        secondToThird:
          secondTimeVisitors > 0
            ? (thirdTimeVisitors / secondTimeVisitors) * 100
            : 0,
        thirdToRetained:
          thirdTimeVisitors > 0
            ? (retainedVisitors / thirdTimeVisitors) * 100
            : 0,
        retainedToBornAgain:
          retainedVisitors > 0
            ? (bornAgainVisitors / retainedVisitors) * 100
            : 0,
      },
    };
  }

  /**
   * Get all visitors
   */
  public getVisitors(): Visitor[] {
    return [...this.visitors];
  }

  /**
   * Get visitors by status
   */
  public getVisitorsByStatus(status: Visitor["status"]): Visitor[] {
    return this.visitors.filter((v) => v.status === status);
  }

  /**
   * Get visitors ready for promotion
   */
  public getVisitorsReadyForPromotion(): Visitor[] {
    return this.visitors.filter(
      (v) =>
        !v.promotedToNewMember &&
        v.consecutiveSundays >= this.CONSECUTIVE_SUNDAYS_FOR_PROMOTION,
    );
  }

  /**
   * Add new visitor
   */
  public addVisitor(
    visitorData: Omit<
      Visitor,
      "id" | "visitorId" | "createdAt" | "updatedAt" | "attendanceHistory"
    >,
  ): Visitor {
    const newVisitor: Visitor = {
      ...visitorData,
      id: `vis_${Date.now()}`,
      visitorId: this.generateVisitorId(),
      attendanceHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.visitors.push(newVisitor);
    this.notifySubscribers();
    return newVisitor;
  }

  /**
   * Generate unique visitor ID
   */
  private generateVisitorId(): string {
    const year = new Date().getFullYear();
    const count = this.visitors.length + 1;
    return `V${year}-${count.toString().padStart(3, "0")}`;
  }
}

// Export singleton instance
export const visitorTrackingService = VisitorTrackingService.getInstance();

// Initialize the service
visitorTrackingService.initialize();

export default visitorTrackingService;
