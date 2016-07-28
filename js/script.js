var Table = {
	data: null,
	origin: null,
	f_data: null,
	f_origin: null,
	type: "current",
	draggable_id: null,
	save: true
};

var Ajax = {
	send: function (body, type) {
		//назначение коллбэка по типу запроса
		if (type == "getMovies") {
			callback = Ajax.getMovies;
		} else if (type == "getFuture") {
			callback = Ajax.getFuture;
		} else if (type == "setMovie") {
			callback = Ajax.setMovie;
		} else if (type == "delMovie") {
			callback = Ajax.delMovie;
		} else if (type == "newMovie") {
			callback = Ajax.newMovie;
		} else if (type == "copy") {
			callback = Ajax.copy;
		} else if (type == "clearToken") {
			callback = Ajax.clearToken;
		} else if (type == "force_update") {
			callback = Ajax.force_update;
		} else if (type == "save") {
			callback = Ajax.save;
		};
		//Отправка запроса
		$.ajax({
			url: "/admin",
			type: "post",
			contentType: "application/json",
			dataType: "json",
			data: body,
			success: function (data) {
				callback(data);
			}
		});
	},
	//Коллбэки запросов
	getMovies: function (data) {
		Table.data = clone(data.movies);
		Table.origin = clone(data.movies);
		Sys.add_num(Table.data);
		Render.showMovies(data.movies);
	},

	getFuture: function (data) {
		Table.f_data = clone(data.movies);
		Table.f_origin = clone(data.movies);
		Sys.add_num(Table.f_data);
		Render.showFuture(data.movies);
	},

	setMovie: function (data) {
		if (data.type == "current") {
			Render.clear("current");
			DB.getMovies();
		} else {
			Render.clear("future");
			DB.getFuture();
		};
	},

	delMovie: function (data) {
		if (data.type == "current") {
			Render.clear("current");
			DB.getMovies();
		} else {
			Render.clear("future");
			DB.getFuture();
		};
	},

	newMovie: function (data) {
		if (data.type == "current") {
			Render.clear("current");
			DB.getMovies();
		} else {
			Render.clear("future");
			DB.getFuture();
		};
	},

	copy: function (data) {
		if (DB.copy == "CF") {
			DB.getFuture();
		} else if (DB.copy == "FC") {
			DB.getMovies();
		};
	},

	clearToken: function (data) {
		console.log(data.text);
	},
	force_update: function (data) {
		console.log("Отправлен запрос на обновление");
	},
	save: function (data) {
		console.log('save')
		Table.save = false;
	}
};
var DB = {
	copy: null,
	save: function () {
		var base;
		if (Table.type == "current") {
			base = Table.data;
		} else {
			base = Table.f_data;
		};
		var body = JSON.stringify({
			tTable: Table.type,
			action: "save",
			data: base
		});
		Ajax.send(body, "save");
	},
	//Новый фильм
	newMovie: function (elem) {
		var inputs = document.getElementById("inputs");
		var sessions = [];
		for (var i = 1; i < inputs.children.length; i++) {
			if (inputs.children[i].value == "") {
				continue;
			};
			sessions.push({
				time: inputs.children[i].value
			});
		};
		var body = JSON.stringify({
			tTable:   Table.type,
			action:   "newMovie",
			name:     inputs.children[0].value,
			sessions: sessions
		});
		Win.close();
		Ajax.send(body, "newMovie");
	},
	//Удаление фильма
	delMovie: function (elem) {
		var body = JSON.stringify({
			action: "delMovie",
			id: elem.parentElement.dataset.id,
			tTable: elem.parentElement.dataset.tTable
		});
		Ajax.send(body, "delMovie");
	},
	//Открыть окно редактирования
	editMovie: function (elem) {
		var table;
		var tTable;
		if (elem.parentElement.dataset.tTable == "current") {
			table = Table.data;
			tTable = "current";
		} else if (elem.parentElement.dataset.tTable == "future") {
			table = Table.f_data;
			tTable = "future";
		};
		Win.open(1, table[elem.dataset.rowId], tTable);
	},
	//Внести изменения
	setMovie: function (elem) {
		var inputs = document.getElementById("inputs");
		var sessions = [];
		for (var i = 1; i < inputs.children.length; i++) {
			if (inputs.children[i].value == "") {
				continue;
			};
			sessions.push({
				time: inputs.children[i].value
			});
		};
		var body = JSON.stringify({
			id:       elem.dataset.id,
			tTable:   Table.type,
			action:   "setMovie",
			name:     inputs.children[0].value,
			sessions: sessions
		});
		Win.close();
		Ajax.send(body, "setMovie");
	},
	//Получить список текущего репертуара
	getMovies: function () {
		var body = JSON.stringify({
			action: "getMovies"
		});
		Ajax.send(body, "getMovies");
	},
	//Получить список шаблона
	getFuture: function () {
		var body = JSON.stringify({
			action: "getFuture",
		});
		Ajax.send(body, "getFuture");
	},
	copyCF: function () {
		Win.close();
		DB.copy = "CF";
		var body = JSON.stringify({
			action: "copyCF"
		});
		Ajax.send(body, "copy");
	},
	copyFC: function () {
		Win.close();
		DB.copy = "FC";
		var body = JSON.stringify({
			action: "copyFC"
		});
		Ajax.send(body, "copy");
	}
};

