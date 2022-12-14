
import React from "react"
import { useDispatch, useSelector } from "react-redux";
import { getFriendList, getProfilePage, getRequestList, getSocketSocial, setFriendList, setRequestList } from "../../../Redux/userSlice";
import { ImCheckmark } from "react-icons/im";
import instance from "../../../API/Instance";

interface props {
	User: any;
	UserUuid: string,
	UserImg: string,
}

function Accept(props: props) {
	const dispatch = useDispatch();
	const socket = useSelector(getSocketSocial);
	const friendList = useSelector(getFriendList);
	const requestList = useSelector(getRequestList);
	const profilePage = useSelector(getProfilePage);


	async function AcceptFriend(uuid: string, image: any) {
		const test: any[] = requestList.filter((friend: any) => friend.uuid === uuid)
		if (test.length) {
			await instance.post(`user/AcceptFriend`, { uuid: uuid }, {
				headers: ({
					Authorization: 'Bearer ' + localStorage.getItem('token'),
				})
			}).then((res) => {
				const request: any[] = requestList.filter((element: any) => element.uuid !== uuid);
				dispatch(setFriendList([...friendList, { uuid: uuid, username: test[0].username, image: image }]));
				dispatch(setRequestList(request));
				socket?.emit('acceptFriend', { uuid: uuid, myUUID: props.User.uuid });
			});
		}
	}

	return (
		props.UserUuid && props.UserImg ?
			<button onClick={() => (AcceptFriend(props.UserUuid, props.UserImg))} > <span className='green'><ImCheckmark /></span> </button>
			:
			<button onClick={() => (AcceptFriend(profilePage.uuid, profilePage.image))} > <span className='green'><ImCheckmark /></span> </button>
	);
}

export default Accept;