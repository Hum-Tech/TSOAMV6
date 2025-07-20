/**
 * Print and Export Utilities for TSOAM Church Management System
 *
 * This module provides comprehensive printing and export functionality
 * that works across all printers and export formats (PDF, Excel, CSV)
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { settingsService } from "@/services/SettingsService";

// Types for autoTable
interface AutoTableOptions {
  head?: any[][];
  body?: any[][];
  startY?: number;
  theme?: string;
  styles?: any;
  headStyles?: any;
  alternateRowStyles?: any;
  margin?: any;
}

// Use autoTable directly
const generatePDFTable = (pdf: jsPDF, options: any) => {
  return autoTable(pdf, options);
};

/**
 * Create a stylized logo when actual logo is not available
 */
const createStylizedLogo = (
  pdf: jsPDF,
  logoX: number,
  logoY: number,
  churchInfo: any,
) => {
  // Outer circle with gradient effect
  pdf.setFillColor(128, 0, 32); // Church primary color
  pdf.circle(logoX, logoY, 15, "F");

  // Middle circle
  pdf.setFillColor(160, 0, 42); // Lighter accent
  pdf.circle(logoX, logoY, 12, "F");

  // Inner circle for logo background
  pdf.setFillColor(255, 255, 255);
  pdf.circle(logoX, logoY, 9, "F");

  // Church initials or cross symbol
  pdf.setTextColor(128, 0, 32);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");

  // Extract initials from church name
  const words = churchInfo.name.split(" ");
  const initials =
    words.length >= 2
      ? words[0].charAt(0) + words[1].charAt(0)
      : churchInfo.name.charAt(0);

  pdf.text(initials, logoX, logoY + 2, { align: "center" });

  // Add decorative elements
  pdf.setDrawColor(128, 0, 32);
  pdf.setLineWidth(0.5);

  // Small decorative crosses around the logo
  const drawSmallCross = (x: number, y: number, size: number) => {
    pdf.line(x - size, y, x + size, y); // horizontal line
    pdf.line(x, y - size, x, y + size); // vertical line
  };

  drawSmallCross(logoX - 20, logoY - 10, 1.5);
  drawSmallCross(logoX + 20, logoY - 10, 1.5);
  drawSmallCross(logoX - 20, logoY + 10, 1.5);
  drawSmallCross(logoX + 20, logoY + 10, 1.5);
};

/**
 * Load image as base64 for PDF embedding with timeout
 */
const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    // Set up timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error("Image loading timeout"));
    }, 5000); // 5 second timeout

    img.onload = () => {
      clearTimeout(timeout);

      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Set canvas size (square for logo)
        const size = 120;
        canvas.width = size;
        canvas.height = size;

        if (ctx) {
          // Fill with white background
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, size, size);

          // Create circular clip path
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
          ctx.clip();

          // Draw image to fit the circle
          ctx.drawImage(img, 0, 0, size, size);

          // Convert to base64
          const dataURL = canvas.toDataURL("image/png", 0.9);
          resolve(dataURL);
        } else {
          reject(new Error("Canvas context not available"));
        }
      } catch (error) {
        reject(
          new Error(
            "Failed to process image: " +
              (error instanceof Error ? error.message : "Unknown error"),
          ),
        );
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Failed to load image from URL"));
    };

    // Try to load the image
    try {
      img.src = url;
    } catch (error) {
      clearTimeout(timeout);
      reject(new Error("Invalid image URL"));
    }
  });
};

/**
 * Get dynamic church information from settings
 */
const getChurchInfo = () => {
  const churchSettings = settingsService.getChurchSettings();
  return {
    name: churchSettings.name || "The Seed of Abraham Ministry (TSOAM)",
    address: churchSettings.address || "Nairobi, Kenya",
    phone: churchSettings.phone || "+254 700 000 000",
    email: churchSettings.email || "admin@tsoam.org",
    website: churchSettings.website || "www.tsoam.org",
    kraPin: churchSettings.kraPin || "P123456789X",
    registrationNumber: churchSettings.registrationNumber || "REG/12345/2020",
    establishedYear: churchSettings.establishedYear || "2000",
    motto: churchSettings.motto || "Growing in Faith, Serving in Love",
    primaryColor: "#800020", // Church maroon
    secondaryColor: "#600015", // Darker maroon
    accentColor: "#A0002A", // Lighter maroon
    logoUrl:
      churchSettings.logoUrl ||
      "https://cdn.builder.io/api/v1/image/assets%2F0627183da1a04fa4b6c5a1ab36b4780e%2F24ea526264444b8ca043118a01335902?format=webp&width=800",
  };
};

