import * as mediasoup from 'mediasoup';
import { AppData } from 'mediasoup/node/lib/types.js';

class PeerService {
    public socketId: string;
    public transports: string[] = [];
    public producers: string[] = [];
    public consumers: string[] = [];
    public username: string;
    public isAdmin: boolean;
    public room_id: string;
    public isMicMute: boolean;
    public isWebCamMute: boolean;
    public isShareScreen: boolean;

    constructor(socketId:string,isAdmin:boolean,username:string,room_id:string,isWebCamMute:boolean=true,isMicMute:boolean=true,isShareScreen:boolean=false){
        this.socketId = socketId;
        this.username = username;
        this.isAdmin = isAdmin;
        this.room_id = room_id;
        this.isMicMute = isMicMute;
        this.isWebCamMute = isWebCamMute;
        this.isShareScreen = isShareScreen;
    }

}

export default PeerService;