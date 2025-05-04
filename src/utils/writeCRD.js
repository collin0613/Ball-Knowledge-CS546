import fs, { write } from 'fs';

const VERSION = 1;

function writeCRDFile(numTables, startRow, endRow, startRow2, endRow2) {
    const buffer = new ArrayBuffer(1024);
    const view = new DataView(buffer);

    view.setUint8(0, 0x43);
    view.setUint8(1, 0x52);
    view.setUint8(2, 0x44);
    view.setUint8(3, 0x46);
    view.setUint8(4, VERSION);
    view.setUint8(5, 0x00);
    view.setUint16(6, numTables, true);
    view.setUint16(8, startRow, true);
    view.setUint16(10, endRow, true);
    view.setUint16(12, startRow2, true);
    view.setUint16(14, endRow2, true);

    view.set

    fs.writeFileSync('file.crd', new Uint8Array(buffer));
}

writeCRDFile(1, 2, 3, 4, 5);
console.log('CRD file written successfully');