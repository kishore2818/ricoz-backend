const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const ExcelJS = require('exceljs');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');

/**
 * Multi-format document parser
 * Supports: PDF (native & scanned OCR), XLSX, XLS, DOCX, CSV
 */
const parseDocument = async (filePath, mimeType, originalName) => {
  const ext = path.extname(originalName || filePath).toLowerCase();
  const fileBuffer = fs.readFileSync(filePath);

  let result = {
    text: '',
    pageCount: 1,
    isScanned: false,
    tables: [],
    preview: ''
  };

  try {
    if (ext === '.pdf' || mimeType === 'application/pdf') {
      const pdfData = await pdfParse(fileBuffer);
      result.text = pdfData.text || '';
      result.pageCount = pdfData.numpages || 1;

      // Scanned detection: if average text per page is extremely low (< 50 chars)
      const avgCharsPerPage = result.text.trim().length / (result.pageCount || 1);
      if (avgCharsPerPage < 50 && result.text.trim().length < 100) {
        result.isScanned = true;
        console.log(`[Parser] Scanned PDF detected for ${originalName}. Running OCR fallback...`);
        try {
          const ocrResult = await Tesseract.recognize(filePath, 'eng', {
            logger: m => {}
          });
          if (ocrResult && ocrResult.data && ocrResult.data.text) {
            result.text = ocrResult.data.text;
          }
        } catch (ocrErr) {
          console.warn(`[Parser OCR Warning] OCR execution failed: ${ocrErr.message}`);
        }
      }
    } else if (ext === '.xlsx' || ext === '.xls' || ext === '.csv' || mimeType.includes('sheet') || mimeType.includes('csv')) {
      const workbook = new ExcelJS.Workbook();
      if (ext === '.csv' || mimeType.includes('csv')) {
        await workbook.csv.readFile(filePath);
      } else {
        await workbook.xlsx.readFile(filePath);
      }

      let aggregatedText = '';
      const tables = [];

      workbook.eachSheet((worksheet, sheetId) => {
        aggregatedText += `\n--- Sheet: ${worksheet.name} ---\n`;
        const sheetRows = [];

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          const rowValues = [];
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            let val = cell.value;
            if (val && typeof val === 'object' && val.result !== undefined) {
              val = val.result; // Formula evaluation result
            }
            rowValues.push(val !== null && val !== undefined ? String(val).trim() : '');
          });
          sheetRows.push(rowValues);
          aggregatedText += rowValues.join(' | ') + '\n';
        });

        tables.push({
          sheetName: worksheet.name,
          rows: sheetRows
        });
      });

      result.text = aggregatedText;
      result.tables = tables;
      result.pageCount = workbook.worksheets.length;
    } else if (ext === '.docx' || mimeType.includes('wordprocessingml')) {
      const docxResult = await mammoth.extractRawText({ path: filePath });
      result.text = docxResult.value || '';
      result.pageCount = 1;
    } else {
      // Fallback plain text read
      result.text = fileBuffer.toString('utf-8');
    }

    result.preview = result.text.substring(0, 500).replace(/\s+/g, ' ').trim();
    return result;
  } catch (err) {
    console.error(`[Parser Error] Failed to parse document ${filePath}:`, err);
    throw new Error(`Document parsing failed: ${err.message}`);
  }
};

module.exports = {
  parseDocument
};

