import { Point } from '../models/point';
export function flatNodes(nodes) {
    var result = [];
    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
        var item = nodes_1[_i];
        if (item.type) {
            continue;
        }
        result.push(item);
        if (item.children) {
            result.push.apply(result, flatNodes(item.children));
        }
    }
    return result;
}
export function getParent(pens, child) {
    var parent;
    for (var _i = 0, pens_1 = pens; _i < pens_1.length; _i++) {
        var item = pens_1[_i];
        if (item.type) {
            continue;
        }
        if (!item.children) {
            continue;
        }
        for (var _a = 0, _b = item.children; _a < _b.length; _a++) {
            var subItem = _b[_a];
            if (subItem.id === child.id) {
                return item;
            }
            if (subItem.type) {
                continue;
            }
            if (subItem.children) {
                parent = getParent(subItem.children, child);
                if (parent) {
                    return parent;
                }
            }
        }
    }
    return parent;
}
export function pointInRect(point, vertices) {
    if (vertices.length < 3) {
        return false;
    }
    var isIn = false;
    var last = vertices[vertices.length - 1];
    for (var _i = 0, vertices_1 = vertices; _i < vertices_1.length; _i++) {
        var item = vertices_1[_i];
        if ((item.y < point.y && last.y >= point.y) || (item.y >= point.y && last.y < point.y)) {
            if (item.x + ((point.y - item.y) * (last.x - item.x)) / (last.y - item.y) > point.x) {
                isIn = !isIn;
            }
        }
        last = item;
    }
    return isIn;
}
export function pointInLine(point, from, to) {
    var points = [
        new Point(from.x - 8, from.y - 8),
        new Point(to.x - 8, to.y - 8),
        new Point(to.x + 8, to.y + 8),
        new Point(from.x + 8, from.y + 8)
    ];
    return pointInRect(point, points);
}
export function lineLen(from, to) {
    var len = Math.sqrt(Math.pow(Math.abs(from.x - to.x), 2) + Math.pow(Math.abs(from.y - to.y), 2));
    return len | 0;
}
export function curveLen(from, cp1, cp2, to) {
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', "M" + from.x + " " + from.y + " C" + cp1.x + " " + cp1.y + " " + cp2.x + " " + cp2.y + " " + to.x + " " + to.y);
    return path.getTotalLength() | 0;
}
//# sourceMappingURL=canvas.js.map