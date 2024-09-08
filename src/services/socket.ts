import { Server } from "socket.io";
import mediasoupService from "./mediasoup.js";
import { CONNECT_TRANSPORT, CONSUME, CONSUME_RESUME, CREATE_WEBRTC_TRANSPORT, DISCONNECT, GET_PRODUCERS, JOIN_ROOM, MUTE_UNMUTE, NEW_PARTCIPANT_JOIN, NEW_PRODUCER, PARTICIPANTS_DISCONNECT, PRODUCE_TRANSPORT, TRANSPORT_RECV_CONNECT } from "../constant/events.js";
import { consumerContainer, peers, producersContainer, rooms, transportsContainer } from "../glabalVariable.js";
import * as mediasoup from 'mediasoup';
import RoomsService from "./Rooms.js";
import PeerService from "./Peer.js";
import { Transport } from "./subprocess/transport.js";
import { Producer } from "./subprocess/producers.js";
import { Router } from "mediasoup/node/lib/types.js";
import { Consumer } from "./subprocess/consumer.js";

class SocketService {
    private _io: Server;
    private mediasoupConnection;

    constructor() {
        console.log('Init Socker Services');
        this._io = new Server({
            cors: {
                allowedHeaders: ['*'],
                origin: '*'
            }
        });
        this.mediasoupConnection = this._io.of('/mediasoup');
    }

    get io() {
        return this._io;
    }

    initMediasoupListners() {
        console.log('init Mediasoup Services');
        const connection = this.mediasoupConnection;
        connection.on('connection', (socket) => {
            console.log('user connect ', socket.id);
            socket.on(JOIN_ROOM, async ({ room_id, username,isMicMute,isWebCamMute }, callback) => {
                socket.join(room_id);
                const router = await this.createRoom(room_id, socket.id);
                const isAdmin = rooms.get(room_id) ? false : true;
                const newPeer: PeerService = new PeerService(socket.id, isAdmin, username, room_id,isWebCamMute,isMicMute);
                peers.set(socket.id, newPeer);
                const rtpCapabilities: mediasoup.types.rtpCapabilities = router.rtpCapabilities;


                const participants: PeerService[] = [];
                peers.forEach((peer: PeerService) => {
                    if (peer.room_id == room_id && peer.socketId != socket.id) {
                        participants.push(peer);
                    }
                })

                callback(socket.id, rtpCapabilities, participants);
                // connection.to(room_id).emit(NEW_PARTCIPANT_JOIN, { username, socketId: socket.id,isMicMute,isWebCamMute });
                socket.to(room_id).emit(NEW_PARTCIPANT_JOIN, { username, socketId: socket.id,isMicMute,isWebCamMute });
            });


            socket.on(DISCONNECT, () => {
                const room_id = peers.get(socket.id)?.room_id;
                peers.delete(socket.id);

                transportsContainer.remove(socket.id);
                producersContainer.remove(socket.id);
                consumerContainer.remove(socket.id)

                const roomRef: RoomsService = rooms.get(room_id);
                if (roomRef?.participants) {
                    roomRef.participants = roomRef.participants.filter(socketId => socketId != socket.id);
                }
                rooms.set(room_id, roomRef);
                connection.to(room_id).emit(PARTICIPANTS_DISCONNECT, { socketId: socket.id });
            });



            socket.on(CREATE_WEBRTC_TRANSPORT, ({ consumer }, callback) => {
                const room_id = peers.get(socket.id).room_id;
                const roomRef: RoomsService = rooms.get(room_id);

                roomRef.createWebRtcTransport().then(transport => {
                    callback({
                        params: {
                            id: transport.id,
                            iceParameters: transport.iceParameters,
                            iceCandidates: transport.iceCandidates,
                            dtlsParameters: transport.dtlsParameters,
                        }
                    });

                    this.addTransport(transport, room_id, consumer, socket.id);
                    

                }).catch((error: Error) => {
                    callback({
                        params: {
                            error: error.message
                        }
                    })
                    console.log('error white creating webrtc transport', error.message);
                })

            })


            socket.on(CONNECT_TRANSPORT, async ({ dtlsParameters }) => {
                await transportsContainer.getTranport(socket.id).connect({ dtlsParameters });
            });


            socket.on(PRODUCE_TRANSPORT, async ({ kind, rtpParameters, appData }, callback) => {

                const producer = await transportsContainer.getTranport(socket.id).produce({
                    kind,
                    rtpParameters,
                })



                // add producer to the producers array
                const room_id = peers.get(socket.id).room_id;

                this.addProducer(producer, room_id, socket.id)



                console.log('Producer ID: ', producer.id, producer.kind)
                socket.to(room_id).emit(NEW_PRODUCER,{producerId: producer.id,socketId: socket.id})

                producer.on('transportclose', () => {
                    console.log('transport for this producer closed ')
                    producer.close()
                })

                // Send back to the client the Producer's id

                callback({
                    id: producer.id,
                    producersExist: producersContainer.getAllProducer(room_id, socket.id).length > 0 ? true : false
                })
            });



            socket.on(GET_PRODUCERS, (callback) => {
                const room_id = peers.get(socket.id).room_id;
                const producerIds = producersContainer.getAllProducer(room_id, socket.id);
                callback(producerIds);
            })



            socket.on(TRANSPORT_RECV_CONNECT, async ({ dtlsParameters, serverConsumerTransportId }) => {
                console.log(`DTLS PARAMS: ${dtlsParameters}`)
                const consumerTransport = transportsContainer.getTransportById(serverConsumerTransportId);
                await consumerTransport.connect({ dtlsParameters });
            })


            socket.on(CONSUME, async ({ rtpCapabilities, remoteProducerId, serverConsumerTransportId }, callback) => {
                try {
                    const room_id: string = peers.get(socket.id).room_id;
                    const router: Router = rooms.get(room_id).router;
                    const consumerTransport = transportsContainer.getTransportById(serverConsumerTransportId);

                    if (router.canConsume({
                        producerId: remoteProducerId,
                        rtpCapabilities
                    })) {
                        // transport can now consume and return a consumer
                        const consumer = await consumerTransport.consume({
                            producerId: remoteProducerId,
                            rtpCapabilities,
                            paused: true,
                        })

                        consumer.on('transportclose', () => {
                            console.log('transport close from consumer')
                        })

                        consumer.on('producerclose', () => {
                            console.log('producer of consumer closed')
                            socket.emit('producer-closed', { remoteProducerId })

                            consumerTransport.close([])

                            transportsContainer.removeByTransportId(consumerTransport.id)
                            consumer.close()
                            consumerContainer.removeByConsumerId(consumer.id)
                        })

                        this.addConsumer(consumer, room_id,socket.id);

                        // from the consumer extract the following params
                        // to send back to the Client
                        const params = {
                            id: consumer.id,
                            producerId: remoteProducerId,
                            kind: consumer.kind,
                            rtpParameters: consumer.rtpParameters,
                            serverConsumerId: consumer.id,
                        }

                        // send the parameters to the client
                        callback({ params })
                    }
                } catch (error: any) {
                    console.log(error.message)
                    callback({
                        params: {
                            error: error
                        }
                    })
                }
            });

            socket.on(CONSUME_RESUME,async ({ serverConsumerId }) => {
               const consumer = consumerContainer.findConsumerId(serverConsumerId);              
               await consumer?.resume();
            })


            socket.on(MUTE_UNMUTE,({value, type, socketId}) => {
                const peer:PeerService = peers.get(socket.id);
                if(type == 'mic'){
                    peer.isMicMute = value;
                }else{
                    peer.isWebCamMute = value;
                }
                peers.set(socketId,peer);
                const room_id = peer.room_id;
                socket.to(room_id).emit(MUTE_UNMUTE,{value,type,socketId});
            })






        })
    }

