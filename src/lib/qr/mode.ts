/**
 * Mode
 * @author Kazuhiko Arase
 */
export enum Mode {
    // number
    MODE_NUMBER = 1 << 0,
    // alpha num
    MODE_ALPHA_NUM = 1 << 1,
    // 8bit byte
    MODE_8BIT_BYTE = 1 << 2,
    // kanji
    MODE_KANJI = 1 << 3
}
