import {
	IsBoolean,
	IsNotEmpty,
	IsString,
	IsUUID,
	Length,
} from 'class-validator';
import { Expose } from 'class-transformer';

export class SendUserDto {
	@IsNotEmpty()
	@IsString()
	@Expose()
	username: string;

	@IsNotEmpty()
	@IsString()
	@Expose()
	trueUsername: string;

	@IsNotEmpty()
	@IsString()
	@Expose()
	uuid: string;

	@IsNotEmpty()
	@IsString()
	@Expose()
	image: string;

	@IsNotEmpty()
	@Expose()
	id: number;

	@IsNotEmpty()
	@IsBoolean()
	@Expose()
	isLoggedIn: boolean;
}

export class FriendsDto {
	@IsNotEmpty()
	@IsUUID()
	@Expose()
	uuid: string;
}

export class SearchDto {
	@IsNotEmpty()
	@IsString()
	@Length(1, 16)
	@Expose()
	username: string;
}

export class ExpDto {
	@IsNotEmpty()
	@Expose()
	exp: number;
}

export class TokenDto {
	@IsNotEmpty()
	@Expose()
	token: string;
}