/**
 * Print configuration options
 */
export interface PrintOptions {
  title: string;
  orientation?: "portrait" | "landscape";
  paperSize?: "a4" | "letter" | "legal";
  includeHeader?: boolean;
  includeFooter?: boolean;
  customCSS?: string;
}

/**
 * Export configuration options
 */
export interface ExportOptions {
  filename: string;
  format: "pdf" | "excel" | "csv";
  title?: string;
  subtitle?: string;
  data: any[];
  columns?: { key: string; title: string; width?: number }[];
  orientation?: "portrait" | "landscape";
  includeChurchHeader?: boolean;
}

/**
 * Print HTML content directly
 * @param content HTML content to print
 * @param options Print options
 */
export const printHTML = (
  content: string,
  options: PrintOptions = { title: "Document" },
) => {
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert("Please allow popups to enable printing");
    return;
  }

  const css = `
    <style>
      @page {
        size: ${options.paperSize || "a4"} ${options.orientation || "portrait"};
        margin: 20mm;
      }

      body {
        font-family: 'Arial', sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #333;
        margin: 0;
        padding: 0;
      }

      .church-header {
        text-align: center;
        border-bottom: 3px solid ${getChurchInfo().primaryColor};
        padding-bottom: 20px;
        margin-bottom: 25px;
        background: linear-gradient(135deg, ${getChurchInfo().primaryColor}10, ${getChurchInfo().accentColor}05);
        border-radius: 8px;
        padding: 20px;
      }

      .church-logo {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 3px solid ${getChurchInfo().primaryColor};
        margin: 0 auto 15px;
        display: block;
        object-fit: cover;
      }

      .church-name {
        font-size: 22px;
        font-weight: bold;
        color: ${getChurchInfo().primaryColor};
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .church-details {
        font-size: 10px;
        color: #666;
      }

      .document-title {
        font-size: 18px;
        font-weight: bold;
        text-align: center;
        margin: 25px 0;
        color: ${getChurchInfo().primaryColor};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid ${getChurchInfo().primaryColor};
        padding-bottom: 10px;
      }

      .print-date {
        text-align: right;
        font-size: 10px;
        color: #666;
        margin-bottom: 20px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
      }

      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }

      th {
        background-color: ${getChurchInfo().primaryColor};
        color: white;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.5px;
      }

      tr:nth-child(even) {
        background-color: ${getChurchInfo().primaryColor}08;
      }

      .footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 10px;
        color: #666;
        border-top: 1px solid #ddd;
        padding: 10px;
      }

      @media print {
        body { print-color-adjust: exact; }
        .no-print { display: none !important; }
      }

      ${options.customCSS || ""}
    </style>
  `;

  const churchInfo = getChurchInfo();
  const header =
    options.includeHeader !== false
      ? `
    <div class="church-header">
      <img src="${churchInfo.logoUrl}"
           alt="${churchInfo.name} Logo"
           class="church-logo" />
      <div class="church-name">${churchInfo.name}</div>
      <div class="church-details">
        ${churchInfo.address} | ${churchInfo.phone} | ${churchInfo.email}
      </div>
      <div style="margin-top: 10px; padding: 5px 15px; background: ${churchInfo.primaryColor}; color: white; border-radius: 15px; display: inline-block; font-size: 10px; font-weight: bold;">
        OFFICIAL DOCUMENT
      </div>
    </div>
    <div class="document-title">${options.title}</div>
    <div class="print-date">Printed on: ${new Date().toLocaleString()}</div>
  `
      : "";

  const footer =
    options.includeFooter !== false
      ? `
    <div class="footer">
      Generated by ${churchInfo.name} Management System | Page <span class="pageNumber"></span>
    </div>
  `
      : "";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${options.title}</title>
      <meta charset="utf-8">
      ${css}
    </head>
    <body>
      ${header}
      ${content}
      ${footer}
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();

    // Close the window after printing (with a delay to ensure print dialog appears)
    setTimeout(() => {
      printWindow.close();
    }, 1000);
  };
};

/**
 * Export data to PDF with proper logo handling
 * @param options Export options
 */
