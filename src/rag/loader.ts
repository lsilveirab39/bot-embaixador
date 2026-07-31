import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

export interface LoadedDocument {
  source: string;
  title: string | null;
  content: string;
  metadata: Record<string, unknown>;
}

const supported = new Set([".md", ".txt", ".json", ".csv", ".html", ".htm"]);

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else if (entry.isFile() && supported.has(path.extname(entry.name).toLowerCase())) files.push(fullPath);
  }
  return files;
}

function htmlToText(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function loadDocuments(directory: string): Promise<LoadedDocument[]> {
  const info = await stat(directory);
  if (!info.isDirectory()) throw new Error(`${directory} não é um diretório`);
  const files = await walk(directory);
  const documents: LoadedDocument[] = [];

  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    const raw = await readFile(file, "utf8");
    let content = raw;
    if (extension === ".json") {
      content = JSON.stringify(JSON.parse(raw), null, 2);
    } else if (extension === ".html" || extension === ".htm") {
      content = htmlToText(raw);
    }
    documents.push({
      source: path.relative(process.cwd(), file).replaceAll("\\", "/"),
      title: path.basename(file, extension),
      content,
      metadata: { extension },
    });
  }

  return documents;
}
