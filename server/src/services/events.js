import { EventEmitter } from "node:events";
// Tiny in-process bus that decouples HTTP controllers from the socket layer.
export const events = new EventEmitter();
