import * as express from 'express';
import {Server} from 'socket.io';
import * as Common from '@common';
import * as http from 'http';
import * as Logic from './server';

const expressApp = express();
const server = http.createServer(expressApp);
const io = new Server<Common.ClientToServerEvents, Common.ServerToClientEvents, Common.InterServerEvents, Common.SocketData>(server, {
  cors: {
    origin: /.*/
  }
});

io.on('connection', (client) => {

  console.log(`Connection received :) ${client.id}`);
  client.on('error', (error) => {
    console.log("Error");
    console.log(error);
  });
  client.on('disconnecting', () => {
    console.log("Disconnecting");
  });
  client.on('disconnect', () => {
    console.log("Disconnected");
  });
});

server.listen(3000, () => {
  console.log(`⚡️[server]: Server is running!!`);
});

Logic.default();

export const viteNodeApp = expressApp;
