/**
 * Beast CLI — Vim Motions
 *
 * Parser for vim motion commands.
 */
export type MotionType = "char" | "word" | "WORD" | "line" | "paragraph" | "sentence" | "match" | "percent";
export interface Motion {
    type: MotionType;
    direction: "forward" | "backward";
    count: number;
    isLinewise: boolean;
}
/**
 * Vim Motion Parser
 *
 * Parses vim motion commands like w, b, e, $, 0, etc.
 */
export declare class VimMotionParser {
    /**
     * Parse a motion string
     */
    parse(motionStr: string): Motion | null;
    /**
     * Execute a motion on text
     */
    execute(text: string, position: number, motion: Motion): number;
    /**
     * Execute a single motion
     */
    private executeSingle;
    /**
     * Find start of current line
     */
    private findLineStart;
    /**
     * Find next word
     */
    private findNextWord;
    /**
     * Find previous word
     */
    private findPrevWord;
    /**
     * Find next paragraph
     */
    private findNextParagraph;
    /**
     * Find previous paragraph
     */
    private findPrevParagraph;
    /**
     * Check if character is a word character
     */
    private isWordChar;
}
