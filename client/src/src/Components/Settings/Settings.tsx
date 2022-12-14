
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createNotification } from "../notif/Notif";
import React from "react";
import { IoIosFolderOpen } from "react-icons/io"
import { BsArrowRightCircleFill } from 'react-icons/bs'
import { Tb2Fa } from 'react-icons/tb'
import { ImCross } from "react-icons/im";
import './Settings.scss'
import { useDispatch, useSelector } from "react-redux";
import { getUserImg, setHistoryList, setUserImg, setUserUsername } from "../../Redux/userSlice";
import instance from "../../API/Instance";

function Settings() {
	let navigate = useNavigate();
	let booleffect = false;
	const [changename, setChangename] = useState<string>();
	const [changeavatar, setChangeavatar] = useState<any>();
	const [fileName, setFileName] = useState<string>("");

	const [QrCode, setQrCode] = useState<Blob>();
	const [TurnedOff, setTurnedOff] = useState<boolean>(false);
	const [authCode, setAuthCode] = useState<string>();
	const token = localStorage.getItem("token");

	const [booleffect2, setbooleffect2] = useState<boolean>(true);

	const [User, setUser] = useState<any>();
	const [IsTwoAuthActivated, setActivated] = useState<boolean>();
	const [IsTwoAuthConnected, setConnected] = useState<boolean>();


	const dispatch = useDispatch();
	const userImg = useSelector(getUserImg);
	async function GetLoggedInfoAndUser() {
		if (localStorage.getItem("token")) {
			await instance.get(`user/getLoggedInfo`, {
				headers: {
					Authorization: "Bearer " + localStorage.getItem("token"),
				},
			})
				.then((res) => {
					setActivated(res.data.isTwoFactorAuthenticationEnabled);
					setConnected(res.data.isSecondFactorAuthenticated);
				});
			await instance.get(`user`, {
				headers: {
					Authorization: "Bearer " + localStorage.getItem("token"),
				},
			})
				.then((res) => {
					setUser(res.data.User);
					dispatch(setUserImg(import.meta.env.VITE_URL_API + ":7000/" + res.data.User.image));
					dispatch(setUserUsername(res.data.User.username));
				})
				.catch((err) => {
					setUser(undefined);
					navigate("/");
				});
		} else {
			navigate("/");
		}
		setbooleffect2(false);
	}

	async function reloadHistoryList() {
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
	}

	function setOfAuthStatus() {
		setTurnedOff(true);
	}

	const DeactivatedTwoAuth = async (event: any) => {
		event.preventDefault();
		await instance.post(`2fa/turn-off`,
			{ twoFactorAuthenticationCode: authCode },
			{
				headers: {
					Authorization: "Bearer " + token,
				},
			}
		)
			.then((res) => {
				GetLoggedInfoAndUser();
				createNotification("success", "two auth auth succefully deactivated");
				setTurnedOff(false);
				setQrCode(undefined);
			})
			.catch((err) => {
				createNotification("error", err.response.data.message);
			});
	};
	const ChangeUsername = async (event: any) => {
		event.preventDefault();
		await instance.post(`user/changeUsername`,
			{ newName: changename },
			{
				headers: {
					Authorization: "Bearer " + token,
				},
			}
		)
			.then((res) => {
				GetLoggedInfoAndUser();
				reloadHistoryList();
				createNotification("success", "Username succefuly changed");
			})
			.catch((err) => {
				createNotification(
					"error",
					err.response.data.message
				);
			});
	};

	const AvatarFile = async (event: any) => {
		const size  = Number((event.target.files[0].size / 1024 / 1024).toFixed(2));
		if (size > 10)
		{
			createNotification("error", "File too big , try uploading an image of less than 10Mb");
			return;
		}
		setChangeavatar(event.target.files[0]);
		setFileName(event.target.files[0]?.name);
	}
	const ChangeAvatar = async (event: any) => {
		event.preventDefault();
		if (changeavatar) {
			const data = new FormData();
			data.append("file", changeavatar, changeavatar.name);
			setFileName("");
			setChangeavatar(undefined)

			await instance({
				url: `user/changeAvatar`,
				method: "POST",
				data: data,
				headers: {
					'Content-Type': "multipart/form-data"
				}
			})
				.then((res) => {
					GetLoggedInfoAndUser();
					createNotification("success", "Avatar succefully changed");
				})
				.catch((err) => {
					createNotification("error", err.response.statusText);
				});
		}
	};

	const GetQrCode = async (event: any) => {
		event.preventDefault();
		await instance.post(`2fa/generate`,
			{},
			{
				headers: {
					Authorization: "Bearer " + token,
				},
				responseType: "blob",
			}
		)
			.then((res) => {
				setQrCode(res.data);
			})
			.catch((err) => {
				createNotification("error", err.response.statusText);
			});
	};

	const ActivateTwoAuth = async (event: any) => {
		event.preventDefault();
		await instance.post(`2fa/turn-on`,
			{ twoFactorAuthenticationCode: authCode },
			{
				headers: {
					Authorization: "Bearer " + token,
				},
			}
		)
			.then((res) => {
				GetLoggedInfoAndUser();
			});

		await instance.post(`2fa/authenticate`,
			{ twoFactorAuthenticationCode: authCode },
			{
				headers: {
					Authorization: "Bearer " + token,
				},
			}
		)
			.then((res) => {
				createNotification("success", res.data.message);
				GetLoggedInfoAndUser();
			})
			.catch((err) => {
				createNotification("error", err.response.data.message);
			});
	};

	useEffect(() => {
		if (!booleffect) {
			GetLoggedInfoAndUser();
			booleffect = true;
		}
	}, []);
	return (
		<div className="SettingsPage">
			{
				!booleffect2 ?
					(
						<>
							{
								User ?
									(
										<div className="Container">
											<div id="UsernameGroup">
												<h3> Current username : {User.username} </h3>
												<div className="line"></div>
												<h3>
													New Username
												</h3>
												<form id="UsernameForm" onSubmit={ChangeUsername}>
													<input
														type="text"
														id="name"
														name="name"
														required
														minLength={1}
														maxLength={10}
														onChange={(e) => setChangename(e.target.value)}
													/>
													<button title="submit" className="clickset" type="submit"><span><BsArrowRightCircleFill /></span></button>
												</form>
											</div>
											<div id="AvatarGroup">
												<h3>
													Current Avatar :
												</h3>
												<img
													src={userImg}
													alt="user_img"
													width="96"
													height="64"
												/>
												<div className="line"></div>
												<h3>
													New Avatar
												</h3>
												<form title="choose file" id="AvatarForm" onSubmit={ChangeAvatar}>
													<label htmlFor="avatar"><IoIosFolderOpen /></label>
													<input
														type="file"
														id="avatar"
														name="avatar"
														required
														onChange={(e) =>
															e.target.files != null
																? AvatarFile(e)
																: null
														}
													/>
													<p> {fileName}</p>
													<button title="submit" className="clickset" type="submit" ><span><BsArrowRightCircleFill /></span></button>
												</form>
											</div>
											<div id="QrCodeGroup">
												<div id="Activate2auth">
													{
														!IsTwoAuthActivated && !QrCode ?
															(
																<button title="Activate two factor auth" className="clickset" onClick={(e) => GetQrCode(e)}> <span><Tb2Fa /></span></button>
															)
															:
															null
													}
												</div>
												{!IsTwoAuthActivated ? (
													QrCode ? (
														<div id="QrCodeOpened">
															<img src={URL.createObjectURL(QrCode)} alt="QrCode" />
															<h3>
																Please enter your 6 digit code after scanning the
																QR Code in the Google Authenticator app :
															</h3>
															<form onSubmit={ActivateTwoAuth}>
																<input
																	type="text"
																	id="code"
																	name="code"
																	required
																	onChange={(e) => setAuthCode(e.target.value)}
																/>
																<button title="submit" className="clickset" type="submit"><span><BsArrowRightCircleFill /></span></button>
																<button onClick={() => setQrCode(undefined)}> <span id="cancel2auth"><ImCross /></span> </button>
															</form>
														</div>
													) :
														null
												)
													: (
														<div id="TwoAuthActivated">
															{TurnedOff ? (
																<>
																	<h3>
																		Please enter your 6 digit code to deactivate two auth authentication : &nbsp;
																	</h3>
																	<form onSubmit={DeactivatedTwoAuth}>
																		<input
																			type="text"
																			id="code"
																			name="code"
																			required
																			onChange={(e) =>
																				setAuthCode(e.target.value)
																			}
																		/>
																		<button title="submit" className="clickset" type="submit"><span><BsArrowRightCircleFill /></span></button>
																		<button onClick={() => setTurnedOff(false)}> <span id="cancelDesac"><ImCross /></span> </button>
																	</form>
																</>
															) :
																<button onClick={setOfAuthStatus}>
																	<h3>Desactivate two auth</h3>
																</button>
															}
														</div>
													)}

											</div>
										</div>
									)
									:
									null
							}
						</>
					)
					:
					<h3> Loading .... </h3>
			}
		</div>
	);
}

export default Settings;
