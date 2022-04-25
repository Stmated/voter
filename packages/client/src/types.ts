import {Socket} from 'socket.io-client';
import * as Common from '../../common'

export type ClientSocket = Socket<Common.ServerToClientEvents, Common.ClientToServerEvents>
