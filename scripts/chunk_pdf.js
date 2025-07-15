const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

function splitIntoChunks(text, chunkSize = 100, overlap = 30) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
  }
  return chunks;
}

async function chunkPDF(filePath, chunkSize = 100, overlap = 30) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  // Optionally, split by headings/sections if you can detect them
  // For now, just chunk the whole text
  const chunks = splitIntoChunks(data.text, chunkSize, overlap);
  return chunks.map((text, i) => ({
    text,
    filename: path.basename(filePath),
    page: null, // Enhance with page detection if needed
    section: null, // Enhance with section detection if needed
    chunkIndex: i,
  }));
}

// Example usage:
// node scripts/chunk_pdf.js path/to/file.pdf
if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node chunk_pdf.js <path-to-pdf>');
    process.exit(1);
  }
  chunkPDF(filePath).then((chunks) => {
    const outPath = filePath.replace(/\.pdf$/i, '.chunks.json');
    fs.writeFileSync(outPath, JSON.stringify(chunks, null, 2));
    console.log(`Wrote ${chunks.length} chunks to ${outPath}`);
  });
} 