import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatController } from "./chat.controller";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { Channel } from "./Entities/channel.entity";
import { User } from "./Entities/user.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Channel, User]),
    ],
    controllers: [ChatController],
    providers: [ChatService, ChatGateway],
})
export class ChatModule{}