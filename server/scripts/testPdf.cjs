const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function testPdf() {
  const filePath = path.join(process.cwd(), 'data', 'biblia-reina-valera-1960.pdf');
  const dataBuffer = fs.readFileSync(filePath);
  
  function render_page(pageData) {
    let render_options = {
        normalizeWhitespace: false,
        disableCombineTextItems: false
    }
    return pageData.getTextContent(render_options).then(function(textContent) {
        let lastY, text = '';
        for (let item of textContent.items) {
            if (lastY == item.transform[5] || !lastY){
                text += item.str;
            } else {
                text += '\n' + item.str;
            }    
            lastY = item.transform[5];
        }
        return text;
    });
  }

  const options = {
    pagerender: render_page,
    max: 20
  };

  const data = await pdf(dataBuffer, options);
  console.log(data.text);
}

testPdf().catch(console.error);
