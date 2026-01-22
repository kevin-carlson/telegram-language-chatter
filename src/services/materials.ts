import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { config } from '../config';

// Import document parsers
import officeparser from 'officeparser';

interface ParsedMaterial {
  filename: string;
  content: string;
  type: 'notes' | 'presentation' | 'document' | 'text';
}

/**
 * Parse all reference materials from the configured directory
 */
export async function loadReferenceMaterials(): Promise<string> {
  const materialsDir = config.referenceMaterialsDir;

  if (!fs.existsSync(materialsDir)) {
    console.log(`Creating reference materials directory: ${materialsDir}`);
    fs.mkdirSync(materialsDir, { recursive: true });
    return '';
  }

  const files = fs.readdirSync(materialsDir);
  const materials: ParsedMaterial[] = [];

  for (const file of files) {
    const filePath = path.join(materialsDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively process subdirectories
      const subMaterials = await processDirectory(filePath);
      materials.push(...subMaterials);
    } else {
      const material = await parseFile(filePath);
      if (material) {
        materials.push(material);
      }
    }
  }

  if (materials.length === 0) {
    console.log('No reference materials found');
    return '';
  }

  console.log(`Loaded ${materials.length} reference materials`);

  // Format materials for context
  return formatMaterialsForContext(materials);
}

/**
 * Process a directory recursively
 */
async function processDirectory(dirPath: string): Promise<ParsedMaterial[]> {
  const materials: ParsedMaterial[] = [];
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const subMaterials = await processDirectory(filePath);
      materials.push(...subMaterials);
    } else {
      const material = await parseFile(filePath);
      if (material) {
        materials.push(material);
      }
    }
  }

  return materials;
}

/**
 * Parse a single file based on its extension
 */
async function parseFile(filePath: string): Promise<ParsedMaterial | null> {
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);

  try {
    switch (ext) {
      case '.txt':
        return {
          filename,
          content: fs.readFileSync(filePath, 'utf-8'),
          type: 'text',
        };

      case '.md':
        return {
          filename,
          content: fs.readFileSync(filePath, 'utf-8'),
          type: 'notes',
        };

      case '.pptx':
      case '.ppt':
        return await parsePowerPoint(filePath, filename);

      case '.docx':
      case '.doc':
        return await parseWord(filePath, filename);

      case '.pdf':
        return await parsePDF(filePath, filename);

      default:
        // Skip unsupported file types silently
        return null;
    }
  } catch (error) {
    console.error(`Failed to parse ${filename}:`, error);
    return null;
  }
}

/**
 * Parse PowerPoint files
 */
async function parsePowerPoint(filePath: string, filename: string): Promise<ParsedMaterial | null> {
  try {
    const content = await officeparser.parseOfficeAsync(filePath);
    return {
      filename,
      content: content || '',
      type: 'presentation',
    };
  } catch (error) {
    console.error(`Failed to parse PowerPoint ${filename}:`, error);
    return null;
  }
}

/**
 * Parse Word documents
 */
async function parseWord(filePath: string, filename: string): Promise<ParsedMaterial | null> {
  try {
    const content = await officeparser.parseOfficeAsync(filePath);
    return {
      filename,
      content: content || '',
      type: 'document',
    };
  } catch (error) {
    console.error(`Failed to parse Word document ${filename}:`, error);
    return null;
  }
}

/**
 * Parse PDF files
 */
async function parsePDF(filePath: string, filename: string): Promise<ParsedMaterial | null> {
  try {
    const pdfParse = await import('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse.default(dataBuffer);
    return {
      filename,
      content: data.text,
      type: 'document',
    };
  } catch (error) {
    console.error(`Failed to parse PDF ${filename}:`, error);
    return null;
  }
}

/**
 * Format parsed materials for inclusion in AI context
 */
function formatMaterialsForContext(materials: ParsedMaterial[]): string {
  const sections: string[] = [];

  // Group by type
  const presentations = materials.filter(m => m.type === 'presentation');
  const notes = materials.filter(m => m.type === 'notes' || m.type === 'text');
  const documents = materials.filter(m => m.type === 'document');

  if (presentations.length > 0) {
    sections.push('=== LESSON PRESENTATIONS ===');
    for (const pres of presentations) {
      sections.push(`\n--- ${pres.filename} ---`);
      // Limit content to avoid overwhelming the context
      const truncatedContent = truncateContent(pres.content, 5000);
      sections.push(truncatedContent);
    }
  }

  if (notes.length > 0) {
    sections.push('\n=== TUTOR NOTES ===');
    for (const note of notes) {
      sections.push(`\n--- ${note.filename} ---`);
      const truncatedContent = truncateContent(note.content, 3000);
      sections.push(truncatedContent);
    }
  }

  if (documents.length > 0) {
    sections.push('\n=== LEARNING DOCUMENTS ===');
    for (const doc of documents) {
      sections.push(`\n--- ${doc.filename} ---`);
      const truncatedContent = truncateContent(doc.content, 3000);
      sections.push(truncatedContent);
    }
  }

  return sections.join('\n');
}

/**
 * Truncate content while trying to preserve complete lines/sentences
 */
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content;
  }

  // Try to truncate at a line break
  const truncated = content.substring(0, maxLength);
  const lastNewline = truncated.lastIndexOf('\n');

  if (lastNewline > maxLength * 0.8) {
    return truncated.substring(0, lastNewline) + '\n[... content truncated ...]';
  }

  // Otherwise, truncate at last period
  const lastPeriod = truncated.lastIndexOf('.');
  if (lastPeriod > maxLength * 0.8) {
    return truncated.substring(0, lastPeriod + 1) + '\n[... content truncated ...]';
  }

  return truncated + '\n[... content truncated ...]';
}

/**
 * Watch the materials directory for changes (cross-platform using chokidar)
 */
export function watchMaterialsDirectory(callback: () => void): void {
  const materialsDir = config.referenceMaterialsDir;

  if (!fs.existsSync(materialsDir)) {
    return;
  }

  // Use chokidar for cross-platform file watching (works on Linux, macOS, Windows)
  const watcher = chokidar.watch(materialsDir, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  // Debounce callback to avoid multiple rapid reloads
  let debounceTimer: NodeJS.Timeout | null = null;
  const debouncedCallback = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      callback();
      debounceTimer = null;
    }, 1000);
  };

  watcher
    .on('add', (filePath) => {
      console.log(`Reference material added: ${path.basename(filePath)}`);
      debouncedCallback();
    })
    .on('change', (filePath) => {
      console.log(`Reference material changed: ${path.basename(filePath)}`);
      debouncedCallback();
    })
    .on('unlink', (filePath) => {
      console.log(`Reference material removed: ${path.basename(filePath)}`);
      debouncedCallback();
    })
    .on('error', (error) => {
      console.error('File watcher error:', error);
    });
}
