// Placeholder extracted text — mirrors the prototype's TEXT_A/TEXT_B.
// Step 5 replaces this with real OCR output.

export type NotifKind = "green" | "yellow" | "blue" | "red";
export interface Notif {
  id: number;
  kind: NotifKind;
  ico: "checkC" | "alertT" | "pdf" | "xC";
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

// Placeholder notifications — replaced by real activity feed later.
export const NOTIFS: Notif[] = [
  { id: 1, kind: "green", ico: "checkC", title: "OCR processing complete", desc: "“Q2-Financial-Report.pdf” extracted with 98.4% accuracy.", time: "2m ago", unread: true },
  { id: 2, kind: "yellow", ico: "alertT", title: "3 spec mismatches found", desc: "Artwork “Spring-Campaign-A4” has color and dimension issues.", time: "18m ago", unread: true },
  { id: 3, kind: "blue", ico: "pdf", title: "New document assigned", desc: "Legal Dept shared “NDA-Vendor-2024.docx” for review.", time: "1h ago", unread: true },
  { id: 4, kind: "red", ico: "xC", title: "Language check failed", desc: "Grammar issues detected in “Brochure-TH.pdf” (Thai).", time: "3h ago", unread: false },
  { id: 5, kind: "green", ico: "checkC", title: "Report exported", desc: "Compliance report for batch #1042 is ready to download.", time: "Yesterday", unread: false },
];

export type SpecStatus = "pass" | "fail" | "warning";
export type SpecCat = "Dimensions" | "Colors" | "Typography" | "Images" | "Barcodes";
export interface SpecRow {
  id: string;
  cat: SpecCat;
  spec: string;
  expected: string;
  actual: string;
  status: SpecStatus;
  details?: string;
}

// Placeholder spec-compliance findings — replaced by real analysis in step 5.
export const SPECS: SpecRow[] = [
  { id: "s1", cat: "Dimensions", spec: "Width", expected: "210mm", actual: "210mm", status: "pass" },
  { id: "s2", cat: "Dimensions", spec: "Height", expected: "297mm", actual: "295mm", status: "fail", details: "2mm deviation — outside ±0.5mm tolerance" },
  { id: "s3", cat: "Dimensions", spec: "Bleed Area", expected: "3mm", actual: "3mm", status: "pass" },
  { id: "s4", cat: "Dimensions", spec: "Safe Zone", expected: "5mm", actual: "4mm", status: "warning", details: "Safe zone 1mm below spec" },
  { id: "s5", cat: "Colors", spec: "Primary Brand Color", expected: "#1A3C6E", actual: "#1A3C6E", status: "pass" },
  { id: "s6", cat: "Colors", spec: "Secondary Color", expected: "#FF5722", actual: "#FF6833", status: "fail", details: "Color deviation ΔE=4.2, threshold ΔE=2.0" },
  { id: "s7", cat: "Colors", spec: "Background Color", expected: "#FFFFFF", actual: "#FFFFFF", status: "pass" },
  { id: "s8", cat: "Colors", spec: "CMYK Profile", expected: "ISO Coated v2", actual: "ISO Coated v2", status: "pass" },
  { id: "s9", cat: "Typography", spec: "Headline Font", expected: "Helvetica Neue Bold", actual: "Helvetica Neue Bold", status: "pass" },
  { id: "s10", cat: "Typography", spec: "Body Font Size", expected: "10pt", actual: "9.5pt", status: "warning", details: "Slightly below spec" },
  { id: "s11", cat: "Typography", spec: "Min Font Size", expected: "6pt", actual: "5pt", status: "fail", details: "Below minimum size" },
  { id: "s12", cat: "Typography", spec: "Line Spacing", expected: "120%", actual: "120%", status: "pass" },
  { id: "s13", cat: "Images", spec: "Resolution (DPI)", expected: "300 DPI", actual: "300 DPI", status: "pass" },
  { id: "s14", cat: "Images", spec: "Image Format", expected: "CMYK TIFF", actual: "RGB JPEG", status: "fail", details: "Must be CMYK TIFF" },
  { id: "s15", cat: "Images", spec: "Color Space", expected: "CMYK", actual: "RGB", status: "fail", details: "Must use CMYK" },
  { id: "s16", cat: "Barcodes", spec: "Barcode Type", expected: "EAN-13", actual: "EAN-13", status: "pass" },
  { id: "s17", cat: "Barcodes", spec: "Barcode Size", expected: "≥25mm", actual: "27mm", status: "pass" },
  { id: "s18", cat: "Barcodes", spec: "Quiet Zone", expected: "3mm", actual: "2mm", status: "warning", details: "Below minimum" },
];

export const TEXT_A = `PRODUCT SPECIFICATION DOCUMENT
Version: 2.3 | Date: January 15, 2026

1. PRODUCT OVERVIEW
Product Name: Wireless Bluetooth Headphones
Model Number: BT-PRO-500
SKU: HP-BT-PRO-500-BLK

2. TECHNICAL SPECIFICATIONS
- Frequency Response: 20Hz - 20kHz
- Impedance: 32 Ohms
- Driver Size: 40mm
- Battery Life: Up to 30 hours
- Bluetooth Version: 5.0
- Range: Up to 10 meters

3. PHYSICAL DIMENSIONS
- Weight: 250g
- Headband Width: 180mm

4. PACKAGE CONTENTS
- 1x Headphones unit
- 1x USB-C charging cable
- 1x Carrying pouch`;

export type Severity = "medium" | "low";
export interface GrammarIssue {
  line: number;
  type: string;
  message: string;
  severity: Severity;
}

// Placeholder grammar findings — replaced by real analysis in step 5.
export const GRAMMAR: GrammarIssue[] = [
  { line: 3, type: "style", message: "Consider using consistent date format throughout the document", severity: "low" },
  { line: 9, type: "grammar", message: "Ensure unit abbreviations are consistent (Hz vs hertz)", severity: "medium" },
  { line: 16, type: "clarity", message: "Specify warranty terms more precisely", severity: "low" },
];

export const TEXT_B = `PRODUCT SPECIFICATION DOCUMENT
Version: 2.4 | Date: March 10, 2026

1. PRODUCT OVERVIEW
Product Name: Wireless Bluetooth Headphones Pro
Model Number: BT-PRO-600
SKU: HP-BT-PRO-600-BLK

2. TECHNICAL SPECIFICATIONS
- Frequency Response: 18Hz - 22kHz
- Impedance: 32 Ohms
- Driver Size: 45mm
- Battery Life: Up to 40 hours
- Bluetooth Version: 5.2
- Range: Up to 15 meters

3. PHYSICAL DIMENSIONS
- Weight: 230g
- Headband Width: 185mm

4. PACKAGE CONTENTS
- 1x Headphones unit
- 1x USB-C charging cable
- 1x Carrying case
- 1x Quick start guide`;
