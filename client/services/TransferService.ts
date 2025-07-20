/**
 * TSOAM Church Management System - Transfer Service
 *
 * Manages efficient data transfer between different modules:
 * - Visitor -> New Member
 * - New Member -> Full Member
 *
 * Ensures data consistency and proper workflow management.
 *
 * @author TSOAM Development Team
 * @version 1.0.0
 */

export interface TransferData {
  sourceModule: "visitor" | "newMember";
  targetModule: "newMember" | "fullMember";
  sourceId: string;
  transferDate: string;
  transferredBy: string;
}

export interface VisitorToNewMemberTransfer {
  visitorId: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  gender: "Male" | "Female";
  dateOfBirth?: string;
  maritalStatus?: string;
  address?: string;
  firstVisitDate: string;
  bornAgain: boolean;
  howHeardAboutChurch: string;
}

export interface NewMemberToFullMemberTransfer {
  visitorId: string;
  newMemberId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "Male" | "Female";
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed";
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  visitDate: string;
  baptized: boolean;
  baptismDate?: string;
  bibleStudyCompleted: boolean;
  bibleStudyCompletionDate?: string;
  employmentStatus: "Employed" | "Jobless" | "Business Class";
  previousChurchName?: string;
  reasonForLeavingPreviousChurch?: string;
  reasonDetails?: string;
  serviceGroups: string[];
  bornAgain: boolean;
  churchFeedback?: string;
  prayerRequests?: string;
  daysAsNewMember: number;
}

class TransferService {
  private static instance: TransferService;
  private transfers: TransferData[] = [];
  private subscribers: Array<(transfers: TransferData[]) => void> = [];

  public static getInstance(): TransferService {
    if (!TransferService.instance) {
      TransferService.instance = new TransferService();
    }
    return TransferService.instance;
  }

  public initialize(): void {
    this.loadTransferHistory();
  }

  private loadTransferHistory(): void {
    const stored = localStorage.getItem("tsoam_transfer_history");
    if (stored) {
      this.transfers = JSON.parse(stored);
    }
  }

