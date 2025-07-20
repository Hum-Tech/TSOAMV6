/**
 * TSOAM Church Management System - Export Service
 *
 * Comprehensive export functionality for all modules with offline support.
 * Handles PDF, Excel, and CSV exports with proper error handling and fallbacks.
 *
 * Features:
 * - Universal export functions for all data types
 * - Offline storage and queuing for failed exports
 * - Automatic retry when connection is restored
 * - Church branding and formatting consistency
 * - Progress tracking for large exports
 *
 * @author TSOAM Development Team
 * @version 2.0.0
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Define interfaces for export options
export interface ExportColumn {
  key: string;
  title: string;
  width?: number;
  align?: "left" | "center" | "right";
  format?: (value: any) => string;
}

export interface ExportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  data: any[];
  columns?: ExportColumn[];
  format: "pdf" | "excel" | "csv";
  orientation?: "portrait" | "landscape";
  includeHeader?: boolean;
  churchInfo?: any;
}

export interface ExportProgress {
  step: string;
  progress: number;
  total: number;
  message: string;
}

// Church branding configuration
const CHURCH_CONFIG = {
  name: "The Seed of Abraham Ministry (TSOAM)",
  address: "Nairobi, Kenya",
  phone: "+254 700 000 000",
  email: "admin@tsoam.org",
  website: "www.tsoam.org",
  kraPin: "P123456789X",
  primaryColor: "#800020",
  secondaryColor: "#600015",
  accentColor: "#A0002A",
};

/**
 * Export Service Class - Handles all export operations
 */
