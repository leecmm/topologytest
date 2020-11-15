export declare enum KeyType {
    None = -1,
    CtrlOrAlt = 0,
    Ctrl = 1,
    Shift = 2,
    Alt = 3
}
export declare enum KeydownType {
    None = -1,
    Document = 0,
    Canvas = 1
}
export interface Options {
    cacheLen?: number;
    extDpiRatio?: number;
    width?: string | number;
    height?: string | number;
    color?: string;
    activeColor?: string;
    hoverColor?: string;
    anchorRadius?: number;
    anchorFillStyle?: string;
    dockStrokeStyle?: string;
    dockFillStyle?: string;
    dragColor?: string;
    animateColor?: string;
    font?: {
        color?: string;
        fontFamily?: string;
        fontSize?: number;
        lineHeight?: number;
        textAlign?: string;
        textBaseline?: string;
    };
    rotateCursor?: string;
    hoverCursor?: string;
    hideInput?: boolean;
    hideRotateCP?: boolean;
    hideSizeCP?: boolean;
    hideAnchor?: boolean;
    onlySizeX?: boolean;
    onlySizeY?: boolean;
    alwaysAnchor?: boolean;
    disableEmptyLine?: boolean;
    disableRepeatLine?: boolean;
    disableScale?: boolean;
    disableMoveOutParent?: boolean;
    disableDockLine?: boolean;
    playIcon?: string;
    pauseIcon?: string;
    fullScreenIcon?: string;
    loopIcon?: string;
    translateKey?: KeyType;
    scaleKey?: KeyType;
    minScale?: number;
    maxScale?: number;
    autoExpandDistance?: number;
    keydown?: KeydownType;
    on?: (event: string, data: any) => void;
}
export declare const DefalutOptions: Options;
