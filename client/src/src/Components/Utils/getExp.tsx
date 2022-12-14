import React from "react";
import instance from "../../API/Instance";

export async function getExp(uuid: string, setProfileExp: any) {
	await instance.get(`user/getExp/` + uuid, {
		headers: {
			Authorization: "Bearer " + localStorage.getItem("token"),
		},
	})
		.then((res) => {
			if (res.data) {
				setProfileExp(res.data.Exp);
				let elem = document.getElementsByClassName('exp');
				let cut: number;
				if (res.data.Exp === "21.00")
					cut = 100;
				else
				{
					if (res.data.Exp.length == 4)
						cut = res.data.Exp.slice(2);
					else
						cut = res.data.Exp.slice(3);
				}
				for (let i = 0; elem[i]; i++) {
					(elem[i] as HTMLElement).style.setProperty('--expAmount', cut.toString() + '%');
				}
			}
		})
		.catch((err) => {
			setProfileExp(0.00);
			let elem = document.getElementsByClassName('exp');
			for (let i = 0; elem[i]; i++) {
				(elem[i] as HTMLElement).style.setProperty('--expAmount', '00%');
			}
		});
}

export async function getExpProfile(uuid: string, setProfileExp: any) {
	await instance.get(`user/getExp/` + uuid, {
		headers: {
			Authorization: "Bearer " + localStorage.getItem("token"),
		},
	})
		.then((res) => {
			if (res.data) {
				setProfileExp(res.data.Exp);
				let elem = document.getElementsByClassName('Exp');
				let cut: number;
				if (res.data.Exp === "21.00")
					cut = 100;
				else
				{
					if (res.data.Exp.length == 4)
						cut = res.data.Exp.slice(2);
					else
						cut = res.data.Exp.slice(3);
				}
				cut *= 0.8;
				for (let i = 0; elem[i]; i++) {
					(elem[i] as HTMLElement).style.setProperty('--expAmount', cut.toString() + '%');
				}
			}
		})
		.catch((err) => {
			setProfileExp(0.00);
			let elem = document.getElementsByClassName('Exp');
			for (let i = 0; elem[i]; i++) {
				(elem[i] as HTMLElement).style.setProperty('--expAmount', '00%');
			}
		});
}

export async function getMyExp(uuid: string, setProfileExp: any) {
	await instance.get(`user/getExp/` + uuid, {
		headers: {
			Authorization: "Bearer " + localStorage.getItem("token"),
		},
	})
		.then((res) => {
			if (res.data) {
				setProfileExp(res.data.Exp);
				let elem = document.getElementsByClassName('myExp');
				let cut: number;
				if (res.data.Exp === "21.00")
					cut = 100;
				else
				{
					if (res.data.Exp.length == 4)
						cut = res.data.Exp.slice(2);
					else
						cut = res.data.Exp.slice(3);
				}
				for (let i = 0; elem[i]; i++) {

					(elem[i] as HTMLElement).style.setProperty('--expAmount', cut.toString() + '%');
				}
			}
			else {
				setProfileExp(0.00);
				let elem = document.getElementsByClassName('myExp');
				for (let i = 0; elem[i]; i++) {
					(elem[i] as HTMLElement).style.setProperty('--expAmount', '0%');
				}
			}
		})
		.catch((err) => {
			setProfileExp(0.00);
			let elem = document.getElementsByClassName('myExp');
			for (let i = 0; elem[i]; i++) {
				(elem[i] as HTMLElement).style.setProperty('--expAmount', '0%');
			}
		});
}