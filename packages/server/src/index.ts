import * as express from 'express';
import {Server, Socket} from 'socket.io';
import * as Common from '@common';
import * as http from 'http';
import * as Logic from './server';
import {ItemOption, State} from '@common';
import * as JsonPatch from 'fast-json-patch';

const expressApp = express();
const server = http.createServer(expressApp);

type SafeSocket = Socket<Common.ClientToServerEvents, Common.ServerToClientEvents, Common.InterServerEvents, Common.SocketData>;

const io = new Server<Common.ClientToServerEvents, Common.ServerToClientEvents, Common.InterServerEvents, Common.SocketData>(server, {
  cors: {
    origin: /.*/
  }
});

interface Room {
  id: string;
  state: State;
  //items: ItemOptions[];
  clients: SafeSocket[];
  version: number;
}

const rooms = new Map<string, Room>();

const DEFAULT_ROOM = 'lobby';

function getRoom(roomId: string = DEFAULT_ROOM): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      state: {
        items: []
      },
      clients: [],
      version: 0
    });
  }

  const room = rooms.get(roomId);
  if (!room) {
    throw new Error(`Could not find room: ${roomId}`);
  }

  return room;
}

const leaveRoom = (room: Room, client: SafeSocket) => {

  // We remove any older clients. We only keep the latest.
  const clientIndex = room.clients.indexOf(client);

  if (clientIndex !== -1) {

    console.log(`User ${client.data.name} left room ${room.id}`);
    room.clients[clientIndex].disconnect(true);
    room.clients.splice(clientIndex, 1);
  }
}

const joinRoom = (room: Room, client: SafeSocket) => {

  if (client.data.room) {
    leaveRoom(getRoom(client.data.room), client);
  }

  client.data = {
    name: client.data.name,
    room: room.id || client.data.room
  };

  console.log(`User ${client.data.name} joined room ${client.data.room}`);

  room.clients.push(client);
}

io.on('connection', (client) => {

  console.log(`Connection received :) ${client.id}`);

  if (!client.data.room) {
    client.data.room = DEFAULT_ROOM;
  }

  for (const room of rooms.values()) {
    leaveRoom(room, client);
  }

  const doChange = (callback: { (room: Room, beforeChange: State, afterChange: State): void }) => {

    const room = getRoom(client.data.room);
    const beforeChange: Common.State = {items: room.state.items.slice()};
    const afterChange: Common.State = {items: room.state.items.slice()};

    callback(room, beforeChange, afterChange);

    const operations = JsonPatch.compare(beforeChange, afterChange, true);
    console.log(`Emitting changes`);
    console.log(operations);

    room.state = afterChange;
    room.version++;

    for (const c of room.clients) {
      c.emit('state_changed', operations, client.id);
    }
  }

  client.on('error', (error) => {
    console.log("Error");
    console.log(error);
  });
  client.on('disconnecting', () => {
    console.log("Disconnecting");
  });
  client.on('disconnect', () => {
    console.log("Disconnected");
    leaveRoom(getRoom(client.data.room), client);
  });

  client.on('join', (data, callback) => {

    const room = getRoom(client.data.room);
    joinRoom(room, client);

    callback(room.state);

    // console.log("Getting pictures!");
    //
    // new ImageDownloader()
    //   .search('cats')
    //   .then(results => {
    //     console.log(JSON.stringify(results, null, '  '));
    //   })
    //   .catch(reason => {
    //     console.log("Could not get any cats")
    //     console.log(reason);
    //   });
  });

  client.on('set_label', (id, label) => {
    console.log(`Received set_label for ${id} with label ${label}`);

    doChange((room, beforeChange, afterChange) => {
      let itemIndex = afterChange.items.findIndex(it => it.id == id);
      if (itemIndex === -1) {

        console.log(`Will add a new item`);
        afterChange.items.push({
          id: id,
          label: label
        });
        itemIndex = afterChange.items.length - 1;
      }

      const item = afterChange.items[itemIndex];
      afterChange.items[itemIndex] = {...item, label: label};
    });
  });
  client.on('set_result', (id, result) => {
    doChange((room, beforeChange, afterChange) => {
      const itemIndex = afterChange.items.findIndex(it => it.id == id);
      if (itemIndex === -1) {
        return;
      }

      const item = afterChange.items[itemIndex];
      afterChange.items[itemIndex] = {...item, result: result};
    });
  });
  client.on('set_image', (id, image) => {
    doChange((room, beforeChange, afterChange) => {
      const itemIndex = afterChange.items.findIndex(it => it.id == id);
      if (itemIndex === -1) {
        return;
      }

      const item = afterChange.items[itemIndex];
      afterChange.items[itemIndex] = {...item, image: image};

    });
  });
  client.on('delete_item', (id) => {
    doChange((room, beforeChange, afterChange) => {
      const itemIndex = afterChange.items.findIndex(it => it.id == id);
      if (itemIndex === -1) {
        return;
      }

      afterChange.items.splice(itemIndex, 1);
    });
  });
  client.on('move_starting_order', (id, index) => {

    doChange((room, beforeChange, afterChange) => {

      const itemIndex = beforeChange.items.findIndex(it => it.id === id);
      if (itemIndex === -1) {

        console.log(`Could not find item ${id}`);
        return;
      }

      const itemToMove = afterChange.items[itemIndex];
      afterChange.items.splice(itemIndex, 1);
      if (itemIndex < index) {

        // Need to decrement it, since an item before where we insert has been removed.
        index--;
      }

      afterChange.items.splice(index, 0, itemToMove);
    });
  });
});

server.listen(3000, () => {
  console.log(`⚡️[server]: Server is running!!`);
});

Logic.default();

export const viteNodeApp = expressApp;
