// Type declaration cho pdf-parse v2
declare module 'pdf-parse' {
  interface PDFLine {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }

  interface PDFPage {
    pageNumber: number;
    width: number;
    height: number;
    lines: PDFLine[];
  }

  interface PDFDocument {
    pages: PDFPage[];
    metadata?: Record<string, unknown>;
  }

  export class PDFParse {
    loadPDF(buffer: Buffer): Promise<PDFDocument>;
  }
}
