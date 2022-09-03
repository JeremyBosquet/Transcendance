import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { userInfo } from "os";
import { Repository } from "typeorm";
import { Channel } from "./Entities/channel.entity";
import { Chat } from "./Entities/chat.entity";
import { User } from "./Entities/user.entity";

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Chat) private chatRepository: Repository<Chat>, 
        @InjectRepository(Channel) private channelRepository: Repository<Channel>, 
        @InjectRepository(User) private userRepository: Repository<User>, 
      ) {}

      async createMessage(chat: Chat): Promise<Chat> {
        return await this.chatRepository.save(chat);
      }

      async getMessages(): Promise<Chat[]> {
        return await this.chatRepository.find();
      }
    
      async getMessageFromRoom(room: string): Promise<Chat[]> {
        return await (await this.chatRepository.find()).filter(message => message.room === room);
      }

      async createChannel(channel: Channel): Promise<Channel> {
        return await this.channelRepository.save(channel);
      }
    
      async getChannel(channelId : string): Promise<any> {
        let channelInfos = [];
        channelInfos.push(await this.channelRepository.findOneBy({id: channelId}));
        if (channelInfos[0])
          channelInfos[0].users = await this.getUsersInfosInChannel(channelId);
        return channelInfos
      }

      async getBrutChannel(channelId : string): Promise<any> {
        return await this.channelRepository.findOneBy({id: channelId});
      }

      async getChannels(): Promise<Channel[]> {
        return await this.channelRepository.find();
      }

      async getChannelsWhereUserByName(name: string, userId: string): Promise<Channel[]> {
        function containsPlayer(users : any) {
          const containsUser = users.filter(user => user.id === userId);

          if (Object.keys(containsUser).length == 0)
            return false;
          return true;
        }
        
        const containsName = (e: string) => {
          if (e.includes(name))
            return true;
          return false;
        }

        const channels = await this.channelRepository.find();
        return (channels.filter(channel => (containsName(channel.name) && !containsPlayer(channel.users)) === true));
      }

      async getChannelsWhereUser(userId: string): Promise<any> {
        function containsPlayer(users : any) {
          const containsUser = users.filter(user => user.id === userId);

          if (Object.keys(containsUser).length == 0)
            return false;
          return true;
        }
        
        const channels = await this.channelRepository.find();
        return (channels.filter(channel => containsPlayer(channel.users) === true));
      }

      async getUsersInfosInChannel(channelId: string): Promise<any> {
        const channel = await this.channelRepository.findOneBy({id: channelId});

        let users = [];
        for (const user of channel.users) {
          let userInfos : any = await this.getUser(user.id);
          if (userInfos)
          {
            userInfos["role"] = user.role;
          }
          users.push(userInfos);
        }

        return users;
      }


      async updateChannelWithNewUser(channelId: string, data: Channel): Promise<any> {
        return await this.channelRepository.update(channelId, data);
      }

      async deleteChannel(channelId: string): Promise<any> {
        return await this.channelRepository.delete(channelId);
      }

      async createUser(user: User): Promise<User> {
        return await this.userRepository.save(user);
      }

      async getUser(userId: string): Promise<User> {
        return await this.userRepository.findOneBy({id: userId});
      }

}