export const exportToPDF = async (options: ExportOptions): Promise<void> => {
  const pdf = new jsPDF({
    orientation: options.orientation || "portrait",
    unit: "mm",
    format: "a4",
  });

  const churchInfo = getChurchInfo();
  let yPosition = 20;

  // Add church header with logo if requested
  if (options.includeChurchHeader !== false) {
    try {
      const logoX = 105;
      const logoY = yPosition + 10;

      // Try to load and embed the actual church logo
      let logoEmbedded = false;
      if (churchInfo.logoUrl && churchInfo.logoUrl.trim() !== "") {
        try {
          console.log(
            "Attempting to load church logo from:",
            churchInfo.logoUrl,
          );
          const logoBase64 = await loadImageAsBase64(churchInfo.logoUrl);

          // Successfully loaded logo - add it to PDF
          pdf.addImage(logoBase64, "PNG", logoX - 15, logoY - 15, 30, 30);
          console.log("Church logo successfully embedded in PDF");
          logoEmbedded = true;
        } catch (logoError) {
          console.warn("Could not load church logo from URL:", logoError);
          logoEmbedded = false;
        }
      }

      // If logo wasn't embedded, create stylized logo
      if (!logoEmbedded) {
        console.log("Using stylized logo fallback");
        createStylizedLogo(pdf, logoX, logoY, churchInfo);
      }

      yPosition += 35;

      // Church name
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(128, 0, 32); // Church primary color
      pdf.text(churchInfo.name, pdf.internal.pageSize.width / 2, yPosition, {
        align: "center",
      });

      yPosition += 12;

      // Church details
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(80, 80, 80);
      const details = `${churchInfo.address} | ${churchInfo.phone} | ${churchInfo.email}`;
      pdf.text(details, pdf.internal.pageSize.width / 2, yPosition, {
        align: "center",
      });

      yPosition += 8;

      // KRA PIN if available
      if (churchInfo.kraPin) {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `KRA PIN: ${churchInfo.kraPin}`,
          pdf.internal.pageSize.width / 2,
          yPosition,
          {
            align: "center",
          },
        );
        yPosition += 6;
      }

      // Official document badge
      pdf.setFillColor(128, 0, 32);
      pdf.roundedRect(
        pdf.internal.pageSize.width / 2 - 25,
        yPosition - 2,
        50,
        8,
        4,
        4,
        "F",
      );
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        "OFFICIAL DOCUMENT",
        pdf.internal.pageSize.width / 2,
        yPosition + 2,
        {
          align: "center",
        },
      );

      yPosition += 12;

      // Decorative line separator
      pdf.setDrawColor(128, 0, 32);
      pdf.setLineWidth(2);
      pdf.line(30, yPosition, pdf.internal.pageSize.width - 30, yPosition);

      // Accent lines
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(160, 0, 42);
      pdf.line(
        40,
        yPosition + 2,
        pdf.internal.pageSize.width - 40,
        yPosition + 2,
      );

      yPosition += 18;
    } catch (error) {
      console.warn("Could not add header to PDF:", error);
      // Fallback to text-only header
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(128, 0, 32);
      pdf.text(churchInfo.name, pdf.internal.pageSize.width / 2, yPosition, {
        align: "center",
      });
      yPosition += 15;
    }
  }

  // Document title
  if (options.title) {
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text(options.title, pdf.internal.pageSize.width / 2, yPosition, {
      align: "center",
    });
    yPosition += 10;
  }

  // Subtitle
  if (options.subtitle) {
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(options.subtitle, pdf.internal.pageSize.width / 2, yPosition, {
      align: "center",
    });
    yPosition += 10;
  }

  // Generated date
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text(
    `Generated on: ${new Date().toLocaleString()}`,
    pdf.internal.pageSize.width - 20,
    yPosition,
    { align: "right" },
  );
  yPosition += 15;

  // Prepare table data
  if (options.data && options.data.length > 0) {
    const columns =
      options.columns ||
      Object.keys(options.data[0]).map((key) => ({ key, title: key }));

    const tableHeaders = columns.map((col) => col.title);
    const tableData = options.data.map((row) =>
      columns.map((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return "";
        if (typeof value === "number") return value.toLocaleString();
        if (typeof value === "boolean") return value ? "Yes" : "No";
        return String(value);
      }),
    );

    // Add table using autoTable with autofit
    generatePDFTable(pdf, {
      head: [tableHeaders],
      body: tableData,
      startY: yPosition,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        columnWidth: "auto",
        halign: "left",
        valign: "middle",
      },
      headStyles: {
        fillColor: [128, 0, 32], // Church maroon color
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
      // columnStyles removed due to type compatibility
      margin: { left: 15, right: 15 },
      tableWidth: "auto",
      showHead: "everyPage",
      didDrawPage: function (data) {
        // Add watermark on each page
        pdf.setTextColor(240, 240, 240);
        pdf.setFontSize(50);
        pdf.text(
          "TSOAM",
          pdf.internal.pageSize.width / 2,
          pdf.internal.pageSize.height / 2,
          {
            align: "center",
            angle: 45,
          },
        );
      },
    });
  }

  // Add page numbers
  const pageCount = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pdf.internal.pageSize.width / 2,
      pdf.internal.pageSize.height - 10,
      { align: "center" },
    );
  }

  // Save the PDF
  pdf.save(options.filename);
};

