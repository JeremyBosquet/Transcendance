import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createNotification } from "../../Components/notif/Notif";
import { useDispatch, useSelector } from 'react-redux';
import "./HomePage.scss";
import React from "react";
import NavBar from "../../Components/Nav/NavBar";
import { getMyExp } from '../../Components/Utils/getExp'
import { whoWon } from "../../Components/Utils/whoWon";
import KillSocket from "../../Components/KillSocket/KillSocket";
import { getHistoryList, getUserImg, getUserUsername, setUserUsername, setUserImg, setHistoryList, setRanking, getRanking } from "../../Redux/userSlice";
import io from "socket.io-client";
import GameReady from "../../Components/GameReady/GameReady";
import GamePlay from "../../Components/GamePlay/GamePlay";
import "../../Pages/Home/HomePage.scss";
import { getSockeGame, setSocketGame } from "../../Redux/gameSlice";
import instance from "../../API/Instance";
import { Helmet } from "react-helmet";
import { GiRank3 } from "react-icons/gi";
import { Link } from "react-router-dom";

interface IPlayer {
	id: string;
	name: string;
	status: string;
	x: number;
	y: number;
}

interface IBall {
	x: number;
	y: number;
	speed: number;
	direction: number;
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
	scoreA: number;
	scoreB: number;
	ball: IBall;
	settings: ISettings;
	configurationA: IConfiguration;
	configurationB: IConfiguration;
}

interface IConfiguration {
	difficulty: string;
	background: string;
	confirmed: boolean;
}

interface ISettings {
	defaultSpeed: number;
	defaultDirection: number;
	boardWidth: number;
	boardHeight: number;
	ballRadius: number;
	background: string;
}

