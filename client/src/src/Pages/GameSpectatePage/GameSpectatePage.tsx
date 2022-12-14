import { useEffect, useState } from "react";
import io from "socket.io-client";
import { createNotification } from "../../Components/notif/Notif";
import RoomSpectateInfo from "../../Components/RoomSpectateInfo/RoomSpectateInfo";
import { useNavigate, useParams } from "react-router-dom";
import GameSpectate from "../../Components/GameSpectate/GameSpectate";
import React from "react";
import NavBar from "../../Components/Nav/NavBar";
import "../../Pages/Home/HomePage.scss";
import { useDispatch, useSelector } from "react-redux";
import { getSockeSpectate, setSocketSpectate } from "../../Redux/gameSlice";
import KillSocket from "../../Components/KillSocket/KillSocket";
import { getUser, setUser } from "../../Redux/userSlice";
import instance from "../../API/Instance";
import './GameSpectatePage.scss'
import { Helmet } from "react-helmet";
import { IRoom } from "../../Components/GamePlay/Interfarces/GameInterace";

function GameSpectatePage() {
	const [rooms, setRooms] = useState<IRoom[]>([]);
	const [room, setRoom] = useState<IRoom>();
	const navigate = useNavigate();
	const { roomId } = useParams<{ roomId: string }>();
	const user = useSelector(getUser);
	const dispatch = useDispatch();
	const socket = useSelector(getSockeSpectate);
	const [display, setDisplay] = useState<Boolean>(false);

	KillSocket("game");
	KillSocket("chat");

	const getRooms = async (e: any) => {
		const messages = await instance.get(
			`room/getRoomSpectates`
		);

		if (messages?.data) {
			setRooms(messages.data);
		}
	};
	useEffect(() => {
		if (socket)
			socket?.close();
		const newSocket = io(import.meta.env.VITE_URL_API + ":7002");
		dispatch(setSocketSpectate(newSocket));
		getRooms(null);
	}, []);
	useEffect(() => {
		socket?.on("roomStarted", (room: IRoom) => {
			setRooms([...rooms, room]);
		});
	}, [socket, rooms]);
	useEffect(() => {
		socket?.on("roomFinished", (room: IRoom) => {
			setRooms((rooms) => rooms.filter((r) => r.id !== room.id));
		});
	}, [socket, rooms]);
	useEffect(() => {
		if (socket && roomId && display && roomId.length > 0) {
			socket.removeListener("gameEnd");
			socket.removeListener("gameForceEnd");
			socket.removeListener("roomUpdated");
			socket.removeListener("gameInit");
			socket.removeListener("errorRoomNotFound");
			socket?.emit("joinRoomSpectate", { roomId: roomId, id: user?.uuid });
			socket?.on("errorRoomNotFound", (room: IRoom) => {
				if (room)
					setRooms((rooms) => rooms.filter((r) => r.id !== room.id));
				navigate("/game/spectate");
			});
			socket.on("gameInit", (room: IRoom) => {
				setRoom(room);
			});
			socket.on("gameEnd", (data: IRoom) => {
				if (data.scoreA === 10)
					createNotification("success", (room?.playerA?.name != undefined ? room?.playerA.name : "PlayerA") + " won the game");
				else if (data.scoreB === 10)
					createNotification("success", (room?.playerB?.name != undefined ? room?.playerB.name : "PlayerB") + " won the game");
				setDisplay(false);
				setRooms((rooms) => rooms.filter((r) => r.id !== data.id));
				setRoom(undefined);
				navigate("/game/spectate");
			});
			socket.on("gameForceEnd", (data: IRoom) => {
				createNotification("info", "The game was stopped because one of the players left the game");
				setDisplay(false);
				setRooms((rooms) => rooms.filter((r) => r.id !== data.id));
				setRoom(undefined);
				navigate("/game/spectate");
			});
			socket?.on("roomUpdated", (data: IRoom) => {
				if (room)
					setRoom({ ...room, scoreA: data.scoreA, scoreB: data.scoreB });
			});
		}
	}, [socket, roomId, display, room, user]);

	useEffect(() => {
		const checkId = async () => {
			if (roomId) {
				const result = await instance.get(`room/checkGame/` + roomId).then((res) => {
					setDisplay(true);
				})
				.catch((err) => {
					setDisplay(false);
					navigate("/game/spectate");
				});
			}
		};
		checkId();
	}, [roomId]);

	useEffect(() => {
		const interval = setInterval(() => {
			getRooms(null);
		}, 5000);
		return () => clearInterval(interval);
	}, []);

	return (
		<>
			{<NavBar />}
			<div className='roomPage'>
				<Helmet>
					<meta charSet="utf-8" />
					<title> Spectate - transcendence </title>
					<link rel="icon" type="image/png" href="/logo.png" />
				</Helmet>
				{!roomId ? (
					<div className='container'>
						<h3 className="title">Current's game</h3>
						<div className="roomInfos">
							{rooms.map((room: IRoom) => (
								<RoomSpectateInfo
									key={room.id}
									id={room.id}
									owner={room.owner}
									status={room.status}
									nbPlayers={room.nbPlayers}
									name={room.name}
									createdAt={room.createdAt}
									settings={room.settings}
									lastActivity={room.lastActivity}
									playerAName={room.playerA?.name}
									playerBName={room.playerB?.name}
									scoreA={room.scoreA}
									scoreB={room.scoreB}
									playerAId={room.playerA?.id}
									playerBId={room.playerB?.id}
								/>
							))}
						</div>
					</div>
				) : (
					<div>
						{room ? <GameSpectate setRoom={setRoom} socket={socket} room={room} /> : null}
					</div>
				)}
			</div>
		</>
	);
}

export default GameSpectatePage;
