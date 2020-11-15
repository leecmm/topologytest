import { Node } from '../../models/node';
import { Line } from '../../models/line';
export declare function getWords(txt: string): any[];
export declare function getLines(ctx: CanvasRenderingContext2D, words: string[], maxWidth: number, fontSize: number): any[];
export declare function fillText(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, width: number, height: number, lineHeight: number, maxLineLen?: number, bk?: string): void;
export declare function text(ctx: CanvasRenderingContext2D, node: Node | Line): void;
export declare function iconfont(ctx: CanvasRenderingContext2D, node: Node): void;
