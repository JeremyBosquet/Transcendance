
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createNotification } from "../../Components/notif/Notif";
import React from "react";
import KillSocket from "../../Components/KillSocket/KillSocket";
import instance from "../../API/Instance";
import { Helmet } from "react-helmet";
import { BsArrowRightCircleFill } from 'react-icons/bs'
import "./TwoAuth.scss";
import { useDispatch, useSelector } from "react-redux";
import { getSocketSocial, setSocketSocial } from "../../Redux/userSlice";
import { io } from "socket.io-client";

function TwoAuth() {
	KillSocket("all");
	let navigate = useNavigate();
	let booleffect = false;
	const [print, setPrint] = useState<boolean>();
	const [authCode, setAuthCode] = useState<string>();

	const [booleffect2, setbooleffect2] = useState<boolean>(true);

	const [User, setUser] = useState<any>();
	const [IsTwoAuthActivated, setActivated] = useState<boolean>(false);
	const [IsTwoAuthConnected, setConnected] = useState<boolean>(false);

	const dispatch = useDispatch();
	const socketSocial = useSelector(getSocketSocial);

	async function GetLoggedInfo() {
		if (localStorage.getItem("token")) {
			await instance.get(`user/getLoggedInfo`, {
				headers: {
					Authorization: "Bearer " + localStorage.getItem("token"),
				},
			})
				.then((res) => {
					setActivated(res.data.isTwoFactorAuthenticationEnabled);
					setConnected(res.data.isSecondFactorAuthenticated);
					setbooleffect2(false);
				})
				.catch((err) => {
					setbooleffect2(false);
				});
		} else {
			createNotification("error", "User not found");
			navigate("/");
		}
	}

	function setOfPrint() {
		if (IsTwoAuthActivated)
			setPrint(true);
		else
			setPrint(false);
	}

	const LogTwoAuth = async (event: any) => {
		event.preventDefault();
		await instance.post(`2fa/authenticate`,
			{ twoFactorAuthenticationCode: authCode },
			{
				headers: {
					Authorization: "Bearer " + localStorage.getItem("token"),
				},
			}
		)
			.then((res) => {
				createNotification("success", res.data.message);
				navigate("/");
			})
			.catch((err) => {
				createNotification("error", err.response.data.message);
			});
		if (IsTwoAuthConnected) {
			await instance.get(`user`, {
				headers: {
					Authorization: "Bearer " + localStorage.getItem("token"),
				},
			})
				.then((res) => {
					setUser(res.data.User);
					if (!socketSocial)
					{
						socketSocial?.close();
						const newSocketSocial = io(import.meta.env.VITE_URL_API + ':7003');
						newSocketSocial?.emit("connected", { uuid: res.data.User.uuid });
						dispatch(setSocketSocial(newSocketSocial));
					}
				});
		}
	};
	useEffect(() => {
		if (!booleffect) {
			GetLoggedInfo();
			booleffect = true;
		}
	}, []);
	useEffect(() => {
		if (!booleffect2)
			setOfPrint();
	}, [IsTwoAuthActivated]);
	return (
		<div className="TwoAuthPage">
			<Helmet>
				<meta charSet="utf-8" />
				<title> Two-Factor Auth - transcendence </title>
				<link rel="icon" type="image/png" href="/logo.png" />
			</Helmet>
			{print ? (
				<>
					<h2>
						Enter Google authenticator code
					</h2>
					<div className="Form">
						<form onSubmit={LogTwoAuth}>
							<input
								type="text"
								id="code"
								name="code"
								required
								onChange={(e) => setAuthCode(e.target.value)}
							/>
							<button type="submit"><span><BsArrowRightCircleFill /></span></button>
						</form>
					</div>
				</>
			) : (
				null
			)}
		</div>
	);
}

export default TwoAuth;
