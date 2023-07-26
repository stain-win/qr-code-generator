import { ByteArrayOutputStream } from './ByteArrayOutputStream';
import { Base64EncodeOutputStream } from './Base64EncodeOutputStream';
import { Base64DecodeInputStream } from './Base64DecodeInputStream';
import { ByteArrayInputStream } from './ByteArrayInputStream';

/**
 * Base64
 * @author Kazuhiko Arase
 */
export function encode(data: number[]): number[] {
    const bout = new ByteArrayOutputStream();
    try {
        const ostream = new Base64EncodeOutputStream(bout);
        try {
            ostream.writeBytes(data);
        } finally {
            ostream.close();
        }
    } finally {
        bout.close();
    }
    return bout.toByteArray();
}

export function decode(data: number[]): number[] {
    const bout = new ByteArrayOutputStream();
    try {
        const istream = new Base64DecodeInputStream(new ByteArrayInputStream(data));
        try {
            let b: number;
            while ((b = istream.readByte()) != -1) {
                bout.writeByte(b);
            }
        } finally {
            istream.close();
        }
    } finally {
        bout.close();
    }
    return bout.toByteArray();
}