  private saveTransferHistory(): void {
    localStorage.setItem(
      "tsoam_transfer_history",
      JSON.stringify(this.transfers),
    );
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => callback(this.transfers));
  }

  public subscribe(callback: (transfers: TransferData[]) => void): void {
    this.subscribers.push(callback);
  }

  public unsubscribe(callback: (transfers: TransferData[]) => void): void {
    this.subscribers = this.subscribers.filter((sub) => sub !== callback);
  }

  /**
   * Record a transfer between modules
   */
  public recordTransfer(transfer: Omit<TransferData, "transferDate">): void {
    const newTransfer: TransferData = {
      ...transfer,
      transferDate: new Date().toISOString(),
    };

    this.transfers.push(newTransfer);
    this.saveTransferHistory();
    this.notifySubscribers();

    console.log(
      `Transfer recorded: ${transfer.sourceModule} -> ${transfer.targetModule} for ID: ${transfer.sourceId}`,
    );
  }

  /**
   * Transfer visitor data to new members module
   */
  public transferVisitorToNewMember(
    visitorData: VisitorToNewMemberTransfer,
    transferredBy: string,
  ): boolean {
    try {
      // Get existing new members data
      const existingNewMembers = this.getNewMembersData();

      // Generate new member ID
      const memberCount = existingNewMembers.length + 1;

      // Create new member record with 'N' suffix to distinguish from visitors
      const newMember = {
        id: memberCount,
        visitorId: `${visitorData.visitorId}N`,
        fullName: visitorData.fullName,
        phoneNumber: visitorData.phoneNumber,
        email: visitorData.email || "",
        dateOfBirth: visitorData.dateOfBirth || "",
        gender: visitorData.gender,
        maritalStatus: visitorData.maritalStatus || "",
        address: visitorData.address || "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        employmentStatus: "Unknown",
        previousChurchName: "",
        reasonForLeavingPreviousChurch: "",
        reasonDetails: "",
        howHeardAboutUs: visitorData.howHeardAboutChurch,
        purposeOfVisit: "Church Membership",
        bornAgain: visitorData.bornAgain,
        churchFeedback: "",
        prayerRequests: "",
        serviceGroups: [],
        baptized: false,
        baptismDate: "",
        bibleStudyCompleted: false,
        bibleStudyCompletionDate: "",
        visitDate: visitorData.firstVisitDate,
        daysAsNewMember: 0,
        eligibleForMembership: false,
        isActive: true,
      };

      // Add to new members list
      const updatedNewMembers = [...existingNewMembers, newMember];
      this.saveNewMembersData(updatedNewMembers);

      // Record the transfer
      this.recordTransfer({
        sourceModule: "visitor",
        targetModule: "newMember",
        sourceId: visitorData.visitorId,
        transferredBy,
      });

      return true;
    } catch (error) {
      console.error("Failed to transfer visitor to new member:", error);
      return false;
    }
  }

  /**
   * Transfer new member data to full members module
   */
  public transferNewMemberToFullMember(
    newMemberData: NewMemberToFullMemberTransfer,
    transferredBy: string,
    serviceGroups: string[] = [],
  ): {
    success: boolean;
    memberId?: string;
    titheNumber?: string;
    error?: string;
  } {
    try {
      // Get existing full members data
      const existingFullMembers = this.getFullMembersData();

      // Generate member ID and tithe number
      const memberCount = existingFullMembers.length + 1;
      const memberId = `TSOAM2025-${memberCount.toString().padStart(3, "0")}`;
      const titheNumber = `T2025-${memberCount.toString().padStart(3, "0")}`;

      // Create full member record
      const fullMember = {
        id: memberCount.toString(),
        memberId,
        titheNumber,
        fullName: newMemberData.fullName,
        email: newMemberData.email,
        phone: newMemberData.phone,
        dateOfBirth: newMemberData.dateOfBirth,
        gender: newMemberData.gender,
        maritalStatus: newMemberData.maritalStatus,
        address: newMemberData.address,
        emergencyContactName: newMemberData.emergencyContactName,
        emergencyContactPhone: newMemberData.emergencyContactPhone,
        membershipStatus: "Active" as const,
        yearOfJoining: new Date().getFullYear(),
        visitDate: newMemberData.visitDate,
        membershipDate: new Date().toISOString().split("T")[0],
        baptized: newMemberData.baptized,
        baptismDate: newMemberData.baptismDate || "",
        bibleStudyCompleted: newMemberData.bibleStudyCompleted,
        bibleStudyCompletionDate: newMemberData.bibleStudyCompletionDate || "",
        employmentStatus: newMemberData.employmentStatus,
        previousChurchName: newMemberData.previousChurchName,
        reasonForLeavingPreviousChurch:
          newMemberData.reasonForLeavingPreviousChurch,
        reasonDetails: newMemberData.reasonDetails,
        howHeardAboutUs: "Church Membership Process" as const,
        serviceGroups: serviceGroups,
        bornAgain: newMemberData.bornAgain,
        churchFeedback: newMemberData.churchFeedback,
        prayerRequests: newMemberData.prayerRequests,
        transferredFromNewMemberId: newMemberData.newMemberId,
        createdAt: new Date().toISOString(),
      };

      // Add to full members list
      const updatedFullMembers = [...existingFullMembers, fullMember];
      this.saveFullMembersData(updatedFullMembers);

      // Record the transfer
      this.recordTransfer({
        sourceModule: "newMember",
        targetModule: "fullMember",
        sourceId: newMemberData.newMemberId,
        transferredBy,
      });

      // Update new member as transferred
      this.markNewMemberAsTransferred(newMemberData.newMemberId);

      return { success: true, memberId, titheNumber };
    } catch (error) {
      console.error("Failed to transfer new member to full member:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark new member as transferred (remove from active new members)
   */
  private markNewMemberAsTransferred(newMemberId: string): void {
    const newMembers = this.getNewMembersData();
    const updatedNewMembers = newMembers.filter(
      (member) => member.id.toString() !== newMemberId,
    );
    this.saveNewMembersData(updatedNewMembers);
  }

  /**
   * Get new members data from localStorage
   */
  public getNewMembersData(): any[] {
    const stored = localStorage.getItem("tsoam_new_members_data");
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Save new members data to localStorage
   */
  private saveNewMembersData(data: any[]): void {
    localStorage.setItem("tsoam_new_members_data", JSON.stringify(data));
  }

  /**
   * Get full members data from localStorage
   */
  public getFullMembersData(): any[] {
    const stored = localStorage.getItem("tsoam_full_members_data");
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Save full members data to localStorage
   */
  public saveFullMembersData(data: any[]): void {
    localStorage.setItem("tsoam_full_members_data", JSON.stringify(data));
  }

  /**
   * Get transfer history
   */
  public getTransferHistory(): TransferData[] {
    return [...this.transfers];
  }

  /**
   * Get transfers by source module
   */
  public getTransfersBySource(
    sourceModule: "visitor" | "newMember",
  ): TransferData[] {
    return this.transfers.filter((t) => t.sourceModule === sourceModule);
  }

  /**
   * Get transfers by target module
   */
  public getTransfersByTarget(
    targetModule: "newMember" | "fullMember",
  ): TransferData[] {
    return this.transfers.filter((t) => t.targetModule === targetModule);
  }
}

// Export singleton instance
export const transferService = TransferService.getInstance();

// Initialize the service
transferService.initialize();

export default transferService;
