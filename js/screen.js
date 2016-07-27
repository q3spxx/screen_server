var auth;

var Ajax = {
	send: function (body, type) {
		var url;
		var callback;
		if (type == "time") {
			url = "/time";
			callback = Ajax.time;
		} else if (type == "getMovies") {
			url = "/handle";
			callback = Ajax.getMovies;
		} else if (type == "update") {
			url = "/update";
			callback = Ajax.update;
		} else if (type == "auth") {
			url = "/auth";
			callback = Ajax.auth;
		} else {
			return false;
		};

		$.ajax({
			url: url,
			type: "post",
			contentType: "application/json",
			dataType: "json",
			data: body,
			success: function (data) {
				callback(data);
			}
		});
	},
	update: function (data) {
		if (data.need_auth) {
			Ajax.send("", "auth");
			return;
		};

		if (data.update) {
			Table.getMovies();
		};
	},
	auth: function (data) {
		auth.token = data.token;
		if (Sys.screen == "waiting") {
			Sys.screen = "started";
			init();
		};
	},
	getMovies: function (data) {
		if (data.need_auth) {
			Ajax.send("", "auth");
			return;
		};

		Table.data = data.movies;
		Table.create_next_movie_arr();
		Render.clear();
		Table.create();
		Render.table();
	},
	time: function (data) {
		Time.date = new Date(data.date);
	}

}; 

