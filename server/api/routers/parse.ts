import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import OpenAI from "openai";
import Reducto from "reductoai";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import pdfParse from "pdf-parse";
import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function fetchFileFromBlob(blobUrl: string, retries = 3) {
  let url: URL;
  try {
    url = new URL(blobUrl);
  } catch {
    throw new Error(`Invalid blob URL format: ${blobUrl}`);
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(blobUrl, {
        method: "GET",
        headers: {
          Accept: "*/*",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        if (response.status === 404 && attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(
            `File not found (404), retrying in ${waitTime}ms... (attempt ${
              attempt + 1
            }/${retries + 1})`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        throw new Error(`Failed to fetch file from blob storage`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const urlPath = url.pathname;
      const encodedFileName = urlPath.split("/").pop() || "document.pdf";
      const fileName = decodeURIComponent(encodedFileName);

      const fileType =
        response.headers.get("content-type") ||
        response.headers.get("Content-Type") ||
        "application/pdf";

      console.log(
        `Successfully fetched file: ${fileName} (${buffer.length} bytes, ${fileType})`
      );

      return { buffer, fileName, fileType };
    } catch (error) {
      console.error("Error fetching file from blob:", error);
    }
  }

  throw new Error(
    `Failed to fetch file from blob storage after all retries: ${blobUrl}`
  );
}

async function parseWithOpenAI(
  buffer: Buffer,
  fileName: string,
  fileType: string
) {
  const uint8Array = new Uint8Array(buffer);
  const fileBlob = new Blob([uint8Array], { type: fileType });
  const openaiFile = new File([fileBlob], fileName, {
    type: fileType,
  });

  const uploadedFile = await openai.files.create({
    file: openaiFile,
    purpose: "user_data",
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a PDF parser that MUST extract and return ALL content from PDF files. You must include every piece of text, every section, every detail, and preserve the complete document structure. Do not summarize, omit, or skip any content. Return the entire document content in full. For tables, format each row as a separate JSON object.",
      },
      {
        role: "user",
        content: [
          {
            type: "file",
            file: {
              file_id: uploadedFile.id,
            },
          },
          {
            type: "text",
            text: 'You MUST extract and return ALL content from this PDF file. Include every word, every section, every paragraph, every heading, every table, every list item, and every detail. Do not summarize or omit anything. Preserve the structure and formatting as much as possible. Return the complete, full content of the entire PDF document. IMPORTANT: If the PDF contains tables, format each table row as a separate JSON item where each column header becomes a key and the row values become the corresponding values. For example, if a table has columns \'Name\', \'Age\', \'City\', then each row should be formatted as: {"Name": "value", "Age": "value", "City": "value"}. Extract all table rows in this JSON format.',
          },
        ],
      },
    ],
  });

  const content =
    completion.choices[0]?.message?.content || "No content extracted";

  await openai.files.delete(uploadedFile.id);

  return content;
}

async function parseWithPdfParse(buffer: Buffer, fileName: string) {
  try {
    const data = await pdfParse(buffer);

    return data.text || "No text content found in PDF";
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    throw new Error(`PDF parsing failed: ${errorMessage}`);
  }
}

async function parseWithReducto(buffer: Buffer, fileName: string) {
  let tempFilePath: string | null = null;
  try {
    const apiKey = process.env.REDUCTO_API_KEY;
    const client = apiKey ? new Reducto({ apiKey }) : new Reducto();

    const tempDir = path.join(os.tmpdir(), "reducto-parse");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    tempFilePath = path.join(tempDir, `${Date.now()}-${fileName}`);
    fs.writeFileSync(tempFilePath, buffer);

    const uploadResponse = await client.upload({
      file: fs.createReadStream(tempFilePath),
    });

    const fileId = (uploadResponse as any).file_id || uploadResponse;

    const result = await client.parse.run({
      input: fileId,
    });

    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return "No content extracted with Reducto";
  }
}

export const parseRouter = router({
  openai: publicProcedure
    .input(
      z.object({
        blobUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { buffer, fileName, fileType } = await fetchFileFromBlob(
          input.blobUrl
        );
        const content = await parseWithOpenAI(buffer, fileName, fileType);
        return {
          success: true,
          content,
        };
      } catch (error) {
        console.error("Error parsing with OpenAI:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to parse file",
        };
      }
    }),

  pdfParse: publicProcedure
    .input(
      z.object({
        blobUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { buffer, fileName } = await fetchFileFromBlob(input.blobUrl);
        const content = await parseWithPdfParse(buffer, fileName);
        return {
          success: true,
          content,
        };
      } catch (error) {
        console.error("Error parsing with pdf-parse:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to parse file",
        };
      }
    }),

  reducto: publicProcedure
    .input(
      z.object({
        blobUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { buffer, fileName } = await fetchFileFromBlob(input.blobUrl);
        const content = await parseWithReducto(buffer, fileName);
        return {
          success: true,
          content,
        };
      } catch (error) {
        console.error("Error parsing with Reducto:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to parse file",
        };
      }
    }),
});
