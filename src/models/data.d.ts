import { Pen } from './pen';
import { Lock } from './status';
export declare class TopologyData {
    pens: Pen[];
    lineName: string;
    fromArrowType: string;
    toArrowType: string;
    scale: number;
    locked: Lock;
    bkImage: string;
    bkColor: string;
    grid?: boolean;
    websocket?: string;
    mqttUrl?: string;
    mqttOptions?: {
        clientId?: string;
        username?: string;
        password?: string;
    };
    mqttTopics?: string;
    manualCps?: boolean;
    data?: any;
    constructor(json?: any);
}