    private async createRoom(room_id: string, socketId: string): mediasoup.types.router {
        let router: mediasoup.types.router;
        if (rooms.get(room_id)) {
            const roomRef: RoomsService = rooms.get(room_id);
            roomRef.addParticipants(socketId);
            router = roomRef.router;
        } else {
            router = await mediasoupService.getRouter();
            const newRoom = new RoomsService(router, socketId);
            rooms.set(room_id, newRoom)
        }
        return router;
    }




    private addTransport(transport: mediasoup.types.transport, room_id: string, consumer: Boolean, socketId: string) {

        const transportRef: Transport = new Transport(socketId, transport, room_id, consumer);
        transportsContainer.addTransport(transportRef);

        const peerRef: PeerService = peers.get(socketId);
        peerRef.transports = [...peerRef.transports, transport.id]
        peers.set(socketId, peerRef);
    }


    private addProducer(producer: mediasoup.types.Producer, room_id: string, socketId: string) {
        const newProducer: Producer = new Producer(socketId, producer, room_id);
        producersContainer.addProducer(newProducer);

        const peerRef: PeerService = peers.get(socketId);
        peerRef.producers = [...peerRef.producers, producer.id]
        peers.set(socketId, peerRef);
    }

    private addConsumer(consumer: mediasoup.types.Consumer, room_id: string, socketId: string) {
        const newConsumer: Consumer = new Consumer(socketId, consumer, room_id);
        consumerContainer.addConsumer(newConsumer);

        const peerRef: PeerService = peers.get(socketId);
        peerRef.consumers = [...peerRef.consumers, consumer.id]
        peers.set(socketId, peerRef);
    }




}

const socketService = new SocketService();
export default socketService;