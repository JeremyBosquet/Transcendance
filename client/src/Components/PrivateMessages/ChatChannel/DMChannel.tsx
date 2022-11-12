import axios from 'axios';
import { useEffect, useState } from 'react';
import { Iuser, IuserDb } from './interfaces/users';
import SendMessage from './SendMessage/SendMessage';
import Player from './Player/Player';
import Messages from './Messages/Messages';
import { Imessage } from './interfaces/messages';
import './ChatChannel.scss'
import { useDispatch, useSelector } from 'react-redux';
import { getSelectedChannelDM, getSocket, setChannels, setSelectedChannelDM } from '../../../Redux/chatSlice';
import { getUser } from '../../../Redux/authSlice';

interface Ichannel {
  id: string;
  users: IuserDb[];
}

function DMChannel() {
  const [messages, setMessages] = useState<Imessage[]>([]);
  const [users, setUsers] = useState<IuserDb[]>([]);
  const [usersConnected, setUsersConnected] = useState<Iuser[]>([]);
  const [dm, setDm] = useState<Ichannel>();
  const [name, setName] = useState<string>();
  
  const selectedChannelDM = useSelector(getSelectedChannelDM);
  const user = useSelector(getUser);
  const socket = useSelector(getSocket);

  const dispatch = useDispatch();

  const getUsersChannel = async (userId: any) => {
    await axios.get("http://localhost:4000/api/chat/dms/user/" + userId)
    .then((res) => {
        if (res)
          dispatch(setChannels(res.data));
    })
  }

  const getMessages = async () => {
    await axios.get(`http://localhost:4000/api/chat/dm/messages/` + selectedChannelDM + '/' + user.id)
    .then(res => {
      if (res.data)
        setMessages(res.data);
    }).catch(err => {
      if (err.response.status === 401) {
        dispatch(setSelectedChannelDM(""));
      getUsersChannel(user.id);
      setMessages([]);
      }
    });
  }
  
  useEffect(() => {
    const getChannel = async () => {
      const dm = (await axios.get(`http://localhost:4000/api/chat/dm/` + selectedChannelDM)).data;
      setDm(dm);
      setUsers(dm.users);
    }
    if (selectedChannelDM !== "")
    {
      socket?.emit("join", {channelId: selectedChannelDM, userId: user.id});
      getMessages();
      
    }
    
    getChannel();
  }, [selectedChannelDM])
  
  useEffect(() => {
    const getName = async () => {
      const userId = dm?.users[0]?.id === user.id ? dm?.users[1]?.id : dm?.users[0]?.id;
      const u = (await axios.get(`http://localhost:4000/api/chat/user/` + userId)).data;
      if (u?.name)
        setName(u.name);
    }
    if (dm?.id)
      getName();
  }, [dm])
  
  useEffect(() => {
    socket.removeListener('messageFromServer');
    socket.on('messageFromServer', (message: Imessage) => {
      setMessages(messages => [...messages, message]);
    });
    
    socket.removeListener('usersConnected');
    socket.on('usersConnected', (usersConnected: Iuser[]) => {
      setUsersConnected(usersConnected);
    });
  }, [socket])


  return (
    <>
      <div>
        <div className='ChatChannel'>
            <div> 
              {name ? <h2>{name}</h2> : <h2>Select a DM</h2>}
            </div>
            {/* Print messages */}
            <Messages userId={user.id} messages={messages} users={users} setUsers={setUsers}/>
            <div className='sendMessage'>
              <SendMessage channelId={selectedChannelDM} user={user}/>
            </div>
        </div>
      </div>
      <div className='playersList'>
        <h2>Players</h2>
        <div className='messages'>
          {users?.map((user : any) => ( 
            <Player key={user.id} setUsers={setUsers} users={users} user={user} usersConnected={usersConnected} />
          ))}
        </div>
      </div>
    </>
  );
}

export default DMChannel;
