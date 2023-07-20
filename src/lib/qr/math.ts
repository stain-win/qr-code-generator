/**
 * QRMath
 * @author Kazuhiko Arase
 */
export class QRMath {

    constructor() {
        throw 'error';
    }
    private static initialized = false;

    private static EXP_TABLE: number[];
    private static LOG_TABLE: number[];

    private static initialize =  () => {
        if (!QRMath.initialized) {
            let i;
            QRMath.EXP_TABLE = [];
            QRMath.LOG_TABLE = [];
            for (i = 0; i < 256; i += 1) {
                QRMath.EXP_TABLE.push(i < 8 ? 1 << i :
                  QRMath.EXP_TABLE[i - 4] ^
                  QRMath.EXP_TABLE[i - 5] ^
                  QRMath.EXP_TABLE[i - 6] ^
                  QRMath.EXP_TABLE[i - 8]);
                QRMath.LOG_TABLE.push(0);
            }
            for (i = 0; i < 255; i += 1) {
                QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
            }
            QRMath.initialized = true;
        }
    };
    public static glog(n: number): number {
        QRMath.initialize();
        if (n < 1) {
            throw 'log(' + n + ')';
        }
        return QRMath.LOG_TABLE[n];
    }

    public static gexp(n: number): number {
        QRMath.initialize();
        while (n < 0) {
            n += 255;
        }
        while (n >= 256) {
            n -= 255;
        }
        return QRMath.EXP_TABLE[n];
    }
}
