import ConsumerService from "./services/subprocess/consumer.js";
import ProducerService from "./services/subprocess/producers.js";
import TransportService from "./services/subprocess/transport.js";

export const rooms = new Map(); // { roomName1: { Router, rooms: [ sicketId1, ... ] }, ...}
export const consumer = new Map();
export const peers = new Map(); // { socketId1: { roomName1, socket, transports = [id1, id2,] }, producers = [id1, id2,] }, consumers = [id1, id2,], peerDetails }, ...}
export let transportsContainer = new TransportService(); // [ { socketId1, roomName1, transport, consumer }, ... ]
export const producersContainer = new ProducerService(); // [ { socketId1, roomName1, producer, }, ... ]
export let consumerContainer = new ConsumerService();