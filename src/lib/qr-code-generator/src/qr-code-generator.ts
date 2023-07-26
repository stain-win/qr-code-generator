import {QR8BitByte} from './qr/8BitByte';
import { QRCode } from "./qr/qrCode";
export class QrCodeGenerator extends QRCode {
  constructor() {
    super();
  }

  createSegments (text: string): void {
    console.log(new QR8BitByte(text));
    // this.addData(new QR8BitByte(text));
    this.addData(text);
  }

  encode (text: string): void {
    this.addData(new QR8BitByte(text));
    this.make();
  }

  getEncodedModules (): boolean[][] {
    return this.modules;
  }
}