function HomePage() {
	const navigate = useNavigate();
	const [booleffect2, setbooleffect2] = useState<boolean>(true);

	const [User, setUser] = useState<any>();
	const [trueUsername, setTrueUsername] = useState<string>("");
	const [myProfileExp, setMyProfileExp] = useState<any>();
	const socketGame = useSelector(getSockeGame);
	const [ready, setReady] = useState<boolean>(false);
	const [playing, setPlaying] = useState<boolean>(false);
	const [playerId, setPlayerId] = useState<string>("");
	const [playerName, setPlayerName] = useState<string>("");
	const [room, setRoom] = useState<IRoom>();
	const [display, setDisplay] = useState<boolean>(true);


	KillSocket("chat");
	KillSocket("spectate");
	const dispatch = useDispatch();

	const userImg: any = useSelector(getUserImg);
	const userUsername: string = useSelector(getUserUsername);
	const myHistoryList: any[] = useSelector(getHistoryList);
	const Rank: number = useSelector(getRanking);
	useEffect(() => {
		if (socketGame)
			socketGame?.close();
		const newSocket = io(import.meta.env.VITE_URL_API + ":7002");
		dispatch(setSocketGame(newSocket));
	}, []);

	useEffect(() => {
		socketGame?.emit("searching");
	}, [socketGame]);

	socketGame?.removeListener("errorRoomIsFull");
	socketGame?.removeListener("playerReady");
	socketGame?.removeListener("gameStart");
	socketGame?.removeListener("playerDisconnected");
	socketGame?.removeListener("gameEnd");
	socketGame?.removeListener("gameForceEnd");
	socketGame?.removeListener("roomUpdated");

	socketGame?.on("playerReady", (data: IRoom) => {
		if (ready) {
			setRoom(data);
		}
	});
	socketGame?.on("gameStart", (data: IRoom) => {
		setRoom(data);
		setPlaying(true);
		setReady(false);
		setDisplay(false);
	});
	socketGame?.on("playerDisconnected", (data: IRoom) => {
		if (ready) {
			createNotification("info", "The opponent player has left the game");
			if (playing) {
				setPlaying(false);
			} else setRoom(data);
		}
	});
	socketGame?.on("gameEnd", (data: IRoom) => {
		if (data.scoreA === 10)
			createNotification("success", "PlayerA a gagner");
		else if (data.scoreB === 10)
			createNotification("success", "PlayerB a gagner");
		setDisplay(true);
		setRoom(data);
		setPlaying(false);
		setReady(false);
	});
	socketGame?.on("gameForceEnd", (data: IRoom) => {
		createNotification("info", "The opponent player has left the game");
		setRoom(data);
		setPlaying(false);
		setDisplay(true);

		setReady(false);
	});
	socketGame?.on("roomUpdated", (data: IRoom) => {
		if (room)
			setRoom({ ...room, scoreA: data.scoreA, scoreB: data.scoreB });
	});

	async function GetLoggedInfoAndUser() {
		if (localStorage.getItem("token")) {
			await instance.get(`user`)
				.then((res) => {
					setUser(res.data.User);
					dispatch(setUserUsername(res.data.User.username));
					dispatch(setUserImg(import.meta.env.VITE_URL_API + ":7000/" + res.data.User.image));
					setTrueUsername(res.data.User.trueUsername);
					instance.get(`room/getGameOfUser/` + res.data.User.uuid).then((res) => {
						if (res.data && res.data.length)
							dispatch(setHistoryList(res.data));
						else if (res.data)
							dispatch(setHistoryList([]));
					});
					instance.get(`user/Ranking`).then((res) => {
						if (res.data && res.data.Rank)
							dispatch(setRanking(res.data.Rank));
					});
				}).catch(() => {
					setUser(undefined);
				});
		}
		else
			setUser(undefined);
		setbooleffect2(false);
	}

	async function reloadHistoryAndRank() {
		await instance.get(`room/getGameOfUser/` + User.uuid,
			{
				headers: {
					Authorization: "Bearer " + localStorage.getItem("token"),
				},
			}).then((res) => {
				if (res.data && res.data.length)
					dispatch(setHistoryList(res.data));
				else if (res.data)
					dispatch(setHistoryList([]));
			});
		await instance.get(`user/Ranking`).then((res) => {
			if (res.data && res.data.Rank)
				dispatch(setRanking(res.data.Rank));
		});
	}

	useEffect(() => {
		GetLoggedInfoAndUser();
	}, []);

	useEffect(() => {
		if (User)
			reloadHistoryAndRank();
	}, [playing]);

	useEffect(() => {
		if (User)
			getMyExp(User.uuid, setMyProfileExp);
	}, [User, booleffect2, playing, display]);

	return (
		<>
			{!booleffect2 && !ready && !playing? (
				<div className="HomePage main">
					<>
						{!User ? (
							<>
								<Helmet>
									<meta charSet="utf-8" />
									<title> Login - transcendence </title>
								</Helmet>
								<h1 id="loginTitle"> transcendence </h1>
								<button id="login" onClick={() => navigate("/login")}>
									login
								</button>
							</>
						) : (
							<>
								<NavBar />
								{display ? (
									<div id="myProfile">
										<Helmet>
											<meta charSet="utf-8" />
											<title> Home - transcendence </title>
										</Helmet>
										<img
											src={userImg}
											alt="user_img"
											className="userImg"
											width="384"
											height="256"
										/>
										{myProfileExp < 5 ?
											<img className="image" src={"./steel.png"} height={28} width={28} />
											: myProfileExp < 10 ?
												<img className="image" src={"./bronze.png"} height={28} width={28} />
												: myProfileExp < 15 ?
													<img className="image" src={"./silver.png"} height={28} width={28} />
													: myProfileExp < 21 ?
														<img className="image" src={"./gold.png"} height={28} width={28} />
														: myProfileExp < 22 ?
															<img className="image" src={"./diamond.png"} height={36} width={28} />
															: <img className="image" src={"./steel.png"} height={28} width={28} />
										}
										<div className="userInfo">
											<div className="Rank">
												<h3> {userUsername} </h3>
												<h4> <GiRank3 />{Rank} </h4>
											</div>
											<h4> @{trueUsername} </h4>
											<div className="expBar">
												<span className="myExp"> </span>
												<p>{myProfileExp}</p>
											</div>
											<div id="listMyGameParent">
												<div className="table">
													<div> Players </div>

													<div> Results </div>


													<div> Score </div>

												</div>
												{myHistoryList.length ?
													(
														<div id="listMyGame">
															{myHistoryList.map((game: any, index: number) => (
																<div className="user" key={index}>
																	<p id="playerName">
																		<Link to={"/profile/" + game.playerA.trueName}>{game.playerA.name}</Link>
																		{" vs "}
																		<Link to={"/profile/" + game.playerB.trueName}>{game.playerB.name}</Link>
																	</p>
																	<p id="playerStatus">
																		{whoWon(User.uuid, game)}
																	</p>
																	<p id="playerScore">
																		{game.scoreA < 0 ? (game.scoreA == -42 ? 0 : -game.scoreA) : game.scoreA} - {game.scoreB < 0 ? (game.scoreB == -42 ? 0 : -game.scoreB) : game.scoreB}
																	</p>
																</div>
															))}
														</div>
													)
													: null}
											</div>
										</div>
									</div>
								) : (null)}
								<GameReady
									socket={socketGame}
									setDisplay={setDisplay}
									setReady={setReady}
									setPlayerId={setPlayerId}
									setPlayerName={setPlayerName}
								/>
							</>
						)}
					</>
				</div>
			) : null}
			{!booleffect2 && playing && User ? (
				<>
					<NavBar />
					<GamePlay
						playerName={playerName}
						playerId={playerId}
						socket={socketGame}
						room={room}
					/>
				</>
			) : null}
		</>
	);
}

export default HomePage;
