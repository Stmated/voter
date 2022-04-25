import * as React from 'react';
import './App.css';
import {ClientSocket} from './types';
import Sortable from 'sortablejs';
import {FaAward, FaVoteYea} from 'react-icons/fa';
import {AiOutlineDisconnect, AiOutlineSend} from 'react-icons/ai';
import {MdHowToVote, MdPlaylistAdd, MdRemoveCircle, MdSportsScore} from 'react-icons/md';
import {GoListOrdered} from 'react-icons/go';
import {RiGuideLine} from 'react-icons/ri';
import {ImMoveUp} from 'react-icons/im';
import {GuessType} from '@voter/common';

interface Item {
  id: number;
  name: string;
}

interface State {
  connected: boolean;
  items: Item[];
}

interface ListComponentProps {
  state: State;
}

interface ListItemComponentProps {
  item: Item;
}

// const client = new ImgurClient({
//   clientId: process.env.CLIENT_ID,
//   //clientSecret: process.env.CLIENT_SECRET,
//   //refreshToken: process.env.REFRESH_TOKEN,
// });

export const ListItemComponent: React.FC<ListItemComponentProps> = (props) => {

  const [imageUrl, setImageUrl] = React.useState('');

  React.useEffect(() => {

    // client.searchGallery({
    //   query: `title: ${props.item.name}`
    // })
    // .then(response => {
    //
    //   console.log("Got gallery matches");
    //   console.log(response);
    //
    //   if (response.success && response.data.length > 0) {
    //     setImageUrl(response.data[0].link);
    //   }
    // });

  }, [props.item.name]);

  return <div className="item">
    <img src={imageUrl} />
    <small>{props.item.name}</small>
  </div>;
}

export const ListComponent: React.FC<ListComponentProps> = (props) => {

  React.useEffect(() => {

    const el = document.getElementById('items');
    if (!el) {
      return;
    }

    const groupName = 'localStorage-example';
    Sortable.create(el, {
      group: groupName,
      animation: 100,
      direction: 'vertical',

      store: {
        get: function(sortable) {
          const order = localStorage.getItem(groupName);
          return order ? order.split('|') : [];
        },
        set: function(sortable) {
          const order = sortable.toArray();
          localStorage.setItem(groupName, order.join('|'));
        }
      },
      onChoose: function() {
        console.log("onChoose");
      },
      onChange: function() {
        console.log("onChange");
      },
      onEnd: function() {
        console.log("onEnd");
      },
      onMove: function() {
        console.log("onMove");
      },
      onStart: function() {
        console.log("onStart");
      }
    });

  }, []);

  return <div className="items" id="items">
    {props.state.items.map(it => <ListItemComponent key={it.id} item={it} />)}
  </div>;
};

function App(props: { socket: ClientSocket }) {

  const handleClickSend = () => {
    props.socket.emit('guess', 'Pontus', GuessType.WANTED, 34, '123');
  };

  const [state, setState] = React.useState(() => {
    return {
      connected: false,
      items: [
        {
          id: 0,
          name: 'A'
        },
        {
          id: 1,
          name: 'B'
        }
      ]
    } as State;
  });

  React.useEffect(() => {

    console.log("App created!");
    props.socket.on("item_changed", (id, options, by) => {
      console.log("Received noArg");
    });

    props.socket.on("item_deleted", (id, by) => {
      console.log("Received basicEmit");
    });

    props.socket.on("moved_result_order", (id, order, by) => {
      console.log("Received withAck");
    });

    props.socket.on("moved_starting_order", (id, order, by) => {
      console.log("Received withAck");
    });

    props.socket.on("guessed", (id, order, by) => {
      console.log("Received withAck");
    });

    props.socket.on('connect', () => {
      setState((s) => ({...s, connected: true}));
      console.log("Connected to server, as " + props.socket.id);
    });

  }, [props.socket]);

  return (
    <section className="App">
      <header className="App-header">
        <span>{state.connected ? <FaVoteYea/> : <AiOutlineDisconnect/>}</span>
      </header>
      <main className="App-main">
        <ListComponent state={state}/>
        <MdPlaylistAdd/>
        <MdRemoveCircle/>

        <button onClick={handleClickSend}><AiOutlineSend/></button>
      </main>
      <footer className="App-footer">
        <button onClick={handleClickSend}><GoListOrdered/><ImMoveUp /></button>
        <button onClick={handleClickSend}><RiGuideLine /><MdHowToVote/></button>
        <button onClick={handleClickSend}><MdSportsScore/><FaAward /></button>
      </footer>
    </section>
  );
}

export default App;
