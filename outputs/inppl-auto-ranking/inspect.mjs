import fs from 'node:fs/promises';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load('C:/Users/Terra/Downloads/InPost [INPPL] Ranking (1).xlsx'));
console.log((await wb.inspect({kind:'sheet',include:'id,name',maxChars:1200})).ndjson);
const preview=await wb.render({sheetName:'Ranking',range:'N1:W12',scale:1,format:'png'});
await fs.writeFile(new URL('before.png',import.meta.url),new Uint8Array(await preview.arrayBuffer()));
console.log('Rendered original');
