import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import JSZip from 'jszip';

function sanitizeForDirectory(name: string): string {
  // Remove .epub extension, replace spaces with underscores
  return name.replace(/\.epub$/i, '').replace(/\s+/g, '_');
}

interface EpubMetadata {
  title?: string;
  creator?: string;
  identifier?: string;
  publisher?: string;
  generator?: string;
  generatorVersion?: string;
  rights?: string;
  language?: string;
  modified?: string;
}

function extractMetadata(opfContent: string): EpubMetadata {
  const metadata: EpubMetadata = {};

  // Helper to extract content between tags
  const getTag = (tag: string): string | undefined => {
    const match = opfContent.match(new RegExp(`<dc:${tag}[^>]*>([^<]+)</dc:${tag}>`, 'i'));
    return match?.[1]?.trim();
  };

  // Dublin Core metadata
  metadata.title = getTag('title');
  metadata.creator = getTag('creator');
  metadata.identifier = getTag('identifier');
  metadata.publisher = getTag('publisher');
  metadata.rights = getTag('rights');
  metadata.language = getTag('language');

  // Generator meta tag
  const generatorMatch = opfContent.match(/<meta\s+name="generator"\s+content="([^"]+)"/i);
  metadata.generator = generatorMatch?.[1];

  // Generator version (e.g., vellum-version)
  const versionMatch = opfContent.match(/<meta\s+name="[^"]*version[^"]*"\s+content="([^"]+)"/i);
  metadata.generatorVersion = versionMatch?.[1];

  // Modified date
  const modifiedMatch = opfContent.match(/<meta\s+property="dcterms:modified">([^<]+)</i);
  metadata.modified = modifiedMatch?.[1]?.trim();

  return metadata;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('epub') as File | null;

    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'No epub file provided',
      });
    }

    const fileName = file.name;

    // Check .epub extension
    if (!fileName.toLowerCase().endsWith('.epub')) {
      return NextResponse.json({
        success: false,
        message: 'File is not an .epub file',
        error: fileName,
      });
    }

    // Create output directory name
    const dirName = sanitizeForDirectory(fileName);
    const documentsDir = join(homedir(), 'Documents');
    const outputDir = join(documentsDir, dirName);

    // Remove existing directory if it exists, then create fresh
    await rm(outputDir, { recursive: true, force: true });

    // Create output directory
    await mkdir(outputDir, { recursive: true });

    // Get file buffer from uploaded file
    const arrayBuffer = await file.arrayBuffer();
    const epubBuffer = Buffer.from(arrayBuffer);

    // Save original epub to output directory
    const epubCopyPath = join(outputDir, fileName);
    await writeFile(epubCopyPath, epubBuffer);

    // Extract epub with JSZip
    const zip = await JSZip.loadAsync(epubBuffer);

    const filesExtracted: string[] = [];
    let metadata: EpubMetadata = {};

    // Extract all files
    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) {
        // Create directory
        await mkdir(join(outputDir, relativePath), { recursive: true });
      } else {
        // Extract file
        const content = await zipEntry.async('nodebuffer');
        const filePath = join(outputDir, relativePath);

        // Ensure parent directory exists
        await mkdir(dirname(filePath), { recursive: true });

        await writeFile(filePath, content);
        filesExtracted.push(relativePath);

        // Parse OPF file for metadata
        if (relativePath.toLowerCase().endsWith('.opf')) {
          const opfContent = content.toString('utf-8');
          metadata = extractMetadata(opfContent);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully extracted "${fileName}"`,
      outputDir,
      filesExtracted: filesExtracted.sort(),
      metadata,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Extraction failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
