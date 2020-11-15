var Layer = /** @class */ (function () {
    function Layer(TID) {
        this.TID = TID;
    }
    Layer.prototype.generateStoreKey = function (key) {
        return this.TID + "-" + key;
    };
    return Layer;
}());
export { Layer };
