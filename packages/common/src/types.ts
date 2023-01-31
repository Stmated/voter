import * as JsonPatch from 'fast-json-patch';

export enum GuessType {
  /**
   * The guess is for what the voter WANTS to place at a certain order.
   */
  WANTED,

  /**
   * The guess is for what the voter EXPECTS to place at a certain order.
   */
  EXPECTED
}

export interface ItemOption {
  id: string;
  label: string;
  image?: string;
  result?: string;
}

export interface State {
  items: ItemOption[];
}

export interface ServerToClientEvents {

  state_changed: (operations: JsonPatch.Operation[], by: string) => void;

  /*
  moved_starting_order: (id: string, order: number, by: string) => void;
  item_changed: (id: string, options: ItemOptions, by: string) => void;
  item_deleted: (id: string, by: string) => void;
  guessed: (id: string, type: GuessType, order: number, by: string) => void;
  moved_result_order: (id: string, order: number, by: string) => void;
  */
}

export interface SocketData {
  name: string;
  room: string;
}

export interface ClientToServerEvents {
  join: (data: SocketData, callback: {(state: State): void}) => void;
  move_starting_order: (id: string, order: number) => void;
  set_label: (id: string, label: string) => void;
  set_result: (id: string, result: string) => void;
  set_image: (id: string, image: string) => void;
  delete_item: (id: string) => void;
  guess: (id: string, type: GuessType, order: number, result: string) => void;
  move_result_order: (id: string, order: number) => void;
}

export interface InterServerEvents {
  ping: () => void;
}