var Win = {
	//Свойства окна
	name: "",
	width: 500,
	height: 500,
	//Бэкграунд под окном
	bg: function () {
		var bg = Sys.ce("div");
		bg.id = "bg";
		bg.className = "bg";
		bg.onclick = Win.close;
		return bg;
	},
	//Окно
	win: function (type, movie, tTable) {
		//Создание html элемента окна
		var win = Sys.ce("div");
		win.id = "win";
		win.className = "win";
		win.style.width = Win.width + "px";
		win.style.height = Win.height + "px";
		win.style.marginLeft = Win.width / 2 * -1 + "px";
		//Добавление тайтла
		win.appendChild(Win.title());
		//Добавление инпутов названия фильма и сеансов
		win.appendChild(Win.inputs(movie));
		//Кнопка добавления сеанса
		var addTime = Sys.ce("input");
		addTime.type = "button";
		addTime.value = "Добавить сеанс";
		addTime.onclick = Win.addTime;
		win.appendChild(addTime);
		//Кнопка действия
		var setMovie = Sys.ce("input");
		setMovie.id = "newMovie";
		setMovie.type = "button";
		setMovie.dataset.tTable = tTable;
		//Создание фильма
		if (type == 0) {
			setMovie.value = "Создать фильм";
			setMovie.onclick = function () {
				DB.newMovie(this);
			};
		//Редактирование фильма
		} else if (type == 1) {
			setMovie.dataset.id = movie.id;
			setMovie.value = "Редактировать";
			setMovie.onclick = function () {
				DB.setMovie(this);
			};
		};
		win.appendChild(setMovie);

		return win;
	},
	//Тайтл окна
	title: function () {
		var title = Sys.ce("div");
		title.className = "title";
		title.innerHTML = Win.name;
		return title;
	},
	//Инпуты названия и сеансов
	inputs: function (movie) {
		var inputs = Sys.ce("div");
		inputs.id = "inputs";
		inputs.className = "inputs";

		var name = Sys.ce("input");
		name.type = "text";
		name.id = "iName";
		name.maxLength = 60;
		name.style.width = Win.width - 100 + "px";
		name.value = movie.name;
		inputs.appendChild(name);

		movie.sessions.forEach(function (session) {
			var time = Sys.ce("input");
			time.type = "time";
			time.className = "iTime";
			time.value = session.time;
			inputs.appendChild(time);
		});

		return inputs;
	},
	//Кнопка добавления сеанса
	addTime: function () {
		var inputs = document.getElementById("inputs");
		var time = Sys.ce("input");
		time.type = "time";
		time.className = "iTime";
		time.value = "";
		inputs.appendChild(time);
	},
	//Обработчик открытия окна
	open: function (type, movie, tTable) {
		if (type == 0) {
			Win.name = "Новый фильм";
		} else if (type == 1) {
			Win.name = "Редактирование";
		};
		Win.open_bg();
		document.body.appendChild(Win.win(type, movie, tTable));
	},
	open_alarm: function (title, callback) {
		var alarm = Sys.ce('div');
		alarm.id = "alarm";

		var alarm_title = Sys.ce('span');
		alarm_title.id = 'alarm_title';
		alarm_title.innerHTML = title;
		alarm.appendChild(alarm_title);

		var input_yes = Sys.ce('button');
		input_yes.className = "alarm_input";
		input_yes.innerHTML = "Да";
		input_yes.onclick = callback;
		alarm.appendChild(input_yes);

		var input_no = Sys.ce('button');
		input_no.className = "alarm_input";
		input_no.innerHTML = "Нет";
		input_no.onclick = Win.close;
		alarm.appendChild(input_no);

		Win.open_bg();
		document.body.appendChild(alarm);
	},
	close_alarm: function () {
		document.getElementById('alarm').remove();
	},
	open_bg: function () {
		document.body.appendChild(Win.bg());
	},
	close_bg: function () {
		document.getElementById("bg").remove();
	},
	//Закрытие окна
	close: function () {
		Win.name = "";
		if (document.getElementById("bg")) {
			Win.close_bg();
		};
		if (document.getElementById('alarm')) {
			Win.close_alarm();
		};
		if (document.getElementById("win")) {
			document.getElementById("win").remove();
		};
	}
};