var Table = {
	data: null,
	output: null,
	next_movie_arr: [],
	init: function () {
		Table.getMovies();
		setInterval(function () {
			Table.update();
		},
		5000);
	},
	create_next_movie_arr: function () {
		Table.next_movie_arr = [];
		Table.data.forEach(function (movie) {
			movie.sessions.forEach(function (session) {
				var time = session.time.split(":");
				Table.next_movie_arr.push({
					name: movie.name,
					time: session.time,
					hour: Number(time[0]),
					minute: Number(time[1])
				});
			});
		});

		Table.next_movie_arr = Table.next_movie_arr.sort(function (a, b) {
			var hour_a = a.hour;
			var hour_b = b.hour;
			if (a.hour >= 0 && a.hour < 4) {
				hour_a = a.hour + 24;
			};
			if (b.hour >= 0 && b.hour < 4) {
				hour_b = b.hour + 24;
			};

			if (hour_a < hour_b) {
				return -1;
			} else if (hour_a > hour_b) {
				return 1;
			} else {
				if (a.minute < b.minute) {
					return -1
				} else if (a.minute > b.minute) {
					return 1;
				} else {
					return 0;
				};
			};
		});

		while (Table.next_movie_arr[0]) {
			var n_hour = Table.next_movie_arr[0].hour;
			var s_hour = Time.date.getHours();
			if (n_hour >= 0 && n_hour < 4) {
				n_hour = n_hour + 24;
			};
			if (s_hour >= 0 && s_hour < 4) {
				s_hour = s_hour + 24;
			};

			if (n_hour > s_hour) {
				break;
			} else if (n_hour == s_hour) {
				if (Table.next_movie_arr[0].minute >= Time.date.getMinutes()) {
					break;
				};
			};

			Table.next_movie_arr.splice(0 , 1);
		};

		if (Table.next_movie_arr[0]) {
			Render.next_movie(0, Table.next_movie_arr[0].name, Table.next_movie_arr[0].time);
		};
		if (Table.next_movie_arr[1]) {
			Render.next_movie(1, Table.next_movie_arr[1].name, Table.next_movie_arr[1].time);
		};
	},
	next_movie_check: function () {
		if (!Table.next_movie_arr[0]) {
			return;
		};
		var n_hour = Table.next_movie_arr[0].hour;
		var s_hour = Time.date.getHours();
		if (n_hour >= 0 && n_hour < 4) {
			n_hour = n_hour + 24;
		};
		if (s_hour >= 0 && s_hour < 4) {
			s_hour = s_hour + 24;
		};

		if (n_hour < s_hour) {
			Table.next_movie_arr.splice(0, 1);
			if (Table.next_movie_arr[0]) {
				Render.next_movie(0, Table.next_movie_arr[0].name, Table.next_movie_arr[0].time);
				if (Table.next_movie_arr[1]) {
					Render.next_movie(1, Table.next_movie_arr[1].name, Table.next_movie_arr[1].time);
				} else {
					Render.next_movie(1, "--", "--");
				};
			} else {
				Render.next_movie(0, "--", "--");
			};
		} else if (n_hour == s_hour) {
			if (Table.next_movie_arr[0].minute <= Time.date.getMinutes()) {
				Table.next_movie_arr.splice(0, 1);
				if (Table.next_movie_arr[0]) {
					Render.next_movie(0, Table.next_movie_arr[0].name, Table.next_movie_arr[0].time);
					if (Table.next_movie_arr[1]) {
						Render.next_movie(1, Table.next_movie_arr[1].name, Table.next_movie_arr[1].time);
					} else {
						Render.next_movie(1, "--", "--");
					};
				} else {
					Render.next_movie(0, "--", "--");		
				};
			};
		};

	},
	update: function () {
		var body = JSON.stringify({
			token: auth.token
		});
		Ajax.send(body, "update");
	},
	getMovies: function () {
		var body = JSON.stringify({
			action: "getMovies",
			token: auth.token
		});
		Ajax.send(body, "getMovies");
	},

	CancelCheck: function () {
		if (Number(Time.date.getHours()) == 4 &&
			Number(Time.date.getMinutes()) == 30 &&
			Number(Time.date.getSeconds()) == 0) {

			Table.create_next_movie_arr();
			Table.gCancel();
			Render.clear();
			Render.table();
		};
	},

	gCancel: function () {
		Table.output.forEach(function (movie) {
			movie.sessions.forEach(function (sessionsCell) {
				sessionsCell.forEach(function (session) {
					session.color = "w";
				});
			});
		});
	},

	TimeoutCheck: function () {
		var hour = Number(Time.date.getHours());	
		var minute = Number(Time.date.getMinutes());
		if (hour >= 0 && hour < 10) {
			hour = hour + 24;
		};
		Table.output.forEach(function (movie) {
			movie.sessions.forEach(function (sessionCell) {
				sessionCell.forEach(function (session) {
					var sHour = session.hour;
					if (sHour >= 0 && sHour < 10) {
						sHour = sHour + 24;
					};
					if (sHour < hour && session.color == "w") {
						session.color = "g";
					} else if (sHour == hour && session.minute <= minute && session.color == "w") {
						session.color = "g";
					} else {
						return false;
					};
					Render.clear();
					Render.table();
				});
			});
		});
	},

	create: function () {
		//Обнуление
		Table.output = [];
		//Выбор каждого 2-го элемента
		for (var i = Number(scr); i < Table.data.length; i = i + 2) {
			//Создание output объекта
			var movie = {
				name: Table.data[i].name,
				sessions: []
			};
			//Заполнение массива sessions
			movie.sessions = Table.data[i].sessions.map(function (session) {
				var time = session.time.split(":");
				return {
					time: session.time,
					hour: Number(time[0]),
					minute: Number(time[1]),
					color: "w"
				}
			});
			//Output массив для сеансов
			var sessions = [];
			for (var h = 10; h < 28; h = h + 2) {
				//Фильтруем объекты в диапозоне 2 часа и создаем для них массив
				var temp = movie.sessions.filter(function (session) {
					var hour = session.hour;
					if (hour >= 0 && hour < 10) {
						hour = hour + 24
					};
					if (hour >= h && hour < h + 2) {
						return true;
					} else {
						return false;
					};
				});
				//Сортируем по порядку
				temp = temp.sort(function (a, b) {
					if (a.hour >= 0 && a.hour < 10) {
						a.hour = a.hour + 24;
					};
					if (b.hour >= 0 && b.hour < 10) {
						b.hour = b.hour + 24;
					};

					if (a.hour < b.hour) {
						return -1;
					} else if (a.hour > b.hour) {
						return 1;
					} else {
						if (a.minute < b.minute) {
							return -1;
						} else if (a.minute > b.minute) {
							return 1;
						} else {
							return 0;
						};
					};
				});
				sessions.push(temp);
			};
			//Получившийся двумерный массив сеансов заводим в output объект
			movie.sessions = sessions;
			//Добавляем этот объект в массив output фильмов
			Table.output.push(movie);
		};
	}
};

