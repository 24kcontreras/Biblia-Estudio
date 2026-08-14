import fs from 'fs';
import path from 'path';
import PDFParser from 'pdf2json';

const pdfParser = new PDFParser(this, 1);
pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
pdfParser.on("pdfParser_dataReady", pdfData => {
    const raw = pdfParser.getRawTextContent();
    fs.writeFileSync('nvi-text.txt', raw, 'utf8');
    console.log("Extracción NVI completada.");
});

const filePath = path.join(process.cwd(), 'data', 'BIBLIA NUEVA VERSIÓN INTERNACIONAL (NVI) 2015.pdf');
pdfParser.loadPDF(filePath);
