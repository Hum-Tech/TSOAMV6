/**
 * TSOAM Church Management System - Employee-Member Link Service
 *
 * Handles cross-referencing between employees and church members
 * Ensures data consistency and provides integrated reporting
 *
 * @author TSOAM Development Team
 * @version 1.0.0
 */

import { databaseService, Employee, FullMember } from "./DatabaseService";

export interface EmployeeMemberLink {
  employeeId: string;
  employeeNumber: string;
  memberId: string;
  titheNumber: string;
  visitorId: string;
  linkDate: string;
  linkedBy: string;
  isActive: boolean;
  notes?: string;
}

export interface EmployeeMemberProfile {
  // Employee data
  employee: Employee;

  // Member data
  member?: FullMember;

  // Combined profile
  displayName: string;
  primaryContact: string;
  allNumbers: {
    employeeNumber: string;
    memberId?: string;
    titheNumber?: string;
    visitorId?: string;
  };

  // Status flags
  isLinked: boolean;
  hasConflicts: boolean;
  conflicts?: string[];
}

class EmployeeMemberLinkService {
  private static instance: EmployeeMemberLinkService;

  public static getInstance(): EmployeeMemberLinkService {
    if (!EmployeeMemberLinkService.instance) {
      EmployeeMemberLinkService.instance = new EmployeeMemberLinkService();
    }
    return EmployeeMemberLinkService.instance;
  }

