import { Node } from '../models/node';
import { Line } from '../models/line';
import { getBezierPoint } from '../middles/lines/curve';
import { Rect } from '../models/rect';
export function getRect(pens) {
    var x1 = 99999;
    var y1 = 99999;
    var x2 = -99999;
    var y2 = -99999;
    var points = [];
    for (var _i = 0, pens_1 = pens; _i < pens_1.length; _i++) {
        var item = pens_1[_i];
        if (item instanceof Node) {
            var pts = item.rect.toPoints();
            if (item.rotate) {
                for (var _a = 0, pts_1 = pts; _a < pts_1.length; _a++) {
                    var pt = pts_1[_a];
                    pt.rotate(item.rotate, item.rect.center);
                }
            }
            points.push.apply(points, pts);
        }
        else if (item instanceof Line) {
            points.push(item.from);
            points.push(item.to);
            if (item.name === 'curve') {
                for (var i = 0.01; i < 1; i += 0.02) {
                    points.push(getBezierPoint(i, item.from, item.controlPoints[0], item.controlPoints[1], item.to));
                }
            }
        }
    }
    for (var _b = 0, points_1 = points; _b < points_1.length; _b++) {
        var item = points_1[_b];
        if (x1 > item.x) {
            x1 = item.x;
        }
        if (y1 > item.y) {
            y1 = item.y;
        }
        if (x2 < item.x) {
            x2 = item.x;
        }
        if (y2 < item.y) {
            y2 = item.y;
        }
    }
    return new Rect(x1, y1, x2 - x1, y2 - y1);
}
