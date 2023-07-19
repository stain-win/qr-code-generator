//---------------------------------------------------------------------
//
// QR Code Generator for TypeScript
//
// Copyright (c) 2015 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//
// The word 'QR Code' is registered trademark of
// DENSO WAVE INCORPORATED
//  http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------

import {ErrorCorrectLevel} from './errorCorrectLevel';
import {QRData} from './qrData';
import {QR8BitByte} from './8BitByte';
import {QRUtil} from './utils';
import {RSBlock} from './rsBlock';
import {BitBuffer} from './bitBuffer';
import {Polynomial} from './polynomial';
import {GIFImage} from '../image/GIFImage';
import {stringToBytes_SJIS} from '../text/stringToBytes_SJIS';

/**
 * QRCode
 * @author Kazuhiko Arase
 */
export class QRCode {

    private static PAD0 = 0xEC;

    private static PAD1 = 0x11;

    private typeNumber: number;

    private errorCorrectLevel: ErrorCorrectLevel;

    private _qrDataList: QRData[];

    private _modules: boolean[][];

    private moduleCount: number;

    public constructor() {
        this.typeNumber = 1;
        this.errorCorrectLevel = ErrorCorrectLevel.L;
        this._qrDataList = [];
    }

    public get modules(): boolean[][] {
        return this._modules;
    }

    public get qrDataList(): QRData[] {
        return this._qrDataList;
    }

    public getTypeNumber(): number {
        return this.typeNumber;
    }

    public setTypeNumber(typeNumber: number): void {
        this.typeNumber = typeNumber;
    }

    public getErrorCorrectLevel(): ErrorCorrectLevel {
        return this.errorCorrectLevel;
    }

    public setErrorCorrectLevel(errorCorrectLevel: ErrorCorrectLevel) {
        this.errorCorrectLevel = errorCorrectLevel;
    }

    public clearData(): void {
        this._qrDataList = [];
    }

    public addData(qrData: QRData | string): void {
        if (qrData instanceof QRData) {
            this._qrDataList.push(qrData);
        } else if (typeof qrData === 'string') {
            this._qrDataList.push(new QR8BitByte(qrData));
        } else {
            throw typeof qrData;
        }
    }

    private getDataCount(): number {
        return this._qrDataList.length;
    }

    private getData(index: number): QRData {
        return this._qrDataList[index];
    }

    public isDark(row: number, col: number): boolean {
        if (this._modules[row][col] != null) {
            return this._modules[row][col];
        } else {
            return false;
        }
    }

    public getModuleCount(): number {
        return this.moduleCount;
    }

    public make(): void {
        this.makeImpl(false, this.getBestMaskPattern());
    }

    private getBestMaskPattern(): number {

        let minLostPoint = 0;
        let pattern = 0;

        for (let i = 0; i < 8; i += 1) {

            this.makeImpl(true, i);

            const lostPoint = QRUtil.getLostPoint(this);

            if (i == 0 || minLostPoint > lostPoint) {
                minLostPoint = lostPoint;
                pattern = i;
            }
        }

        return pattern;
    }

    private makeImpl(test: boolean, maskPattern: number): void {

        // initialize modules
        this.moduleCount = this.typeNumber * 4 + 17;
        this._modules = [];
        for (let i = 0; i < this.moduleCount; i += 1) {
            this._modules.push([]);
            for (let j = 0; j < this.moduleCount; j += 1) {
                this._modules[i].push(null);
            }
        }

        this.setupPositionProbePattern(0, 0);
        this.setupPositionProbePattern(this.moduleCount - 7, 0);
        this.setupPositionProbePattern(0, this.moduleCount - 7);

        this.setupPositionAdjustPattern();
        this.setupTimingPattern();

        this.setupTypeInfo(test, maskPattern);

        if (this.typeNumber >= 7) {
            this.setupTypeNumber(test);
        }

        const data = QRCode.createData(
            this.typeNumber, this.errorCorrectLevel, this._qrDataList);
        this.mapData(data, maskPattern);
    }

    private mapData(data: number[], maskPattern: number): void {

        let inc = -1;
        let row = this.moduleCount - 1;
        let bitIndex = 7;
        let byteIndex = 0;
        const maskFunc = QRUtil.getMaskFunc(maskPattern);

        for (let col = this.moduleCount - 1; col > 0; col -= 2) {

            if (col == 6) {
                col -= 1;
            }

            while (true) {

                for (let c = 0; c < 2; c += 1) {

                    if (this._modules[row][col - c] == null) {

                        let dark = false;

                        if (byteIndex < data.length) {
                            dark = (((data[byteIndex] >>> bitIndex) & 1) == 1);
                        }

                        const mask = maskFunc(row, col - c);

                        if (mask) {
                            dark = !dark;
                        }

                        this._modules[row][col - c] = dark;
                        bitIndex -= 1;

                        if (bitIndex == -1) {
                            byteIndex += 1;
                            bitIndex = 7;
                        }
                    }
                }

                row += inc;

                if (row < 0 || this.moduleCount <= row) {
                    row -= inc;
                    inc = -inc;
                    break;
                }
            }
        }
    }

