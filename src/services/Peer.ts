import * as mediasoup from 'mediasoup';

class PeerService {
    public socketId: string;
    public transports: mediasoup.types.transport[] = [];
    public producers: mediasoup.types.producer[] = [];
    public consumers: mediasoup.types.consumer[] = [];
    public username: string;
    public isAdmin: Boolean;
    public room_id: string;
    public isMicMute: Boolean;
    public isWebCamMute: Boolean;

    constructor(socketId:string,isAdmin:Boolean,username:string,room_id:string,isWebCamMute:Boolean=true,isMicMute:Boolean=true){
        this.socketId = socketId;
        this.username = username;
        this.isAdmin = isAdmin;
        this.room_id = room_id;
        this.isMicMute = isMicMute;
        this.isWebCamMute = isWebCamMute;
    }

}

export default PeerService;