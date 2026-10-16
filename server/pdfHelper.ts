/**
 * Safe PDF and text extractor
 */
export async function extractTextFromBuffer(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const isPdf = mimeType.includes('pdf') || filename.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    try {
      // Dynamic import of pdf-parse to handle ESM/CJS compatibility safely
      const pdfParseModule = await import('pdf-parse');
      const PDFParserClass = (pdfParseModule as any).PDFParse || (pdfParseModule as any).default?.PDFParse;

      // Handle pdf-parse v2 class API
      if (typeof PDFParserClass === 'function') {
        const parser = new PDFParserClass({ data: buffer });
        const textResult = await parser.getText();
        if (typeof parser.destroy === 'function') {
          await parser.destroy();
        }
        if (textResult && textResult.text && textResult.text.trim().length > 0) {
          return textResult.text.trim();
        }
      }

      // Handle pdf-parse v1 function API
      const pdfParseFn = typeof pdfParseModule === 'function' ? pdfParseModule : (pdfParseModule as any).default;
      if (typeof pdfParseFn === 'function') {
        const data = await pdfParseFn(buffer);
        if (data && data.text && data.text.trim().length > 0) {
          return data.text.trim();
        }
      }
    } catch (err) {
      console.warn('[PDF] Failed to parse with pdf-parse, attempting stream/plain fallback:', err);
    }

    // Fallback: extract printable strings from PDF stream if simple text
    try {
      const rawString = buffer.toString('latin1');
      const matches = rawString.match(/\(([^()]{3,})\)Tj/g);
      if (matches && matches.length > 0) {
        return matches.map((m) => m.slice(1, -3)).join(' ');
      }
    } catch (fallbackErr) {
      console.warn('[PDF] Raw stream fallback error:', fallbackErr);
    }
  }

  // Fallback to utf-8 text
  return buffer.toString('utf-8');
}
