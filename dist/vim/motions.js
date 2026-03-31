/**
 * Beast CLI — Vim Motions
 *
 * Parser for vim motion commands.
 */
import { createLogger } from "../utils";
const logger = createLogger({ prefix: "vim:motion" });
/**
 * Vim Motion Parser
 *
 * Parses vim motion commands like w, b, e, $, 0, etc.
 */
export class VimMotionParser {
    /**
     * Parse a motion string
     */
    parse(motionStr) {
        // Handle simple motions
        const simpleMotions = {
            "h": { type: "char", direction: "backward" },
            "l": { type: "char", direction: "forward" },
            "j": { type: "line", direction: "forward", isLinewise: true },
            "k": { type: "line", direction: "backward", isLinewise: true },
            "w": { type: "word", direction: "forward" },
            "W": { type: "WORD", direction: "forward" },
            "b": { type: "word", direction: "backward" },
            "B": { type: "WORD", direction: "backward" },
            "e": { type: "word", direction: "forward" },
            "E": { type: "WORD", direction: "forward" },
            "0": { type: "line", direction: "backward" },
            "$": { type: "line", direction: "forward" },
            "{": { type: "paragraph", direction: "backward" },
            "}": { type: "paragraph", direction: "forward" },
            "(": { type: "sentence", direction: "backward" },
            ")": { type: "sentence", direction: "forward" },
            "%": { type: "percent", direction: "forward" },
        };
        // Check for count prefix (e.g., "3w")
        const match = motionStr.match(/^(\d*)(.+)$/);
        if (!match)
            return null;
        const [, countStr, motion] = match;
        const count = countStr ? parseInt(countStr, 10) : 1;
        const baseMotion = simpleMotions[motion];
        if (!baseMotion)
            return null;
        return {
            count,
            direction: "forward",
            isLinewise: false,
            ...baseMotion,
            type: baseMotion.type,
        };
    }
    /**
     * Execute a motion on text
     */
    execute(text, position, motion) {
        let newPos = position;
        for (let i = 0; i < motion.count; i++) {
            newPos = this.executeSingle(text, newPos, motion);
        }
        return newPos;
    }
    /**
     * Execute a single motion
     */
    executeSingle(text, position, motion) {
        switch (motion.type) {
            case "char":
                return motion.direction === "forward"
                    ? Math.min(position + 1, text.length - 1)
                    : Math.max(position - 1, 0);
            case "line":
                if (motion.direction === "forward") {
                    const nextNewline = text.indexOf("\n", position + 1);
                    return nextNewline === -1 ? text.length : nextNewline + 1;
                }
                else {
                    const prevNewline = text.lastIndexOf("\n", position - 1);
                    return prevNewline === -1 ? 0 : this.findLineStart(text, prevNewline);
                }
            case "word":
            case "WORD":
                return motion.direction === "forward"
                    ? this.findNextWord(text, position, motion.type === "WORD")
                    : this.findPrevWord(text, position, motion.type === "WORD");
            case "paragraph":
                return motion.direction === "forward"
                    ? this.findNextParagraph(text, position)
                    : this.findPrevParagraph(text, position);
            case "percent":
                return Math.floor(text.length * (position / text.length));
            default:
                return position;
        }
    }
    /**
     * Find start of current line
     */
    findLineStart(text, position) {
        let i = position;
        while (i > 0 && text[i - 1] !== "\n") {
            i--;
        }
        return i;
    }
    /**
     * Find next word
     */
    findNextWord(text, position, bigWord) {
        let i = position;
        // Skip current word
        while (i < text.length && this.isWordChar(text[i], bigWord)) {
            i++;
        }
        // Skip whitespace
        while (i < text.length && !this.isWordChar(text[i], bigWord) && text[i] !== "\n") {
            i++;
        }
        return i;
    }
    /**
     * Find previous word
     */
    findPrevWord(text, position, bigWord) {
        let i = position - 1;
        // Skip whitespace
        while (i > 0 && !this.isWordChar(text[i], bigWord) && text[i] !== "\n") {
            i--;
        }
        // Skip word
        while (i > 0 && this.isWordChar(text[i - 1], bigWord)) {
            i--;
        }
        return Math.max(i, 0);
    }
    /**
     * Find next paragraph
     */
    findNextParagraph(text, position) {
        let i = position;
        let foundBlank = false;
        while (i < text.length) {
            if (text[i] === "\n" && (text[i + 1] === "\n" || i === text.length - 1)) {
                foundBlank = true;
            }
            else if (foundBlank && text[i] !== "\n") {
                return i;
            }
            i++;
        }
        return text.length;
    }
    /**
     * Find previous paragraph
     */
    findPrevParagraph(text, position) {
        let i = position - 1;
        let foundBlank = false;
        while (i >= 0) {
            if (text[i] === "\n" && (i === 0 || text[i - 1] === "\n")) {
                foundBlank = true;
            }
            else if (foundBlank && text[i] !== "\n") {
                // Find start of this line
                while (i > 0 && text[i - 1] !== "\n") {
                    i--;
                }
                return i;
            }
            i--;
        }
        return 0;
    }
    /**
     * Check if character is a word character
     */
    isWordChar(char, bigWord) {
        if (bigWord) {
            return !/\s/.test(char);
        }
        return /\w/.test(char);
    }
}
//# sourceMappingURL=motions.js.map