/**
 * Export data to CSV
 * @param options Export options
 */
export const exportToCSV = (options: ExportOptions): void => {
  if (!options.data || options.data.length === 0) {
    alert("No data to export");
    return;
  }

  const columns =
    options.columns ||
    Object.keys(options.data[0]).map((key) => ({ key, title: key }));

  // Create CSV header
  const headers = columns.map((col) => `"${col.title}"`).join(",");

  // Create CSV rows
  const rows = options.data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return '""';
        if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`;
        return `"${String(value)}"`;
      })
      .join(",");
  });

  // Combine header and rows
  const csvContent = [
    `"${options.title || "Export"}"`,
    `"Generated on: ${new Date().toLocaleString()}"`,
    "", // Empty line
    headers,
    ...rows,
  ].join("\n");

  // Create and download the file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", options.filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Export data to Excel using XLSX library
 * @param options Export options
 */
export const exportToExcel = (options: ExportOptions): void => {
  try {
    // Dynamic import for XLSX to avoid build issues
    import("xlsx")
      .then((XLSX) => {
        if (!options.data || options.data.length === 0) {
          alert("No data to export");
          return;
        }

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Prepare data with proper headers
        const columns =
          options.columns ||
          Object.keys(options.data[0]).map((key) => ({ key, title: key }));

        const worksheetData = [
          // Title row
          [options.title || "Export"],
          [`Generated on: ${new Date().toLocaleString()}`],
          [], // Empty row
          // Headers
          columns.map((col) => col.title),
          // Data rows
          ...options.data.map((row) =>
            columns.map((col) => {
              const value = row[col.key];
              if (value === null || value === undefined) return "";
              if (typeof value === "number") return value;
              if (typeof value === "boolean") return value ? "Yes" : "No";
              return String(value);
            }),
          ),
        ];

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);

        // Set column widths
        const colWidths = columns.map(() => ({ wch: 15 }));
        ws["!cols"] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Data");

        // Generate filename
        const filename = options.filename.endsWith(".xlsx")
          ? options.filename
          : `${options.filename}.xlsx`;

        // Save file
        XLSX.writeFile(wb, filename);
      })
      .catch(() => {
        // Fallback to CSV if XLSX fails
        console.warn("XLSX library not available, falling back to CSV");
        const modifiedOptions = {
          ...options,
          filename: options.filename
            .replace(".xlsx", ".csv")
            .replace(".xls", ".csv"),
        };
        exportToCSV(modifiedOptions);
      });
  } catch (error) {
    // Fallback to CSV if anything fails
    console.warn("Excel export failed, falling back to CSV", error);
    const modifiedOptions = {
      ...options,
      filename: options.filename
        .replace(".xlsx", ".csv")
        .replace(".xls", ".csv"),
    };
    exportToCSV(modifiedOptions);
  }
};

/**
 * Print a React component
 * @param componentRef React ref to the component
 * @param options Print options
 */
export const printComponent = (
  componentRef: React.RefObject<HTMLElement>,
  options: PrintOptions = { title: "Document" },
) => {
  if (!componentRef.current) {
    alert("Nothing to print");
    return;
  }

  const content = componentRef.current.innerHTML;
  printHTML(content, options);
};

/**
 * Print a table with data
 * @param data Array of objects to display
 * @param columns Column definitions
 * @param title Table title
 * @param options Additional print options
 */
export const printTable = (
  data: any[],
  columns: {
    key: string;
    title: string;
    align?: "left" | "center" | "right";
  }[],
  title: string,
  options: Partial<PrintOptions> = {},
) => {
  if (!data || data.length === 0) {
    alert("No data to print");
    return;
  }

  const tableHTML = `
    <table>
      <thead>
        <tr>
          ${columns.map((col) => `<th style="text-align: ${col.align || "left"}">${col.title}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${data
          .map(
            (row) => `
          <tr>
            ${columns
              .map((col) => {
                const value = row[col.key];
                const displayValue =
                  value === null || value === undefined
                    ? ""
                    : typeof value === "number"
                      ? value.toLocaleString()
                      : typeof value === "boolean"
                        ? value
                          ? "Yes"
                          : "No"
                        : String(value);
                return `<td style="text-align: ${col.align || "left"}">${displayValue}</td>`;
              })
              .join("")}
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;

  printHTML(tableHTML, { title, ...options });
};

/**
 * Export data based on format
 * @param format Export format
 * @param options Export options
 */
export const exportData = async (
  format: "pdf" | "excel" | "csv",
  options: ExportOptions,
) => {
  switch (format) {
    case "pdf":
      await exportToPDF(options);
      break;
    case "excel":
      exportToExcel(options);
      break;
    case "csv":
      exportToCSV(options);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

/**
 * Print payslip
 * @param payslipData Payslip data
 */
export const printPayslip = (payslipData: any) => {
  const payslipHTML = `
    <div style="max-width: 800px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <strong>Employee:</strong> ${payslipData.employeeName}<br>
          <strong>Employee ID:</strong> ${payslipData.employeeId}<br>
          <strong>Department:</strong> ${payslipData.department || "N/A"}
        </div>
        <div style="text-align: right;">
          <strong>Pay Period:</strong> ${payslipData.payPeriod}<br>
          <strong>Pay Date:</strong> ${payslipData.payDate}<br>
          <strong>Payslip ID:</strong> ${payslipData.id}
        </div>
      </div>

      <table style="width: 100%; margin-bottom: 20px;">
        <tr>
          <th colspan="2" style="background-color: #f0f0f0; text-align: center;">EARNINGS</th>
          <th colspan="2" style="background-color: #f0f0f0; text-align: center;">DEDUCTIONS</th>
        </tr>
        <tr>
          <td>Basic Salary</td>
          <td style="text-align: right;">KSH ${payslipData.basicSalary?.toLocaleString() || "0"}</td>
          <td>PAYE Tax</td>
          <td style="text-align: right;">KSH ${payslipData.deductions?.paye?.toLocaleString() || "0"}</td>
        </tr>
        <tr>
          <td>Allowances</td>
          <td style="text-align: right;">KSH ${payslipData.allowances?.toLocaleString() || "0"}</td>
          <td>SHA</td>
          <td style="text-align: right;">KSH ${payslipData.deductions?.sha?.toLocaleString() || "0"}</td>
        </tr>
        <tr>
          <td>Overtime Pay</td>
          <td style="text-align: right;">KSH ${payslipData.overtimePay?.toLocaleString() || "0"}</td>
          <td>NSSF</td>
          <td style="text-align: right;">KSH ${payslipData.deductions?.nssf?.toLocaleString() || "0"}</td>
        </tr>
        <tr>
          <td></td>
          <td></td>
          <td>Housing Levy</td>
          <td style="text-align: right;">KSH ${payslipData.deductions?.housingLevy?.toLocaleString() || "0"}</td>
        </tr>
        <tr>
          <td></td>
          <td></td>
          <td>Other Deductions</td>
          <td style="text-align: right;">KSH ${payslipData.deductions?.other?.toLocaleString() || "0"}</td>
        </tr>
        <tr style="font-weight: bold; background-color: #f9f9f9;">
          <td>GROSS PAY</td>
          <td style="text-align: right;">KSH ${payslipData.grossPay?.toLocaleString() || "0"}</td>
          <td>TOTAL DEDUCTIONS</td>
          <td style="text-align: right;">KSH ${Object.values(
            payslipData.deductions || {},
          )
            .reduce((sum: number, val: any) => sum + (Number(val) || 0), 0)
            .toLocaleString()}</td>
        </tr>
      </table>

      <div style="text-align: center; font-size: 16px; font-weight: bold; background-color: #e8f5e8; padding: 10px; border: 2px solid #4CAF50;">
        NET PAY: KSH ${payslipData.netPay?.toLocaleString() || "0"}
      </div>

      <div style="margin-top: 30px; font-size: 10px; color: #666;">
        <p><em>This is a computer-generated payslip and does not require a signature.</em></p>
        <p><em>For any queries regarding this payslip, please contact the HR department.</em></p>
      </div>
    </div>
  `;

  printHTML(payslipHTML, {
    title: `Payslip - ${payslipData.employeeName} - ${payslipData.payPeriod}`,
    orientation: "portrait",
  });
};

export default {
  printHTML,
  printComponent,
  printTable,
  printPayslip,
  exportToPDF,
  exportToCSV,
  exportToExcel,
  exportData,
};
