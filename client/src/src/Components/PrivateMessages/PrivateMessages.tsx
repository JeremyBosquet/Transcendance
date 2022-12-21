import axios from 'axios';
import { useEffect, useState } from 'react';
import './Channels.scss';
import { useDispatch, useSelector } from 'react-redux';
import { getUser } from '../../Redux/authSlice';
import DM from './DM/DM';
import DMChannel from './DMChannel/DMChannel';
import { useParams } from 'react-router-dom';
import React from 'react';
import { setDMs } from '../../Redux/chatSlice';
import instance from '../../API/Instance';

function PrivateMessages() {
    const params = useParams();
    const [init, setInit] = useState<boolean>(false);
    const dispatch = useDispatch();
    
    const user = useSelector(getUser);

    useEffect(() => {
        const getUsersDM = async (userId: any) => {
            await instance.get("chat/dm/user/" + userId)
            .then((res) => {
                if (res)
                    dispatch(setDMs(res.data));
                    setInit(true);
            })
        }
        
        if (!init)
            getUsersDM(user.uuid);
        //eslint-disable-next-line
    }, [init, user])

    return (
    <div className='channels'>
        <div className='channelChat'>
            { params.id !== undefined ? 
                <DMChannel />
                    :
                null
            }
        </div>
    </div>
  );
}

export default PrivateMessages;