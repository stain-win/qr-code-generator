import { qrCodeGenerator } from './qr-code-generator';

describe('qrCodeGenerator', () => {
  it('should work', () => {
    expect(qrCodeGenerator()).toEqual('qr-code-generator');
  });
});
