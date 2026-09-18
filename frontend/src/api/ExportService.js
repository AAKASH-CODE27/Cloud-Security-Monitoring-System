// src/api/ExportService.js

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

/* =========================================================
   PDF EXPORT
========================================================= */

export const exportToPDF = (
  title,
  columns,
  data,
  fileName = "report.pdf"
) => {
  try {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    /* =========================
       TITLE
    ========================= */

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);

    pdf.text(
      title || "Report",
      14,
      18
    );

    /* =========================
       GENERATED DATE
    ========================= */

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    pdf.text(
      `Generated: ${new Date().toLocaleString("en-IN")}`,
      14,
      25
    );

    /* =========================
       TABLE
    ========================= */

    autoTable(pdf, {
      startY: 32,

      head: [
        Array.isArray(columns)
          ? columns
          : [],
      ],

      body:
        Array.isArray(data)
          ? data
          : [],

      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        valign: "middle",
        halign: "left",
        overflow: "linebreak",
      },

      headStyles: {
        fillColor: [
          59,
          130,
          246,
        ],

        textColor: [
          255,
          255,
          255,
        ],

        fontStyle: "bold",

        halign: "center",
      },

      alternateRowStyles: {
        fillColor: [
          248,
          250,
          252,
        ],
      },

      margin: {
        top: 32,
        left: 10,
        right: 10,
        bottom: 15,
      },

      didDrawPage: (pageData) => {
        const pageNumber =
          pdf.internal.getNumberOfPages();

        pdf.setFontSize(8);

        pdf.setTextColor(
          100,
          116,
          139
        );

        pdf.text(
          `SentinelCore SecureOps | Page ${pageNumber}`,
          pageData.settings.margin.left,
          pdf.internal.pageSize.height - 7
        );
      },
    });

    pdf.save(fileName);

    return true;

  } catch (error) {

    console.error(
      "PDF Export Error:",
      error
    );

    throw error;
  }
};


/* =========================================================
   EXCEL EXPORT
========================================================= */

export const exportToExcel = (
  jsonData,
  sheetName = "Report",
  fileName = "report.xlsx"
) => {

  try {

    const data = Array.isArray(
      jsonData
    )
      ? jsonData
      : [];

    const worksheet =
      XLSX.utils.json_to_sheet(
        data
      );

    /* =========================
       AUTO COLUMN WIDTH
    ========================= */

    const keys =
      data.length > 0
        ? Object.keys(data[0])
        : [];

    worksheet["!cols"] =
      keys.map((key) => {

        const maxLength =
          data.reduce(
            (
              max,
              row
            ) => {

              const value =
                row[key] ??
                "";

              return Math.max(
                max,
                String(value).length
              );

            },
            String(key).length
          );

        return {
          width:
            Math.min(
              Math.max(
                maxLength + 2,
                12
              ),
              35
            ),
        };
      });

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheetName || "Report"
    );

    XLSX.writeFile(
      workbook,
      fileName || "report.xlsx"
    );

    return true;

  } catch (error) {

    console.error(
      "Excel Export Error:",
      error
    );

    throw error;
  }
};


/* =========================================================
   CSV EXPORT
========================================================= */

export const exportToCSV = (
  jsonData,
  fileName = "report.csv"
) => {

  try {

    const data = Array.isArray(
      jsonData
    )
      ? jsonData
      : [];

    const worksheet =
      XLSX.utils.json_to_sheet(
        data
      );

    const csv =
      XLSX.utils.sheet_to_csv(
        worksheet
      );

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      fileName || "report.csv";

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      url
    );

    return true;

  } catch (error) {

    console.error(
      "CSV Export Error:",
      error
    );

    throw error;
  }
};


/* =========================================================
   FORMAT TABLE DATA
========================================================= */

export const formatTableData = (
  rows
) => {

  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    return [];
  }

  return rows.map(
    (item) =>
      Object.values(
        item || {}
      )
  );
};


/* =========================================================
   DATE FORMATTER
========================================================= */

export const formatDate = (
  date
) => {

  if (!date) {
    return "-";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "-";
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
};


/* =========================================================
   DATE + TIME FORMATTER
========================================================= */

export const formatDateTime = (
  date
) => {

  if (!date) {
    return "-";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "-";
  }

  return parsedDate.toLocaleString(
    "en-IN",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );
};


/* =========================================================
   NUMBER FORMATTER
========================================================= */

export const formatNumber = (
  value
) => {

  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return new Intl.NumberFormat(
    "en-IN"
  ).format(number);
};


/* =========================================================
   PERCENTAGE FORMATTER
========================================================= */

export const formatPercent = (
  value,
  decimals = 0
) => {

  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "0%";
  }

  return `${number.toFixed(
    decimals
  )}%`;
};


/* =========================================================
   FILE SIZE FORMATTER
========================================================= */

export const formatBytes = (
  bytes
) => {

  const number =
    Number(bytes);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return "0 Bytes";
  }

  const k = 1024;

  const sizes = [
    "Bytes",
    "KB",
    "MB",
    "GB",
    "TB",
    "PB",
  ];

  const index = Math.floor(
    Math.log(number) /
      Math.log(k)
  );

  const safeIndex =
    Math.min(
      index,
      sizes.length - 1
    );

  const value =
    number /
    Math.pow(
      k,
      safeIndex
    );

  return `${parseFloat(
    value.toFixed(2)
  )} ${sizes[safeIndex]}`;
};


/* =========================================================
   ASSET REPORT FORMATTER
========================================================= */

export const formatAssetForReport = (
  asset
) => {

  if (!asset) {
    return {};
  }

  return {

    ID:
      asset.id ?? "-",

    Name:
      asset.assetName ||
      asset.name ||
      "-",

    IP:
      asset.ipAddress ||
      asset.ip ||
      "-",

    Owner:
      asset.owner ||
      "-",

    Department:
      asset.department ||
      asset.assignedDepartment ||
      "-",

    Vendor:
      asset.manufacturer ||
      asset.vendor ||
      "-",

    OS:
      asset.operatingSystem ||
      asset.os ||
      "-",

    Type:
      asset.assetType ||
      "-",

    Status:
      asset.status ||
      "-",

    Health:
      asset.health ||
      "-",

    Severity:
      asset.severity ||
      "-",

    Risk:
      asset.riskScore ??
      0,

    Patch:
      asset.patchLevel ||
      "-",

  };
};


/* =========================================================
   FORMAT MULTIPLE ASSETS
========================================================= */

export const formatAssetsForReport = (
  assets
) => {

  if (
    !Array.isArray(assets)
  ) {
    return [];
  }

  return assets.map(
    formatAssetForReport
  );
};


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {

  exportToPDF,

  exportToExcel,

  exportToCSV,

  formatTableData,

  formatDate,

  formatDateTime,

  formatNumber,

  formatPercent,

  formatBytes,

  formatAssetForReport,

  formatAssetsForReport,

};