import { Options } from './options';
import { Canvas } from './canvas';
export declare class RenderLayer extends Canvas {
    parentElem: HTMLElement;
    options: Options;
    offscreen: any;
    bkImg: HTMLImageElement;
    bkImgRect: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    constructor(parentElem: HTMLElement, options: Options, TID: String);
    loadBkImg(cb?: any): void;
    clearBkImg(): void;
    render: () => void;
    coverRect(canvasWidth: number, canvasHeight: number, imgWidth: number, imgHeight: number): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