class ExportService {
  private static instance: ExportService;
  private offlineQueue: ExportOptions[] = [];
  private progressCallbacks: ((progress: ExportProgress) => void)[] = [];

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Subscribe to export progress updates
   */
  public onProgress(callback: (progress: ExportProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * Remove progress callback
   */
  public offProgress(callback: (progress: ExportProgress) => void): void {
    this.progressCallbacks = this.progressCallbacks.filter(
      (cb) => cb !== callback,
    );
  }

  /**
   * Notify progress subscribers
   */
  private notifyProgress(progress: ExportProgress): void {
    this.progressCallbacks.forEach((callback) => callback(progress));
  }

  /**
   * Check if we're online
   */
  private isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Store export request for offline processing
   */
  private storeOfflineExport(options: ExportOptions): void {
    this.offlineQueue.push(options);
    localStorage.setItem(
      "tsoam_offline_exports",
      JSON.stringify(this.offlineQueue),
    );
  }

  /**
   * Process offline export queue when online
   */
  public async processOfflineQueue(): Promise<void> {
    if (!this.isOnline() || this.offlineQueue.length === 0) return;

    this.notifyProgress({
      step: "Processing Offline Queue",
      progress: 0,
      total: this.offlineQueue.length,
      message: "Processing queued exports...",
    });

    for (let i = 0; i < this.offlineQueue.length; i++) {
      try {
        await this.export(this.offlineQueue[i]);
        this.notifyProgress({
          step: "Processing Offline Queue",
          progress: i + 1,
          total: this.offlineQueue.length,
          message: `Processed ${i + 1} of ${this.offlineQueue.length} exports`,
        });
      } catch (error) {
        console.error("Failed to process offline export:", error);
      }
    }

    // Clear the queue
    this.offlineQueue = [];
    localStorage.removeItem("tsoam_offline_exports");
  }

  /**
   * Load offline queue from storage
   */
  public loadOfflineQueue(): void {
    const stored = localStorage.getItem("tsoam_offline_exports");
    if (stored) {
      try {
        this.offlineQueue = JSON.parse(stored);
      } catch (error) {
        console.error("Failed to load offline queue:", error);
        this.offlineQueue = [];
      }
    }
  }

  /**
   * Main export function - handles all formats
   */
  public async export(options: ExportOptions): Promise<void> {
    try {
      this.notifyProgress({
        step: "Initializing",
        progress: 0,
        total: 100,
        message: "Preparing export...",
      });

      // Validate data
      if (!options.data || options.data.length === 0) {
        throw new Error("No data to export");
      }

      // If offline, queue the export
      if (!this.isOnline()) {
        this.storeOfflineExport(options);
        throw new Error(
          "Currently offline. Export queued for when connection is restored.",
        );
      }

      // Process based on format
      switch (options.format) {
        case "pdf":
          await this.exportToPDF(options);
          break;
        case "excel":
          await this.exportToExcel(options);
          break;
        case "csv":
          await this.exportToCSV(options);
          break;
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }

      this.notifyProgress({
        step: "Complete",
        progress: 100,
        total: 100,
        message: "Export completed successfully!",
      });
    } catch (error) {
      console.error("Export failed:", error);
      throw error;
    }
  }

  /**
   * Export to PDF with church branding
   */
  private async exportToPDF(options: ExportOptions): Promise<void> {
    this.notifyProgress({
      step: "Generating PDF",
      progress: 20,
      total: 100,
      message: "Creating PDF document...",
    });

    const pdf = new jsPDF({
      orientation: options.orientation || "portrait",
      unit: "mm",
      format: "a4",
    });

    let yPosition = 20;

    // Add church header
    if (options.includeHeader !== false) {
      yPosition = this.addPDFHeader(pdf, yPosition, options);
    }

    this.notifyProgress({
      step: "Generating PDF",
      progress: 40,
      total: 100,
      message: "Adding content...",
    });

    // Add title
    if (options.title) {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text(options.title, pdf.internal.pageSize.width / 2, yPosition, {
        align: "center",
      });
      yPosition += 10;
    }

    // Add subtitle
    if (options.subtitle) {
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(options.subtitle, pdf.internal.pageSize.width / 2, yPosition, {
        align: "center",
      });
      yPosition += 10;
    }

    // Add generation date
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `Generated on: ${new Date().toLocaleString()}`,
      pdf.internal.pageSize.width - 20,
      yPosition,
      { align: "right" },
    );
    yPosition += 15;

    this.notifyProgress({
      step: "Generating PDF",
      progress: 60,
      total: 100,
      message: "Creating table...",
    });

    // Create table
    const columns = this.getColumns(options);
    const tableHeaders = columns.map((col) => col.title);
    const tableData = this.formatTableData(options.data, columns);

    autoTable(pdf, {
      head: [tableHeaders],
      body: tableData,
      startY: yPosition,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [128, 0, 32],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
      margin: { left: 15, right: 15 },
      didDrawPage: (data) => {
        // Add page numbers
        const pageNumber = data.pageNumber;
        const pageCount = (pdf as any).internal.getNumberOfPages();
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `Page ${pageNumber} of ${pageCount}`,
          pdf.internal.pageSize.width / 2,
          pdf.internal.pageSize.height - 10,
          { align: "center" },
        );
      },
    });

    this.notifyProgress({
      step: "Generating PDF",
      progress: 90,
      total: 100,
      message: "Finalizing PDF...",
    });

    // Save the PDF
    const filename = options.filename.endsWith(".pdf")
      ? options.filename
      : `${options.filename}.pdf`;
    pdf.save(filename);
  }

