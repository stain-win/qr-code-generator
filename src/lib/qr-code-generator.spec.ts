import { QrCodeGenerator } from './qr-code-generator';
import { beforeEach, describe } from 'vitest';

describe('qrCodeGenerator', () => {
  let qrGenerator: QrCodeGenerator;

  beforeEach(() => {
    qrGenerator = new QrCodeGenerator();
  });

  it('should instantiate library', () => {
    expect(qrGenerator).toBeTruthy();
  });

  describe('createSegments', () => {
    it('should encode data', () => {
      qrGenerator.createSegments('test');
      expect(qrGenerator.qrDataList).toBeTruthy();
      expect(qrGenerator.qrDataList[0]).toEqual({ mode: 4, data: 'test' });
    });

    it('should create segments', () => {
      qrGenerator.createSegments('test');
      qrGenerator.make()
      expect(qrGenerator.getEncodedModules()).toBeTruthy();
    });
  });
});
