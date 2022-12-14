
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import Channels from '../../Components/Channels/Channels';
import NavBar from '../../Components/Nav/NavBar';
import { getLogged, getUser, setLogged, setUser } from '../../Redux/userSlice';
import './ChannelPage.scss';
import "../../Pages/Home/HomePage.scss";
import { createNotification } from '../../Components/notif/Notif';
import { getSockeGameChat, setSocketGameChat } from '../../Redux/gameSlice';
import { io } from 'socket.io-client';
import GamePlay from '../../Components/GamePlay/GamePlay';
import GameChatReady from '../../Components/GameChatReady/GameChatReady';
import KillSocket from '../../Components/KillSocket/KillSocket';
import Channel from '../../Components/Channels/Channel/Channel';
import { getChannels, getUserChat, setChannels, setUserChat } from '../../Redux/chatSlice';
import { IoArrowBackOutline } from 'react-icons/io5';
import FormCreateChannel from '../../Components/FormCreateChannel/FormCreateChannel';
import Search from '../../Components/Channels/Search/Search';
import instance from '../../API/Instance';
import { Helmet } from "react-helmet";
import { IInvites, IRoom } from '../../Components/GamePlay/Interfarces/GameInterace';

function ChannelPage() {
	const params = useParams();
	const logged = useSelector(getLogged);
	const user = useSelector(getUser);
	const userChat = useSelector(getUserChat);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const socketGame = useSelector(getSockeGameChat);
	const [inGame, setInGame] = useState<boolean>(false);
	const [ready, setReady] = useState<boolean>(false);
	const [playing, setPlaying] = useState<boolean>(false);
	const [playerId, setPlayerId] = useState<string>("");
	const [playerName, setPlayerName] = useState<string>("");
	const [room, setRoom] = useState<IRoom>();
	const [inviteGames, setInviteGames] = useState<IInvites[]>([]);
	const [searchChannel, setSearchChannel] = useState<string>("");
	const [channelsFind, setChannelsFind] = useState<[]>([]);
	const channels = useSelector(getChannels);

	KillSocket("game");
	KillSocket("spectate");

	useEffect(() => {
		const getUserInfos = async () => {
			await instance.get(`user`, {
				headers: {
					Authorization: "Bearer " + localStorage.getItem("token"),
				},
			})
				.then((res) => {
					dispatch(setUser(res.data.User));
					dispatch(setUserChat(res.data.User));
					dispatch(setLogged(true));
				})
				.catch((err) => {
					setUser(undefined);
					setUserChat(undefined);
					createNotification("error", "User not found");
					localStorage.removeItem("token");
					navigate("/");
				});
		}

		if (localStorage.getItem("token"))
			getUserInfos();
	}, []);

	const handleChangeMode = (newMode: string) => {
		if (newMode === "channels")
			return;
		if (newMode === "dm")
			navigate("/chat/dm")
	}


	const getUsersChannel = async () => {
		await instance.get(`api/chat/channels/user`)
			.then((res) => {
				if (res)
					dispatch(setChannels(res.data));
			})
	}

	useEffect(() => {
		if (socketGame)
			socketGame?.close();
		const newSocket = io(import.meta.env.VITE_URL_API + ":7002");
		dispatch(setSocketGameChat(newSocket));
	}, []);

	function quitGame() {
		setInGame(false);
		setReady(false);
		setPlaying(false);
		setPlayerId("");
		setPlayerName("");
		setRoom(undefined);
		const newSocket = io(import.meta.env.VITE_URL_API + ":7002");
		socketGame?.close();
		dispatch(setSocketGameChat(newSocket));
	}

	socketGame?.removeListener("errorRoomIsFull");
	socketGame?.removeListener("playerReady");
	socketGame?.removeListener("gameStart");
	socketGame?.removeListener("playerDisconnected");
	socketGame?.removeListener("gameEnd");
	socketGame?.removeListener("gameForceEnd");
	socketGame?.removeListener("roomUpdated");
	socketGame?.removeListener("gameFetchInvite");

	socketGame?.on("gameRemoveInvite", (data: any) => {
		if (data?.target && data?.room) {

			if (data?.target === user.uuid && data.room?.id) {
				setInviteGames(inviteGames.filter((invite) => invite.roomId !== data.room?.id));
			}
		}
	});

	if (user)
		socketGame?.emit("gameAskInvite", { id: user.uuid });
	socketGame?.on("gameFetchInvite", (data: any) => {
		if (data?.target && data?.room && data?.switch == true) {

			if (data?.target === user.uuid) {
				setRoom(data?.room);
				setPlayerId(data?.target);
				setPlayerName(data?.targetName);
				setInGame(true);
				setReady(false);
				setPlaying(false);
			}
		}
		else if (data?.target && data?.room && data?.switch == false) {
			if (data?.target === user.uuid) {
				const newInvitation: IInvites = {
					requestFrom: data.room?.playerA.id,
					roomId: data.room?.id,
				}
				if (inviteGames.filter((invite) => invite.roomId === data.room.id).length === 0)
					setInviteGames([...inviteGames, newInvitation]);
			}
		}
	});

	socketGame?.on("playerReady", (data: IRoom) => {
		if (ready) {
			setRoom(data);
		}
	});
	socketGame?.on("gameStart", (data: IRoom) => {
		setRoom(data);
		setPlaying(true);
		setReady(false);
	});
	socketGame?.on("playerDisconnected", (data: IRoom) => {
		if (ready) {
			createNotification("info", "The other player has left the game");
			if (playing) {
				setPlaying(false);
			} else setRoom(data);
		}
		setInGame(false);
		setRoom(undefined);
		setPlaying(false);
		setReady(false);
		quitGame();
	});
	socketGame?.on("gameEnd", (data: IRoom) => {
		if (data.scoreA === 10)
			createNotification("success", (room?.playerA?.name != undefined ? room?.playerA.name : "PlayerA") + " won the game");
		else if (data.scoreB === 10)
			createNotification("success", (room?.playerB?.name != undefined ? room?.playerB.name : "PlayerB") + " won the game");
		setRoom(undefined);
		setPlaying(false);
		setReady(false);
		setInGame(false);
		quitGame();
	});
	socketGame?.on("gameForceEnd", (data: IRoom) => {
		createNotification("info", "The opponent has left the game");
		setRoom(undefined);
		setPlaying(false);
		setReady(false);
		setInGame(false);
		quitGame();
	});
	socketGame?.on("roomUpdated", (data: IRoom) => {
		if (room)
			setRoom({ ...room, scoreA: data.scoreA, scoreB: data.scoreB });
	});


	useEffect(() => {
		if (inGame || ready) {
			quitGame();
		}
	}, [params.id]);

	return (
		<>

			<div className="blur">
				<NavBar />
				{!inGame ? (
					<div className='chatPage'>
						<Helmet>
							<meta charSet="utf-8" />
							<title> Channel - transcendence </title>
							<link rel="icon" type="image/png" href="/logo.png" />
						</Helmet>
						<div className='container'>
							{logged === false ?
								(
									<div className='notLogged'>
										<p>Pending...</p>
									</div>
								)
								:
								(
									<>
										{params.id ?
											(
												<div className="backButtonDiv">
													<button className="backButton" onClick={() => navigate('/chat/')}><IoArrowBackOutline className='backIcon' /> Back</button>
												</div>
											) : null
										}
										<div className={params.id ? 'leftSide hideSmall' : 'leftSide'}>
											<div className='topActions'>
												<div className='selectChannelOrDm'>
													<button className="selectedButton" onClick={() => handleChangeMode("channels")}>Channels</button>
													<button className="selectedButton" onClick={() => handleChangeMode("dm")}>DM</button>
												</div>
												<div className="searchBar">
													<Search searchChannel={searchChannel} setSearchChannel={setSearchChannel} setChannelsFind={setChannelsFind} getUsersChannel={getUsersChannel} />
												</div>
											</div>
											<div className='channelsInfos'>
												{searchChannel === "" ?
													<div className='channelsInfo'>
														{channels && channels.map((channel: any) => (
															<Channel key={channel["id"]} channel={channel} setSearchChannel={setSearchChannel} foundChannel={false} />
														))}
													</div>
													:
													<div className='channelsInfo'>
														{channelsFind && channelsFind.map((channel) => (
															<Channel key={channel["id"]} channel={channel} setSearchChannel={setSearchChannel} foundChannel={true} />
														))}
														{channelsFind.length === 0 ? (<p className="noChannel">No channel found.</p>) : null}
													</div>
												}
											</div>
											<FormCreateChannel />
										</div>
										<Channels searchChannel={searchChannel} setSearchChannel={setSearchChannel} setChannelsFind={setChannelsFind} invites={inviteGames} />
									</>
								)}
						</div>
					</div>
				) : (
					<>
						{!ready && !playing && room ? (
							<GameChatReady
								room={room}
								quitGame={quitGame}
								socket={socketGame}
								setReady={setReady}
								setPlayerId={setPlayerId}
								setPlayerName={setPlayerName}
							/>
						) : null}
						{playing ? (
							<GamePlay
								playerName={playerName}
								playerId={playerId}
								socket={socketGame}
								room={room}
							/>
						) : null}
					</>
				)}
			</div>
		</>
	);
}

export default ChannelPage;
