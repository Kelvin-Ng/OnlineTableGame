const view_dir = __dirname + '/view/';

const table_list_num = 10;

var swig = require('swig');
var fs = require('fs');

var handlers_get = [];
var handlers_post = [];
var url_file = [];

var core_logic;

url_file['/register'] = 'register.html';
url_file['/createtable'] = 'createtable.html';

function sendSwig(res, file, vars)
{
	res.send(swig.renderFile(view_dir + file, vars));
}

function verifyLogin(req, callback)
{
	var cookies = req.signedCookies;
	if (cookies.username && cookies.password)
	{
		core_logic.login(cookies.username, cookies.password, function(success) {
			callback(success);
		});
	}
	else
	{
		callback(false);
	}
}

handlers_get['/'] = function(req, res) {
	verifyLogin(req, function(result) {
		sendSwig(res, 'index.html', {login: result,
					username: req.signedCookies.username});
	});
};

handlers_post['/register'] = function(req, res) {
	core_logic.register(req.body.username, req.body.password, req.body.re_password, function(result) {
		switch (result)
		{
		case 0:
			res.redirect('/tablelist');
			break;
		case 1:
			res.send(swig.renderFile(view_dir + 'register.html', {password_mismatch: true}));
			break;
		case 2:
			res.send(swig.renderFile(view_dir + 'register.html', {username_exists: true}));
			break;
		}
	});
};

handlers_get['/login'] = function(req, res) {
	verifyLogin(req, function(success) {
		if (success)
		{
			res.redirect('/tablelist');
		}
		else
		{
			sendSwig(res, 'login.html');
		}
	});
};

handlers_post['/login'] = function(req, res) {
	core_logic.login(req.body.username, req.body.password, function(success) {
		if (success)
		{
			res.cookie('username', req.body.username, {signed: true});
			res.cookie('password', req.body.password, {signed: true});
			res.redirect('/tablelist');
		}
		else
		{
			sendSwig(res, 'login.html', {password_wrong: true});
		}
	});
};

handlers_post['/createtable'] = function(req, res) {
	verifyLogin(req, function(success) {
		if (success)
		{
			core_logic.createTable(req.body.type, req.body.name, req.signedCookies.username, function() {
				res.redirect('/tablelist');
			});
		}
		else
		{
			res.redirect('/login');
		}
	});
};

handlers_get['/tablelist'] = function(req, res) {
	verifyLogin(req, function(success) {
		if (success)
		{
			var from = 1;
			
			if (req.query.from)
			{
				from = req.query.from;
			}

			if (req.query.type)
			{
				core_logic.getTables(from,
						table_list_num,
						function(table_list) {
							sendSwig(res,
								'tablelist.html',
								{table_list: table_list});
						},
						req.query.type);
			}
			else
			{
				core_logic.getTables(from,
						table_list_num,
						function(table_list) {
							sendSwig(res,
								'tablelist.html',
								{table_list: table_list});
						});
			}
		}
		else
		{
			res.redirect('/login');
		}
	});
};

handlers_get['/table'] = function(req, res) {
	res.send('table');
};

handlers_get['/logout'] = function(req, res) {
	res.clearCookie('username');
	res.clearCookie('password');

	res.redirect('/');
};

module.exports = function(app, core_logic_) {
	core_logic = core_logic_;

	return {
		register: function() {
			for (handler in handlers_get)
			{
				app.get(handler, handlers_get[handler]);
			}
			for (handler in handlers_post)
			{
				app.post(handler, handlers_post[handler]);
			}

			app.use(function(req, res, next) {
				if (handlers_get[req.url])
				{
					next();
				}
				else if (url_file[req.url])
				{
					sendSwig(res, url_file[req.url]);
				}
				else
				{
					var path_table = req.url.match(
							/^\/tables\/[^\/]+\//);
					var path_file;

					if (path_table)
					{
						path_table = path_table[0];

						path_file = req.url.substr(
								path_table.length);
					}
					else
					{
						path_table = '\/view\/';
						path_file = req.url;
					}

					var full_path = __dirname +
							path_table +
							'public/' +
							path_file;
					if (fs.existsSync(full_path))
					{
						res.sendFile(full_path);
					}
					else
					{
						next();
					}
				}
			});
		}
	};
}

