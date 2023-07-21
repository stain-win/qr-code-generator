import { ErrorCorrectLevel } from './errorCorrectLevel';
import { QRData } from './qrData';
import { getRSBlocks, RSBlock } from './rsBlock';
import { BitBuffer } from './bitBuffer';
import { getErrorCorrectPolynomial } from './utils';
import { Polynomial } from './polynomial';

const PAD0 = 0xec;
const PAD1 = 0x11;

function createNumArray(len: number): number[] {
    const a: number[] = [];
    for (let i = 0; i < len; i += 1) {
        a.push(0);
    }
    return a;
}

export function createData(
    typeNumber: number,
    errorCorrectLevel: ErrorCorrectLevel,
    dataArray: QRData[]
): number[] {
    let i;
    const rsBlocks: RSBlock[] = getRSBlocks(typeNumber, errorCorrectLevel);

    const buffer = new BitBuffer();

    for (i = 0; i < dataArray.length; i += 1) {
        const data = dataArray[i];
        buffer.put(data.getMode(), 4);
        buffer.put(data.getLength(), data.getLengthInBits(typeNumber));
        data.write(buffer);
    }

    // calc max data count
    let totalDataCount = 0;
    for (i = 0; i < rsBlocks.length; i += 1) {
        totalDataCount += rsBlocks[i].getDataCount();
    }

    if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw (
            'code length overflow. (' +
            buffer.getLengthInBits() +
            '>' +
            totalDataCount * 8 +
            ')'
        );
    }

    // end
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
        buffer.put(0, 4);
    }

    // padding
    while (buffer.getLengthInBits() % 8 != 0) {
        buffer.putBit(false);
    }

    // padding
    while (true) {
        if (buffer.getLengthInBits() >= totalDataCount * 8) {
            break;
        }
        buffer.put(PAD0, 8);

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
            break;
        }
        buffer.put(PAD1, 8);
    }

    return createBytes(buffer, rsBlocks);
}

function createBytes(buffer: BitBuffer, rsBlocks: RSBlock[]): number[] {
    let i;
    let r;
    let offset = 0;

    let maxDcCount = 0;
    let maxEcCount = 0;

    const dcdata: number[][] = [];
    const ecdata: number[][] = [];

    for (r = 0; r < rsBlocks.length; r += 1) {
        dcdata.push([]);
        ecdata.push([]);
    }

    for (r = 0; r < rsBlocks.length; r += 1) {
        const dcCount = rsBlocks[r].getDataCount();
        const ecCount = rsBlocks[r].getTotalCount() - dcCount;

        maxDcCount = Math.max(maxDcCount, dcCount);
        maxEcCount = Math.max(maxEcCount, ecCount);

        dcdata[r] = createNumArray(dcCount);
        for (i = 0; i < dcdata[r].length; i += 1) {
            dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
        }
        offset += dcCount;

        const rsPoly = getErrorCorrectPolynomial(ecCount);
        const rawPoly = new Polynomial(dcdata[r], rsPoly.getLength() - 1);

        const modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = createNumArray(rsPoly.getLength() - 1);
        for (i = 0; i < ecdata[r].length; i += 1) {
            const modIndex = i + modPoly.getLength() - ecdata[r].length;
            ecdata[r][i] = modIndex >= 0 ? modPoly.getAt(modIndex) : 0;
        }
    }

    let totalCodeCount = 0;
    for (i = 0; i < rsBlocks.length; i += 1) {
        totalCodeCount += rsBlocks[i].getTotalCount();
    }

    const data = createNumArray(totalCodeCount);
    let index = 0;

    for (i = 0; i < maxDcCount; i += 1) {
        for (r = 0; r < rsBlocks.length; r += 1) {
            if (i < dcdata[r].length) {
                data[index] = dcdata[r][i];
                index += 1;
            }
        }
    }

    for (i = 0; i < maxEcCount; i += 1) {
        for (r = 0; r < rsBlocks.length; r += 1) {
            if (i < ecdata[r].length) {
                data[index] = ecdata[r][i];
                index += 1;
            }
        }
    }
    return data;
}
