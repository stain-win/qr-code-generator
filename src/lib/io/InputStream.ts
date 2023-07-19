/**
 * InputStream
 * @author Kazuhiko Arase
 */
export abstract class InputStream {
    protected constructor() {
        // empty
    }

    public abstract readByte(): number;

    public close(): void {
        //empty
    }
}