    private setupPositionAdjustPattern(): void {

        const pos = QRUtil.getPatternPosition(this.typeNumber);

        for (let i = 0; i < pos.length; i += 1) {

            for (let j = 0; j < pos.length; j += 1) {

                const row = pos[i];
                const col = pos[j];

                if (this._modules[row][col] != null) {
                    continue;
                }

                for (let r = -2; r <= 2; r += 1) {

                    for (let c = -2; c <= 2; c += 1) {

                        if (r == -2 || r == 2 || c == -2 || c == 2
                            || (r == 0 && c == 0)) {
                            this._modules[row + r][col + c] = true;
                        } else {
                            this._modules[row + r][col + c] = false;
                        }
                    }
                }
            }
        }
    }

    private setupPositionProbePattern(row: number, col: number): void {

        for (let r = -1; r <= 7; r += 1) {

            for (let c = -1; c <= 7; c += 1) {

                if (row + r <= -1 || this.moduleCount <= row + r
                    || col + c <= -1 || this.moduleCount <= col + c) {
                    continue;
                }

                if ((0 <= r && r <= 6 && (c == 0 || c == 6))
                    || (0 <= c && c <= 6 && (r == 0 || r == 6))
                    || (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
                    this._modules[row + r][col + c] = true;
                } else {
                    this._modules[row + r][col + c] = false;
                }
            }
        }
    }

    private setupTimingPattern(): void {
        for (let r = 8; r < this.moduleCount - 8; r += 1) {
            if (this._modules[r][6] != null) {
                continue;
            }
            this._modules[r][6] = r % 2 == 0;
        }
        for (let c = 8; c < this.moduleCount - 8; c += 1) {
            if (this._modules[6][c] != null) {
                continue;
            }
            this._modules[6][c] = c % 2 == 0;
        }
    }

    private setupTypeNumber(test: boolean): void {

        let i;
        const bits = QRUtil.getBCHTypeNumber(this.typeNumber);

        for (i = 0; i < 18; i += 1) {
            this._modules[~~(i / 3)][i % 3 + this.moduleCount - 8 - 3] =
                !test && ((bits >> i) & 1) == 1;
        }

        for (i = 0; i < 18; i += 1) {
            this._modules[i % 3 + this.moduleCount - 8 - 3][~~(i / 3)] =
                !test && ((bits >> i) & 1) == 1;
        }
    }

    private setupTypeInfo(test: boolean, maskPattern: number): void {

        let mod;
        let i;
        const data = (this.errorCorrectLevel << 3) | maskPattern;
        const bits = QRUtil.getBCHTypeInfo(data);

        // vertical
        for (i = 0; i < 15; i += 1) {

            mod = !test && ((bits >> i) & 1) == 1;

            if (i < 6) {
                this._modules[i][8] = mod;
            } else if (i < 8) {
                this._modules[i + 1][8] = mod;
            } else {
                this._modules[this.moduleCount - 15 + i][8] = mod;
            }
        }

        // horizontal
        for (i = 0; i < 15; i += 1) {

            mod = !test && ((bits >> i) & 1) == 1;

            if (i < 8) {
                this._modules[8][this.moduleCount - i - 1] = mod;
            } else if (i < 9) {
                this._modules[8][15 - i - 1 + 1] = mod;
            } else {
                this._modules[8][15 - i - 1] = mod;
            }
        }

        // fixed
        this._modules[this.moduleCount - 8][8] = !test;
    }

    public static createData(
        typeNumber: number,
        errorCorrectLevel: ErrorCorrectLevel,
        dataArray: QRData[]
    ): number[] {

        let i;
        const rsBlocks: RSBlock[] = RSBlock.getRSBlocks(
            typeNumber, errorCorrectLevel);

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
            throw 'code length overflow. ('
            + buffer.getLengthInBits()
            + '>'
            + totalDataCount * 8
            + ')';
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
            buffer.put(QRCode.PAD0, 8);

            if (buffer.getLengthInBits() >= totalDataCount * 8) {
                break;
            }
            buffer.put(QRCode.PAD1, 8);
        }

        return QRCode.createBytes(buffer, rsBlocks);
    }

    private static createBytes(
        buffer: BitBuffer,
        rsBlocks: RSBlock[]
    ): number[] {

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

        function createNumArray(len: number): number[] {
            const a: number[] = [];
            for (let i = 0; i < len; i += 1) {
                a.push(0);
            }
            return a;
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

            const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
            const rawPoly = new Polynomial(dcdata[r], rsPoly.getLength() - 1);

            const modPoly = rawPoly.mod(rsPoly);
            ecdata[r] = createNumArray(rsPoly.getLength() - 1);
            for (i = 0; i < ecdata[r].length; i += 1) {
                const modIndex = i + modPoly.getLength() - ecdata[r].length;
                ecdata[r][i] = (modIndex >= 0) ? modPoly.getAt(modIndex) : 0;
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

    public toDataURL(cellSize = 2, margin = cellSize * 4): string {
        const mods = this.getModuleCount();
        const size = cellSize * mods + margin * 2;
        const gif = new GIFImage(size, size);
        for (let y = 0; y < size; y += 1) {
            for (let x = 0; x < size; x += 1) {
                if (margin <= x && x < size - margin &&
                    margin <= y && y < size - margin &&
                    this.isDark(
                        ~~((y - margin) / cellSize),
                        ~~((x - margin) / cellSize))) {
                    gif.setPixel(x, y, 0);
                } else {
                    gif.setPixel(x, y, 1);
                }
            }
        }
        return gif.toDataURL();
    }

    // by default, SJIS encoding is applied.
    public static stringToBytes = stringToBytes_SJIS;
}