  /**
   * Link an employee to a church member
   */
  public linkEmployeeToMember(
    employeeId: string,
    memberId: string,
    linkedBy: string,
    notes?: string,
  ): boolean {
    try {
      // Validate that both employee and member exist
      const employees = databaseService.getEmployees();
      const members = databaseService.getFullMembers();

      const employee = employees.find((e) => e.employeeId === employeeId);
      const member = members.find((m) => m.memberId === memberId);

      if (!employee || !member) {
        throw new Error("Employee or member not found");
      }

      // Check for existing links
      if (employee.isChurchMember && employee.memberId) {
        throw new Error("Employee is already linked to a member");
      }

      if (member.isEmployee && member.employeeId) {
        throw new Error("Member is already linked to an employee");
      }

      // Perform the link using database service
      const success = databaseService.linkEmployeeToMember(
        employeeId,
        memberId,
      );

      if (success) {
        // Create link record for audit purposes
        const link: EmployeeMemberLink = {
          employeeId,
          employeeNumber: employee.employeeNumber,
          memberId,
          titheNumber: member.titheNumber,
          visitorId: member.visitorId,
          linkDate: new Date().toISOString(),
          linkedBy,
          isActive: true,
          notes,
        };

        this.saveLinkRecord(link);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to link employee to member:", error);
      return false;
    }
  }

  /**
   * Unlink an employee from a church member
   */
  public unlinkEmployeeFromMember(
    employeeId: string,
    reason: string,
    unlinkedBy: string,
  ): boolean {
    try {
      const employees = databaseService.getEmployees();
      const employee = employees.find((e) => e.employeeId === employeeId);

      if (!employee || !employee.isChurchMember) {
        return false;
      }

      const memberId = employee.memberId;

      // Update employee record
      databaseService.updateEmployee(employee.id, {
        isChurchMember: false,
        memberId: undefined,
        titheNumber: undefined,
        visitorId: undefined,
      });

      // Update member record if exists
      if (memberId) {
        const members = databaseService.getFullMembers();
        const member = members.find((m) => m.memberId === memberId);

        if (member) {
          databaseService.updateFullMember(member.id, {
            isEmployee: false,
            employeeId: undefined,
            employeeNumber: undefined,
            department: undefined,
            position: undefined,
            dateOfEmployment: undefined,
          });
        }
      }

      // Record the unlink
      const links = this.getLinkRecords();
      const linkIndex = links.findIndex(
        (l) => l.employeeId === employeeId && l.isActive,
      );

      if (linkIndex !== -1) {
        links[linkIndex] = {
          ...links[linkIndex],
          isActive: false,
          notes: `${links[linkIndex].notes || ""}\nUnlinked: ${reason} (by ${unlinkedBy} on ${new Date().toISOString()})`,
        };
        this.saveLinkRecords(links);
      }

      return true;
    } catch (error) {
      console.error("Failed to unlink employee from member:", error);
      return false;
    }
  }

  /**
   * Get all employee-member profiles with cross-reference data
   */
  public getEmployeeMemberProfiles(): EmployeeMemberProfile[] {
    const employees = databaseService.getEmployees();
    const members = databaseService.getFullMembers();

    return employees.map((employee) => {
      const linkedMember =
        employee.isChurchMember && employee.memberId
          ? members.find((m) => m.memberId === employee.memberId)
          : undefined;

      const conflicts = this.detectConflicts(employee, linkedMember);

      return {
        employee,
        member: linkedMember,
        displayName: employee.fullName,
        primaryContact: employee.phoneNumber,
        allNumbers: {
          employeeNumber: employee.employeeNumber,
          memberId: linkedMember?.memberId,
          titheNumber: linkedMember?.titheNumber,
          visitorId: linkedMember?.visitorId,
        },
        isLinked: employee.isChurchMember,
        hasConflicts: conflicts.length > 0,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      };
    });
  }

  /**
   * Search for potential member matches for an employee
   */
  public findPotentialMatches(employee: Employee): FullMember[] {
    const members = databaseService.getFullMembers();
    const potentialMatches: Array<{ member: FullMember; score: number }> = [];

    members.forEach((member) => {
      if (member.isEmployee) return; // Skip already linked members

      let score = 0;

      // Exact name match
      if (employee.fullName.toLowerCase() === member.fullName.toLowerCase()) {
        score += 100;
      } else {
        // Partial name match
        const employeeNames = employee.fullName.toLowerCase().split(" ");
        const memberNames = member.fullName.toLowerCase().split(" ");
        const commonNames = employeeNames.filter((name) =>
          memberNames.some(
            (mName) => mName.includes(name) || name.includes(mName),
          ),
        );
        score +=
          (commonNames.length /
            Math.max(employeeNames.length, memberNames.length)) *
          50;
      }

      // Phone number match
      if (employee.phoneNumber === member.phoneNumber) {
        score += 80;
      }

      // Email match
      if (
        employee.email &&
        member.email &&
        employee.email.toLowerCase() === member.email.toLowerCase()
      ) {
        score += 70;
      }

      // Date of birth match
      if (
        employee.dateOfBirth &&
        member.dateOfBirth &&
        employee.dateOfBirth === member.dateOfBirth
      ) {
        score += 60;
      }

      // Gender match
      if (employee.gender === member.gender) {
        score += 20;
      }

      // Only include if score is above threshold
      if (score >= 40) {
        potentialMatches.push({ member, score });
      }
    });

    return potentialMatches
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Top 10 matches
      .map((match) => match.member);
  }

  /**
   * Get unlinked employees (employees who are not church members)
   */
  public getUnlinkedEmployees(): Employee[] {
    return databaseService
      .getEmployees()
      .filter((employee) => employee.isActive && !employee.isChurchMember);
  }

  /**
   * Get unlinked members (members who are not employees)
   */
  public getUnlinkedMembers(): FullMember[] {
    return databaseService
      .getFullMembers()
      .filter((member) => member.isActive && !member.isEmployee);
  }

  /**
   * Get comprehensive statistics
   */
  public getStatistics(): {
    totalEmployees: number;
    totalMembers: number;
    linkedEmployees: number;
    linkedMembers: number;
    unlinkedEmployees: number;
    unlinkedMembers: number;
    linkagePercentage: number;
  } {
    const employees = databaseService.getEmployees().filter((e) => e.isActive);
    const members = databaseService.getFullMembers().filter((m) => m.isActive);

    const linkedEmployees = employees.filter((e) => e.isChurchMember).length;
    const linkedMembers = members.filter((m) => m.isEmployee).length;

    return {
      totalEmployees: employees.length,
      totalMembers: members.length,
      linkedEmployees,
      linkedMembers,
      unlinkedEmployees: employees.length - linkedEmployees,
      unlinkedMembers: members.length - linkedMembers,
      linkagePercentage:
        employees.length > 0
          ? Math.round((linkedEmployees / employees.length) * 100)
          : 0,
    };
  }

  /**
   * Detect data conflicts between employee and member records
   */
  private detectConflicts(employee: Employee, member?: FullMember): string[] {
    if (!member) return [];

    const conflicts: string[] = [];

    // Name mismatch
    if (employee.fullName.toLowerCase() !== member.fullName.toLowerCase()) {
      conflicts.push(
        `Name mismatch: Employee "${employee.fullName}" vs Member "${member.fullName}"`,
      );
    }

    // Phone mismatch
    if (employee.phoneNumber !== member.phoneNumber) {
      conflicts.push(
        `Phone mismatch: Employee "${employee.phoneNumber}" vs Member "${member.phoneNumber}"`,
      );
    }

    // Email mismatch
    if (
      employee.email &&
      member.email &&
      employee.email.toLowerCase() !== member.email.toLowerCase()
    ) {
      conflicts.push(
        `Email mismatch: Employee "${employee.email}" vs Member "${member.email}"`,
      );
    }

    // Gender mismatch
    if (employee.gender !== member.gender) {
      conflicts.push(
        `Gender mismatch: Employee "${employee.gender}" vs Member "${member.gender}"`,
      );
    }

    // Date of birth mismatch
    if (
      employee.dateOfBirth &&
      member.dateOfBirth &&
      employee.dateOfBirth !== member.dateOfBirth
    ) {
      conflicts.push(`Date of birth mismatch`);
    }

    return conflicts;
  }

  /**
   * Save link record to storage
   */
  private saveLinkRecord(link: EmployeeMemberLink): void {
    const links = this.getLinkRecords();
    links.push(link);
    this.saveLinkRecords(links);
  }

  /**
   * Get link records from storage
   */
  private getLinkRecords(): EmployeeMemberLink[] {
    const stored = localStorage.getItem("tsoam_employee_member_links");
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Save link records to storage
   */
  private saveLinkRecords(links: EmployeeMemberLink[]): void {
    localStorage.setItem("tsoam_employee_member_links", JSON.stringify(links));
  }

  /**
   * Export linkage data for reporting
   */
  public exportLinkageData(): any[] {
    const profiles = this.getEmployeeMemberProfiles();

    return profiles.map((profile) => ({
      "Employee Number": profile.allNumbers.employeeNumber,
      "Employee Name": profile.employee.fullName,
      Department: profile.employee.department,
      Position: profile.employee.position,
      "Is Church Member": profile.isLinked ? "Yes" : "No",
      "Member ID": profile.allNumbers.memberId || "N/A",
      "Tithe Number": profile.allNumbers.titheNumber || "N/A",
      "Visitor ID": profile.allNumbers.visitorId || "N/A",
      Phone: profile.employee.phoneNumber,
      Email: profile.employee.email,
      "Has Conflicts": profile.hasConflicts ? "Yes" : "No",
      Conflicts: profile.conflicts?.join("; ") || "None",
    }));
  }
}

export const employeeMemberLinkService =
  EmployeeMemberLinkService.getInstance();
