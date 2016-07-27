var db = require("db");
var express = require("express");
var bp = require("body-parser");
var multer = require("multer");
var upload = multer();

function gen_uuid () {
	var uuid = "";
	for (var i = 0; i < 32; i++) {
		uuid += Math.floor(Math.random() * 16).toString(16);
	};
	return uuid;
};

var app = express();
app.use(bp.json());
app.use(bp.urlencoded({extended: true}));

app.post("/auth", function (req, res) {
	var response = {
		token: gen_uuid()
	};
	db.add_auth_note(response.token);
	res.send(JSON.stringify(response));
}); 

app.post("/update", function (req, res) {
	var response;
	var update = db.check_update(req.body.token);
	if (update === null) {
		response = {
			need_auth: true
		};
	} else {
		response = {
			update: update
		};
	};
	res.send(JSON.stringify(response))
});

app.post("/time", function (req, res) {
	var response;
	var date = new Date();
	if (req.body.getTime) {
		response = JSON.stringify({
			date: date
		});
	};
	res.send(response);
});

app.get("*", function (req, res) {
	if (req.url == "/") {
		res.sendFile(__dirname + "/templates/auth.html");
	} else if (req.url == "/admin") {
		res.sendFile(__dirname + "/templates/admin.html");
	} else if (req.url == "/screen_1") {
		res.sendFile(__dirname + "/templates/screen1.html");
	} else if (req.url == "/screen_2") {
		res.sendFile(__dirname + "/templates/screen2.html");
	} else {
		res.sendFile(__dirname + req.path);
	};
});

app.post("/admin", function (req, res) {
	var response;
	if (req.body.action == "getMovies") {
		response = {
			movies: db.data.movies
		};
	} else if (req.body.action == "getFuture") {
			response = {
			getFuture: true,
			movies:    db.fData.movies
		};
	} else if (req.body.action == "setMovie") {
		db.setMovie(req.body);
		response = {
			setMovie: true,
			type:     req.body.tTable
		};
		db.update_on();
	} else if (req.body.action == "delMovie") {
		db.delMovie(req.body.id, req.body.tTable);
		response = {
			delMovie: true,
			type: req.body.tTable
		};
		db.update_on();
	} else if (req.body.action == "newMovie") {
		db.addMovie(req.body);
		response = {
			newMovie: true,
			type: req.body.tTable
		};
		if (req.body.tTable == "current") {
			db.update_on();
		};
	} else if (req.body.action == "copyFC") {
		db.copyFC();
		response = {
			copy: true
		};
		db.update_on();
	} else if (req.body.action == "copyCF") {
		db.copyCF();
		response = {
			copy: true
		};
	} else if (req.body.clearToken) {
		db.clear_auth_note();
		response = {
			text: "Tokens is clear"
		}
	} else if (req.body.force_update) {
		db.update_on();
		response = {
			force_update: true
		};
	};
	res.send(JSON.stringify(response))
});

app.post("/handle", upload.array(), function (req, res) {
	var response;
	if (req.body.action == "getMovies") {
			var index = db.search_token(req.body.token);
			if (index === false) {
				response = {
					need_auth: true
				};
			} else {
				db.update_off(index);
				response = {
					getMovies: true,
					movies: db.data.movies
				};
			};
	};
	res.send(JSON.stringify(response));
});

app.listen(80);