var Sys = {
	screen: 'waiting',
	init: function () {
		document.addEventListener("keydown", function (e) {
			Sys.keyHandle(e);
		});
		Sys.resizeImg();
	},
	keyHandle: function (e) {
		if (e.keyCode == 122) {
			setTimeout(Sys.resizeImg, 200);
		};
	},
	resizeImg: function () {
		document.getElementById("main").style.width = document.documentElement.clientWidth + "px";
		document.getElementById("main").style.height = document.documentElement.clientHeight + "px";
	},
	ce: function (type) {
		var elem = document.createElement(type);
		return elem;
	}
};

var Render =  {
	init: function () {
		setInterval(function () {
			Render.time();
		}, 
		1000);
	},
	next_movie: function (num, name, time) {
		document.getElementById('next_movie_title_' + num).children[0].innerHTML = name;
		document.getElementById('next_movie_time_' + num).children[0].innerHTML = time;
	},
	time: function () {
		var hour = Time.date.getHours();
		var minutes = Time.date.getMinutes();
		if (hour < 10) {
			hour = "0" + hour;
		};
		if (minutes < 10) {
			minutes = "0" + minutes;
		};
		document.getElementById("serverTime").innerHTML = hour + ":" + minutes;	
	},
	clear: function () {
		while (document.getElementById("container").children.length > 0) {
			document.getElementById("container").children[0].remove();
		};
	},
	table: function () {
		//Шапка
		var bg = true;
		var row = Sys.ce("div");
		row.className = "row";
		row.style.backgroundColor = "#002DB2";

		var nameWrap = Sys.ce("div");
		nameWrap.className = "nameWrap";
		// Название
		var title = Sys.ce("div");
		title.className = "title";
		title.innerHTML = "Название фильма";
		nameWrap.appendChild(title);
		row.appendChild(nameWrap);
		// Сеансы
		var sessionsElem = Sys.ce("div");
		sessionsElem.className = "sessions";
		sessionsElem.innerHTML = "Сеансы";
		row.appendChild(sessionsElem);
		//Добавление в контейнер шапки
		document.getElementById("container").appendChild(row);
		//Вывод фильмов
		Table.output.forEach(function (movie) {
			var row = Sys.ce("div");
			row.className = "row";
			//Цвет бэкграунда
			if (bg) {
				row.style.backgroundColor = "#88f"
				bg = false;
			} else {
				row.style.backgroundColor = "#002DB2"
				bg = true;
			};
			//Название фильма
			var nameWrap = Sys.ce("div");
			nameWrap.className = "nameWrap";
			var name = Sys.ce("div");
			name.className = "name";
			//Отступ от топа
			if (movie.name.length > 34) {
				name.style.marginTop = "8px";
			} else {
				name.style.marginTop = "22px";
			};
			name.innerHTML = movie.name;
			nameWrap.appendChild(name);
			row.appendChild(nameWrap);
			//Вывод сеансов
			movie.sessions.forEach(function (session) {
				var hour = Sys.ce("div");
				hour.className = "hour";
				//Отступ от топа
				if (session.length == 2) {
					hour.style.paddingTop = "6px";
				} else if (session.length == 3) {
					hour.style.paddingTop = "2px";
					hour.style.fontSize = "19px";
				} else {
					hour.style.paddingTop = "22px";
				};
				//Заполнение временной ячейки
				session.forEach(function (t) {
					var time = Sys.ce("div");
					time.className = "time" + " " + t.color;
					time.innerHTML = t.time;
					hour.appendChild(time);
				});
				row.appendChild(hour);
			});
			//Добавление в контейнер готовой строки
			document.getElementById("container").appendChild(row);
		});
	}
};

var Time = {
	date: null,
	init: function () {
		this.date = new Date();
		this.getServerTime();
		setInterval(function () {
			Time.timeUp();
			Table.CancelCheck();
			if (Number(Time.date.getHours()) >= 10 || Number(Time.date.getHours()) < 4) {
				Table.TimeoutCheck();
			};
			Table.next_movie_check();
		},
		1000);
		setInterval(function () {
			Time.getServerTime();
		}, 
		3600000);
	},
	timeUp: function () {
		this.date.setSeconds(this.date.getSeconds() + 1);
	},
	getServerTime: function () {
		var body = JSON.stringify({
			getTime: true
		});
		Ajax.send(body, "time");
	}
};

function Auth () {
	token: false
};

function authCheck () {
	auth = new Auth();
	Ajax.send("", "auth");
};

function init () {
	Sys.init();
	Time.init();
	Table.init();
	Render.init();
};

window.onload = authCheck();