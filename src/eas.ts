import EventEmitter2 from "eventemitter2";
import { VERIFICATION_CREATED_EVENT, VERIFICATION_DELETED_EVENT } from "./constant";
import { Message } from "@farcaster/hub-nodejs";
import { log } from "./log";

export class Eas {
    public emitter: EventEmitter2;

    constructor(emitter: EventEmitter2) {
        this.emitter = emitter;
    }

    static create(emitter: EventEmitter2) {
        return new Eas(emitter);
    }

    async handleEvent() {
        this.emitter.on(VERIFICATION_CREATED_EVENT, (data: Message) => {
            log.info(`${VERIFICATION_CREATED_EVENT} data: ${JSON.stringify(data)}`);
        });

        this.emitter.on(VERIFICATION_DELETED_EVENT, (data: Message) => {
            log.info(`${VERIFICATION_DELETED_EVENT} data: ${JSON.stringify(data)}`);
        });
    }
}
