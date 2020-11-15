export var KeyType;
(function (KeyType) {
    KeyType[KeyType["None"] = -1] = "None";
    KeyType[KeyType["CtrlOrAlt"] = 0] = "CtrlOrAlt";
    KeyType[KeyType["Ctrl"] = 1] = "Ctrl";
    KeyType[KeyType["Shift"] = 2] = "Shift";
    KeyType[KeyType["Alt"] = 3] = "Alt";
})(KeyType || (KeyType = {}));
export var KeydownType;
(function (KeydownType) {
    KeydownType[KeydownType["None"] = -1] = "None";
    KeydownType[KeydownType["Document"] = 0] = "Document";
    KeydownType[KeydownType["Canvas"] = 1] = "Canvas";
})(KeydownType || (KeydownType = {}));
export var DefalutOptions = {
    cacheLen: 30,
    font: {
        color: '#222',
        fontFamily: '"Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial',
        fontSize: 12,
        lineHeight: 1.5,
        textAlign: 'center',
        textBaseline: 'middle',
    },
    color: '#222',
    hoverColor: '#fa541c',
    anchorRadius: 4,
    anchorFillStyle: '#fff',
    dockStrokeStyle: '#fa541c',
    dockFillStyle: '#fa541c',
    dragColor: '#1890ff',
    activeColor: '#1890ff',
    rotateCursor: '/assets/img/rotate.cur',
    hoverCursor: 'pointer',
    minScale: 0.25,
    maxScale: 5,
    autoExpandDistance: 200,
    keydown: KeydownType.Document,
};
//# sourceMappingURL=options.js.map