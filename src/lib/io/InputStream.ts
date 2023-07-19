/**
 * InputStream
 * @author Kazuhiko Arase
 */
export abstract class InputStream {
    constructor() {
        // empty
    }

    public abstract readByte(): number;

    public close(): void {
        //empty
    }
}
