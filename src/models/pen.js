import { Store } from 'le5le-store';
import { s8 } from '../utils/uuid';
import { Rect } from './rect';
import { pointInRect } from '../utils/canvas';
import { EventType, EventAction } from './event';
export var PenType;
(function (PenType) {
    PenType[PenType["Node"] = 0] = "Node";
    PenType[PenType["Line"] = 1] = "Line";
})(PenType || (PenType = {}));
var Pen = /** @class */ (function () {
    function Pen(json) {
        this.type = PenType.Node;
        this.rect = new Rect(0, 0, 0, 0);
        this.lineWidth = 1;
        this.rotate = 0;
        this.offsetRotate = 0;
        this.globalAlpha = 1;
        this.dash = 0;
        this.strokeStyle = '';
        this.fillStyle = '';
        this.font = {
            color: '',
            fontFamily: '"Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial',
            fontSize: 12,
            lineHeight: 1.5,
            fontStyle: 'normal',
            fontWeight: 'normal',
            textAlign: 'center',
            textBaseline: 'middle',
            background: ''
        };
        this.animateCycleIndex = 0;
        this.events = [];
        this.eventFns = ['link', 'doAnimate', 'doFn', 'doWindowFn'];
        if (json) {
            this.id = json.id || s8();
            this.name = json.name || '';
            this.value = json.value;
            this.tags = Object.assign([], json.tags);
            if (json.rect) {
                this.rect = new Rect(json.rect.x, json.rect.y, json.rect.width, json.rect.height);
            }
            this.dash = json.dash || 0;
            this.lineDash = json.lineDash;
            this.lineDashOffset = json.lineDashOffset || 0;
            if (json.lineWidth || json.lineWidth === 0) {
                this.lineWidth = json.lineWidth;
            }
            this.strokeStyle = json.strokeStyle || '';
            this.fillStyle = json.fillStyle || '';
            this.lineCap = json.lineCap;
            this.globalAlpha = json.globalAlpha || 1;
            this.rotate = json.rotate || 0;
            this.offsetRotate = json.offsetRotate || 0;
            if (json.font) {
                Object.assign(this.font, json.font);
            }
            this.text = json.text;
            if (json.textMaxLine) {
                this.textMaxLine = +json.textMaxLine || 0;
            }
            this.textOffsetX = json.textOffsetX || 0;
            this.textOffsetY = json.textOffsetY || 0;
            this.shadowColor = json.shadowColor;
            this.shadowBlur = json.shadowBlur;
            this.shadowOffsetX = json.shadowOffsetX;
            this.shadowOffsetY = json.shadowOffsetY;
            this.animateType = json.animateType;
            this.animateCycle = json.animateCycle;
            this.nextAnimate = json.nextAnimate;
            this.animatePlay = json.animatePlay;
            this.locked = json.locked;
            this.stand = json.stand;
            this.hideInput = json.hideInput;
            this.hideRotateCP = json.hideRotateCP;
            this.hideSizeCP = json.hideSizeCP;
            this.hideAnchor = json.hideAnchor;
            this.events = json.events || [];
            this.markdown = json.markdown;
            this.tipId = json.tipId;
            this.title = json.title;
            this.visible = json.visible !== false;
            if (json.rectInParent) {
                this.rectInParent = json.rectInParent;
            }
            if (typeof json.data === 'object') {
                this.data = JSON.parse(JSON.stringify(json.data));
            }
            else {
                this.data = json.data || '';
            }
        }
        else {
            this.id = s8();
            this.textOffsetX = 0;
            this.textOffsetY = 0;
        }
    }
    Pen.prototype.render = function (ctx) {
        if (!this.visible) {
            return;
        }
        if (this.from && !this.to) {
            return;
        }
        ctx.save();
        // for canvas2svg
        if (ctx.setAttrs) {
            ctx.setAttrs(this);
        }
        if (this.rotate || this.offsetRotate) {
            ctx.translate(this.rect.center.x, this.rect.center.y);
            ctx.rotate(((this.rotate + this.offsetRotate) * Math.PI) / 180);
            ctx.translate(-this.rect.center.x, -this.rect.center.y);
        }
        if (this.lineWidth > 1) {
            ctx.lineWidth = this.lineWidth;
        }
        ctx.strokeStyle = this.strokeStyle || '#222';
        this.fillStyle && (ctx.fillStyle = this.fillStyle);
        if (this.lineCap) {
            ctx.lineCap = this.lineCap;
        }
        else if (this.type === PenType.Line) {
            ctx.lineCap = 'round';
        }
        if (this.globalAlpha < 1) {
            ctx.globalAlpha = this.globalAlpha;
        }
        if (this.lineDash) {
            ctx.setLineDash(this.lineDash);
        }
        else {
            switch (this.dash) {
                case 1:
                    ctx.setLineDash([5, 5]);
                    break;
                case 2:
                    ctx.setLineDash([10, 10]);
                    break;
                case 3:
                    ctx.setLineDash([10, 10, 2, 10]);
                    break;
            }
        }
        if (this.lineDashOffset) {
            ctx.lineDashOffset = this.lineDashOffset;
        }
        if (this.shadowColor) {
            ctx.shadowColor = this.shadowColor;
            ctx.shadowOffsetX = this.shadowOffsetX;
            ctx.shadowOffsetY = this.shadowOffsetY;
            ctx.shadowBlur = this.shadowBlur;
        }
        this.draw(ctx);
        ctx.restore();
        if (this.children) {
            for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                var item = _a[_i];
                item.render(ctx);
            }
        }
    };
    Pen.prototype.hit = function (point, padding) {
        if (padding === void 0) { padding = 0; }
        if (this.rotate % 360 === 0) {
            return this.rect.hit(point, padding);
        }
        var pts = this.rect.toPoints();
        for (var _i = 0, pts_1 = pts; _i < pts_1.length; _i++) {
            var pt = pts_1[_i];
            pt.rotate(this.rotate, this.rect.center);
        }
        return pointInRect(point, pts);
    };
    Pen.prototype.click = function () {
        if (!this.events) {
            return;
        }
        for (var _i = 0, _a = this.events; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.type !== EventType.Click) {
                continue;
            }
            this[this.eventFns[item.action]] && this[this.eventFns[item.action]](item.value, item.params);
        }
    };
    Pen.prototype.dblclick = function () {
        if (!this.events) {
            return;
        }
        for (var _i = 0, _a = this.events; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.type !== EventType.DblClick) {
                continue;
            }
            this[this.eventFns[item.action]] && this[this.eventFns[item.action]](item.value, item.params);
        }
    };
    Pen.prototype.doSocketMqtt = function (item, msg, client) {
        if (item.action < EventAction.Function) {
            this[this.eventFns[item.action]](msg.value || msg || item.value, msg.params || item.params, client);
        }
        else if (item.action < EventAction.SetProps) {
            this[this.eventFns[item.action]](item.value, msg || item.params, client);
        }
        else if (item.action === EventAction.SetProps) {
            var props = [];
            var data = msg;
            if (typeof msg === 'string') {
                try {
                    data = JSON.parse(msg);
                }
                catch (error) { }
            }
            if (Array.isArray(data)) {
                props = data;
            }
            for (var _i = 0, props_1 = props; _i < props_1.length; _i++) {
                var prop = props_1[_i];
                if (prop.key) {
                    if (typeof prop.value === 'object') {
                        this[prop.key] = Object.assign(this[prop.key], prop.value);
                    }
                    else {
                        this[prop.key] = prop.value;
                    }
                }
            }
            Store.set(this.generateStoreKey('LT:render'), true);
        }
    };
    Pen.prototype.show = function () {
        this.visible = true;
        return this;
    };
    Pen.prototype.hide = function () {
        this.visible = false;
        return this;
    };
    Pen.prototype.isVisible = function () {
        return this.visible;
    };
    Pen.prototype.getTID = function () {
        return this.TID;
    };
    Pen.prototype.setTID = function (id) {
        this.TID = id;
        return this;
    };
    Pen.prototype.link = function (url, params) {
        window.open(url, params === undefined ? '_blank' : params);
    };
    Pen.prototype.doAnimate = function (tag, params) {
        this.animateStart = Date.now();
        Store.set(this.generateStoreKey('LT:AnimatePlay'), {
            tag: tag,
            pen: this
        });
    };
    Pen.prototype.doFn = function (fn, params, client) {
        var func;
        if (client) {
            func = new Function('pen', 'params', 'client', fn);
        }
        else {
            func = new Function('pen', 'params', fn);
        }
        func(this, params, client);
    };
    Pen.prototype.doWindowFn = function (fn, params, client) {
        window[fn](this, params, client);
    };
    Pen.prototype.generateStoreKey = function (key) {
        return this.TID + "-" + key;
    };
    return Pen;
}());
export { Pen };
//# sourceMappingURL=pen.js.map