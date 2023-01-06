import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { UsersService } from 'src/Users/users.service';
import { In, Repository } from 'typeorm';
import { Room } from './Entities/room.entity';
import { SendGameHistoryDto } from './room.dto';

const roomList = [];

@Injectable()
export class RoomService {
  async clearDatabase() {
    const list = await this.roomRepository.find();
    for (let i = 0; i < list.length; i++) {
      if (list[i].status != 'finished' && list[i].status != 'destroy') {
        await this.roomRepository.remove(list[i]);
      }
    }
  }

  constructor(
    @InjectRepository(Room) private roomRepository: Repository<Room>,
    private readonly userService: UsersService,
  ) {
    this.clearDatabase();
  }
  async getInGamePlayers(): Promise<any> {
    let lista = await this.roomRepository.find({
      where: { status: In(['playing']) },
    });
    let listb = [];
    for (let i = 0; i < lista.length; i++) {
      if (lista[i].playerA !== null) {
        if (listb.findIndex((player) => player.id == lista[i].playerA.id) == -1) {
          const temp = { uuid: lista[i].playerA.id };
          listb.push(temp);
        }
      }
      if (lista[i].playerB !== null) {
        if (listb.findIndex((player) => player.id == lista[i].playerB.id) == -1) {
          const temp = { uuid: lista[i].playerB.id };
          listb.push(temp);
        }
      }
    }
    return listb;
  }

  async getWaitingRooms(): Promise<Room[]> {
    let _index: number;
    if (roomList.length > 0) {
      const _roomList = roomList.filter((room) => room.status == 'waiting');
      return _roomList;
    }
    else {
      const rooms = await this.roomRepository.find({
        where: { status: In(['waiting']) },
      });
      return rooms;
    }
  }

  async updateRoom(roomId: string, data: any): Promise<any> {
    let _index: number;
    if ((_index = roomList.findIndex((_room) => _room.id == roomId)) != 1)
      roomList[_index] = { ...roomList[_index], ...data };
    else {
      roomList.push({ ...await this.roomRepository.findOneBy({ id: roomId }), ...data });
      await this.roomRepository.update(roomId, data);
    }

  }

  async getRoomSpectates(): Promise<Room[]> {
    if (roomList.length > 0) {
      const _roomList = roomList.filter((room) => room.status == 'playing');
      return _roomList;
    }
    else {
      const _roomList = await (this.roomRepository.findBy({ status: 'playing' }));
      return _roomList;
    }
  }

  async getRooms(): Promise<Room[]> {
    if (roomList && roomList?.length > 0) return roomList;
    else {
      const save = await this.roomRepository.find();
      for (let i = 0; i < save.length; i++) {
        roomList.push(save[i]);
      }
    }
    return roomList;
  }
  async createRoom(room: Room): Promise<Room> {
    room.ball = {
      x: 50,
      y: 50,
      speed: room.settings.defaultSpeed,
      direction: room.settings.defaultDirection,
    };
    roomList.push(room);
    return await this.roomRepository.save(room);
  }
  async getRoom(roomId: string): Promise<Room> {
    if (roomList.findIndex((_room) => _room.id == roomId) != -1) return roomList[roomList.findIndex((_room) => _room.id == roomId)];
    else return await (this.roomRepository.findOneBy({ id: roomId }));
  }
  async removeFromID(roomId: string): Promise<void> {
    await this.roomRepository.delete(roomId);
  }
  async addPlayer(
    room: Room,
    playerId: string,
    playerName: string,
  ): Promise<Room> {

    if (room.playerA !== null && room.playerA.id === playerId)
      throw new Error("Player already in a room");
    else if (room.playerB !== null && room.playerB.id === playerId)
      throw new Error("Player already in a room");
    if (room.playerA === null)
      room.playerA = {
        id: playerId,
        name: playerName,
        status: 'ready',
        trueName: null,
        x: 0,
        y: 0,
      };
    else if (room.playerB === null)
      room.playerB = {
        id: playerId,
        name: playerName,
        trueName: null,
        status: 'ready',
        x: 0,
        y: 0,
      };
    else if (room.nbPlayers < 0 || room.nbPlayers >= 2)
      throw new Error('Room is full');
    else throw new Error('Room is full or we are fucked');
    room.nbPlayers++;
    roomList[room.id] = room;
    return await this.roomRepository.save(room);
  }
  async save(room: Room): Promise<Room> {
    if (roomList.findIndex((_room) => _room.id == room.id) != -1) {
      const _index = roomList.findIndex((_room) => _room.id == room.id);
      roomList[_index] = room;
    }
    else {
      roomList.push(room);
    }
    return await this.roomRepository.save(room);
  }
  async getGameOfUser(uuid: string): Promise<Room[]> {
    const tab: Room[] = [];
    const info = (await this.roomRepository.find()).filter(
      (room) =>
        (room.playerA !== null &&
          room.status == 'finished' &&
          room.playerA.id === uuid) ||
        (room.playerB !== null && room.playerB.id === uuid && room.status == 'finished'),
    );
    for (let i = 0; i < info.length; i++) {
      if (info[i].playerA?.id && info[i].playerB.id) {
        const findA = await this.userService.findUserByUuid(info[i].playerA.id);
        if (findA) {
          info[i].playerA.name = findA.username;
          info[i].playerA.trueName = findA.trueUsername;
        }
        const findB = await this.userService.findUserByUuid(info[i].playerB.id);
        if (findB) {
          info[i].playerB.name = findB.username;
          info[i].playerB.trueName = findB.trueUsername;
        }
        tab.push(
          plainToClass(SendGameHistoryDto, info[i], {
            excludeExtraneousValues: true,
          }),
        );
      }
    }
    return tab.sort((a, b) => b.lastActivity - a.lastActivity);
  }
}
