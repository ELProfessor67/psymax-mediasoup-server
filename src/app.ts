import express,{Request,Response} from 'express';
import { config } from 'dotenv';
import http from 'http';
import socketService from './services/socket.js';
import RoomRouter from './routers/room.js'




config({path: '.env'});
const app = express();
app.use(RoomRouter);
app.get('/', (req:Request,res:Response) => {
    res.send('Server is Working fine.')
})




const httpSever = http.createServer(app);


//init socket
socketService.io.attach(httpSever);


//init mediasoup listners
socketService.initMediasoupListners();


export default httpSever;