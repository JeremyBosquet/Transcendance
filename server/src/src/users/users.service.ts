import { HttpStatus, Injectable, Req, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ifriends, UserModel } from '../typeorm/user.entity';
import { Repository } from 'typeorm';
import { FriendsDto, SendUserDto } from './users.dto';
import { any, number } from 'joi';
import { JwtService } from '@nestjs/jwt';
import { plainToClass } from 'class-transformer';
import { User } from 'src/login/user.decorator';
import * as bcrypt from 'bcrypt';
import { promises as fs } from "fs";
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
  ) {}

  async setTwoFactorAuthenticationSecret(secret: string, uuid: string) {
    return this.userRepository.update(
      { uuid },
      {
        twoFactorAuthenticationSecret: secret,
      },
    );
  }

  async turnOnTwoFactorAuthentication(uuid: string) {
    return this.userRepository.update(
      { uuid },
      {
        isTwoFactorAuthenticationEnabled: true,
      },
    );
  }

  async turnOffTwoFactorAuthentication(uuid: string) {
    return this.userRepository.update(
      { uuid },
      {
        isTwoFactorAuthenticationEnabled: false,
        isSecondFactorAuthenticated: false,
        twoFactorAuthenticationSecret: 'null',
      },
    );
  }

  async IsAuthenticated(uuid: string) {
    return this.userRepository.update(
      { uuid },
      {
        isSecondFactorAuthenticated: true,
      },
    );
  }

  async IsLoggedIn(uuid: string, token : string) {
	const find = (await this.userRepository.find()).filter((user) => user.uuid === uuid)[0];
	if (find && find.isLoggedIn)
	{
		for (let i = 0; i < find.isLoggedIn.length; i++)
		{
			const date = new Date(find.isLoggedIn[i].CreatedAt);
			date.setDate(date.getDate() + 2);
			if (date < new Date())
				find.isLoggedIn.splice(i, 1);
			else
				if (await bcrypt.compare(find.isLoggedIn[i].token, token))
					return;
		}			
		let newTab = find.isLoggedIn;
		const hashed = await bcrypt.hash(token, 10);
		newTab.push({token : hashed, CreatedAt : new Date()});
		return this.userRepository.update(
		{ uuid },
		{
			isLoggedIn: newTab,
		},
		);
	}
  }

  async IsntLoggedIn(uuid: string, token : string) {
	const find = (await this.userRepository.find()).filter((user) => user.uuid === uuid)[0];
	if (find && find.isLoggedIn)
	{
		let newTab = find.isLoggedIn;
		for (let i = 0; i < newTab.length; i++)
			if (await bcrypt.compare(token, find.isLoggedIn[i].token))
				newTab.splice(i, 1);
		return this.userRepository.update(
		{ uuid },
		{
			isLoggedIn: newTab,
		},
		);
	}
  }

  async IsntAuthenticated(uuid: string) {
    return this.userRepository.update(
      { uuid },
      {
        isSecondFactorAuthenticated: false,
      },
    );
  }

  async findUserByUuid(uuid: string) {
    const find = (await this.userRepository.find()).filter((user) => user.uuid === uuid)[0];
    return find;
  }

  async findFriendByUuid(Useruuid : string, uuid: string) {
    const find = (await this.userRepository.find()).filter((user) => user.uuid === uuid)[0];
	if (find)
	{
		for (let i = 0; i < find.blocked.length; i++)
			if (find.blocked[i].uuid === Useruuid)
				return (2);
		for (let i = 0; i < find.blockedby.length; i++)
			if (find.blockedby[i].uuid === Useruuid)
				return (3);
	}
    return find;
  }


  async ListFriendsWithUuid(uuid: string) {
    const find = (await this.userRepository.find()).filter((user) => user.uuid === uuid)[0];
    if (find)
		return find.friends;
    return [];
  }

  async Leaderboard() {
	const find = (await this.userRepository.find()).sort((a, b) => b.exp - a.exp);
	if (find)
		return find;
	return [];
  }

  async Ranking(uuid : string) {
	const find = await this.Leaderboard();
	if (find)
	{
		for (let i = 0; i < find.length; i++)
			if (find[i].uuid === uuid)
				return (i + 1);
		return 1;
	}
	return 1;
  }

  async GetProfilesWithUuidTab(listUuid: any[]) {
    let user: any;
    let userSend: any;
    const tab: any[] = [];
    for (let i = 0; i < listUuid.length; i++) {
      user = await this.findUserByUuid(listUuid[i].uuid);
      if (user) {
        userSend = plainToClass(SendUserDto, user, {
          excludeExtraneousValues: true,
        });
        tab.push(userSend);
      }
    }
    return tab;
  }

  async ListFriendsRequestedWithUuid(uuid: string) {
    const find = (await this.userRepository.find()).filter(
      (user) => user.uuid === uuid,
    )[0];
    if (find)
		return find.friendsNotacceptedYet;
    return null;
  }

  async ListFriendsRequestWithUuid(uuid: string) {
    const find = (await this.userRepository.find()).filter(
      (user) => user.uuid === uuid,
    )[0];
    if (find)
		return find.friendRequest;
    return null;
  }

  async ListUsernameFriendsRequestWithUuid(uuid: string) {
    const find = (await this.userRepository.find()).filter(
      (user) => user.uuid === uuid,
    )[0];
    if (find) {
      let usernameList: any[] = [];
      for (let i = 0; i < find.friendRequest.length; i++) {
        usernameList.push(
          plainToClass(
            SendUserDto,
            await this.findUserByUuid(find.friendRequest[i].uuid),
            { excludeExtraneousValues: true },
          ),
        );
      }
      return usernameList;
    }
    return null;
  }

  async ListBlockedWithUuid(uuid: string) {
    const find = (await this.userRepository.find()).filter((user) => user.uuid === uuid)[0];
    if (find)
		return find.blocked;
    return null;
  }

  async ListBlockedByWithUuid(uuid: string) {
    const find = (await this.userRepository.find()).filter((user) => user.uuid === uuid)[0];
    if (find)
		return find.blockedby;
    return null;
  }

  async getExp(uuid: string) {
    const find = (await this.userRepository.find()).filter((user) => user.uuid === uuid)[0];
    if (find)
		return find.exp;
    return (undefined);
  }

  async addExp(uuid: string, exp : number) {
    const find = (await this.userRepository.find()).filter((user) => user.uuid === uuid)[0];
    if (find) {
      let oldexp = find.exp;
      if (Number(oldexp))
      {
        exp = exp - (Math.floor(Number(oldexp)) * 2 / 100);
        if (exp < 0)
          exp = 0;
      }
      let newexp : number;
      if (Number((Number(oldexp) + Number(exp)).toFixed(2)) > 21.00)
        newexp = 21.00;
      else
        newexp = Number((Number(oldexp) + Number(exp)).toFixed(2));
      await this.userRepository.update({ uuid }, { exp :  newexp});
      return 1;
    }
    return 0;
  }

  async IsFriendByUuid(uuid: string, userUuid: string) {
    const find = (await this.userRepository.find()).filter(
      (user) => user.uuid === userUuid,
    )[0];
    if (find) return find.friends.filter((user) => user.uuid === uuid);
    return null;
  }

  async addUserByUuid(uuid: string, User: UserModel) {
    const find = (await this.userRepository.find()).filter(
      (user) => user.uuid === uuid,
    )[0];
    if (find) {
      if (uuid === User.uuid) return 2;
      if (
        find.blocked.filter((user) => user.uuid === User.uuid).length ||
        find.blockedby.filter((user) => user.uuid === User.uuid).length ||
        User.blocked.filter((user) => user.uuid === uuid).length ||
        User.blockedby.filter((user) => user.uuid === uuid).length
      )
        return 5;
      if (User.friends) {
        for (let i = 0; User.friends[i]; i++) {
          if (User.friends[i].uuid === uuid) return 3;
        }
      }
      if (find.friendRequest) {
        for (let i = 0; find.friendRequest[i]; i++) {
          if (find.friendRequest[i].uuid === User.uuid) return 4;
        }
      }
      if (find.friendsNotacceptedYet) {
        for (let i = 0; find.friendsNotacceptedYet[i]; i++) {
          if (find.friendsNotacceptedYet[i].uuid === User.uuid) return 6;
        }
      }
      let newList: Ifriends[] = [];
      const askFriend: Ifriends = {
        uuid: User.uuid,
      };
      if (!find.friendRequest) newList.push(askFriend);
      else {
        newList = find.friendRequest;
        newList.push(askFriend);
      }
      await this.userRepository.update(uuid, { friendRequest: newList });
      newList = [];
      askFriend.uuid = uuid;
      if (!User.friendsNotacceptedYet) newList.push(askFriend);
      else {
        newList = User.friendsNotacceptedYet;
        newList.push(askFriend);
      }
      await this.userRepository.update(User.uuid, {
        friendsNotacceptedYet: newList,
      });
      return 1;
    }
    return 0;
  }

  async acceptUserByUuid(uuid: string, User: UserModel) {
    const find = (await this.userRepository.find()).filter(
      (user) => user.uuid === uuid,
    )[0];
    if (find) {
      if (User.friendRequest) {
        let i = 0;
        for (i = 0; User.friendRequest[i]; i++) {
          if (User.friendRequest[i].uuid === uuid) {
            let newList: Ifriends[] = [];
            let removeRequest: Ifriends[] = User.friendRequest;
            const newFriend: Ifriends = {
              uuid: uuid,
            };
            if (!User.friends) newList.push(newFriend);
            else {
              newList = User.friends;
              newList.push(newFriend);
            }
            removeRequest.splice(i, 1);
            await this.userRepository.update(User.uuid, { friends: newList });
            await this.userRepository.update(User.uuid, {
              friendRequest: removeRequest,
            });
            newList = [];
            newFriend.uuid = User.uuid;
            if (!find.friends) newList.push(newFriend);
            else {
              newList = find.friends;
              newList.push(newFriend);
            }
            await this.userRepository.update(uuid, { friends: newList });
            if (find.friendsNotacceptedYet) {
              for (i = 0; find.friendsNotacceptedYet[i]; i++) {
                if (find.friendsNotacceptedYet[i].uuid === User.uuid) {
                  removeRequest = find.friendsNotacceptedYet;
                  removeRequest.splice(i, 1);
                }
              }
              await this.userRepository.update(uuid, {
                friendsNotacceptedYet: removeRequest,
              });
            }
            return 1;
          }
        }
        if (i == 0) return 3;
        return 2;
      }
      return 3;
    }
    return 0;
  }

  async blockUserByUuid(uuid: string, User: UserModel) {
    const find = (await this.userRepository.find()).filter(
      (user) => user.uuid === uuid,
    )[0];
    if (find) {
      if (uuid === User.uuid) return 2;
      if (User.blocked) {
        for (let i = 0; User.blocked[i]; i++) {
          if (User.blocked[i].uuid === uuid) return 3;
        }
      }
      let newList: Ifriends[] = [];
      let blockUser: Ifriends = {
        uuid: User.uuid,
      };
      if (!find.blockedby) newList.push(blockUser);
      else {
        newList = find.blockedby;
        newList.push(blockUser);
      }
      await this.userRepository.update(uuid, { blockedby: newList });
      newList = [];
      blockUser.uuid = uuid;
      if (!User.blocked) newList.push(blockUser);
      else {
        newList = User.blocked;
        newList.push(blockUser);
      }
      await this.userRepository.update(User.uuid, { blocked: newList });
      let removeBlocked: Ifriends[] = [];
      let verify: boolean = false;
      if (find.friends) {
        for (let i = 0; find.friends[i]; i++) {
          if (find.friends[i].uuid === User.uuid) {
            removeBlocked = find.friends;
            removeBlocked.splice(i, 1);
            verify = true;
          }
        }
        if (verify)
          await this.userRepository.update(uuid, { friends: removeBlocked });
      }
      removeBlocked = [];
      verify = false;
      if (User.friends) {
        for (let i = 0; User.friends[i]; i++) {
          if (User.friends[i].uuid === uuid) {
            removeBlocked = User.friends;
            removeBlocked.splice(i, 1);
            verify = true;
          }
        }
        if (verify)
          await this.userRepository.update(User.uuid, {
            friends: removeBlocked,
          });
      }
      removeBlocked = [];
      verify = false;
      if (User.friendsNotacceptedYet) {
        for (let i = 0; User.friendsNotacceptedYet[i]; i++) {
          if (User.friendsNotacceptedYet[i].uuid === uuid) {
            removeBlocked = User.friendsNotacceptedYet;
            removeBlocked.splice(i, 1);
            verify = true;
          }
        }
        if (verify)
          await this.userRepository.update(User.uuid, {
            friendsNotacceptedYet: removeBlocked,
          });
      }
      removeBlocked = [];
      verify = false;
      if (User.friendRequest) {
        for (let i = 0; User.friendRequest[i]; i++) {
          if (User.friendRequest[i].uuid === uuid) {
            removeBlocked = User.friendRequest;
            removeBlocked.splice(i, 1);
            verify = true;
          }
        }
        if (verify)
          await this.userRepository.update(User.uuid, {
            friendRequest: removeBlocked,
          });
      }
      removeBlocked = [];
      verify = false;
      if (find.friendRequest) {
        for (let i = 0; find.friendRequest[i]; i++) {
          if (find.friendRequest[i].uuid === User.uuid) {
            removeBlocked = find.friendRequest;
            removeBlocked.splice(i, 1);
            verify = true;
          }
        }
        if (verify)
          await this.userRepository.update(uuid, {
            friendRequest: removeBlocked,
          });
      }
      removeBlocked = [];
      verify = false;
      if (find.friendsNotacceptedYet) {
        for (let i = 0; find.friendsNotacceptedYet[i]; i++) {
          if (find.friendsNotacceptedYet[i].uuid === User.uuid) {
            removeBlocked = find.friendsNotacceptedYet;
            removeBlocked.splice(i, 1);
            verify = true;
          }
        }
        if (verify)
          await this.userRepository.update(uuid, {
            friendsNotacceptedYet: removeBlocked,
          });
      }
      return 1;
    }
    return 0;
  }

  async removeFriendByUuid(uuid: string, User: UserModel) {
    const find = (await this.userRepository.find()).filter(
      (user) => user.uuid === uuid,
    )[0];
    if (find) {
      if (uuid === User.uuid) return 2;
      if (User.friends) {
        let i: number = 0;
        for (i = 0; User.friends[i]; i++) {
          if (User.friends[i].uuid === uuid) {
            let removeFriend: Ifriends[] = [];
            let verify: boolean = false;
            if (find.friends) {
              for (let j = 0; find.friends[j]; j++) {
                if (find.friends[j].uuid === User.uuid) {
                  removeFriend = find.friends;
                  removeFriend.splice(j, 1);
                  verify = true;
                }
              }
              if (verify)
                await this.userRepository.update(uuid, {
                  friends: removeFriend,
                });
            }
            removeFriend = [];
            if (User.friends) {
              removeFriend = User.friends;
              removeFriend.splice(i, 1);
              await this.userRepository.update(User.uuid, {
                friends: removeFriend,
              });
            }
            return 1;
          }
        }
        return 3;
      }
      return 4;
    }
    return 0;
  }

  async cancelFriendAddByUuid(uuid: string, User: UserModel) {
    const find = (await this.userRepository.find()).filter(
      (user) => user.uuid === uuid,
    )[0];
    if (find) {
      if (uuid === User.uuid) return 2;
      if (User.friendsNotacceptedYet) {
        let i: number = 0;
        for (i = 0; User.friendsNotacceptedYet[i]; i++) {
          if (User.friendsNotacceptedYet[i].uuid === uuid) {
            let removeFriend: Ifriends[] = [];
            let verify: boolean = false;
            if (find.friendRequest) {
              for (let j = 0; find.friendRequest[j]; j++) {
                if (find.friendRequest[j].uuid === User.uuid) {
                  removeFriend = find.friendRequest;
                  removeFriend.splice(j, 1);
                  verify = true;
                }
              }
              if (verify)
                await this.userRepository.update(uuid, {
                  friendRequest: removeFriend,
                });
            }
            removeFriend = [];
            if (User.friendsNotacceptedYet) {
              removeFriend = User.friendsNotacceptedYet;
              removeFriend.splice(i, 1);
              await this.userRepository.update(User.uuid, {
                friendsNotacceptedYet: removeFriend,
              });
            }
            return 1;
          }
        }
        return 3;
      }
      return 4;
    }
    return 0;
  }

  async refuseFriendAddByUuid(uuid: string, User: UserModel) {
    const find = (await this.userRepository.find()).filter(
      (user) => user.uuid === uuid,
    )[0];
    if (find) {
      if (uuid === User.uuid) return 2;
      if (User.friendRequest) {
        let i: number = 0;
        for (i = 0; User.friendRequest[i]; i++) {
          if (User.friendRequest[i].uuid === uuid) {
            let removeFriend: Ifriends[] = [];
            let verify: boolean = false;
            if (find.friendsNotacceptedYet) {
              for (let j = 0; find.friendsNotacceptedYet[j]; j++) {
                if (find.friendsNotacceptedYet[j].uuid === User.uuid) {
                  removeFriend = find.friendsNotacceptedYet;
                  removeFriend.splice(j, 1);
                  verify = true;
                }
              }
              if (verify)
                await this.userRepository.update(uuid, {
                  friendsNotacceptedYet: removeFriend,
                });
            }
            removeFriend = [];
            if (User.friendRequest) {
              removeFriend = User.friendRequest;
              removeFriend.splice(i, 1);
              await this.userRepository.update(User.uuid, {
                friendRequest: removeFriend,
              });
            }
            return 1;
          }
        }
        return 3;
      }
      return 4;
    }
    return 0;
  }

  async unblockUserByUuid(uuid: string, User: UserModel) {
    const find = (await this.userRepository.find()).filter(
      (user) => user.uuid === uuid,
    )[0];
    if (find) {
      if (uuid === User.uuid) return 2;
      let verify: boolean = false;
      if (User.blocked) {
        for (let i = 0; User.blocked[i]; i++) {
          if (User.blocked[i].uuid === uuid) {
            let blockedList: Ifriends[] = User.blocked;
            blockedList.splice(i, 1);
            await this.userRepository.update(User.uuid, {
              blocked: blockedList,
            });
            verify = true;
          }
        }
      }

      if (!verify) return 3;

      if (find.blockedby) {
        for (let i = 0; find.blockedby[i]; i++) {
          if (find.blockedby[i].uuid === User.uuid) {
            let blockedByList: Ifriends[] = find.blockedby;
            blockedByList.splice(i, 1);
            await this.userRepository.update(uuid, {
              blockedby: blockedByList,
            });
            verify = true;
          }
        }
      }
      if (!verify) return 3;

      return 1;
    }
    return 0;
  }

  async findUsersByUsername(username: string, UserUuid: string) {
    function containsPlayer(oneUser: UserModel) {
      if (oneUser.uuid === UserUuid)
	  	return true;
      return false;
    }

    const containsName = (user: UserModel, username: string) => {
      if (user.username.includes(username) || user.trueUsername.includes(username))
	  	return true;
      return false;
    };

    const find = await this.userRepository.find();
    return find.filter(
      (user) => (containsName(user, username) && !containsPlayer(user)) === true,
    );
  }

  async findUserByUsername(username: string, Useruuid : string) {
	const find = (await this.userRepository.find()).filter((user) => user.trueUsername === username)[0];
	if (find)
	{
		for (let i = 0; i < find.blocked.length; i++)
			if (find.blocked[i].uuid === Useruuid)
				return (2);
		for (let i = 0; i < find.blockedby.length; i++)
			if (find.blockedby[i].uuid === Useruuid)
				return (3);
	}
    return find;
  }

  async ChangeUsername(uuid: string, newName: string) {
    const alreadyexist = await this.userRepository.find({
      where: { username: newName },
    });
    if (alreadyexist[0]) return 0;
    const user = (await this.userRepository.find()).filter(
      (user) => user.uuid === uuid,
    )[0];
    if (user) {
      await this.userRepository.update({ uuid }, { username: newName });
      return 1;
    }
    return 0;
  }

  async ChangeAvatar(uuid: string, newAvatar: Buffer, type : string) {
    const user = (await this.userRepository.find()).filter(
      (user) => user.uuid === uuid,
    )[0];
    if (user) {
		const path = "./src/uploads/avatar/";
		if (type.includes("image/"))
			type = type.slice(6);
		const name = uuidv4() + "." + type;
		try 
		{
			//delete img
			await fs.unlink(path + user.image);
		}
		catch
		{}
		try
		{
			await fs.writeFile(path + name, newAvatar);
		}
		catch (err)
		{
			return (2);
		}
      await this.userRepository.update({ uuid }, { image: name});
      return 1;
    }
    return 0;
  }

  async getUsers(): Promise<UserModel[]> {
    return await this.userRepository.find();
  }

  async clearDatabase() {
    console.log('Clear database in progress :');
    const list = await this.userRepository.find();
    for (let i = 0; i < list.length; i++) {
      await this.userRepository.remove(list[i]);
    }
    console.log('done');
  }

  //   async getMyUser(userId: any) : Promise<UserModel> {
  // 	const findUser = (await this.userRepository.find({ where: { id: userId} }));
  // 	if (findUser[0])
  // 		return (findUser[0]);
  // 	return ;
  //   }
}
