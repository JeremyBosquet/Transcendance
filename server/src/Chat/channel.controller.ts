import { Body, Controller, Get, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { ChatService } from './chat.service';
import { IcreateChannel, IeditChannelPassword } from './Interfaces/Channels';
import * as bcrypt from 'bcrypt';

@Controller('api/chat')
export class ChannelController {
    constructor(
        private readonly chatService: ChatService
    ) {}

    @Post('channel')
    async createChannel(@Res() res, @Body() body) {
        async function passwordHash(password) {
            return await bcrypt.hash(password, 10);
        }

        if (body?.password)
            body.password = await passwordHash(body.password); // need bcrypt encryption

        const channel : IcreateChannel = await this.chatService.createChannel(body);
        res.json(channel);
    }

    @Post('channel/join')
    async joinChannel(@Res() res, @Body() body) {
        async function passwordHash(password) {
            return await bcrypt.hash(password, 10);
        }
        
        const checkIfUserAlreadyIn = (channel: any) => {
            const containsUser = channel.users.filter(user => user.id === body.userId);
            if (Object.keys(containsUser).length == 0)
                return false;
            return true;
        }

        if (body?.channel?.id && body?.userId)
        {
            const channel = await this.chatService.getBrutChannel(body.channel.id);
            if (channel)
            {
                if (channel.visibility === "protected")
                {
                    const result = await bcrypt.compare(body.password, channel.password);
                    if (!channel?.password || result === false)
                        return res.status(HttpStatus.FORBIDDEN).json({message: "Password is wrong"});
                }

                let user = {"id": body.userId, "role": "default"}
                if (channel.users)
                {
                    if (checkIfUserAlreadyIn(channel) === true)
                        return res.status(HttpStatus.CONFLICT).json({message: "User already in channel"});

                    channel.users = [...channel.users, user];
                }
                await this.chatService.updateChannel(body.channel.id, channel);
                return res.status(HttpStatus.OK).json({message: "Join successfully"});
            }
            return res.status(HttpStatus.NOT_FOUND).json({message: "Channel not found"});
        }
        return res.status(HttpStatus.BAD_REQUEST).json({message: "Bad request"});
    }

    @Post('channel/leave')
    async leaveChannel(@Res() res, @Body() body) {
        const checkIfUserAlreadyIn = (channel: any) => {
            const containsUser = channel.users.filter(user => user.id === body.userId);
            if (Object.keys(containsUser).length == 0)
                return false;
            return true;
        }

        if (body?.channel?.id && body?.userId)
        {
            const channel = await this.chatService.getBrutChannel(body.channel.id);
            if (channel)
            {
                if (channel.users)
                {
                    if (checkIfUserAlreadyIn(channel) === false)
                        return res.status(HttpStatus.CONFLICT).json({message: "User not in channel"});

                    channel.users = channel.users.filter(user => user.id !== body.userId);
                }
                if (Object.keys(channel.users).length == 0)
                    await this.chatService.deleteChannel(body.channel.id);
                else
                    await this.chatService.updateChannel(body.channel.id, channel);
                return res.status(HttpStatus.OK).json({message: "Leave successfully"});
            }
            return res.status(HttpStatus.NOT_FOUND).json({message: "Channel not found"});
        }
        return res.status(HttpStatus.BAD_REQUEST).json({message: "Bad request"});
    }
    
    @Post('channel/edit') //Edit channel password
    async editChannel(@Res() res, @Body() body : IeditChannelPassword) {
        function verifPassword(password: string) {
            if (!password || password.length < 8)
                return (false);
            return (true);
        }

        async function passwordHash(password) {
            return await bcrypt.hash(password, 10);
        }

        const channel = await this.chatService.getChannel(body.channelId);
        if (!channel)
            return res.status(HttpStatus.NOT_FOUND).json({message: "Channel not found"});
            
        if (channel.visibility === "public") {
            if (verifPassword(body.password)){
                channel.visibility = "protected";
                channel.password = await passwordHash(body.password);
                await this.chatService.updateChannel(channel.id, channel);
                return res.status(HttpStatus.OK).json("Password updated");
            }
        } else if (channel.visibility === "protected" || channel.visibility === "private") {
            if (verifPassword(body.oldPassword) && await bcrypt.compare(channel.password, body.oldPassword)) {
                if (verifPassword(body.password)) {
                    channel.password = await passwordHash(body.password);
                    await this.chatService.updateChannel(channel.id, channel);
                    return res.status(HttpStatus.OK).json("Password updated");
                }
            }
        } 
        return res.status(HttpStatus.BAD_REQUEST).json({message: "Bad request"});
    }

    @Get('channel/:id') //Get channel by id
    async getChannel(@Res() res, @Param() param) {
        const channels = await this.chatService.getChannel(param.id);
        res.json(channels);
    }

    @Get('channels/byname/:name/:userId') // Get all channels contains :name where :userId is in
    async getChannelsWhereUserByName(@Param() param, @Res() res) {
        const channels = await this.chatService.getChannelsWhereUserByName(param.name, param.userId);
        res.json(channels);
    }

    @Get('channels/user/:userId') // Get channels where user is in
    async getChannelsWhereUser(@Param() param, @Res() res) {
        const channels = await this.chatService.getChannelsWhereUser(param.userId);
        res.json(channels);
    }

    @Get('channels/users/:channelId') // Get users in channel
    async getChannelsWhereUsers(@Param() param, @Res() res) {
        const channels = await this.chatService.getUsersInfosInChannel(param.channelId);
        res.json(channels);
    }

    @Get('messages/:room')
    async getMessagesFromRoom(@Res() res, @Param() params) {
        const messages = await this.chatService.getMessageFromRoom(params.room);
        res.json(messages);
    }
}