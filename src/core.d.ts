import { Options } from './options';
import { Pen } from './models/pen';
import { Node } from './models/node';
import { Point } from './models/point';
import { Line } from './models/line';
import { TopologyData } from './models/data';
import { Lock } from './models/status';
import { Offscreen } from './offscreen';
import { RenderLayer } from './renderLayer';
import { HoverLayer } from './hoverLayer';
import { ActiveLayer } from './activeLayer';
import { AnimateLayer } from './animateLayer';
import { DivLayer } from './divLayer';
import { Rect } from './models/rect';
import { Socket } from './socket';
import { MQTT } from './mqtt';
declare enum MoveInType {
    None = 0,
    Line = 1,
    LineMove = 2,
    LineFrom = 3,
    LineTo = 4,
    LineControlPoint = 5,
    Nodes = 6,
    ResizeCP = 7,
    HoverAnchors = 8,
    Rotate = 9
}
interface ICaches {
    index: number;
    list: TopologyData[];
}
export declare class Topology {
    id: String;
    data: TopologyData;
    clipboard: TopologyData;
    caches: ICaches;
    options: Options;
    parentElem: HTMLElement;
    canvas: RenderLayer;
    offscreen: Offscreen;
    hoverLayer: HoverLayer;
    activeLayer: ActiveLayer;
    animateLayer: AnimateLayer;
    divLayer: DivLayer;
    private subcribe;
    private subcribeRender;
    private subcribeImage;
    private imageTimer;
    private subcribeAnimateEnd;
    private subcribeAnimateMoved;
    private subcribeMediaEnd;
    touchedNode: any;
    lastHoverNode: Node;
    lastHoverLine: Line;
    input: HTMLTextAreaElement;
    inputObj: Pen;
    mouseDown: {
        x: number;
        y: number;
        restore?: boolean;
    };
    lastTranlated: {
        x: number;
        y: number;
    };
    moveIn: {
        type: MoveInType;
        activeAnchorIndex: number;
        hoverAnchorIndex: number;
        hoverNode: Node;
        hoverLine: Line;
        activeNode: Node;
        lineControlPoint: Point;
    };
    needCache: boolean;
    private tip;
    private raf;
    tipMarkdown: HTMLElement;
    tipElem: HTMLElement;
    gridElem: HTMLElement;
    socket: Socket;
    mqtt: MQTT;
    private scheduledAnimationFrame;
    private scrolling;
    private rendering;
    constructor(parent: string | HTMLElement, options?: Options);
    winResize: () => void;
    resize(size?: {
        width: number;
        height: number;
    }): void;
    dropNodes(jsonList: any[], offsetX: number, offsetY: number): void;
    getTouchOffset(touch: Touch): {
        offsetX: number;
        offsetY: number;
    };
    private ontouched;
    addNode(node: Node | any, focus?: boolean): any;
    addLine(line: any, focus?: boolean): any;
    render(noFocus?: boolean): this;
    open(data?: any): void;
    openSocket(url?: string): void;
    closeSocket(): void;
    openMqtt(url?: string, options?: any): void;
    closeMqtt(): void;
    overflow(): Rect;
    private setNodeText;
    private onMouseMove;
    private onmousedown;
    private onmouseup;
    private ondblclick;
    private onkeydown;
    private getMoveIn;
    inChildNode(pt: Point, children: Pen[]): any;
    inNode(pt: Point, node: Node, inChild?: boolean): any;
    inLine(point: Point, line: Line): Line;
    private getLineDock;
    private getPensInRect;
    private getAngle;
    showInput(item: Pen): void;
    getRect(pens?: Pen[]): Rect;
    getDockPos(offsetX: number, offsetY: number, noDock?: boolean): {
        x: number;
        y: number;
    };
    cache(): void;
    cacheReplace(pens: Pen[]): void;
    undo(noRedo?: boolean): void;
    redo(): void;
    toImage(type?: string, quality?: any, callback?: any, padding?: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    }, thumbnail?: boolean): string;
    saveAsImage(name?: string, type?: string, quality?: any, padding?: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    }, thumbnail?: boolean): void;
    delete(force?: boolean): void;
    delEmptyLines(deleteedId?: string): void;
    removeNode(node: Node): void;
    removeLine(line: Line): void;
    cut(): void;
    copy(): void;
    paste(): void;
    newId(node: any, idMaps: any): void;
    animate(autoplay?: boolean): void;
    updateProps(cache?: boolean, pens?: Pen[]): void;
    lock(lock: Lock): void;
    lockPens(pens: Pen[], lock: Lock): void;
    up(pen: Pen): void;
    top(pen: Pen): void;
    down(pen: Pen): void;
    bottom(pen: Pen): void;
    combine(pens?: Pen[], stand?: boolean): void;
    uncombine(node?: Pen): void;
    find(idOrTag: string, pens?: Pen[]): Pen | Pen[];
    findIndex(pen: Pen): number;
    translate(x: number, y: number, process?: boolean): void;
    scale(scale: number, center?: Point): void;
    scaleTo(scale: number): void;
    round(): void;
    private generateStoreKey;
    private createMarkdownTip;
    private showTip;
    private hideTip;
    scroll(x: number, y: number): void;
    toComponent(pens?: Pen[]): Node;
    clearBkImg(): void;
    dispatch(event: string, data: any): void;
    getValue(idOrTag: string, attr?: string): any;
    setValue(idOrTag: string, val: any, attr?: string): void;
    createGrid(): void;
    showGrid(show?: boolean): void;
    setLineName(name: 'curve' | 'line' | 'polyline' | 'mind', render?: boolean): void;
    destroy(): void;
}
export {};
