import { promises as fs } from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';
import path from 'path';

export interface ParsedFile {
  filename: string;
  text: string;
  mime: string;
}

async function parsePDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text || '';
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value || '';
}

async function parseTXT(buffer: Buffer): Promise<string> {
  return buffer.toString('utf8');
}

export async function parseSingle(filename: string, buffer: Buffer): Promise<ParsedFile> {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf') {
    return { filename, text: await parsePDF(buffer), mime: 'application/pdf' };
  }
  if (ext === '.docx') {
    return { filename, text: await parseDOCX(buffer), mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  }
  if (ext === '.txt') {
    return { filename, text: await parseTXT(buffer), mime: 'text/plain' };
  }
  throw new Error(`Unsupported file type: ${ext}`);
}

export async function parseMaybeZip(filename: string, buffer: Buffer): Promise<ParsedFile[]> {
  const ext = path.extname(filename).toLowerCase();
  if (ext !== '.zip') return [await parseSingle(filename, buffer)];
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const results: ParsedFile[] = [];
  for (const e of entries) {
    if (e.isDirectory) continue;
    const name = e.entryName;
    if (!name.match(/\.(pdf|docx|txt)$/i)) continue;
    const buf = e.getData();
    try {
      results.push(await parseSingle(name, buf));
    } catch (err) {
      // skip unsupported inside zip
    }
  }
  return results;
}