function Movie () {
	this.id = null,
	this.name = "",
	this.sessions = []
};

var Render = {
	//Переключение между таблицами
	onChange: function (id) {
		if (id == 0) {
			Table.type = "current";
			document.getElementById("future").hidden = true;
			document.getElementById("current").hidden = false;
			document.getElementById("btnFuture").disabled = false;
			document.getElementById("btnCurrent").disabled = true;
			document.getElementById("table_title").children[0].innerHTML = "Расписание на экранах";
			DB.getMovies();
		} else if (id == 1) {
			Table.type = "future";
			document.getElementById("future").hidden = false;
			document.getElementById("current").hidden = true;
			document.getElementById("btnFuture").disabled = true;
			document.getElementById("btnCurrent").disabled = false;
			document.getElementById("table_title").children[0].innerHTML = "Шаблон";
			DB.getFuture();
		};
	},
	update: function () {
		Inter.clear("current");
		Inter.clear("future");
		DB.getMovies();
		DB.getFuture();
	},
	//Очистка таблицы
	clear: function (id) {
		var elem = document.getElementById(id);
		while (elem.children.length > 0) {
			elem.children[0].remove();
		};
	},
	//Открытие окна создания нового фильма
	showCreate: function () {
		var movie = new Movie();
		Win.open(0, movie, Table.type);
	},
	//Отображение текущего расписания
	showMovies: function (movies) {
		Render.clear("current");
		var table = Render.composeTable(movies, "current");
		document.getElementById("current").appendChild(table);
	},
	//Отображение будущего расписания
	showFuture: function (movies) {
		Render.clear("future");
		var table = Render.composeTable(movies, "future");
		document.getElementById("future").appendChild(table);
	},
	//Создание html таблицы
	composeTable: function (movies, tTable) {
		var table = Sys.ce("div");
		var bg = true;
		//Создание строк
		movies.forEach(function (movie, i) {
			//Создание строки и класса
			var row = Sys.ce("div");
			row.className = "row";
			row.draggable = "true";
			row.addEventListener("dragstart", handleDragStart, false);
			row.addEventListener("dragover", handleDragOver, false);
			row.addEventListener("dragenter", handleDragEnter, false);
			row.addEventListener("dragleave", handleDragLeave, false);
			row.addEventListener("dragend", handleDragEnd, false);
			row.addEventListener("drop", handleDrop, false);
			//Прикрепление id фильма и типа таблицы
			row.dataset.id = movie.id;
			row.dataset.tTable = tTable;
			//Определение цвета
			if (bg) {
				row.style.backgroundColor = "#aaa";
				bg = false;
			} else {
				row.style.backgroundColor = "#ddd";
				bg = true;
			};
			//Создание контейнера name
			var name = Sys.ce("div");
			name.className = "name"
			name.innerHTML = movie.name;
			row.appendChild(name);
			//Сортировка по возростанию
			var movie_sort = movie.sessions.sort(function (a, b) {
				var hour_a = a.hour;
				if (a.hour >= 0 && a.hour < 4) {
					hour_a = a.hour + 24;
				};
				var hour_b = b.hour;
				if (b.hour >= 0 && b.hour < 4) {
					hour_b = b.hour + 24;
				};

				if (hour_a < hour_b) {
					return -1;
				} else if (hour_a > hour_b) {
					return 1;
				} else if (hour_a == hour_b) {
					if (a.minute < b.minute) {
						return -1;
					} else if (a.minute > b.minute) {
						return 1;
					} else {
						return 0;
					};
				};
			});
			//Создание контейнеров сеансов
			movie_sort.forEach(function (session) {
				var time = Sys.ce("div");
				time.className = "time";
				time.innerHTML = session.time;
				row.appendChild(time);
			});
			//Кнопка delete
			var del = Sys.ce("input");
			del.className = "del";
			del.type = "button";
			del.value = "Удал.";
			del.onclick = function () {
				DB.delMovie(this);
			};
			row.appendChild(del);
			//Кнопка редактирование
			var edit = Sys.ce("input");
			edit.className = "edit";
			edit.type = "button";
			edit.value = "Ред.";
			edit.dataset.rowId = i;
			edit.onclick = function () {
				DB.editMovie(this);
			};
			row.appendChild(edit);
			//Добавление строки в таблицу
			table.appendChild(row);
		});

		return table;
	}
};

