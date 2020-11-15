import { Store } from 'le5le-store';
import { KeyType, KeydownType, DefalutOptions } from './options';
import { PenType } from './models/pen';
import { Node } from './models/node';
import { Point } from './models/point';
import { Line } from './models/line';
import { TopologyData } from './models/data';
import { Lock, AnchorMode } from './models/status';
import { drawNodeFns, drawLineFns } from './middles/index';
import { Offscreen } from './offscreen';
import { RenderLayer } from './renderLayer';
import { HoverLayer } from './hoverLayer';
import { ActiveLayer } from './activeLayer';
import { AnimateLayer } from './animateLayer';
import { DivLayer } from './divLayer';
import { Rect } from './models/rect';
import { s8 } from './utils/uuid';
import { pointInRect } from './utils/canvas';
import { getRect } from './utils/rect';
import { Socket } from './socket';
import { MQTT } from './mqtt';
var resizeCursors = ['nw-resize', 'ne-resize', 'se-resize', 'sw-resize'];
var MoveInType;
(function (MoveInType) {
    MoveInType[MoveInType["None"] = 0] = "None";
    MoveInType[MoveInType["Line"] = 1] = "Line";
    MoveInType[MoveInType["LineMove"] = 2] = "LineMove";
    MoveInType[MoveInType["LineFrom"] = 3] = "LineFrom";
    MoveInType[MoveInType["LineTo"] = 4] = "LineTo";
    MoveInType[MoveInType["LineControlPoint"] = 5] = "LineControlPoint";
    MoveInType[MoveInType["Nodes"] = 6] = "Nodes";
    MoveInType[MoveInType["ResizeCP"] = 7] = "ResizeCP";
    MoveInType[MoveInType["HoverAnchors"] = 8] = "HoverAnchors";
    MoveInType[MoveInType["Rotate"] = 9] = "Rotate";
})(MoveInType || (MoveInType = {}));
var dockOffset = 10;
var Topology = /** @class */ (function () {
    function Topology(parent, options) {
        var _this = this;
        this.data = new TopologyData();
        this.caches = {
            index: 0,
            list: [],
        };
        this.input = document.createElement('textarea');
        this.lastTranlated = { x: 0, y: 0 };
        this.moveIn = {
            type: MoveInType.None,
            activeAnchorIndex: 0,
            hoverAnchorIndex: 0,
            hoverNode: null,
            hoverLine: null,
            activeNode: null,
            lineControlPoint: null,
        };
        this.needCache = false;
        this.tip = '';
        this.gridElem = document.createElement('div');
        this.scheduledAnimationFrame = false;
        this.scrolling = false;
        this.rendering = false;
        this.winResize = function () {
            var timer;
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(function () {
                _this.resize();
                _this.overflow();
            }, 100);
        };
        this.onMouseMove = function (e) {
            if (_this.scheduledAnimationFrame || _this.data.locked === Lock.NoEvent) {
                return;
            }
            // https://caniuse.com/#feat=mdn-api_mouseevent_buttons
            if (_this.mouseDown && !_this.mouseDown.restore && e.buttons !== 1) {
                // 防止异常情况导致mouseup事件没有触发
                _this.onmouseup(e);
                return;
            }
            if (_this.mouseDown && _this.moveIn.type === MoveInType.None) {
                var b = false;
                switch (_this.options.translateKey) {
                    case KeyType.None:
                        b = true;
                        break;
                    case KeyType.Ctrl:
                        if (e.ctrlKey) {
                            b = true;
                        }
                        break;
                    case KeyType.Shift:
                        if (e.shiftKey) {
                            b = true;
                        }
                        break;
                    case KeyType.Alt:
                        if (e.altKey) {
                            b = true;
                        }
                        break;
                    default:
                        if (e.ctrlKey || e.altKey) {
                            b = true;
                        }
                }
                if (b) {
                    var canvasPos_1 = _this.divLayer.canvas.getBoundingClientRect();
                    _this.translate(e.x - _this.mouseDown.x - canvasPos_1.x, e.y - _this.mouseDown.y - canvasPos_1.y, true);
                    return false;
                }
            }
            if (_this.data.locked && _this.mouseDown && _this.moveIn.type !== MoveInType.None) {
                return;
            }
            _this.scheduledAnimationFrame = true;
            var canvasPos = _this.divLayer.canvas.getBoundingClientRect();
            var pos = new Point(e.x - canvasPos.x, e.y - canvasPos.y);
            if (_this.raf)
                cancelAnimationFrame(_this.raf);
            _this.raf = requestAnimationFrame(function () {
                _this.raf = null;
                if (!_this.mouseDown) {
                    _this.getMoveIn(pos);
                    // Render hover anchors.
                    if (_this.moveIn.hoverNode !== _this.lastHoverNode) {
                        if (_this.lastHoverNode) {
                            // Send a move event.
                            _this.dispatch('moveOutNode', _this.lastHoverNode);
                            _this.hideTip();
                            // Clear hover anchors.
                            _this.hoverLayer.node = null;
                        }
                        if (_this.moveIn.hoverNode) {
                            _this.hoverLayer.node = _this.moveIn.hoverNode;
                            // Send a move event.
                            _this.dispatch('moveInNode', _this.moveIn.hoverNode);
                            _this.showTip(_this.moveIn.hoverNode, pos);
                        }
                    }
                    if (_this.moveIn.hoverLine !== _this.lastHoverLine) {
                        if (_this.lastHoverLine) {
                            _this.dispatch('moveOutLine', _this.lastHoverLine);
                            _this.hideTip();
                        }
                        if (_this.moveIn.hoverLine) {
                            _this.dispatch('moveInLine', _this.moveIn.hoverLine);
                            _this.showTip(_this.moveIn.hoverLine, pos);
                        }
                    }
                    if (_this.moveIn.type === MoveInType.LineControlPoint) {
                        _this.hoverLayer.hoverLineCP = _this.moveIn.lineControlPoint;
                    }
                    else if (_this.hoverLayer.hoverLineCP) {
                        _this.hoverLayer.hoverLineCP = null;
                    }
                    if (_this.moveIn.hoverNode !== _this.lastHoverNode ||
                        _this.moveIn.type === MoveInType.HoverAnchors ||
                        _this.hoverLayer.lasthoverLineCP !== _this.hoverLayer.hoverLineCP) {
                        _this.hoverLayer.lasthoverLineCP = _this.hoverLayer.hoverLineCP;
                        _this.render();
                    }
                    _this.scheduledAnimationFrame = false;
                    return;
                }
                // Move out parent element.
                //       const moveOutX = pos.x + 50 > this.parentElem.clientWidth + this.parentElem.scrollLeft;
                //       const moveOutY = pos.y + 50 > this.parentElem.clientHeight + this.parentElem.scrollTop;
                //       if (!this.options.disableMoveOutParent && (moveOutX || moveOutY)) {
                //         this.dispatch('moveOutParent', pos);
                //         if (this.options.autoExpandDistance > 0) {
                //           let resize = false;
                //           if (pos.x + 50 > this.divLayer.canvas.clientWidth) {
                //             this.canvas.width += this.options.autoExpandDistance;
                //             resize = true;
                //           }
                //           if (pos.y + 50 > this.divLayer.canvas.clientHeight) {
                //             this.canvas.height += this.options.autoExpandDistance;
                //             resize = true;
                //           }
                //           if (resize) {
                //             this.resize({
                //               width: this.canvas.width,
                //               height: this.canvas.height,
                //             });
                //           }
                //           this.scroll(
                //             moveOutX ? this.options.autoExpandDistance / 2 : 0,
                //             moveOutY ? this.options.autoExpandDistance / 2 : 0
                //           );
                //         }
                //       }
                //       const moveLeft = pos.x - 100 < this.parentElem.scrollLeft;
                //       const moveTop = pos.y - 100 < this.parentElem.scrollTop;
                //       if (moveLeft || moveTop) {
                //         this.scroll(moveLeft ? -100 : 0, moveTop ? -100 : 0);
                //       }
                switch (_this.moveIn.type) {
                    case MoveInType.None:
                        _this.hoverLayer.dragRect = new Rect(_this.mouseDown.x, _this.mouseDown.y, pos.x - _this.mouseDown.x, pos.y - _this.mouseDown.y);
                        break;
                    case MoveInType.Nodes:
                        if (_this.activeLayer.locked()) {
                            break;
                        }
                        //           const x = pos.x - this.mouseDown.x;
                        //           const y = pos.y - this.mouseDown.y;
                        //           if (x || y) {
                        //             const offset = this.getDockPos(x, y, e.ctrlKey || e.shiftKey || e.altKey);
                        //             this.activeLayer.move(offset.x ? offset.x : x, offset.y ? offset.y : y);
                        //             this.needCache = true;
                        //           }
                        break;
                    case MoveInType.ResizeCP:
                        _this.activeLayer.resize(_this.moveIn.activeAnchorIndex, _this.mouseDown, pos);
                        _this.dispatch('resizePens', _this.activeLayer.pens);
                        _this.needCache = true;
                        break;
                    case MoveInType.LineTo:
                    case MoveInType.HoverAnchors:
                        var arrow = _this.data.toArrowType;
                        if (_this.moveIn.hoverLine) {
                            arrow = _this.moveIn.hoverLine.toArrow;
                        }
                        if (_this.hoverLayer.line) {
                            _this.activeLayer.pens = [_this.hoverLayer.line];
                        }
                        _this.hoverLayer.lineTo(_this.getLineDock(pos), arrow);
                        _this.needCache = true;
                        break;
                    case MoveInType.LineFrom:
                        _this.hoverLayer.lineFrom(_this.getLineDock(pos));
                        _this.needCache = true;
                        break;
                    case MoveInType.LineMove:
                        _this.hoverLayer.lineMove(pos, _this.mouseDown);
                        _this.needCache = true;
                        break;
                    case MoveInType.LineControlPoint:
                        _this.moveIn.hoverLine.controlPoints[_this.moveIn.lineControlPoint.id].x = pos.x;
                        _this.moveIn.hoverLine.controlPoints[_this.moveIn.lineControlPoint.id].y = pos.y;
                        _this.moveIn.hoverLine.textRect = null;
                        if (drawLineFns[_this.moveIn.hoverLine.name] && drawLineFns[_this.moveIn.hoverLine.name].dockControlPointFn) {
                            drawLineFns[_this.moveIn.hoverLine.name].dockControlPointFn(_this.moveIn.hoverLine.controlPoints[_this.moveIn.lineControlPoint.id], _this.moveIn.hoverLine);
                        }
                        _this.needCache = true;
                        Store.set(_this.generateStoreKey('LT:updateLines'), [_this.moveIn.hoverLine]);
                        break;
                    case MoveInType.Rotate:
                        if (_this.activeLayer.pens.length) {
                            _this.activeLayer.offsetRotate(_this.getAngle(pos));
                            _this.activeLayer.updateLines();
                        }
                        _this.needCache = true;
                        break;
                }
                _this.render();
                _this.scheduledAnimationFrame = false;
            });
        };
        this.onmousedown = function (e) {
            if (e.button !== 0)
                return;
            var canvasPos = _this.divLayer.canvas.getBoundingClientRect();
            _this.mouseDown = { x: e.x - canvasPos.x, y: e.y - canvasPos.y };
            if (e.altKey) {
                _this.divLayer.canvas.style.cursor = 'move';
            }
            if (_this.inputObj) {
                _this.setNodeText();
            }
            switch (_this.moveIn.type) {
                // Click the space.
                case MoveInType.None:
                    _this.activeLayer.clear();
                    _this.hoverLayer.clear();
                    _this.dispatch('space', _this.mouseDown);
                    break;
                // Click a line.
                case MoveInType.Line:
                case MoveInType.LineControlPoint:
                    if (e.ctrlKey || e.shiftKey) {
                        //           this.activeLayer.add(this.moveIn.hoverLine);
                        _this.dispatch('multi', _this.activeLayer.pens);
                    }
                    else {
                        //           this.activeLayer.pens = [this.moveIn.hoverLine];
                        _this.dispatch('line', _this.moveIn.hoverLine);
                    }
                    break;
                case MoveInType.LineMove:
                    _this.hoverLayer.initLine = new Line(_this.moveIn.hoverLine);
                    if (_this.data.locked || _this.moveIn.hoverLine.locked) {
                        _this.moveIn.hoverLine.click();
                    }
                // tslint:disable-next-line:no-switch-case-fall-through
                case MoveInType.LineFrom:
                case MoveInType.LineTo:
                    //         this.activeLayer.pens = [this.moveIn.hoverLine];
                    _this.dispatch('line', _this.moveIn.hoverLine);
                    _this.hoverLayer.line = _this.moveIn.hoverLine;
                    break;
                case MoveInType.HoverAnchors:
                    _this.hoverLayer.line = _this.addLine({
                        name: _this.data.lineName,
                        from: new Point(_this.moveIn.hoverNode.rotatedAnchors[_this.moveIn.hoverAnchorIndex].x, _this.moveIn.hoverNode.rotatedAnchors[_this.moveIn.hoverAnchorIndex].y, _this.moveIn.hoverNode.rotatedAnchors[_this.moveIn.hoverAnchorIndex].direction, _this.moveIn.hoverAnchorIndex, _this.moveIn.hoverNode.id),
                        fromArrow: _this.data.fromArrowType,
                        to: new Point(_this.moveIn.hoverNode.rotatedAnchors[_this.moveIn.hoverAnchorIndex].x, _this.moveIn.hoverNode.rotatedAnchors[_this.moveIn.hoverAnchorIndex].y),
                        toArrow: _this.data.toArrowType,
                        strokeStyle: _this.options.color,
                    });
                    _this.dispatch('anchor', {
                        anchor: _this.moveIn.hoverNode.rotatedAnchors[_this.moveIn.hoverAnchorIndex],
                        anchorIndex: _this.moveIn.hoverAnchorIndex,
                        node: _this.moveIn.hoverNode,
                        line: _this.hoverLayer.line,
                    });
                // tslint:disable-next-line:no-switch-case-fall-through
                case MoveInType.Nodes:
                    if (!_this.moveIn.activeNode) {
                        break;
                    }
                    if (e.ctrlKey || e.shiftKey) {
                        if (_this.moveIn.hoverNode && _this.activeLayer.hasInAll(_this.moveIn.hoverNode)) {
                            //             this.activeLayer.setPens([this.moveIn.hoverNode]);
                            _this.dispatch('node', _this.moveIn.hoverNode);
                        }
                        else if (!_this.activeLayer.has(_this.moveIn.activeNode)) {
                            _this.activeLayer.add(_this.moveIn.activeNode);
                            if (_this.activeLayer.pens.length > 1) {
                                _this.dispatch('multi', _this.activeLayer.pens);
                            }
                            else {
                                _this.dispatch('node', _this.moveIn.activeNode);
                            }
                        }
                    }
                    else if (e.altKey) {
                        if (_this.moveIn.hoverNode) {
                            //             this.activeLayer.setPens([this.moveIn.hoverNode]);
                            _this.dispatch('node', _this.moveIn.hoverNode);
                        }
                        else if (_this.moveIn.hoverLine) {
                            //             this.activeLayer.setPens([this.moveIn.hoverLine]);
                            _this.dispatch('line', _this.moveIn.hoverLine);
                        }
                    }
                    else if (_this.activeLayer.pens.length < 2) {
                        //           this.activeLayer.setPens([this.moveIn.activeNode]);
                        _this.dispatch('node', _this.moveIn.activeNode);
                    }
                    if (_this.data.locked || _this.moveIn.activeNode.locked) {
                        _this.moveIn.activeNode.click();
                    }
                    break;
            }
            // Save node rects to move.
            if (_this.activeLayer.pens.length) {
                _this.activeLayer.saveNodeRects();
            }
            _this.render();
        };
        this.onmouseup = function (e) {
            if (!_this.mouseDown)
                return;
            _this.mouseDown = null;
            _this.lastTranlated.x = 0;
            _this.lastTranlated.y = 0;
            _this.hoverLayer.dockAnchor = null;
            _this.hoverLayer.dockLineX = 0;
            _this.hoverLayer.dockLineY = 0;
            _this.divLayer.canvas.style.cursor = 'default';
            if (_this.hoverLayer.dragRect) {
                _this.getPensInRect(_this.hoverLayer.dragRect);
                if (_this.activeLayer.pens && _this.activeLayer.pens.length) {
                    _this.dispatch('multi', _this.activeLayer.pens);
                }
            }
            else {
                switch (_this.moveIn.type) {
                    // Add the line.
                    case MoveInType.HoverAnchors:
                        // New active.
                        if (_this.hoverLayer.line) {
                            var willAddLine = void 0;
                            if (_this.hoverLayer.line.to.id) {
                                if (!_this.options.disableRepeatLine) {
                                    willAddLine = true;
                                }
                                else {
                                    var lines = _this.data.pens.filter(function (pen) {
                                        return pen.type === PenType.Line &&
                                            pen.from.isSameAs(_this.hoverLayer.line.from) &&
                                            pen.to.isSameAs(_this.hoverLayer.line.to);
                                    });
                                    willAddLine = lines.length <= 1;
                                }
                            }
                            else {
                                willAddLine = !_this.options.disableEmptyLine && !_this.hoverLayer.line.disableEmptyLine;
                            }
                            if (willAddLine) {
                                _this.activeLayer.pens = [_this.hoverLayer.line];
                                _this.dispatch('addLine', _this.hoverLayer.line);
                            }
                            else {
                                _this.data.pens.pop();
                                _this.activeLayer.clear();
                            }
                        }
                        _this.offscreen.render();
                        _this.hoverLayer.line = null;
                        break;
                    case MoveInType.Rotate:
                        _this.activeLayer.updateRotate();
                        break;
                    case MoveInType.LineControlPoint:
                        Store.set(_this.generateStoreKey('pts-') + _this.moveIn.hoverLine.id, null);
                        break;
                    case MoveInType.LineFrom:
                    case MoveInType.LineTo:
                        if ((_this.hoverLayer.line.disableEmptyLine || _this.options.disableEmptyLine) &&
                            (!_this.hoverLayer.line.from.id || !_this.hoverLayer.line.to.id)) {
                            _this.needCache = true;
                            _this.activeLayer.clear();
                            _this.data.pens.splice(_this.findIndex(_this.hoverLayer.line), 1);
                        }
                        break;
                }
            }
            _this.hoverLayer.dragRect = null;
            _this.render();
            if (_this.needCache) {
                _this.cache();
            }
            _this.needCache = false;
        };
        this.ondblclick = function (e) {
            var canvasPos = _this.divLayer.canvas.getBoundingClientRect();
            if (_this.moveIn.hoverNode) {
                _this.dispatch('dblclick', _this.moveIn.hoverNode);
                if (_this.moveIn.hoverNode.getTextRect().hit(new Point(e.x - canvasPos.x, e.y - canvasPos.y))) {
                    _this.showInput(_this.moveIn.hoverNode);
                }
                _this.moveIn.hoverNode.dblclick();
            }
            else if (_this.moveIn.hoverLine) {
                _this.dispatch('dblclick', _this.moveIn.hoverLine);
                if (!_this.moveIn.hoverLine.text ||
                    _this.moveIn.hoverLine.getTextRect().hit(new Point(e.x - canvasPos.x, e.y - canvasPos.y))) {
                    _this.showInput(_this.moveIn.hoverLine);
                }
                _this.moveIn.hoverLine.dblclick();
            }
        };
        this.onkeydown = function (key) {
            if (_this.data.locked ||
                key.target.tagName === 'INPUT' ||
                key.target.tagName === 'TEXTAREA') {
                return;
            }
            var done = false;
            var moveX = 0;
            var moveY = 0;
            switch (key.key) {
                case 'a':
                case 'A':
                    _this.activeLayer.setPens(_this.data.pens);
                    done = true;
                    break;
                case 'Delete':
                case 'Backspace':
                    _this.delete();
                    break;
                case 'ArrowLeft':
                    moveX = -5;
                    if (key.ctrlKey) {
                        moveX = -1;
                    }
                    done = true;
                    break;
                case 'ArrowUp':
                    moveY = -5;
                    if (key.ctrlKey) {
                        moveY = -1;
                    }
                    done = true;
                    break;
                case 'ArrowRight':
                    moveX = 5;
                    if (key.ctrlKey) {
                        moveX = 1;
                    }
                    done = true;
                    break;
                case 'ArrowDown':
                    moveY = 5;
                    if (key.ctrlKey) {
                        moveY = 1;
                    }
                    done = true;
                    break;
                case 'x':
                case 'X':
                    _this.cut();
                    break;
                case 'c':
                case 'C':
                    _this.copy();
                    break;
                case 'v':
                case 'V':
                    _this.paste();
                    break;
                case 'y':
                case 'Y':
                    if (key.ctrlKey) {
                        _this.redo();
                    }
                    break;
                case 'z':
                case 'Z':
                    if (key.shiftKey) {
                        _this.redo();
                    }
                    else {
                        _this.undo();
                    }
                    break;
            }
            if (!done) {
                return;
            }
            key.preventDefault();
            if (moveX || moveY) {
                _this.activeLayer.saveNodeRects();
                _this.activeLayer.move(moveX, moveY);
                _this.overflow();
                _this.animateLayer.animate();
            }
            _this.render();
            _this.cache();
        };
        this.id = s8();
        Store.set(this.generateStoreKey('topology-data'), this.data);
        if (!options) {
            options = {};
        }
        var font = Object.assign({}, DefalutOptions.font, options.font);
        options.font = font;
        this.options = Object.assign({}, DefalutOptions, options);
        if (typeof parent === 'string') {
            this.parentElem = document.getElementById(parent);
        }
        else {
            this.parentElem = parent;
        }
        this.parentElem.style.position = 'relative';
        this.parentElem.style.overflow = 'auto';
        this.createGrid();
        var id = this.id;
        this.activeLayer = new ActiveLayer(this.options, id);
        this.hoverLayer = new HoverLayer(this.options, id);
        this.animateLayer = new AnimateLayer(this.options, id);
        this.offscreen = new Offscreen(this.parentElem, this.options, id);
        this.canvas = new RenderLayer(this.parentElem, this.options, id);
        this.divLayer = new DivLayer(this.parentElem, this.options, id);
        this.resize();
        this.divLayer.canvas.ondragover = function (event) { return event.preventDefault(); };
        this.divLayer.canvas.ondrop = function (event) {
            try {
                var json = event.dataTransfer.getData('Topology') || event.dataTransfer.getData('Text');
                if (!json)
                    return;
                var obj = JSON.parse(json);
                event.preventDefault();
                _this.dropNodes(Array.isArray(obj) ? obj : [obj], event.offsetX, event.offsetY);
            }
            catch (_a) { }
        };
        this.subcribe = Store.subscribe(this.generateStoreKey('LT:render'), function () {
            _this.render();
        });
        this.subcribeRender = Store.subscribe('LT:render', function () {
            _this.render();
        });
        this.subcribeImage = Store.subscribe(this.generateStoreKey('LT:imageLoaded'), function () {
            if (_this.imageTimer) {
                clearTimeout(_this.imageTimer);
            }
            _this.imageTimer = setTimeout(function () {
                _this.render();
            }, 100);
        });
        this.subcribeAnimateMoved = Store.subscribe(this.generateStoreKey('LT:rectChanged'), function (e) {
            _this.activeLayer.updateLines(_this.data.pens);
        });
        this.subcribeMediaEnd = Store.subscribe(this.generateStoreKey('mediaEnd'), function (node) {
            if (node.nextPlay) {
                _this.animateLayer.readyPlay(node.nextPlay);
                _this.animateLayer.animate();
            }
            _this.dispatch('mediaEnd', node);
        });
        this.subcribeAnimateEnd = Store.subscribe(this.generateStoreKey('animateEnd'), function (e) {
            if (!e) {
                return;
            }
            switch (e.type) {
                case 'node':
                    _this.offscreen.render();
                    break;
            }
            _this.divLayer.playNext(e.data.nextAnimate);
            _this.dispatch('animateEnd', e);
        });
        this.divLayer.canvas.onmousemove = this.onMouseMove;
        this.divLayer.canvas.onmousedown = this.onmousedown;
        this.divLayer.canvas.onmouseup = this.onmouseup;
        this.divLayer.canvas.ondblclick = this.ondblclick;
        this.divLayer.canvas.tabIndex = 0;
        this.divLayer.canvas.onblur = function () {
            _this.mouseDown = null;
        };
        this.divLayer.canvas.onwheel = function (event) {
            if (_this.options.disableScale) {
                return;
            }
            switch (_this.options.scaleKey) {
                case KeyType.None:
                    break;
                case KeyType.Ctrl:
                    if (!event.ctrlKey) {
                        return;
                    }
                    break;
                case KeyType.Shift:
                    if (!event.shiftKey) {
                        return;
                    }
                    break;
                case KeyType.Alt:
                    if (!event.altKey) {
                        return;
                    }
                    break;
                default:
                    if (!event.ctrlKey && !event.altKey) {
                        return;
                    }
            }
            event.preventDefault();
            if (event.deltaY < 0) {
                _this.scale(1.1);
            }
            else {
                _this.scale(0.9);
            }
            _this.divLayer.canvas.focus();
            return false;
        };
        this.divLayer.canvas.ontouchend = function (event) {
            _this.ontouched(event);
        };
        switch (this.options.keydown) {
            case KeydownType.Document:
                document.onkeydown = this.onkeydown;
                break;
            case KeydownType.Canvas:
                this.divLayer.canvas.onkeydown = this.onkeydown;
                break;
        }
        this.input.style.position = 'absolute';
        this.input.style.zIndex = '-1';
        this.input.style.left = '-1000px';
        this.input.style.width = '0';
        this.input.style.height = '0';
        this.input.style.outline = 'none';
        this.input.style.border = '1px solid #cdcdcd';
        this.input.style.resize = 'none';
        this.parentElem.appendChild(this.input);
        this.createMarkdownTip();
        this.cache();
        this.parentElem.onresize = this.winResize;
        window.addEventListener('resize', this.winResize);
        window.topology = this;
    }
    Topology.prototype.resize = function (size) {
        this.canvas.resize(size);
        this.offscreen.resize(size);
        this.divLayer.resize(size);
        this.render();
        this.showGrid();
        this.dispatch('resize', size);
    };
    Topology.prototype.dropNodes = function (jsonList, offsetX, offsetY) {
        var _this = this;
        var x, y;
        if (jsonList.length) {
            var rect = jsonList[0].rect;
            x = rect.x;
            y = rect.y;
        }
        var firstNode;
        jsonList.forEach(function (json) {
            if (!firstNode) {
                json.rect.x = (offsetX - json.rect.width / 2) << 0;
                json.rect.y = (offsetY - json.rect.height / 2) << 0;
                firstNode = json;
            }
            else {
                //Layout relative to the first node
                var rect = json.rect;
                var dx = rect.x - x, dy = rect.y - y;
                json.rect.x = firstNode.rect.x + dx;
                json.rect.y = firstNode.rect.y + dy;
            }
            if (json.name === 'lineAlone') {
                _this.addLine({
                    name: _this.data.lineName,
                    from: new Point(json.rect.x, json.rect.y),
                    fromArrow: _this.data.fromArrowType,
                    to: new Point(json.rect.x + json.rect.width, json.rect.y + json.rect.height),
                    toArrow: _this.data.toArrowType,
                    strokeStyle: _this.options.color,
                }, true);
            }
            else {
                var node = new Node(json);
                node.setTID(_this.id);
                node.clearChildrenIds();
                _this.addNode(node, true);
                if (node.name === 'div') {
                    _this.dispatch('LT:addDiv', node);
                }
            }
        });
        this.divLayer.canvas.focus();
    };
    Topology.prototype.getTouchOffset = function (touch) {
        var currentTarget = this.parentElem;
        var x = 0;
        var y = 0;
        while (currentTarget) {
            x += currentTarget.offsetLeft;
            y += currentTarget.offsetTop;
            currentTarget = currentTarget.offsetParent;
        }
        return { offsetX: touch.pageX - x, offsetY: touch.pageY - y };
    };
    Topology.prototype.ontouched = function (event) {
        if (!this.touchedNode) {
            return;
        }
        var pos = this.getTouchOffset(event.changedTouches[0]);
        this.touchedNode.rect.x = pos.offsetX - this.touchedNode.rect.width / 2;
        this.touchedNode.rect.y = pos.offsetY - this.touchedNode.rect.height / 2;
        var node = new Node(this.touchedNode);
        node.setTID(this.id);
        node.clearChildrenIds();
        this.addNode(node, true);
        this.touchedNode = undefined;
    };
    Topology.prototype.addNode = function (node, focus) {
        if (focus === void 0) { focus = false; }
        if (this.data.locked || !drawNodeFns[node.name]) {
            return null;
        }
        // if it's not a Node
        if (!node.init) {
            node = new Node(node);
        }
        if (!node.strokeStyle && this.options.color) {
            node.strokeStyle = this.options.color;
        }
        for (var key in node.font) {
            if (!node.font[key]) {
                node.font[key] = this.options.font[key];
            }
        }
        if (this.data.scale !== 1) {
            node.scale(this.data.scale);
        }
        this.data.pens.push(node);
        if (focus) {
            this.activeLayer.setPens([node]);
            this.render();
            this.animate(true);
            this.cache();
            this.dispatch('addNode', node);
        }
        return node;
    };
    Topology.prototype.addLine = function (line, focus) {
        if (focus === void 0) { focus = false; }
        if (this.data.locked) {
            return null;
        }
        if (!line.clone) {
            line = new Line(line);
            line.calcControlPoints(true);
        }
        this.data.pens.push(line);
        if (focus) {
            this.activeLayer.setPens([line]);
            this.render();
            this.animate(true);
            this.cache();
            this.dispatch('addLine', line);
        }
        return line;
    };
    // Render or redraw
    Topology.prototype.render = function (noFocus) {
        if (noFocus === void 0) { noFocus = false; }
        if (noFocus) {
            this.activeLayer.pens = [];
            this.hoverLayer.node = null;
            this.hoverLayer.line = null;
        }
        if (this.rendering) {
            return this;
        }
        this.rendering = true;
        this.offscreen.render();
        this.canvas.render();
        this.rendering = false;
    };
    // open - redraw by the data
    Topology.prototype.open = function (data) {
        if (!data) {
            data = { pens: [] };
        }
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }
        this.animateLayer.stop();
        this.lock(data.locked || Lock.None);
        if (data.lineName) {
            this.data.lineName = data.lineName;
        }
        this.data.fromArrowType = data.fromArrowType;
        this.data.toArrowType = data.toArrowType;
        this.data.scale = data.scale || 1;
        Store.set(this.generateStoreKey('LT:scale'), this.data.scale);
        this.dispatch('scale', this.data.scale);
        this.data.bkColor = data.bkColor;
        this.data.bkImage = data.bkImage;
        this.data.pens = [];
        // for old data.
        if (data.nodes) {
            for (var _i = 0, _a = data.nodes; _i < _a.length; _i++) {
                var item = _a[_i];
                this.data.pens.push(new Node(item));
            }
            for (var _b = 0, _c = data.lines; _b < _c.length; _b++) {
                var item = _c[_b];
                this.data.pens.push(new Line(item));
            }
        }
        // end.
        if (data.pens) {
            for (var _d = 0, _e = data.pens; _d < _e.length; _d++) {
                var item = _e[_d];
                if (!item.from) {
                    this.data.pens.push(new Node(item));
                }
                else {
                    this.data.pens.push(new Line(item));
                }
            }
        }
        this.data.websocket = data.websocket;
        this.data.mqttUrl = data.mqttUrl;
        this.data.mqttOptions = data.mqttOptions || { clientId: s8() };
        this.data.mqttTopics = data.mqttTopics;
        this.data.grid = data.grid;
        if (typeof data.data === 'object') {
            this.data.data = JSON.parse(JSON.stringify(data.data));
        }
        else {
            this.data.data = data.data || '';
        }
        this.caches.list = [];
        this.cache();
        this.divLayer.clear();
        this.overflow();
        this.render(true);
        this.parentElem.scrollLeft = 0;
        this.parentElem.scrollTop = 0;
        this.animate(true);
        this.openSocket();
        this.openMqtt();
        this.showGrid();
    };
    Topology.prototype.openSocket = function (url) {
        this.closeSocket();
        if (url || this.data.websocket) {
            this.socket = new Socket(url || this.data.websocket, this.data);
        }
    };
    Topology.prototype.closeSocket = function () {
        if (this.socket) {
            this.socket.close();
        }
    };
    Topology.prototype.openMqtt = function (url, options) {
        this.closeMqtt();
        if (url || this.data.mqttUrl) {
            this.mqtt = new MQTT(url || this.data.mqttUrl, options || this.data.mqttOptions, this.data.mqttTopics, this.data);
        }
    };
    Topology.prototype.closeMqtt = function () {
        if (this.mqtt) {
            this.mqtt.close();
        }
    };
    Topology.prototype.overflow = function () {
        var rect = this.getRect();
        var _a = this.canvas, width = _a.width, height = _a.height;
        if (width < rect.width) {
            width = rect.width;
        }
        if (height < rect.height) {
            height = rect.height;
        }
        this.resize({ width: width, height: height });
        return rect;
    };
    Topology.prototype.setNodeText = function () {
        this.inputObj.text = this.input.value;
        this.input.style.zIndex = '-1';
        this.input.style.left = '-1000px';
        this.input.style.width = '0';
        this.cache();
        this.offscreen.render();
        this.dispatch('setText', this.inputObj);
        this.inputObj = null;
    };
    Topology.prototype.getMoveIn = function (pt) {
        this.lastHoverNode = this.moveIn.hoverNode;
        this.lastHoverLine = this.moveIn.hoverLine;
        this.moveIn.type = MoveInType.None;
        this.moveIn.hoverNode = null;
        this.moveIn.lineControlPoint = null;
        this.moveIn.hoverLine = null;
        this.hoverLayer.hoverAnchorIndex = -1;
        if (!this.data.locked &&
            !(this.activeLayer.pens.length === 1 && this.activeLayer.pens[0].type) &&
            !this.activeLayer.locked() &&
            this.activeLayer.rotateCPs[0] &&
            this.activeLayer.rotateCPs[0].hit(pt, 15)) {
            this.moveIn.type = MoveInType.Rotate;
            var cursor = this.options.rotateCursor;
            this.divLayer.canvas.style.cursor = cursor.includes('/') ? "url(\"" + cursor + "\"), auto" : cursor;
            return;
        }
        if (this.activeLayer.pens.length > 1 && pointInRect(pt, this.activeLayer.sizeCPs)) {
            this.moveIn.type = MoveInType.Nodes;
        }
        if (!this.data.locked && !this.activeLayer.locked() && !this.options.hideSizeCP) {
            if (this.activeLayer.pens.length > 1 ||
                (!this.activeLayer.pens[0].type && !this.activeLayer.pens[0].hideSizeCP)) {
                for (var i = 0; i < this.activeLayer.sizeCPs.length; ++i) {
                    if (this.activeLayer.sizeCPs[i].hit(pt, 10)) {
                        this.moveIn.type = MoveInType.ResizeCP;
                        this.moveIn.activeAnchorIndex = i;
                        this.divLayer.canvas.style.cursor = resizeCursors[i];
                        return;
                    }
                }
            }
        }
        // In active pen.
        if (!this.data.locked) {
            for (var _i = 0, _a = this.activeLayer.pens; _i < _a.length; _i++) {
                var item = _a[_i];
                if (item instanceof Line && !item.locked) {
                    for (var i = 0; i < item.controlPoints.length; ++i) {
                        if (!item.locked && item.controlPoints[i].hit(pt, 10)) {
                            item.controlPoints[i].id = i;
                            this.moveIn.type = MoveInType.LineControlPoint;
                            this.moveIn.lineControlPoint = item.controlPoints[i];
                            this.moveIn.hoverLine = item;
                            this.divLayer.canvas.style.cursor = 'pointer';
                            return;
                        }
                    }
                    if (this.inLine(pt, item)) {
                        return;
                    }
                }
            }
        }
        this.divLayer.canvas.style.cursor = 'default';
        var len = this.data.pens.length;
        for (var i = len - 1; i > -1; --i) {
            if (this.data.pens[i].type === PenType.Node && this.inNode(pt, this.data.pens[i])) {
                return;
            }
            else if (this.data.pens[i].type === PenType.Line && this.inLine(pt, this.data.pens[i])) {
                // 需要优先判断十分在节点锚点上
                // return;
            }
        }
    };
    Topology.prototype.inChildNode = function (pt, children) {
        if (!children) {
            return null;
        }
        for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
            var item = children_1[_i];
            if (item.type === PenType.Line) {
                if (this.inLine(pt, item)) {
                    return item;
                }
                continue;
            }
            var node = this.inChildNode(pt, item.children);
            if (node) {
                return node;
            }
            node = this.inNode(pt, item, true);
            if (node) {
                return node;
            }
        }
        return null;
    };
    Topology.prototype.inNode = function (pt, node, inChild) {
        if (inChild === void 0) { inChild = false; }
        if (this.data.locked === Lock.NoEvent || !node.visible || node.locked === Lock.NoEvent) {
            return null;
        }
        var child = this.inChildNode(pt, node.children);
        if (child) {
            if (this.moveIn.type !== MoveInType.HoverAnchors) {
                if (child.type === PenType.Line) {
                    this.moveIn.activeNode = node;
                    this.moveIn.type = MoveInType.Nodes;
                }
                else if (child.stand) {
                    this.moveIn.activeNode = child;
                    this.moveIn.type = MoveInType.Nodes;
                }
                else {
                    this.moveIn.activeNode = node;
                    this.moveIn.type = MoveInType.Nodes;
                }
            }
            return child;
        }
        if (node.hit(pt)) {
            this.moveIn.hoverNode = node;
            this.moveIn.type = MoveInType.Nodes;
            if (!this.data.locked && !node.locked) {
                this.divLayer.canvas.style.cursor = 'move';
            }
            else {
                this.divLayer.canvas.style.cursor = this.options.hoverCursor;
            }
            // Too small
            if (!this.data.locked &&
                !node.locked &&
                !(this.options.hideAnchor || node.hideAnchor || node.rect.width < 20 || node.rect.height < 20)) {
                for (var j = 0; j < node.rotatedAnchors.length; ++j) {
                    if (node.rotatedAnchors[j].hit(pt, 5)) {
                        if (!this.mouseDown && node.rotatedAnchors[j].mode === AnchorMode.In) {
                            continue;
                        }
                        this.moveIn.type = MoveInType.HoverAnchors;
                        this.moveIn.hoverAnchorIndex = j;
                        this.hoverLayer.hoverAnchorIndex = j;
                        this.divLayer.canvas.style.cursor = 'crosshair';
                        break;
                    }
                }
            }
            if (!inChild) {
                this.moveIn.activeNode = this.moveIn.hoverNode;
            }
            return node;
        }
        if (this.options.hideAnchor || node.hideAnchor || this.data.locked || node.locked) {
            return null;
        }
        if (node.hit(pt, 5)) {
            for (var j = 0; j < node.rotatedAnchors.length; ++j) {
                if (node.rotatedAnchors[j].hit(pt, 5)) {
                    if (!this.mouseDown && node.rotatedAnchors[j].mode === AnchorMode.In) {
                        continue;
                    }
                    this.moveIn.hoverNode = node;
                    this.moveIn.type = MoveInType.HoverAnchors;
                    this.moveIn.hoverAnchorIndex = j;
                    this.hoverLayer.hoverAnchorIndex = j;
                    this.divLayer.canvas.style.cursor = 'crosshair';
                    if (!inChild) {
                        this.moveIn.activeNode = node;
                    }
                    return node;
                }
            }
        }
        return null;
    };
    Topology.prototype.inLine = function (point, line) {
        if (!line.visible) {
            return null;
        }
        if (line.from.hit(point, 5)) {
            this.moveIn.type = MoveInType.LineFrom;
            this.moveIn.hoverLine = line;
            if (this.data.locked || line.locked) {
                this.divLayer.canvas.style.cursor = this.options.hoverCursor;
            }
            else {
                this.divLayer.canvas.style.cursor = 'move';
            }
            return line;
        }
        if (line.to.hit(point, 5)) {
            this.moveIn.type = MoveInType.LineTo;
            this.moveIn.hoverLine = line;
            if (this.data.locked || line.locked) {
                this.divLayer.canvas.style.cursor = this.options.hoverCursor;
            }
            else {
                this.divLayer.canvas.style.cursor = 'move';
            }
            return line;
        }
        if (line.pointIn(point)) {
            this.moveIn.type = MoveInType.LineMove;
            this.moveIn.hoverLine = line;
            this.divLayer.canvas.style.cursor = this.options.hoverCursor;
            if (line.from.id || line.to.id) {
                this.moveIn.type = MoveInType.Line;
            }
            return line;
        }
        return null;
    };
    Topology.prototype.getLineDock = function (point) {
        this.hoverLayer.dockAnchor = null;
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item instanceof Node) {
                if (item.rect.hit(point, 10)) {
                    this.hoverLayer.node = item;
                }
                for (var i = 0; i < item.rotatedAnchors.length; ++i) {
                    if (item.rotatedAnchors[i].mode && item.rotatedAnchors[i].mode !== AnchorMode.In) {
                        continue;
                    }
                    if (item.rotatedAnchors[i].hit(point, 10)) {
                        point.id = item.id;
                        point.anchorIndex = i;
                        point.direction = item.rotatedAnchors[point.anchorIndex].direction;
                        point.x = item.rotatedAnchors[point.anchorIndex].x;
                        point.y = item.rotatedAnchors[point.anchorIndex].y;
                        this.hoverLayer.dockAnchor = item.rotatedAnchors[i];
                        break;
                    }
                }
            }
            else if (item instanceof Line) {
                if (item.id === this.hoverLayer.line.id) {
                    continue;
                }
                if (item.from.hit(point, 10)) {
                    point.x = item.from.x;
                    point.y = item.from.y;
                    this.hoverLayer.dockAnchor = item.from;
                    break;
                }
                if (item.to.hit(point, 10)) {
                    point.x = item.to.x;
                    point.y = item.to.y;
                    this.hoverLayer.dockAnchor = item.to;
                    break;
                }
                if (item.controlPoints) {
                    for (var _b = 0, _c = item.controlPoints; _b < _c.length; _b++) {
                        var cp = _c[_b];
                        if (cp.hit(point, 10)) {
                            point.x = cp.x;
                            point.y = cp.y;
                            this.hoverLayer.dockAnchor = cp;
                            break;
                        }
                    }
                }
            }
            if (this.hoverLayer.dockAnchor) {
                break;
            }
        }
        return point;
    };
    Topology.prototype.getPensInRect = function (rect) {
        if (rect.width < 0) {
            rect.width = -rect.width;
            rect.x = rect.ex;
            rect.ex = rect.x + rect.width;
        }
        if (rect.height < 0) {
            rect.height = -rect.height;
            rect.y = rect.ey;
            rect.ey = rect.y + rect.height;
        }
        this.activeLayer.pens = [];
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.locked === Lock.NoEvent) {
                continue;
            }
            if (item instanceof Node) {
                if (rect.hitByRect(item.rect)) {
                    this.activeLayer.add(item);
                }
            }
            if (item instanceof Line) {
                if (rect.hit(item.from) && rect.hit(item.to)) {
                    this.activeLayer.add(item);
                }
            }
        }
    };
    Topology.prototype.getAngle = function (pt) {
        if (pt.x === this.activeLayer.rect.center.x) {
            return pt.y <= this.activeLayer.rect.center.y ? 0 : 180;
        }
        if (pt.y === this.activeLayer.rect.center.y) {
            return pt.x < this.activeLayer.rect.center.x ? 270 : 90;
        }
        var x = pt.x - this.activeLayer.rect.center.x;
        var y = pt.y - this.activeLayer.rect.center.y;
        var angle = (Math.atan(Math.abs(x / y)) / (2 * Math.PI)) * 360;
        if (x > 0 && y > 0) {
            angle = 180 - angle;
        }
        else if (x < 0 && y > 0) {
            angle += 180;
        }
        else if (x < 0 && y < 0) {
            angle = 360 - angle;
        }
        if (this.activeLayer.pens.length === 1) {
            return angle - this.activeLayer.pens[0].rotate;
        }
        return angle;
    };
    Topology.prototype.showInput = function (item) {
        if (this.data.locked || item.locked || item.hideInput || this.options.hideInput) {
            return;
        }
        this.inputObj = item;
        var textRect = item.getTextRect();
        this.input.value = item.text || '';
        this.input.style.left = textRect.x + 'px';
        this.input.style.top = textRect.y + 'px';
        this.input.style.width = textRect.width + 'px';
        this.input.style.height = textRect.height + 'px';
        this.input.style.zIndex = '1000';
        if (item.rotate / 360) {
            this.input.style.transform = "rotate(" + item.rotate + "deg)";
        }
        else {
            this.input.style.transform = null;
        }
        this.input.focus();
    };
    Topology.prototype.getRect = function (pens) {
        if (!pens) {
            pens = this.data.pens;
        }
        return getRect(pens);
    };
    // Get a dock rect for moving nodes.
    Topology.prototype.getDockPos = function (offsetX, offsetY, noDock) {
        this.hoverLayer.dockLineX = 0;
        this.hoverLayer.dockLineY = 0;
        var offset = {
            x: 0,
            y: 0,
        };
        if (noDock || this.options.disableDockLine) {
            return offset;
        }
        var x = 0;
        var y = 0;
        var disX = dockOffset;
        var disY = dockOffset;
        for (var _i = 0, _a = this.activeLayer.dockWatchers; _i < _a.length; _i++) {
            var activePt = _a[_i];
            for (var _b = 0, _c = this.data.pens; _b < _c.length; _b++) {
                var item = _c[_b];
                if (!(item instanceof Node) || this.activeLayer.has(item) || item.name === 'text') {
                    continue;
                }
                if (!item.dockWatchers) {
                    item.getDockWatchers();
                }
                for (var _d = 0, _e = item.dockWatchers; _d < _e.length; _d++) {
                    var p = _e[_d];
                    x = Math.abs(p.x - activePt.x - offsetX);
                    if (x < disX) {
                        disX = -99999;
                        offset.x = p.x - activePt.x;
                        this.hoverLayer.dockLineX = p.x | 0;
                    }
                    y = Math.abs(p.y - activePt.y - offsetY);
                    if (y < disY) {
                        disY = -99999;
                        offset.y = p.y - activePt.y;
                        this.hoverLayer.dockLineY = p.y | 0;
                    }
                }
            }
        }
        return offset;
    };
    Topology.prototype.cache = function () {
        if (this.caches.index < this.caches.list.length - 1) {
            this.caches.list.splice(this.caches.index + 1, this.caches.list.length - this.caches.index - 1);
        }
        var data = new TopologyData(this.data);
        this.caches.list.push(data);
        if (this.caches.list.length > this.options.cacheLen) {
            this.caches.list.shift();
        }
        this.caches.index = this.caches.list.length - 1;
    };
    Topology.prototype.cacheReplace = function (pens) {
        if (pens && pens.length) {
            var needPenMap = {};
            for (var i = 0, len = pens.length; i < len; i++) {
                var pen = pens[i];
                var id = pen.id;
                if (pen instanceof Node) {
                    needPenMap[id] = new Node(pen);
                }
                else if (pen instanceof Line) {
                    needPenMap[id] = new Line(pen);
                }
            }
            var cacheListData = this.caches.list[0];
            if (!cacheListData) {
                return;
            }
            for (var i = 0, len = cacheListData.pens.length; i < len; i++) {
                var id = cacheListData.pens[i].id;
                if (needPenMap[id]) {
                    cacheListData.pens[i] = needPenMap[id];
                }
            }
        }
    };
    Topology.prototype.undo = function (noRedo) {
        if (noRedo === void 0) { noRedo = false; }
        if (this.data.locked || this.caches.index < 1) {
            return;
        }
        this.divLayer.clear();
        var data = new TopologyData(this.caches.list[--this.caches.index]);
        this.data.pens.splice(0, this.data.pens.length);
        this.data.pens.push.apply(this.data.pens, data.pens);
        this.render(true);
        this.divLayer.render();
        if (noRedo) {
            this.caches.list.splice(this.caches.index + 1, this.caches.list.length - this.caches.index - 1);
        }
        this.dispatch('undo', this.data);
    };
    Topology.prototype.redo = function () {
        if (this.data.locked || this.caches.index > this.caches.list.length - 2) {
            return;
        }
        this.divLayer.clear();
        var data = new TopologyData(this.caches.list[++this.caches.index]);
        this.data.pens.splice(0, this.data.pens.length);
        this.data.pens.push.apply(this.data.pens, data.pens);
        this.render(true);
        this.divLayer.render();
        this.dispatch('redo', this.data);
    };
    Topology.prototype.toImage = function (type, quality, callback, padding, thumbnail) {
        if (thumbnail === void 0) { thumbnail = true; }
        var rect = new Rect(0, 0, this.canvas.width, this.canvas.height);
        if (thumbnail) {
            rect = this.getRect();
        }
        if (!padding) {
            padding = {
                left: 10,
                top: 10,
                right: 10,
                bottom: 10,
            };
        }
        rect.x -= padding.left;
        rect.y -= padding.top;
        rect.width += padding.left + padding.right;
        rect.height += padding.top + padding.bottom;
        rect.round();
        var srcRect = rect.clone();
        srcRect.scale(this.offscreen.getDpiRatio(), new Point(0, 0));
        srcRect.round();
        var canvas = document.createElement('canvas');
        canvas.width = srcRect.width;
        canvas.height = srcRect.height;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        var ctx = canvas.getContext('2d');
        if (type && type !== 'image/png') {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(this.canvas.canvas, srcRect.x, srcRect.y, srcRect.width, srcRect.height, 0, 0, srcRect.width, srcRect.height);
        if (callback) {
            canvas.toBlob(callback);
            return '';
        }
        return canvas.toDataURL(type, quality);
    };
    Topology.prototype.saveAsImage = function (name, type, quality, padding, thumbnail) {
        if (thumbnail === void 0) { thumbnail = true; }
        var a = document.createElement('a');
        a.setAttribute('download', name || 'le5le.topology.png');
        a.setAttribute('href', this.toImage(type, quality, null, padding, thumbnail));
        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', true, true);
        a.dispatchEvent(evt);
    };
    Topology.prototype.delete = function (force) {
        var pens = [];
        for (var i = 0; i < this.activeLayer.pens.length; i++) {
            var pen = this.activeLayer.pens[i];
            if (!force && pen.locked) {
                continue;
            }
            var found = this.findIndex(pen);
            if (found > -1) {
                if (this.data.pens[found].type === PenType.Node) {
                    this.divLayer.removeDiv(this.data.pens[found]);
                }
                if (this.options.disableEmptyLine) {
                    this.delEmptyLines(pen.id);
                }
                pens.push.apply(pens, this.data.pens.splice(found, 1));
                --i;
            }
            this.animateLayer.pens.delete(pen.id);
        }
        if (!pens.length) {
            return;
        }
        this.render(true);
        this.cache();
        this.dispatch('delete', pens);
    };
    Topology.prototype.delEmptyLines = function (deleteedId) {
        for (var i = 0; i < this.data.pens.length; i++) {
            if (this.data.pens[i].type !== PenType.Line) {
                continue;
            }
            var line = this.data.pens[i];
            if (!line.from.id || !line.to.id || line.from.id === deleteedId || line.to.id === deleteedId) {
                this.data.pens.splice(i, 1);
                this.animateLayer.pens.delete(line.id);
                --i;
            }
        }
    };
    Topology.prototype.removeNode = function (node) {
        var i = this.findIndex(node);
        if (i > -1) {
            this.divLayer.removeDiv(this.data.pens[i]);
            var nodes = this.data.pens.splice(i, 1);
            this.dispatch('delete', nodes);
        }
        this.render(true);
        this.cache();
    };
    Topology.prototype.removeLine = function (line) {
        var i = this.findIndex(line);
        if (i > -1) {
            var lines = this.data.pens.splice(i, 1);
            this.dispatch('delete', lines);
        }
        this.render(true);
        this.cache();
    };
    Topology.prototype.cut = function () {
        if (this.data.locked) {
            return;
        }
        this.clipboard = new TopologyData({
            pens: [],
        });
        for (var i = 0; i < this.activeLayer.pens.length; i++) {
            var pen = this.activeLayer.pens[i];
            this.clipboard.pens.push(pen.clone());
            var found = this.findIndex(pen);
            if (found > -1) {
                if (pen.type === PenType.Node) {
                    this.divLayer.removeDiv(this.data.pens[found]);
                }
                this.data.pens.splice(found, 1);
                --i;
            }
        }
        this.cache();
        this.activeLayer.clear();
        this.hoverLayer.node = null;
        this.moveIn.hoverLine = null;
        this.moveIn.hoverNode = null;
        this.render();
        this.dispatch('delete', this.clipboard.pens);
    };
    Topology.prototype.copy = function () {
        this.clipboard = new TopologyData({
            pens: [],
        });
        for (var _i = 0, _a = this.activeLayer.pens; _i < _a.length; _i++) {
            var pen = _a[_i];
            this.clipboard.pens.push(pen.clone());
        }
        this.dispatch('copy', this.clipboard);
    };
    Topology.prototype.paste = function () {
        if (!this.clipboard || this.data.locked) {
            return;
        }
        this.hoverLayer.node = null;
        this.hoverLayer.line = null;
        this.activeLayer.pens = [];
        var idMaps = {};
        for (var _i = 0, _a = this.clipboard.pens; _i < _a.length; _i++) {
            var pen = _a[_i];
            if (pen.type === PenType.Node) {
                this.newId(pen, idMaps);
                pen.rect.x += 20;
                pen.rect.ex += 20;
                pen.rect.y += 20;
                pen.rect.ey += 20;
                pen.init();
            }
            if (pen instanceof Line) {
                pen.id = s8();
                pen.from = new Point(pen.from.x + 20, pen.from.y + 20, pen.from.direction, pen.from.anchorIndex, idMaps[pen.from.id]);
                pen.to = new Point(pen.to.x + 20, pen.to.y + 20, pen.to.direction, pen.to.anchorIndex, idMaps[pen.to.id]);
                var controlPoints = [];
                for (var _b = 0, _c = pen.controlPoints; _b < _c.length; _b++) {
                    var pt = _c[_b];
                    controlPoints.push(new Point(pt.x + 20, pt.y + 20));
                }
                pen.controlPoints = controlPoints;
            }
            this.data.pens.push(pen);
            this.activeLayer.add(pen);
        }
        this.render();
        this.animate(true);
        this.cache();
        this.copy();
        if (this.clipboard.pens.length > 1) {
            this.dispatch('multi', {
                pens: this.clipboard.pens,
            });
        }
        else if (this.activeLayer.pens.length > 0) {
            if (this.activeLayer.pens[0].type === PenType.Node) {
                this.dispatch('addNode', this.activeLayer.pens[0]);
            }
            else if (this.activeLayer.pens[0].type === PenType.Line) {
                this.dispatch('addLine', this.activeLayer.pens[0]);
            }
        }
    };
    Topology.prototype.newId = function (node, idMaps) {
        var old = node.id;
        node.id = s8();
        idMaps[old] = node.id;
        if (node.children) {
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var item = _a[_i];
                this.newId(item, idMaps);
            }
        }
    };
    Topology.prototype.animate = function (autoplay) {
        if (autoplay === void 0) { autoplay = false; }
        this.animateLayer.readyPlay(null, autoplay);
        this.animateLayer.animate();
    };
    Topology.prototype.updateProps = function (cache, pens) {
        if (cache === void 0) { cache = true; }
        if (!pens) {
            pens = this.activeLayer.pens;
        }
        for (var _i = 0, pens_1 = pens; _i < pens_1.length; _i++) {
            var pen = pens_1[_i];
            if (pen instanceof Node) {
                pen.init();
                pen.initRect();
            }
        }
        this.activeLayer.updateLines(pens);
        this.activeLayer.calcControlPoints();
        this.activeLayer.saveNodeRects();
        this.render();
        // tslint:disable-next-line: no-unused-expression
        cache && this.cache();
    };
    Topology.prototype.lock = function (lock) {
        this.data.locked = lock;
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            item.addToDiv && item.addToDiv();
        }
        this.dispatch('locked', this.data.locked);
    };
    Topology.prototype.lockPens = function (pens, lock) {
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            for (var _b = 0, pens_2 = pens; _b < pens_2.length; _b++) {
                var pen = pens_2[_b];
                if (item.id === pen.id) {
                    item.locked = lock;
                    item.addToDiv && item.addToDiv();
                    break;
                }
            }
        }
        this.dispatch('lockPens', {
            pens: pens,
            lock: lock,
        });
    };
    Topology.prototype.up = function (pen) {
        var i = this.findIndex(pen);
        if (i > -1 && i !== this.data.pens.length - 1) {
            this.data.pens.splice(i + 2, 0, this.data.pens[i]);
            this.data.pens.splice(i, 1);
        }
    };
    Topology.prototype.top = function (pen) {
        var i = this.findIndex(pen);
        if (i > -1) {
            this.data.pens.push(this.data.pens[i]);
            this.data.pens.splice(i, 1);
        }
    };
    Topology.prototype.down = function (pen) {
        var i = this.findIndex(pen);
        if (i > -1 && i !== 0) {
            this.data.pens.splice(i - 1, 0, this.data.pens[i]);
            this.data.pens.splice(i + 1, 1);
        }
    };
    Topology.prototype.bottom = function (pen) {
        var i = this.findIndex(pen);
        if (i > -1) {
            this.data.pens.unshift(this.data.pens[i]);
            this.data.pens.splice(i + 1, 1);
        }
    };
    Topology.prototype.combine = function (pens, stand) {
        if (stand === void 0) { stand = false; }
        if (!pens) {
            pens = this.activeLayer.pens;
        }
        var rect = this.getRect(pens);
        for (var _i = 0, pens_3 = pens; _i < pens_3.length; _i++) {
            var item = pens_3[_i];
            var i = this.findIndex(item);
            if (i > -1) {
                this.data.pens.splice(i, 1);
            }
        }
        var node = new Node({
            name: 'combine',
            rect: new Rect(rect.x, rect.y, rect.width, rect.height),
            text: '',
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 0,
            paddingBottom: 0,
            strokeStyle: 'transparent',
            children: [],
        });
        for (var i = 0; i < pens.length; ++i) {
            if (pens[i].type === PenType.Node && rect.width === pens[i].rect.width && rect.height === pens[i].rect.height) {
                node = pens[i];
                if (!node.children) {
                    node.children = [];
                }
                pens.splice(i, 1);
                break;
            }
        }
        for (var _a = 0, pens_4 = pens; _a < pens_4.length; _a++) {
            var item = pens_4[_a];
            item.stand = stand;
            item.parentId = node.id;
            item.calcRectInParent(node);
            node.children.push(item);
        }
        this.data.pens.push(node);
        this.activeLayer.setPens([node]);
        this.dispatch('node', node);
        this.cache();
    };
    Topology.prototype.uncombine = function (node) {
        if (!node) {
            node = this.activeLayer.pens[0];
        }
        if (!(node instanceof Node)) {
            return;
        }
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var item = _a[_i];
            item.parentId = undefined;
            item.rectInParent = undefined;
            item.locked = Lock.None;
            this.data.pens.push(item);
        }
        var i = this.findIndex(node);
        if (i > -1 && node.name === 'combine') {
            this.data.pens.splice(i, 1);
        }
        else {
            node.children = null;
        }
        this.cache();
        this.activeLayer.clear();
        this.hoverLayer.clear();
    };
    Topology.prototype.find = function (idOrTag, pens) {
        var _this = this;
        if (!pens) {
            pens = this.data.pens;
        }
        var result = [];
        pens.forEach(function (item) {
            if (item.id === idOrTag || item.tags.indexOf(idOrTag) > -1) {
                result.push(item);
            }
            if (item.children) {
                result.push.apply(result, _this.find(idOrTag, item.children));
            }
        });
        if (result.length === 1) {
            return result[0];
        }
        return result;
    };
    Topology.prototype.findIndex = function (pen) {
        for (var i = 0; i < this.data.pens.length; ++i) {
            if (pen.id === this.data.pens[i].id) {
                return i;
            }
        }
        return -1;
    };
    Topology.prototype.translate = function (x, y, process) {
        if (!process) {
            this.lastTranlated.x = 0;
            this.lastTranlated.y = 0;
        }
        var offsetX = x - this.lastTranlated.x;
        var offsetY = y - this.lastTranlated.y;
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            item.translate(offsetX, offsetY);
        }
        this.animateLayer.pens.forEach(function (pen) {
            if (pen instanceof Line) {
                pen.translate(offsetX, offsetY);
            }
        });
        this.lastTranlated.x = x;
        this.lastTranlated.y = y;
        this.render();
        this.cache();
        this.dispatch('translate', { x: x, y: y });
    };
    // scale for scaled canvas:
    //   > 1, expand
    //   < 1, reduce
    Topology.prototype.scale = function (scale, center) {
        if (this.data.scale * scale < this.options.minScale || this.data.scale * scale > this.options.maxScale) {
            return;
        }
        this.data.scale *= scale;
        !center && (center = this.getRect().center);
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            item.scale(scale, center);
        }
        this.animateLayer.pens.forEach(function (pen) {
            if (pen instanceof Line) {
                pen.scale(scale, center);
            }
        });
        Store.set(this.generateStoreKey('LT:scale'), this.data.scale);
        this.render();
        var rect = this.overflow();
        var x = 0;
        var y = 0;
        if (rect.x < 0) {
            x = -rect.x + this.options.autoExpandDistance / 2;
        }
        if (rect.ex > this.canvas.width) {
            x = this.canvas.width - rect.ex - this.options.autoExpandDistance / 2;
        }
        if (rect.y < 0) {
            y = -rect.y + this.options.autoExpandDistance / 2;
        }
        if (rect.ey > this.canvas.height) {
            y = this.canvas.height - rect.ey - this.options.autoExpandDistance / 2;
        }
        this.translate(x, y);
        this.cache();
        this.dispatch('scale', this.data.scale);
    };
    // scale for origin canvas:
    Topology.prototype.scaleTo = function (scale) {
        this.scale(scale / this.data.scale);
        this.data.scale = scale;
    };
    Topology.prototype.round = function () {
        for (var _i = 0, _a = this.data.pens; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item instanceof Node) {
                item.round();
            }
        }
    };
    Topology.prototype.generateStoreKey = function (key) {
        return this.id + "-" + key;
    };
    Topology.prototype.createMarkdownTip = function () {
        this.tipMarkdown = document.createElement('div');
        this.tipMarkdown.style.position = 'fixed';
        this.tipMarkdown.style.zIndex = '-1';
        this.tipMarkdown.style.left = '-9999px';
        this.tipMarkdown.style.width = '260px';
        this.tipMarkdown.style.outline = 'none';
        this.tipMarkdown.style.border = '1px solid #333';
        this.tipMarkdown.style.backgroundColor = 'rgba(0,0,0,.7)';
        this.tipMarkdown.style.color = '#fff';
        this.tipMarkdown.style.padding = '10px 15px';
        this.tipMarkdown.style.overflowY = 'auto';
        this.tipMarkdown.style.minHeight = '30px';
        this.tipMarkdown.style.maxHeight = '260px';
        document.body.appendChild(this.tipMarkdown);
    };
    Topology.prototype.showTip = function (data, pos) {
        if (!this.data.locked || !data || (!data.markdown && !data.tipId && !data.title) || data.id === this.tip) {
            return;
        }
        if (data.title) {
            this.divLayer.canvas.title = data.title;
            this.tip = data.id;
            return;
        }
        if (data.tipId) {
            this.tipElem = document.getElementById(data.tipId);
        }
        var elem = this.tipElem;
        if (data.markdown) {
            elem = this.tipMarkdown;
            var marked = window.marked;
            if (marked) {
                this.tipMarkdown.innerHTML = marked(data.markdown);
            }
            else {
                this.tipMarkdown.innerHTML = data.markdown;
            }
            var a = this.tipMarkdown.getElementsByTagName('A');
            for (var i = 0; i < a.length; ++i) {
                a[i].setAttribute('target', '_blank');
            }
        }
        var parentRect = this.parentElem.getBoundingClientRect();
        var elemRect = elem.getBoundingClientRect();
        var x = parentRect.left + data.rect.x;
        var y = pos.y + parentRect.top;
        if (data instanceof Node) {
            // x = parentRect.left + (data as Node).rect.center.x - elemRect.width / 2;
            y = parentRect.top + data.rect.ey;
        }
        x -= this.parentElem.scrollLeft;
        y -= this.parentElem.scrollTop;
        if (x < 0) {
            x = 0;
        }
        if (x + elemRect.width > document.body.clientWidth) {
            x = document.body.clientWidth - elemRect.width;
        }
        if (y + elemRect.height > document.body.clientHeight) {
            y = document.body.clientHeight - elemRect.height;
        }
        elem.style.position = 'fixed';
        elem.style.left = x + 'px';
        elem.style.top = y + 'px';
        elem.style.zIndex = '100';
        this.tip = data.id;
        this.dispatch('tip', elem);
    };
    Topology.prototype.hideTip = function () {
        if (!this.tip) {
            return;
        }
        this.tipMarkdown.style.left = '-9999px';
        this.tipMarkdown.style.zIndex = '-1';
        if (this.tipElem) {
            this.tipElem.style.left = '-9999px';
            this.tipElem.style.zIndex = '-1';
            this.tipElem = null;
        }
        this.divLayer.canvas.title = '';
        this.tip = '';
    };
    Topology.prototype.scroll = function (x, y) {
        var _this = this;
        if (this.scrolling) {
            return;
        }
        this.scrolling = true;
        this.parentElem.scrollLeft += x;
        this.parentElem.scrollTop += y;
        setTimeout(function () {
            _this.scrolling = false;
        }, 700);
    };
    Topology.prototype.toComponent = function (pens) {
        if (!pens) {
            pens = this.data.pens;
        }
        var rect = this.getRect(pens);
        var node = new Node({
            name: 'combine',
            rect: new Rect(rect.x, rect.y, rect.width, rect.height),
            text: '',
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 0,
            paddingBottom: 0,
            strokeStyle: 'transparent',
            children: [],
        });
        for (var _i = 0, pens_5 = pens; _i < pens_5.length; _i++) {
            var item = pens_5[_i];
            if (item.type === PenType.Node && rect.width === item.rect.width && rect.height === item.rect.height) {
                node = item;
                if (!node.children) {
                    node.children = [];
                }
                break;
            }
        }
        for (var _a = 0, pens_6 = pens; _a < pens_6.length; _a++) {
            var item = pens_6[_a];
            if (item !== node) {
                item.parentId = node.id;
                item.calcRectInParent(node);
                node.children.push(item);
            }
        }
        return node;
    };
    Topology.prototype.clearBkImg = function () {
        this.canvas.clearBkImg();
    };
    Topology.prototype.dispatch = function (event, data) {
        if (this.options.on) {
            this.options.on(event, data);
        }
    };
    Topology.prototype.getValue = function (idOrTag, attr) {
        if (attr === void 0) { attr = 'text'; }
        var pen;
        this.data.pens.forEach(function (item) {
            if (item.id === idOrTag || item.tags.indexOf(idOrTag) > -1) {
                pen = item;
                return;
            }
        });
        return pen[attr];
    };
    Topology.prototype.setValue = function (idOrTag, val, attr) {
        if (attr === void 0) { attr = 'text'; }
        var pen;
        this.data.pens.forEach(function (item) {
            if (item.id === idOrTag || item.tags.indexOf(idOrTag) > -1) {
                pen = item;
                return;
            }
        });
        pen[attr] = val;
    };
    Topology.prototype.createGrid = function () {
        this.gridElem.style.position = 'absolute';
        this.gridElem.style.display = 'none';
        this.gridElem.style.left = '0';
        this.gridElem.style.top = '0';
        this.gridElem.innerHTML = "<svg class=\"svg-grid\" width=\"100%\" height=\"100%\" style=\"position:absolute;left:0;right:0;top:0;bottom:0\"\n      xmlns=\"http://www.w3.org/2000/svg\">\n      <defs>\n        <pattern id=\"grid\" width=\"10\" height=\"10\" patternUnits=\"userSpaceOnUse\">\n          <path d=\"M 10 0 L 0 0 0 10\" fill=\"none\" stroke=\"#f3f3f3\" stroke-width=\"1\" />\n        </pattern>\n      </defs>\n      <rect width=\"100%\" height=\"100%\" fill=\"url(#grid)\" />\n    </svg>";
        this.parentElem.appendChild(this.gridElem);
    };
    Topology.prototype.showGrid = function (show) {
        if (show === undefined) {
            show = this.data.grid;
        }
        this.gridElem.style.width = this.canvas.width + 'px';
        this.gridElem.style.height = this.canvas.height + 'px';
        this.gridElem.style.display = show ? 'block' : 'none';
    };
    Topology.prototype.setLineName = function (name, render) {
        if (render === void 0) { render = true; }
        this.data.pens.forEach(function (pen) {
            if (pen.type) {
                pen.name = name;
                pen.calcControlPoints();
            }
        });
        render && this.render();
    };
    Topology.prototype.destroy = function () {
        this.subcribe.unsubscribe();
        this.subcribeRender.unsubscribe();
        this.subcribeImage.unsubscribe();
        this.subcribeAnimateEnd.unsubscribe();
        this.subcribeAnimateMoved.unsubscribe();
        this.subcribeMediaEnd.unsubscribe();
        this.animateLayer.destroy();
        this.divLayer.destroy();
        document.body.removeChild(this.tipMarkdown);
        window.removeEventListener('resize', this.winResize);
        this.closeSocket();
        window.topology = null;
    };
    return Topology;
}());
export { Topology };
//# sourceMappingURL=core.js.map