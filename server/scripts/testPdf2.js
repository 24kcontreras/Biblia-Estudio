import fs from 'fs';
import path from 'path';
import PDFParser from 'pdf2json';

const pdfParser = new PDFParser(this, 1);
pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
pdfParser.on("pdfParser_dataReady", pdfData => {
    const raw = pdfParser.getRawTextContent();
    fs.writeFileSync('testOutput.txt', raw.substring(0, 5000), 'utf8');
});

const filePath = path.join(process.cwd(), 'data', 'biblia-reina-valera-1960.pdf');
pdfParser.loadPDF(filePath);