  /**
   * Export to Excel format
   */
  public async exportToExcel(options: ExportOptions): Promise<void> {
    this.notifyProgress({
      step: "Generating Excel",
      progress: 20,
      total: 100,
      message: "Loading Excel library...",
    });

    try {
      // Dynamic import to avoid bundle size issues
      let XLSX;
      try {
        XLSX = await import("xlsx");
      } catch (importError) {
        console.warn("Failed to load XLSX library:", importError);
        throw new Error("Excel library unavailable");
      }

      this.notifyProgress({
        step: "Generating Excel",
        progress: 40,
        total: 100,
        message: "Creating workbook...",
      });

      const columns = this.getColumns(options);

      // Create worksheet data
      const worksheetData = [
        // Title rows
        [options.title || "Export"],
        [`Generated on: ${new Date().toLocaleString()}`],
        [`Total Records: ${options.data.length}`],
        [], // Empty row
        // Headers
        columns.map((col) => col.title),
        // Data rows
        ...options.data.map((row) =>
          columns.map((col) => {
            const value = row[col.key];
            if (col.format && typeof col.format === "function") {
              return col.format(value);
            }
            return this.formatCellValue(value);
          }),
        ),
      ];

      this.notifyProgress({
        step: "Generating Excel",
        progress: 60,
        total: 100,
        message: "Formatting worksheet...",
      });

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const colWidths = columns.map((col) => ({ wch: col.width || 15 }));
      ws["!cols"] = colWidths;

      // Create workbook and add worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");

      this.notifyProgress({
        step: "Generating Excel",
        progress: 90,
        total: 100,
        message: "Saving file...",
      });

      // Generate filename
      const filename = options.filename.endsWith(".xlsx")
        ? options.filename
        : `${options.filename}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.warn("Excel export failed, falling back to CSV:", error);
      // Fallback to CSV
      await this.exportToCSV({
        ...options,
        format: "csv",
        filename: options.filename
          .replace(".xlsx", ".csv")
          .replace(".xls", ".csv"),
      });
    }
  }

  /**
   * Export to CSV format
   */
  private async exportToCSV(options: ExportOptions): Promise<void> {
    this.notifyProgress({
      step: "Generating CSV",
      progress: 30,
      total: 100,
      message: "Creating CSV content...",
    });

    const columns = this.getColumns(options);

    // Create CSV header
    const headers = columns.map((col) => `"${col.title}"`).join(",");

    this.notifyProgress({
      step: "Generating CSV",
      progress: 60,
      total: 100,
      message: "Processing data rows...",
    });

    // Create CSV rows
    const rows = options.data.map((row) => {
      return columns
        .map((col) => {
          const value = row[col.key];
          const formattedValue =
            col.format && typeof col.format === "function"
              ? col.format(value)
              : this.formatCellValue(value);

          // Escape quotes and wrap in quotes
          if (typeof formattedValue === "string") {
            return `"${formattedValue.replace(/"/g, '""')}"`;
          }
          return `"${String(formattedValue)}"`;
        })
        .join(",");
    });

    // Combine header and rows
    const csvContent = [
      `"${options.title || "Export"}"`,
      `"Generated on: ${new Date().toLocaleString()}"`,
      `"Total Records: ${options.data.length}"`,
      "", // Empty line
      headers,
      ...rows,
    ].join("\n");

    this.notifyProgress({
      step: "Generating CSV",
      progress: 90,
      total: 100,
      message: "Downloading file...",
    });

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        options.filename.endsWith(".csv")
          ? options.filename
          : `${options.filename}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Add church header to PDF
   */
  private addPDFHeader(
    pdf: jsPDF,
    yPosition: number,
    options: ExportOptions,
  ): number {
    const churchInfo = options.churchInfo || CHURCH_CONFIG;

    // Church name
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(128, 0, 32);
    pdf.text(churchInfo.name, pdf.internal.pageSize.width / 2, yPosition, {
      align: "center",
    });
    yPosition += 8;

    // Address and contact
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(80, 80, 80);
    const details = `${churchInfo.address} | ${churchInfo.phone} | ${churchInfo.email}`;
    pdf.text(details, pdf.internal.pageSize.width / 2, yPosition, {
      align: "center",
    });
    yPosition += 6;

    // Official document badge
    pdf.setFillColor(128, 0, 32);
    pdf.roundedRect(
      pdf.internal.pageSize.width / 2 - 25,
      yPosition - 2,
      50,
      6,
      3,
      3,
      "F",
    );
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      "OFFICIAL DOCUMENT",
      pdf.internal.pageSize.width / 2,
      yPosition + 1,
      { align: "center" },
    );
    yPosition += 10;

    // Separator line
    pdf.setDrawColor(128, 0, 32);
    pdf.setLineWidth(1);
    pdf.line(30, yPosition, pdf.internal.pageSize.width - 30, yPosition);
    yPosition += 15;

    return yPosition;
  }

  /**
   * Get columns for export
   */
  private getColumns(options: ExportOptions): ExportColumn[] {
    if (options.columns) {
      return options.columns;
    }

    // Auto-generate columns from data
    if (options.data.length > 0) {
      return Object.keys(options.data[0]).map((key) => ({
        key,
        title: this.formatColumnTitle(key),
        width: 15,
      }));
    }

    return [];
  }

  /**
   * Format column title from key
   */
  private formatColumnTitle(key: string): string {
    return key
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .replace(/_/g, " ") // Replace underscores with spaces
      .trim();
  }

  /**
   * Format table data for display
   */
  private formatTableData(data: any[], columns: ExportColumn[]): any[][] {
    return data.map((row) =>
      columns.map((col) => {
        const value = row[col.key];
        if (col.format && typeof col.format === "function") {
          return col.format(value);
        }
        return this.formatCellValue(value);
      }),
    );
  }

  /**
   * Format individual cell value
   */
  private formatCellValue(value: any): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") return value.toLocaleString();
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  }

  /**
   * Quick export functions for common use cases
   */
  public async exportAppointments(appointments: any[]): Promise<void> {
    return this.export({
      filename: `TSOAM_Appointments_${new Date().toISOString().split("T")[0]}`,
      title: "TSOAM Church Appointments Report",
      subtitle: `Total Appointments: ${appointments.length}`,
      data: appointments,
      format: "excel",
      columns: [
        { key: "id", title: "Appointment ID", width: 15 },
        { key: "title", title: "Title", width: 25 },
        { key: "date", title: "Date", width: 12 },
        { key: "time", title: "Time", width: 10 },
        { key: "duration", title: "Duration (min)", width: 12 },
        { key: "status", title: "Status", width: 12 },
        { key: "priority", title: "Priority", width: 10 },
        { key: "location", title: "Location", width: 20 },
        {
          key: "attendees",
          title: "Participants",
          width: 25,
          format: (val) =>
            Array.isArray(val) ? val.join(", ") : "No participants",
        },
      ],
    });
  }

  public async exportMembers(members: any[]): Promise<void> {
    return this.export({
      filename: `TSOAM_Members_${new Date().toISOString().split("T")[0]}`,
      title: "TSOAM Church Members Report",
      subtitle: `Total Members: ${members.length}`,
      data: members,
      format: "excel",
      columns: [
        { key: "memberId", title: "Member ID", width: 15 },
        { key: "name", title: "Full Name", width: 25 },
        { key: "email", title: "Email", width: 25 },
        { key: "phone", title: "Phone", width: 15 },
        { key: "status", title: "Status", width: 12 },
        { key: "membershipDate", title: "Membership Date", width: 15 },
        {
          key: "serviceGroups",
          title: "Service Groups",
          width: 20,
          format: (val) => (Array.isArray(val) ? val.join(", ") : val),
        },
      ],
    });
  }

  public async exportFinancialTransactions(transactions: any[]): Promise<void> {
    return this.export({
      filename: `TSOAM_Financial_Transactions_${new Date().toISOString().split("T")[0]}`,
      title: "TSOAM Church Financial Transactions Report",
      subtitle: `Total Transactions: ${transactions.length}`,
      data: transactions,
      format: "excel",
      columns: [
        { key: "id", title: "Transaction ID", width: 15 },
        { key: "date", title: "Date", width: 12 },
        { key: "type", title: "Type", width: 10 },
        { key: "category", title: "Category", width: 15 },
        { key: "description", title: "Description", width: 30 },
        {
          key: "amount",
          title: "Amount (KSH)",
          width: 15,
          format: (val) => `KSH ${Number(val).toLocaleString()}`,
        },
        { key: "paymentMethod", title: "Payment Method", width: 15 },
        { key: "status", title: "Status", width: 12 },
      ],
    });
  }
}

// Export singleton instance
export const exportService = ExportService.getInstance();

// Initialize offline queue on load
exportService.loadOfflineQueue();

// Process offline queue when online
window.addEventListener("online", () => {
  exportService.processOfflineQueue();
});

export default exportService;
