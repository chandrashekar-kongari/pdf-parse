export type ParseMethod = "openai" | "pdfParse" | "reducto";

export interface ParseResults {
  openai: string | null;
  pdfParse: string | null;
  reducto: string | null;
}

export const PARSE_METHOD_LABELS: Record<ParseMethod, string> = {
  pdfParse: "PDF Parse",
  openai: "OpenAI",
  reducto: "Reducto",
};
