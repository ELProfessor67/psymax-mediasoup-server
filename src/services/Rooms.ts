import * as mediasoup from 'mediasoup'
import mediasoupService from './mediasoup.js';


class RoomsService {
    public router: mediasoup.types.router;
    public participants: string[] = [];
    constructor(router:mediasoup.types.router,socketId:string){
        this.router = router;
        this.participants = [socketId];
    }


    addParticipants(socketId: string){
        this.participants = [...this.participants,socketId]
    }



    async createWebRtcTransport ():Promise<mediasoup.types.transport | Error> {
        const router = this.router;
        return new Promise(async (resolve, reject) => {
          try {
            
            const webRtcTransport_options = {
              listenIps: [
                {
                  ip: '0.0.0.0', // replace with relevant IP address
                  announcedIp: '127.0.0.1',
                }
              ],
              enableUdp: true,
              enableTcp: true,
              preferUdp: true,
            }
      
           
            let transport:mediasoup.types.transport = await router.createWebRtcTransport(webRtcTransport_options);

            console.log(`transport id: ${transport.id}`)
      
            transport.on('dtlsstatechange', (dtlsState:mediasoup.types.dtlsState) => {
              if (dtlsState === 'closed') {
                transport.close()
              }
            })
      
            transport.on('close', () => {
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