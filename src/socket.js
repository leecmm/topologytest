import { EventType } from './models';
var Socket = /** @class */ (function () {
    function Socket(url, data) {
        var _this = this;
        this.url = url;
        this.data = data;
        this.onmessage = function (e) {
            if (!_this.data.pens.length || !e || !e.data) {
                return;
            }
            var msg;
            try {
                msg = JSON.parse(e.data);
            }
            catch (error) {
                msg = e.data;
            }
            for (var _i = 0, _a = _this.data.pens; _i < _a.length; _i++) {
                var item = _a[_i];
                for (var _b = 0, _c = item.events; _b < _c.length; _b++) {
                    var event_1 = _c[_b];
                    if (event_1.type === EventType.WebSocket) {
                        if (event_1.name && event_1.name === msg.event) {
                            item.doSocketMqtt(event_1, msg.data, _this.socket);
                        }
                        else if (!event_1.name && msg) {
                            item.doSocketMqtt(event_1, msg, _this.socket);
                        }
                    }
                }
            }
        };
        this.init();
    }
    Socket.prototype.init = function () {
        var _this = this;
        this.socket = new WebSocket(this.url);
        this.socket.onmessage = this.onmessage;
        this.socket.onclose = function () {
            console.log('Canvas websocket closed and reconneting...');
            _this.init();
        };
    };
    Socket.prototype.close = function () {
        this.socket.onclose = null;
        this.socket.close();
    };
    return Socket;
}());
export { Socket };
//# sourceMappingURL=socket.js.map