var Sys = {
	ce: function (elem) {
		var e = document.createElement(elem);
		return e;
	},
	clear_token_notes: function () {
		var body = JSON.stringify({
			clearToken: true
		});
		Ajax.send(body, "clearToken");
	},
	force_update: function () {
		var body = JSON.stringify({
			force_update: true
		});
		Ajax.send(body, "force_update");
	},
	add_num: function (table) {
		table.forEach(function (movie) {
			movie.sessions.forEach(function (session) {
				var time_arr = session.time.split(":");
				session.hour = Number(time_arr[0]);
				session.minute = Number(time_arr[1]);
			});
		});
	},
	gen_uuid: function () {
		var uuid = "";
		for (var i = 0; i < 32; i++) {
			uuid += Math.floor(Math.random() * 16).toString(16);
		};
		return uuid;
	}
}

function handleDragStart (e) {
	e.dataTransfer.setData("plain/text", e.target.dataset.index);
	Table.draggable_id = e.target.dataset.id;
};

function handleDragOver (e) {
	e.preventDefault();
};

function handleDragEnter (e) {
	e.preventDefault();
	if (!e.target.dataset.id) {
		return false;
	};
	if (Table.draggable_id == e.target.dataset.id) {
		this.classList.add('ondrag');
		return false;
	};
	move_row(Table.draggable_id, e.target.dataset.id);
	if (Table.type == "current") {
		Render.showMovies(Table.data);
	} else {
		Render.showFuture(Table.f_data);
	};
	this.classList.add('over');
};

function handleDragLeave (e) {
	e.preventDefault();
	this.classList.remove('over');
};

function handleDragEnd (e) {
	e.preventDefault();
	var elem = document.getElementById(Table.type).children[0];
	for (var i = 0; i < elem.children.length; i++) {
		elem.children[i].classList.remove('over');
		elem.children[i].classList.remove('ondrag');
	};
};

function handleDrop (e) {
	if (e.stopPropagation) {
		e.stopPropagation();
	};
};

function move_row (drag_id, enter_id, type) {
	var drag_index = find_index(drag_id);
	var enter_index = find_index(enter_id);
	var row;
	var t;
	if (Table.type == "current") {
		t = Table.data;
		row = t[drag_index];
	} else {
		t = Table.f_data;
		row = t[drag_index];
	};
	t.splice(drag_index, 1);
	t.splice(enter_index, 0, row);

};

function find_index (id) {
	var t;
	if (Table.type == "current") {
		t = Table.data;
	} else {
		t = Table.f_data;
	};
	for (var i = 0; i < t.length; i++) {
		if (t[i].id == id) {
			return i;
		};
	};
	return false;
};


function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
};

function init () {
	DB.getMovies();
};

window.onload = init();