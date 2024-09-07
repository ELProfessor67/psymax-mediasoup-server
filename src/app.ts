import express from 'express';
import { config } from 'dotenv';
import http from 'http';
import socketService from './services/socket.js';

config({path: '.env'});
const app = express();

const httpSever = http.createServer(app);

//init socket
socketService.io.attach(httpSever);

//init mediasoup listners
socketService.initMediasoupListners();


export default httpSever;