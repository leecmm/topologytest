import { TopologyData } from './models';
export declare class Socket {
    url: string;
    data: TopologyData;
    socket: WebSocket;
    constructor(url: string, data: TopologyData);
    init(): void;
    onmessage: (e: MessageEvent) => void;
    close(): void;
}
