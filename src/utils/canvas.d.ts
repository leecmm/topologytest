import { Point } from '../models/point';
import { Pen } from '../models/pen';
import { Node } from '../models/node';
export declare function flatNodes(nodes: Pen[]): Node[];
export declare function getParent(pens: Pen[], child: Node): Node;
export declare function pointInRect(point: Point, vertices: Point[]): boolean;
export declare function pointInLine(point: Point, from: Point, to: Point): boolean;
export declare function lineLen(from: Point, to: Point): number;
export declare function curveLen(from: Point, cp1: Point, cp2: Point, to: Point): number;
