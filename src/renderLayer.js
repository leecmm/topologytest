var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { Store } from 'le5le-store';
import { Canvas } from './canvas';
var RenderLayer = /** @class */ (function (_super) {
    __extends(RenderLayer, _super);
    function RenderLayer(parentElem, options, TID) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, parentElem, options, TID) || this;
        _this.parentElem = parentElem;
        _this.options = options;
        _this.render = function () {
            if (_this.data.bkImage && !_this.bkImgRect) {
                _this.loadBkImg(_this.render);
                return;
            }
            if (!_this.width || !_this.height || !_this.offscreen) {
                return;
            }
            var ctx = _this.canvas.getContext('2d');
            ctx.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
            if (_this.data.bkColor) {
                ctx.fillStyle = _this.data.bkColor;
                ctx.fillRect(0, 0, _this.width, _this.height);
            }
            if (_this.bkImg && _this.bkImgRect) {
                // ctx.drawImage(this.bkImg, this.bkImgRect.x, this.bkImgRect.y, this.bkImgRect.width,
                //   this.bkImgRect.height, 0, 0, this.width, this.height);
                ctx.drawImage(_this.bkImg, 0, 0, _this.width, _this.height);
            }
            ctx.drawImage(_this.offscreen, 0, 0, _this.width, _this.height);
        };
        _this.offscreen = Store.get(_this.generateStoreKey('LT:offscreen'));
        _this.parentElem.appendChild(_this.canvas);
        return _this;
    }
    RenderLayer.prototype.loadBkImg = function (cb) {
        var _this = this;
        if (!this.data.bkImage) {
            return;
        }
        this.bkImg = new Image();
        this.bkImg.crossOrigin = 'anonymous';
        this.bkImg.src = this.data.bkImage;
        this.bkImg.onload = function () {
            _this.bkImgRect = _this.coverRect(_this.canvas.width, _this.canvas.height, _this.bkImg.width, _this.bkImg.height);
            if (cb) {
                cb();
            }
        };
    };
    RenderLayer.prototype.clearBkImg = function () {
        this.bkImgRect = null;
    };
    RenderLayer.prototype.coverRect = function (canvasWidth, canvasHeight, imgWidth, imgHeight) {
        var x = 0;
        var y = 0;
        var width = imgWidth;
        var height = imgHeight;
        if (imgWidth > imgHeight || (imgWidth === imgHeight && canvasWidth < canvasHeight)) {
            width = canvasWidth * height / canvasHeight;
            x = (imgWidth - width) / 2;
        }
        else if (imgWidth < imgHeight || (imgWidth === imgHeight && canvasWidth > canvasHeight)) {
            height = canvasHeight * width / canvasWidth;
            y = (imgHeight - height) / 2;
        }
        return {
            x: x,
            y: y,
            width: width,
            height: height
        };
    };
    return RenderLayer;
}(Canvas));
export { RenderLayer };
//# sourceMappingURL=renderLayer.js.map