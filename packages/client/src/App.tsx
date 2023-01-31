import * as React from 'react';
import './App.css';
import {ClientSocket} from './types';
import Sortable from 'sortablejs';
import {FaAward, FaVoteYea} from 'react-icons/fa';
import {AiOutlineDisconnect, AiOutlineSend} from 'react-icons/ai';
import {MdDragIndicator, MdHowToVote, MdPlaylistAdd, MdRemoveCircle, MdSportsScore} from 'react-icons/md';
import {GoListOrdered} from 'react-icons/go';
import {RiGuideLine} from 'react-icons/ri';
import {ImMoveUp} from 'react-icons/im';
import {GuessType, ItemOption, SocketData, State} from '@voter/common';
import * as JsonPatch from 'fast-json-patch';
import * as uuid from 'uuid';

interface ClientState extends State {
  connected: boolean;
  room: string;
}

interface ListComponentProps {
  state: ClientState;
  onMove: (item: ItemOption, oldIndex: number, newIndex: number) => void;
}

interface ListItemComponentProps {
  item: ItemOption;
}

export const ListItemComponent: React.FC<ListItemComponentProps> = (props) => {

  const [imageUrl, setImageUrl] = React.useState('');

  React.useEffect(() => {

  }, [props.item.label]);

  const onRemove = () => {

  };

  return <div className="item" data-id={props.item.id} style={{backgroundImage: imageUrl}}>
    <div className="item-handle">
      <MdDragIndicator />
    </div>
    <div className="item-content">
      <div className="item-content-label">
        <small>{props.item.label}</small>
      </div>
      <div className="item-content-actions">
        <button onClick={onRemove}><MdRemoveCircle/></button>
      </div>
    </div>


  </div>;
}

export const ListComponent: React.FC<ListComponentProps> = (props) => {

  // const parentState = React.useRef(props.state);
  React.useEffect(() => {

    const el = document.getElementById('items');
    if (!el) {
      return;
    }

    const sortable = Sortable.create(el, {
      direction: 'vertical',
      handle: '.item-handle',
      onEnd: function(e) {
        console.log(`onEnd ${e.oldIndex} -> ${e.newIndex}`);

        const oldIndex = e.oldIndex == undefined ? -1 : e.oldIndex;
        let newIndex = e.newIndex == undefined ? -1 : e.newIndex;

        if (oldIndex >= 0 && newIndex >= 0) {

          const child = el.childNodes[newIndex] as HTMLElement;
          const itemId = child.getAttribute('data-id') || '-1';
          const item = props.state.items.find(it => it.id == itemId);

          if (item) {
            props.onMove(item, oldIndex, newIndex);
          } else {
            console.log(`Could not find item ${itemId} among the items`);
            console.log(props.state.items);
          }
        }
      }
    });

    return () => {
      sortable.destroy();
    };
  }, [props.state.items]);

  return <div className="items" id="items">
    {props.state.items.map(it => <ListItemComponent key={it.id} item={it}/>)}
  </div>;
};

export const App: React.FC<{ socket: ClientSocket }> = (props) => {

  const [state, setState] = React.useState(() => {
    return {
      connected: false,
      items: [] as ItemOption[]
    } as ClientState;
  });

  React.useEffect(() => {

    if (props.socket.hasListeners('state_changed')) {

      // Listeners have already been registered.
      return;
    }

    const doJoin = () => {

      // Send a join message, to sort of restart the session and update server state about us.
      const userData: SocketData = {
        name: localStorage.getItem('name') || props.socket.id,
        room: localStorage.getItem('room') || 'lobby'
      };

      props.socket.emit('join', userData, (serverState) => {

        console.log('Server knows we have joined, and has given us the current state');
        console.log(serverState);

        setState(s => {
          return {...s, items: serverState.items};
        })
      });
    };

    props.socket.on("state_changed", (operations, by) => {
      console.log("Received state_changed");
      console.log(operations);

      setState((cs) => {

        // Take previous ClientState, patch it with server State, then merge the two.
        const patchResult = JsonPatch.applyPatch(cs, operations, true, false);
        return {...cs, ...patchResult.newDocument as State};
      });
    });

    props.socket.on('connect', () => {
      setState((s) => ({...s, connected: true}));
      console.log("Connected to server, as " + props.socket.id);
    });

    props.socket.on('disconnect', () => {
      setState((s) => ({...s, connected: false}));
      console.log("Disconnected from server, as " + props.socket.id);
    });

    props.socket.io.on('reconnect', () => {
      doJoin();
    });

    doJoin();

  }, [props.socket]);

  const handleClickSend = () => {
    props.socket.emit('guess', 'Pontus', GuessType.WANTED, 34, '123');
  };

  const handleOrderChanged = (item: ItemOption, oldIndex: number, newIndex: number) => {

    console.log(`Order has changed, so emitting an event`);
    props.socket.emit('move_starting_order', item.id, newIndex);
  };

  const addItem = () => {
    props.socket.emit('set_label', uuid.v4(), prompt("Name") || 'N/A');
  };

  return (
    <section className="App">
      <header className="App-header">
        <span>{state.connected ? <FaVoteYea/> : <AiOutlineDisconnect/>}</span>
      </header>
      <main className="App-main">
        <ListComponent state={state} onMove={handleOrderChanged}/>

        <div className="actions">
          <button onClick={addItem}><MdPlaylistAdd/></button>
        </div>
      </main>
      <footer className="App-footer">
        <button onClick={handleClickSend}><GoListOrdered/><ImMoveUp/></button>
        <button onClick={handleClickSend}><RiGuideLine/><MdHowToVote/></button>
        <button onClick={handleClickSend}><MdSportsScore/><FaAward/></button>
      </footer>
    </section>
  );
}

export default App;
