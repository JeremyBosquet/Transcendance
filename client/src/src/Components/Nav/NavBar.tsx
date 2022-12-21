import axios from "axios";
import React from "react";
import { useEffect, useState } from "react";
import {
  redirect,
  useNavigate,
  useLocation,
  useParams,
  NavLink,
} from "react-router-dom";
import { createNotification } from "../notif/Notif";
import { FaUserCircle, FaUserFriends } from "react-icons/fa";
import { IoMdChatbubbles, IoMdSettings } from "react-icons/io";
import { IoLogOutSharp } from "react-icons/io5";
import { IoGameController } from "react-icons/io5";
import { BsFillEyeFill } from "react-icons/bs";
import { GrClose } from "react-icons/gr";
import {AiOutlineClose} from "react-icons/ai";
import './NavBar.scss';
import Social from "../Social/Social";
import { useDispatch, useSelector } from "react-redux";
import { getSockeGame, getSockeGameChat, getSockeSpectate, setSocketGame, setSocketGameChat, setSocketSpectate } from "../../Redux/gameSlice";
import Settings from "../Settings/Settings";

function NavBar(props: any) {
  let location = useLocation();
  let booleffect = false;
  let tab: any[] = [];
  const [compt, setCompt] = useState<number>(0);
  const [booleffect2, setbooleffect2] = useState<boolean>(true);
  const [socialOpened, setSocialOpened] = useState<boolean>(false);
  const [settingsOpened, setSettingsOpened] = useState<boolean>(false);

  const [User, setUser] = useState<any>();
  const [IsTwoAuthActivated, setActivated] = useState<boolean>();
  const [IsTwoAuthConnected, setConnected] = useState<boolean>();
  const [friendRequest, setFriendRequest] = useState<number>();

  

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
        })
        .catch((err) => {
          console.log(err.message);
        });
      await instance.get(`user/ListFriendRequest`, {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        })
        .then((res) => {
          tab = res.data.ListFriendsRequest;
          if (tab.length) {
            setFriendRequest(tab.length);
          } else setFriendRequest(0);
          setCompt(tab.length);
        })
        .catch((err) => {
          console.log(err.message);
          setFriendRequest(0);
        });
    }
    setbooleffect2(false);
  }


  /* Set the width of the side navigation to 250px */
  function openSocial() {
	  	if (socialOpened)
		  	setSocialOpened(false);
		else
			setSocialOpened(true);
		if (settingsOpened)
		{
			const openOrClose = document.getElementById("mySidenavSettings");
			openOrClose?.classList.toggle("active");
			const revealOrHide = document.getElementById("navButtons");
			revealOrHide?.classList.toggle("hidden");
			setSettingsOpened(false);
		}
		const openOrClose = document.getElementById("mySidenavSocial");
		openOrClose?.classList.toggle("active");
		const revealOrHide = document.getElementById("navButtons");
		revealOrHide?.classList.toggle("hidden");
  }

  function openSettings() {
	if (settingsOpened)
		setSettingsOpened(false);
	else
		setSettingsOpened(true);
	if (socialOpened)
	{
		const openOrClose = document.getElementById("mySidenavSocial");
		openOrClose?.classList.toggle("active");
		const revealOrHide = document.getElementById("navButtons");
		revealOrHide?.classList.toggle("hidden");
		setSocialOpened(false);
	}
	const openOrClose = document.getElementById("mySidenavSettings");
	openOrClose?.classList.toggle("active");
	const revealOrHide = document.getElementById("navButtons");
	revealOrHide?.classList.toggle("hidden");
}

  useEffect(() => {
    if (!booleffect) {
      GetLoggedInfo();
      // CallLogout()
      booleffect = true;
    }
  }, []);

  const socketGame = useSelector(getSockeGame);
  const socketSpectate = useSelector(getSockeSpectate);
  const socketChatGame = useSelector(getSockeGameChat);
  const dispatch = useDispatch();
  function closeSocketGame() {
    if (socketGame)
      socketGame.disconnect();
      dispatch(setSocketGame(null));
  }
  function closeSocketSpectate() {
    if (socketSpectate)
    socketSpectate.disconnect();
    dispatch(setSocketSpectate(null));
  }
  function closeSocketChatGame() {
    if (socketChatGame)
    socketChatGame.disconnect();
    dispatch(setSocketGameChat(null));
  }
  const handleClickNav = (pathname: string) => {
    if (!location.pathname.startsWith(pathname) && pathname == "/game")
      closeSocketGame();
    if (!location.pathname.startsWith(pathname) && pathname == "/game/spectate")
    closeSocketSpectate();
    if (!location.pathname.startsWith(pathname) && pathname == "/chat")
    closeSocketChatGame();
  }

  return (
    <div className="NavBar">
            <div id='ProjectName'>
              <NavLink to="/" id='home'>
                Ft_transcendance
              </NavLink>
			</div>
        <>
            <div id="navButtons">
			<NavLink to="/chat" id="chat" className="click" onClick={() => handleClickNav("/chat")}>
                <IoMdChatbubbles className="icon" />
            </NavLink>
			
			<>
                {friendRequest ? (
                  <button id="social" className="click" onClick={() => {openSocial()}}>
                        <FaUserFriends className="icon"/>
                    {/* <button id='menu_text' onClick={() => {
                    socket?.disconnect();
                    setSocket(undefined);
                    navigate("/social")
                  }}> Social({compt}) </button> */}
                  </button>
                ) : (
                  <button id="social" className="click" onClick={() => {openSocial()}}>
                        <FaUserFriends className="icon"/>
                    {/* <button id='menu_text' onClick={() => {
                  socket?.disconnect();
                  setSocket(undefined);
                  navigate("/social")
                }}> Social </button> */}
                  </button>
                )}
              </>

              {/* <NavLink to="/game" id="game" className="click" onClick={() => handleClickNav("/game")}>
                <IoGameController className="icon"/>
              </NavLink> */}
              
              <NavLink to="/game/spectate" id="spectate" className="click" onClick={() => handleClickNav("/game/spectate")}>
                <BsFillEyeFill className="icon"/>
              </NavLink>

			  <button id="settings" className="click" onClick={() => {openSettings()}}>
                <IoMdSettings className="icon"/>
              </button>

              <NavLink to="/logout" id="logout" className="click">
                <IoLogOutSharp className="icon"/>
              </NavLink>
            </div>
            <div id="mySidenavSocial" className="sidenavSocial">
              <button className="closebtn" onClick={() => openSocial()}>
                <span>
                <AiOutlineClose />
                </span>
              </button>
              <Social/>
            </div>
			<div id="mySidenavSettings" className="sidenavSettings">
              <button className="closebtn" onClick={() => openSettings()}>
                <span>
                <AiOutlineClose />
                </span>
              </button>
			  <Settings/>
            </div>
        </>
    </div>
  );
}

export default NavBar;