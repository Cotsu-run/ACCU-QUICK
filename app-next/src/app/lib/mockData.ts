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

// ── Artwork standard: minimum text heights (mm) per element, by region. ──
// Source: MAMA inspection form ST.LIM2629.00 REV 1.
export type StdStatus = "pass" | "fail" | "pending";
export type StdPart = "1" | "2";

export interface StandardRow {
  id: string;
  part: StdPart; // Part 1 = BD/PI, Part 2 = R&D
  labelEn: string;
  labelTh: string;
  thai: string; // min height e.g. "≥ 2.0" (mm), or "—" if not specified
  eu: string;
  usa: string;
  note?: string;
}

export const STANDARD_REF = "ST.LIM2629.00 REV 1";

export const STANDARDS: StandardRow[] = [
  // Part 1 — BD / PI
  { id: "n1", part: "1", labelEn: "Product name", labelTh: "ชื่อสินค้า", thai: "≥ 2.0", eu: "≥ 1.2", usa: "≥ 1.6" },
  { id: "n2", part: "1", labelEn: "Manufacturer name / address / complaint tel", labelTh: "ชื่อ ที่อยู่ผู้ผลิต / เบอร์ร้องเรียน", thai: "≥ 2.0", eu: "≥ 1.2", usa: "≥ 1.6" },
  { id: "n3", part: "1", labelEn: "Distributor name / address", labelTh: "ชื่อ ที่อยู่ผู้จัดจำหน่าย", thai: "≥ 2.0", eu: "—", usa: "—" },
  { id: "n4", part: "1", labelEn: "Country of Origin (export)", labelTh: "แหล่งกำเนิดสินค้า (ส่งออก)", thai: "—", eu: "≥ 1.2", usa: "≥ 1.6" },
  { id: "n5", part: "1", labelEn: "Barcode", labelTh: "บาร์โค้ด", thai: "—", eu: "—", usa: "—" },
  { id: "n6", part: "1", labelEn: "Product code / special text", labelTh: "รหัสสินค้า / ข้อความพิเศษ", thai: "—", eu: "—", usa: "—" },
  // Part 2 — R&D
  { id: "n7", part: "2", labelEn: "Registration number (FDA)", labelTh: "เลขสารบบอาหาร", thai: "≥ 2.0", eu: "—", usa: "—" },
  { id: "n8", part: "2", labelEn: "Ingredients", labelTh: "ส่วนประกอบที่สำคัญ", thai: "≥ 1.5", eu: "≥ 1.2", usa: "≥ 1.6" },
  { id: "n9", part: "2", labelEn: "Allergen information", labelTh: "ข้อมูลสำหรับผู้แพ้อาหาร", thai: "≥ 1.5", eu: "≥ 1.2", usa: "≥ 1.6" },
  { id: "n10", part: "2", labelEn: "Direction (cooking)", labelTh: "วิธีการปรุง", thai: "—", eu: "≥ 1.2", usa: "≥ 1.6" },
  { id: "n11", part: "2", labelEn: "Nutrition Facts", labelTh: "ข้อมูลโภชนาการ", thai: "≥ 1.0", eu: "≥ 1.2", usa: "≥ 1.6" },
  { id: "n12", part: "2", labelEn: "GDA", labelTh: "ข้อมูลโภชนาการ (GDA)", thai: "≥ 1.0", eu: "—", usa: "—" },
  { id: "n13", part: "2", labelEn: "Net weight — outer sachet", labelTh: "น้ำหนักสุทธิ (ซองนอก)", thai: "≥ 3.0", eu: "≥ 1.2", usa: "≥ 1.6" },
  { id: "n14", part: "2", labelEn: "Net weight — bundling film", labelTh: "น้ำหนักสุทธิ (ฟิล์มจัดชุด)", thai: "≥ 6.0", eu: "—", usa: "—" },
  { id: "n15", part: "2", labelEn: "Net weight — cup side", labelTh: "น้ำหนักสุทธิ (ข้างถ้วย)", thai: "≥ 3.0", eu: "—", usa: "—" },
  { id: "n16", part: "2", labelEn: "Net weight — box (small / large / bundle)", labelTh: "น้ำหนักสุทธิ (กล่อง)", thai: "≥ 6.0", eu: "—", usa: "—" },
  { id: "n17", part: "2", labelEn: "Production & best-before date", labelTh: "วันที่ผลิต / ควรบริโภคก่อน", thai: "≥ 1.5", eu: "—", usa: "—" },
  { id: "n18", part: "2", labelEn: "GDA colour (black / dark blue on white)", labelTh: "GDA สีตัวอักษร (ดำ/น้ำเงินเข้ม บนพื้นขาว)", thai: "≥ 1.0", eu: "—", usa: "—", note: "Text & lines must be black or dark blue on white" },
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
