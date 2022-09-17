import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from "@nestjs/websockets";
import { bindCallback } from "rxjs";
import { Socket } from "socket.io";
import { RoomService } from "./room.service";

interface Irooms {
    id: string;
    name: string;
    owner: string;
    nbPlayers: number;
    status: string;
    createdAt: string;
}

interface Iready {
    roomId: string;
    playerId: string;
    playerName: string;
}

const intervalList = [];
@WebSocketGateway(5002, { cors: '*:*'})
export class RoomGateway {

    constructor(private roomService: RoomService) {}
    @WebSocketServer()
    server;

    @SubscribeMessage('roomCreated')
    async handleConnect(@MessageBody() data: Irooms[]): Promise<void> {
        const rooms = await this.roomService.getRooms();
        this.server.emit('roomCreated', rooms);
    }

    async gameLoop(roomTMP : any) : Promise<void> {
        const room = await this.roomService.getRoom(roomTMP.id);
        const settings = room.settings;
        if (room?.id)
        {
            if (room.status === "paused")
            {
                //A gerer differement surement
                console.log("gameLoop - paused");
                this.roomService.removeFromID(room.id);
                clearInterval(intervalList[room.id]);
            }
            else if (room.status === "waiting")
            {
                console.log("gameLoop - waiting, let's play");
                room.status = "playing";
                this.server.in('room-' + room.id).emit('gameStart', room);
                this.roomService.save(room);
            }
            else if (room.status === "playing")
            {
                console.log("gameLoop - playing");
                const ball = room.ball;
                console.log("settings : ", settings);
                if (ball.x < 0 || ball.x > 100)
                {
                    room.status = "waiting";
                    clearInterval(intervalList[room.id]);
                    // Dire que un des deux a perdu
                    // Et reboot la manche si y reste des tours
                }
                else if ((ball.y + ((settings.ballRadius * 100) / 2)) < 0 || (ball.y - ((settings.ballRadius * 100) / 2)) < 0 || (ball.y + ((settings.ballRadius * 100) / 2)) > 100 ||  (ball.y - ((settings.ballRadius * 100) / 2)) > 100)
                {
                    ball.direction = -ball.direction;
                    // Ajouter aleatoire pour la direction
                    ball.x += ball.speed * Math.cos(ball.direction);
                    ball.y += ball.speed * Math.sin(ball.direction);
                }
                else
                {
                    ball.x += ball.speed * Math.cos(ball.direction);
                    ball.y += ball.speed * Math.sin(ball.direction);
                }
                room.ball = ball;
                this.server.in('room-' + room.id).emit('ballMovement', ball);
                await this.roomService.save(room);
            }
        }

    }
    @SubscribeMessage('iAmReady')
    async playerReady(@ConnectedSocket() client: Socket, @MessageBody() data: Iready): Promise<void> {
        const room = await this.roomService.getRoom(data.roomId);
        try {
            await this.roomService.addPlayer(room, data.playerId, data.playerName);
            //this.server.emit('playerReady', room);
        }
        catch (error) {
            if (error.message === "Room is full") {
                //console.log("errorRoomIsFull -", room.id, room.nbPlayers);
                client.join('room-' + room.id);
                this.server.to(client.id).emit('errorRoomIsFull', client.data?.playerId);
                //Spectateur ici
                //this.server.to('room-' + room.id).emit('errorRoomIsFull', error);
            }
            else if (error.message === "Player already in a room")
            {
                //console.log("errorPlayerAlreadyInRoom -", room.id, room.nbPlayers);
                client.join('room-' + room.id);
                this.server.in('room-' + room.id).emit('playerReady', room);
                // a gerer ptetre differement, faut surement kick l'ancien mais comment idk.
            }
           else
                console.log("error -", error.message);
        }
        finally{
            const room = await this.roomService.getRoom(data.roomId);
            if (room?.id !== null  && room?.nbPlayers !== null)
            {
                //console.log("finally -", room.id, room.nbPlayers);
                await client.join('room-' + room.id);
                console.log("rooms : ", client.rooms);
                client.data.roomId = data.roomId;
                client.data.playerId = data.playerId;
                console.log("I sent a playerReady -", room.id, room.nbPlayers, "in room-" + room.id);
                if (room.playerA?.id && room.playerB?.id && room.status != "playing")
                {
                    //room.status = "playing";
                    //intervalList[room.id] = setInterval(this.gameLoop, 100, room);
                    intervalList[room.id] = setInterval(() => this.gameLoop(room), 100);
                }
                  // Lance un qui va tout faire fonctionner
                //clearInterval(intervalList[room.id]);
                this.roomService.save(room);
                this.server.in('room-' + room.id).emit('playerReady', room);
            }
            else
                console.log("error - room is undefined");
        }
    }
    @SubscribeMessage('disconnect')
    async handleDisconnect(@ConnectedSocket() client: Socket) : Promise<void> {
        if (client.data.roomId !== undefined)
        {
            const room = await this.roomService.getRoom(client.data.roomId);
            if (room?.id !== null  && room?.nbPlayers !== null)
            {
                if (room?.playerA?.id == client.data.playerId)
                    room.playerA = null;
                else if (room?.playerB?.id == client.data.playerId)
                    room.playerB = null;
                else
                {
                    console.log("error - player not found - (Call tnard car c la merde ou spectateur)");
                    return ;
                }
                room.nbPlayers--;
                this.server.to('room-' + room.id).emit('playerDisconnected', room);
                room.status = "waiting"; // remove that
                console.log("disconnect -", room.id, room.nbPlayers);
                clearInterval(intervalList[room.id]);
                this.roomService.save(room); // remove that
                // to active
                //await this.roomService.removeFromID(room.id);
            }
        }   
    }
    @SubscribeMessage('playerMove')
    async handleMove(@ConnectedSocket() client: Socket, @MessageBody() data: any): Promise<void> {
        if (client.data?.roomId)
        {
            const room = await this.roomService.getRoom(client.data?.roomId);
            if (room?.status === "playing" && data?.id && data?.x && data?.y)
            {
                if ("playerA" === data.id)
                {
                    room.playerA.x = data.x;
                    room.playerA.y = data.y;
                }
                else if ("playerB"=== data.id)
                {
                    room.playerB.x = data.x;
                    room.playerB.y = data.y;
                }
                this.server.to('room-' + room?.id).emit('playerMovement', data);
                await this.roomService.save(room);
            }
            else
                console.log("action not allowed -", room?.id, room?.status);
            console.log("playerMove -", data);
        }
    }
    @SubscribeMessage('ballMove')
    async handleBallMove(@ConnectedSocket() client: Socket, @MessageBody() data: any): Promise<void> {
        const room = await this.roomService.getRoom(client.data?.roomId);
        this.server.to('room-' + room?.id).emit('ballMovement', data);
    }
}