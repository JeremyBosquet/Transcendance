import React, { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import "./GameSpectate.scss";
import useEventListener from "@use-it/event-listener";
import useImage from "use-image";
import { Helmet } from "react-helmet";
import GameBoard from "../GameBoard/GameBoard";

interface props {
	socket: Socket | undefined;
	room: IRoom | undefined;
	setRoom: any;
}

interface IPlayer {
	id: string;
	name: string;
	status: string;
	x: number;
	y: number;
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
}

interface ISettings {
	defaultSpeed: number;
	defaultDirection: number;
	boardWidth: number;
	boardHeight: number;
	ballRadius: number;
	background: string;
}

interface ICanvasBoard {
	x: number;
	y: number;
	id: string;
	percentY: number;
}

interface IBall {
	x: number;
	y: number;
	speed: number;
	direction: number;
}

interface ICanvasBall {
	x: number;
	y: number;
	id: string;
	radius: number;
	percentX: number;
	percentY: number;
}

let random = Math.random() * 1000;
random = Math.floor(random);
let lastTimestamp = 0;

function GameSpectate(props: props) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const contextRef = useRef<CanvasRenderingContext2D | null>(null);

	let boardAX = 0.025;
	let boardBX = 0.04;

	useEffect(() => {
		random = Math.random() * 1000;
		random = Math.floor(random);
	}, []);
	//const _ImageA = new Image();
	//const _ImageB = new Image();
	//_ImageA.src = import.meta.env.VITE_URL_API + ":7000/api/user/getProfilePicture/" + props.room?.playerA.id  + "#" + random;
	//_ImageB.src = import.meta.env.VITE_URL_API + ":7000/api/user/getProfilePicture/" + props.room?.playerB.id  + "#" + random;

	let mult = 0.5;
	if (window.innerWidth < 500)
		mult = 0.9;
	let _t = window.innerHeight * mult;
	let _r = (window.innerWidth * mult) / (window.innerHeight * mult);
	if (_r < 16 / 9) {
		_t = (window.innerWidth * mult) * (9 / 16);
	}
	const [windowsWidth, setWindowsWidth] = useState((16 * _t) / 9);
	const [windowsHeight, setWindowsHeight] = useState(_t);
	const [boardWidth, setBoardWidth] = useState<number>(
		props.room?.settings.boardWidth
			? (props.room?.settings.boardWidth * 0.01) * windowsWidth
			: 100
	);
	const [boardHeight, setBoardHeight] = useState<number>(
		props.room?.settings.boardHeight
			? (props.room?.settings.boardHeight * 0.01) * windowsHeight
			: 100
	);
	const [ball, setBall] = useState<ICanvasBall>({
		id: "ball",
		x: props.room?.ball.x
			? (props.room?.ball.x * 0.01) * windowsWidth
			: windowsWidth * 0.5,
		y: props.room?.ball.y
			? (props.room?.ball.y * 0.01) * windowsHeight
			: windowsHeight * 0.5,
		radius: props.room?.settings.ballRadius
			? (props.room?.settings.ballRadius * 0.01) * windowsHeight
			: 100,
		percentX: 50,
		percentY: 50,
	});
	const [playerA, setPlayerA] = useState<ICanvasBoard>({
		id: "playerA",
		x: boardAX * windowsWidth,
		y: props.room?.playerA?.y
			? (props.room?.playerA?.y * 0.01) * windowsHeight
			: windowsHeight * 0.5 - boardHeight * 0.5,
		percentY: 50,
	});
	const [playerB, setPlayerB] = useState<ICanvasBoard>({
		id: "playerB",
		x: (windowsWidth - boardBX * windowsWidth),
		y: props.room?.playerB?.y
			? (props.room?.playerB?.y * 0.01) * windowsHeight
			: windowsHeight * 0.5 - boardHeight * 0.5,
		percentY: 50,
	});

	function updateDisplay(): void {
		if (contextRef.current) {
			//setCount(count +1);
			//if (Date.now() - time > 1000) {
			//	console.log(count);
			//	setFps(count);
			//	setCount(0);
			//	setTime(Date.now());
			//}
			let primeColor;
			let secondColor;

			if (props.room?.settings.background === "inverted") {
				primeColor = "white";
				secondColor = "black";
			}
			else {
				primeColor = "black";
				secondColor = "white";
			}
			//contextRef.current.clearRect(0, 0, windowsWidth, windowsHeight);
			contextRef.current.beginPath();
			contextRef.current.fillStyle = primeColor;
			contextRef.current.fillRect(0, 0, windowsWidth, windowsHeight);
			contextRef.current.fillStyle = secondColor;
			contextRef.current.fillRect(Math.floor(windowsWidth * 0.5 - 2), 0, 4, windowsHeight);
			contextRef.current.fillStyle = secondColor;

			let display = 50;
			if (window.innerWidth < 500) {
				display = 30;
				mult = 0.9;
				contextRef.current.font = "20px Arial";
				if (props.room?.scoreA)
					contextRef.current.fillText(props.room?.scoreA.toString(), Math.floor(windowsWidth * 0.5 - 35), 35);
				else
					contextRef.current.fillText("0", Math.floor(windowsWidth * 0.5 - 20), 25);
				if (props.room?.scoreB)
					contextRef.current.fillText(props.room?.scoreB.toString(), Math.floor(windowsWidth * 0.5 + 20), 35);
				else
					contextRef.current.fillText("0", Math.floor(windowsWidth * 0.5 + 10), 25);

			}
			else {
				mult = 0.5;
				contextRef.current.font = "30px Arial";
				
				//if (_ImageA)
				//	contextRef.current.drawImage(_ImageA, Math.floor(windowsWidth * 0.5 - 100), 0, display, display);
				//if (_ImageB)
				//	contextRef.current.drawImage(_ImageB, Math.floor(windowsWidth * 0.5 + 50), 0, display, display);
				if (props.room?.scoreA)
					contextRef.current.fillText(props.room?.scoreA.toString(), Math.floor(windowsWidth * 0.5 - 35), 35);
				else
					contextRef.current.fillText("0", windowsWidth * 0.5 - 35, 35);
				if (props.room?.scoreB)
					contextRef.current.fillText(props.room?.scoreB.toString(), Math.floor(windowsWidth * 0.5 + 20), 35);
				else
					contextRef.current.fillText("0", windowsWidth * 0.5 + 20, 35);
			}
			contextRef.current.fillStyle = secondColor;
			contextRef.current.fillRect(Math.floor(playerA.x), Math.floor(playerA.y), Math.floor(boardWidth), Math.floor(boardHeight));
			contextRef.current.fillStyle = secondColor;
			contextRef.current.fillRect(Math.floor(playerB.x), Math.floor(playerB.y), Math.floor(boardWidth), Math.floor(boardHeight));
			contextRef.current.beginPath();
			contextRef.current.lineJoin = "round";
			contextRef.current.lineWidth = 2;
			contextRef.current.strokeStyle = secondColor;
			
			
			
			contextRef.current.arc(Math.floor(ball.x), Math.floor(ball.y), Math.floor(ball.radius), 0, 2 * Math.PI);
			if (ball.x < windowsWidth * 0.5 + 2 && ball.x > windowsWidth * 0.5 - 2)
				contextRef.current.fillStyle = "gray";
			else
				contextRef.current.fillStyle = secondColor;

			contextRef.current.fill();
			contextRef.current.closePath();
		}
	}

	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas?.getContext("2d");
		if (context) {
			contextRef.current = context;
			updateDisplay();
		}
	}, []);
	function handleResize() {
		let t = window.innerHeight * mult;
		let r = (window.innerWidth * mult) / (window.innerHeight * mult);
		if (r < 16 / 9) {
			t = (window.innerWidth * mult) * (9 / 16);
		}
		setWindowsHeight(t);
		setWindowsWidth((16 * t) / 9);
		setBoardWidth(
			props.room?.settings.boardWidth
				? (props.room?.settings.boardWidth * 0.01) * windowsWidth
				: 100
		);
		setBoardHeight(
			props.room?.settings.boardHeight
				? (props.room?.settings.boardHeight * 0.01) * windowsHeight
				: 100
		);
		setBall({
			...ball,
			id: "ball",
			radius: props.room?.settings.ballRadius
				? (props.room?.settings.ballRadius * 0.01) * windowsHeight
				: 100,
			x: (ball.percentX * 0.01) * windowsWidth,
			y: (ball.percentY * 0.01) * windowsHeight,
			percentX: ball.percentX,
			percentY: ball.percentY,
		});
		setPlayerA({
			...playerA,
			id: "playerA",
			x: (boardAX * windowsWidth),
			y: (playerA.percentY * 0.01) * windowsHeight,
			percentY: playerA.percentY,
		});
		setPlayerB({
			...playerB,
			id: "playerB",
			x: (windowsWidth - boardBX * windowsWidth),
			y: (playerB.percentY * 0.01) * windowsHeight,
			percentY: playerB.percentY,
		});
		updateDisplay();
	}
	useEventListener("resize", handleResize);

	props.socket?.removeListener("playerMovement");
	props.socket?.on("playerMovement", (data: any) => {
		if (data.player && data.x != undefined && data.y != undefined) {
			if (data.player === "playerA") {
				setPlayerA({
					...playerA,
					id: "playerA",
					x: boardAX * windowsWidth,
					y: (data.y * 0.01) * windowsHeight,
					percentY: data.y,
				});
			} else if ((data.player === "playerB")) {
				setPlayerB({
					...playerB,
					id: "playerB",
					x: windowsWidth - boardBX * windowsWidth,
					y: (data.y * 0.01) * windowsHeight,
					percentY: data.y,
				});
			}
		}
		updateDisplay();
	});
	props.socket?.removeListener("ballMovement");
	props.socket?.on("ballMovement", (data: any) => {
		if (lastTimestamp >= data.timestamp) return;
		lastTimestamp = data.timestamp;
		setBall({
			...ball,
			id: "ball",
			x: (data?.x * 0.01) * windowsWidth,
			y: (data?.y * 0.01) * windowsHeight,
			percentX: data?.x,
			percentY: data?.y,
		});
		updateDisplay();
	});
	props.socket?.removeListener("roomUpdated");
	props.socket?.on("roomUpdated", (data: IRoom) => {
		if (props.room)
			props.setRoom({ ...props.room, scoreA: data.scoreA, scoreB: data.scoreB });
	});
	useEffect(() => {
		const interval = setInterval(() => {
			updateDisplay();
		}, 1000 / 60);
		return () => clearInterval(interval);
	}, [windowsWidth, windowsHeight, boardWidth, boardHeight, ball, playerA, playerB]);
	
	return (
		<div id="gameMain" className="cursor">
			<Helmet>
				<meta charSet="utf-8" />
				<title> Spectating - transcendence </title>
				<link rel="icon" type="image/png" href="/logo.png" />
			</Helmet>
			<GameBoard socket={props.socket} room={props.room} />
			<canvas ref={canvasRef} width={windowsWidth} height={windowsHeight} />
		</div>
	);
}

export default GameSpectate;
