import axios from 'axios';
import { useEffect, useState } from 'react';
import { Iuser, IuserDb } from './interfaces/users';
import SendMessage from './SendMessage/SendMessage';
import Player from './Player/Player';
import Messages from './Messages/Messages';
import { Imessage } from './interfaces/messages';
import './ChatChannel.scss'
import { useDispatch, useSelector } from 'react-redux';
import { getSocket, setChannels } from '../../../Redux/chatSlice';
import { getUser, setUser } from '../../../Redux/authSlice';
import { useNavigate, useParams } from 'react-router-dom';
import React from 'react';

interface Ichannel {
  id: string;
  name: string;
  users: IuserDb[];
  visibility: string;
  code: string;
}

function ChatChannel() {
  const [messages, setMessages] = useState<Imessage[]>([]);
  const [users, setUsers] = useState<IuserDb[]>([]);
  const [usersConnected, setUsersConnected] = useState<Iuser[]>([]);
  const [channel, setChannel] = useState<Ichannel>();
  const [mutedUsers, setMutedUsers] = useState<[]>([]);
  const params = useParams();
  
  const selectedChannel = params.id || "";
  const user = useSelector(getUser);
  const socket = useSelector(getSocket);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getUsersChannel = async (userId: any) => {
    await axios.get("http://90.66.192.148:7000/api/chat/channels/user/" + userId)
    .then((res) => {
        if (res)
          dispatch(setChannels(res.data));
    })
  }

  const getMessages = async () => {
    await axios.get(`http://90.66.192.148:7000/api/chat/messages/` + selectedChannel + '/' + user.id)
    .then(res => {
      if (res.data)
        setMessages(res.data);
    }).catch(err => {
      if (err.response.status === 401) {
        getUsersChannel(user.id);
        setMessages([]);
      }
      navigate('/chat/channel');
    });
  }
  
  useEffect(() => {
    if (params.id !== undefined) 
    {
      const getMutedUsers = async () => {
        await axios.get(`http://90.66.192.148:7000/api/chat/mutes/` + selectedChannel)
        .then(res => {
          if (res.data)
            setMutedUsers(res.data);
        });
      }
      const getChannel = async () => {
        const channel = (await axios.get(`http://90.66.192.148:7000/api/chat/channel/` + selectedChannel)).data;
        setChannel(channel);
        setUsers(channel.users);
        dispatch(setUser({...user, role: channel.users.find((u: IuserDb) => u.id === user.id)?.role}));
      }
      if (selectedChannel !== "")
      {
        socket?.emit("join", {channelId: selectedChannel, userId: user.id});
        getMessages();
      }
  
      getChannel();
  
      if (selectedChannel && channel?.users.filter(u => u.id === user.id)[0]?.role === ("admin" || "owner")) {
        getMutedUsers();
      }
    } else
      navigate("/chat/channel/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])
  
  useEffect(() => {
    if (socket) {
      socket.removeListener('messageFromServer');
      socket.on('messageFromServer', (message: Imessage) => {
        setMessages(messages => [...messages, message]);
      });
      
      socket.removeListener('usersConnected');
      socket.on('usersConnected', (usersConnected: Iuser[]) => {
        setUsersConnected(usersConnected);
      });
      
      socket.removeListener('updateAllPlayers');
      socket?.on('updateAllPlayers', (usersDb: IuserDb[]) => {
        setUsers(usersDb);
      });
      
      socket.removeListener('updateMutes');
      socket?.on('updateMutes', (usersDb: []) => {
        if (channel?.users.filter(u => u.id === user.id)[0]?.role === "admin" || "owner")
          setMutedUsers(usersDb);
      });
      
      socket.removeListener('kickFromChannel');
      socket.on('kickFromChannel', (data: {target: string, channelId: string, message: string}) => {
        socket?.emit('leavePermanant', { userId: user.id, channelId: data.channelId });
        getUsersChannel(user.id);
        if (params.id === data.channelId)
          navigate('/chat/channel');
        // use message to display a message to the user
      });
      
      socket.removeListener('adminFromServer');
      socket.on('adminFromServer', (data: {target: string, channelId: string, message: string, role: string}) => {
        if (data.target === user.id) {
          dispatch(setUser(({...user, role: data.role})));
          // use message to display a message to the user
        }
        if (params.id === data.channelId) {
          console.log('here' + data.role);
          if (user?.role === "admin") {
            setUsers(users => users.map((user: IuserDb) => {
              if (user.id === data.target)
                return ({...user, role: data.role});

              return user;
            }));
          }
      }});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket])

  return (
    <>
      <div>
        <div className='ChatChannel'>
          {
            !channel?.name ? <h2>Select a channel</h2> :
            <>
              <div className='ChatChannelInfos'>
                <h2>{channel.name}</h2>
                <h3>{channel.visibility === "private" ? channel.code : null}</h3>
              </div>
              {/* Print messages */}
              <Messages userId={user.id} messages={messages} users={users} setUsers={setUsers}/>
              <div className='sendMessage'>
                  <SendMessage channelId={selectedChannel} user={user}/>
              </div>
            </>
          }
        </div>
      </div>
      <div className='playersList'>
        <h2>Players</h2>
        <div className='messages'>
          {users?.map((user : any) => ( 
            user.print === undefined && user.print !== false ?
              <Player key={user.id} setUsers={setUsers} users={users} user={user} usersConnected={usersConnected} mutedUsers={mutedUsers}/>
            : null
          ))}
        </div>
      </div>
    </>
  );
}

export default ChatChannel;