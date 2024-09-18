import * as mediasoup from 'mediasoup'
import mediasoupService from './mediasoup.js';
import { isErrored } from 'stream';
import { IceParameters } from 'mediasoup/node/lib/fbs/web-rtc-transport.js';
import { DtlsParameters, IceCandidate, WebRtcTransport } from 'mediasoup/node/lib/types.js';
import { Transport } from './subprocess/transport.js';




class RoomsService {
    public router: mediasoup.types.Router;
    public participants: string[] = [];
    constructor(router:mediasoup.types.Router,socketId:string){
        this.router = router;
        this.participants = [socketId];
    }


    addParticipants(socketId: string){
        this.participants = [...this.participants,socketId]
    }



    async createWebRtcTransport ():Promise<WebRtcTransport> {
        const router = this.router;
        return new Promise(async (resolve, reject) => {
          try {
            
            const webRtcTransport_options = {
              listenIps: [
                {
                  ip: '0.0.0.0', // replace with relevant IP address
                  // announcedIp: '127.0.0.1',
                  announcedIp: process.env.PUBLIC_IP,
                  
                }
              ],
              enableUdp: true,
              enableTcp: true,
              preferUdp: true,
            }
      
           
            let transport:WebRtcTransport = await router.createWebRtcTransport(webRtcTransport_options);
            

            console.log(`transport id: ${transport.id}`)
      
            transport.on('dtlsstatechange', (dtlsState:mediasoup.types.DtlsState) => {
              if (dtlsState === 'closed') {
                transport.close()
              }
            })
      
            transport.on('@close', () => {
              console.log('transport closed')
            })
      
            resolve(transport)
      
          } catch (error) {
            reject(error)
          }
        })
    }
}

export default RoomsService;