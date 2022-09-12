import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import GameReady from '../../Components/GameReady/GameReady';
import GamePlay from '../../Components/GamePlay/GamePlay';
import axios from 'axios';

/*interface Iready {
  roomId: string;
  playerId: string;
  playerName: string;
}*/

interface IPlayer {
  id: string;
  name: string; 
  score: number;
  status: string;
}

interface IUsers {
  id: string;
  name: string; 
  image: string;
  createdAt: string;
}

interface IRoom {
  id: string;
  name: string;
  nbPlayers: number;
  owner: string;
  status: string;
  createdAt: string;
  playerA: IPlayer;
  playerB: IPlayer;
}

function GamePlayingPage() {
  const [socket, setSocket] = useState<Socket>();
  const [ready, setReady] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(false);
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [room, setRoom] = useState<IRoom>();
  const [users, setUsers] = useState<IUsers[]>([]); // List of users in the server (temporary)
  const params = useParams();
  
  const checkRooms = async (e : any) => {
    const messages = await axios.get(`http://localhost:5000/api/room/getRooms`);

    if (messages?.data) {
      for (let i = 0; i < messages.data.length; i++) {
        if (messages.data[i].id === params.id) {
          return ;
        }
      }
      window.location.href = '/game/';
    }
  }
  const getUsers = async (e : any) => {
    const messages = await axios.get(`http://localhost:5000/api/chat/getUsers`);
    console.log(messages.data);
    if (messages?.data) {
      setUsers(messages.data)
    }
  }
  useEffect(() => { // Connect to the socket
    const newSocket = io('http://localhost:5002');
    setSocket(newSocket);
    checkRooms(null);
    getUsers(null);
  }, []);
  useEffect(() => {
    if (ready)
    {
      const ready = {roomId: params.id, playerId: playerId, playerName: playerName};
      socket?.emit('iAmReady', ready);
    }
  }, [socket, ready, params.id]);
  useEffect(() => {
    if (socket) {
      socket.on('errorRoomIsFull', (id : string) => {
        console.log("errorRoomIsFull", id);
        window.location.href = '/game/';
        //Spectator here
      } 
      );
      socket.on('playerReady', (data : IRoom) => {
        if (ready)
        {
          setRoom(data);
          if (data?.playerA?.id && data?.playerB?.id)
             setPlaying(true);
        }
      }
      );
      socket.on('playerDisconnected', (data : IRoom) => {
        if (ready)
        {
          console.log("aPlayerDisconnected : ", data);
          if (playing)
          {
            setPlaying(false);
            // C'est la merde faut pause la room
          }
          else
            setRoom(data);
        }
      }
      );
    }
  }, [socket, ready, playing, room]);
  return (
    <div>
      {!ready ? ( <GameReady users={users} socket={socket} setReady={setReady} setPlayerId={setPlayerId} setPlayerName={setPlayerName}/> ) : null }
      {ready ? ( <div> Waiting for another player </div> ) : null }
      <p>{ready && !playing ? "PlayerA : " + room?.playerA?.name  : null }</p>
      <p>{ready && !playing ? "PlayerB : " + room?.playerB?.name: null }</p>
      {playing  ? ( <GamePlay playerName={playerName} playerId={playerId} socket={socket} room={room}/> ) : null }
    </div>
  );
}

export default GamePlayingPage;