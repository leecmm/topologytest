export var EventType;
(function (EventType) {
    EventType[EventType["Click"] = 0] = "Click";
    EventType[EventType["DblClick"] = 1] = "DblClick";
    EventType[EventType["WebSocket"] = 2] = "WebSocket";
    EventType[EventType["Mqtt"] = 3] = "Mqtt";
})(EventType || (EventType = {}));
export var EventAction;
(function (EventAction) {
    EventAction[EventAction["Link"] = 0] = "Link";
    EventAction[EventAction["Animate"] = 1] = "Animate";
    EventAction[EventAction["Function"] = 2] = "Function";
    EventAction[EventAction["WindowFn"] = 3] = "WindowFn";
    EventAction[EventAction["SetProps"] = 4] = "SetProps";
})(EventAction || (EventAction = {}));
//# sourceMappingURL=event.js.map