import { Pen } from './pen';
import { Rect } from './rect';
import { Point } from './point';
export declare const images: {
    [key: string]: {
        img: HTMLImageElement;
        cnt: number;
    };
};
export declare class Node extends Pen {
    is3D: boolean;
    z: number;
    zRotate: number;
    borderRadius: number;
    icon: string;
    iconFamily: string;
    iconSize: number;
    iconColor: string;
    image: string;
    lastImage: string;
    imgNaturalWidth: number;
    imgNaturalHeight: number;
    imageWidth: number;
    imageHeight: number;
    imageRatio: boolean;
    imageAlign: string;
    img: HTMLImageElement;
    bkType: number;
    gradientFromColor: string;
    gradientToColor: string;
    gradientAngle: number;
    gradientRadius: number;
    paddingTop: number | string;
    paddingBottom: number | string;
    paddingLeft: number | string;
    paddingRight: number | string;
    onlySizeX?: boolean;
    onlySizeY?: boolean;
    iconRect: Rect;
    fullIconRect: Rect;
    anchors: Point[];
    rotatedAnchors: Point[];
    children: Pen[];
    dockWatchers: Point[];
    animateDuration: number;
    animateFrames: {
        duration: number;
        start?: number;
        end?: number;
        initState?: Node;
        linear: boolean;
        state: Node;
    }[];
    animateAlone: boolean;
    gif: boolean;
    video: string;
    audio: string;
    play: number;
    playLoop: boolean;
    nextPlay: string;
    iframe: string;
    elementId: string;
    elementLoaded: any;
    elementRendered: boolean;
    constructor(json: any, noChild?: boolean);
    static cloneState(json: any): Node;
    init(): void;
    addToDiv(): void;
    hasGif(): boolean;
    calcAbsPadding(): void;
    setChild(children: any[]): void;
    clearChildrenIds(): void;
    draw(ctx: CanvasRenderingContext2D): void;
    drawBkLinearGradient(ctx: CanvasRenderingContext2D): void;
    drawBkRadialGradient(ctx: CanvasRenderingContext2D): void;
    drawImg(ctx: CanvasRenderingContext2D): void;
    calcAnchors(): void;
    calcRotateAnchors(angle?: number): void;
    getTextRect(): Rect;
    getIconRect(): Rect;
    calcRectByParent(parent: Pen): void;
    calcChildrenRect(): void;
    calcRectInParent(parent: Pen): void;
    getDockWatchers(): void;
    initAnimateProps(): void;
    animate(now: number): void;
    scale(scale: number, center?: Point): void;
    translate(x: number, y: number): void;
    initRect(): void;
    round(): void;
    clone(): Node;
}
