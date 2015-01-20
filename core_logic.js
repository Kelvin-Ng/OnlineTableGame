var core_logic = {};
var db;

var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10);

core_logic.register = function(username, password, re_password, callback) {
	if (password != re_password)
	{
		callback(1);
	}
	else
	{
		db.users.findOne({_id: username}, function(err, user) {
			if (err || !user)
			{
				db.users.insert({_id: username, password: bcrypt.hashSync(password, salt)});

				callback(0);
			}
			else
			{
				callback(2);
			}
		});
	}
};

core_logic.login = function(username, password, callback) {
	db.users.findOne({_id: username}, function(err, user) {
		if (user && bcrypt.compareSync(password, user.password))
		{
			callback(true);
		}
		else
		{
			callback(false);
		}
	});
};

core_logic.createTable = function(type, name, owner_username, callback) {
	db.tables.insert({type: type, name: name, owner_username: owner_username});

	callback();
};

core_logic.getTables = function(from, num, callback, type) {
	if (type)
	{
		db.tables.find({type: type}).skip(from - 1).limit(num).toArray(
			function(err, tables) {
				callback(tables);
			});
	}
	else
	{
		db.tables.find().skip(from - 1).limit(num).toArray(
			function(err, tables) {
				callback(tables);
			});
	}
};

core_logic.getTableInfo = function(id, callback) {
};

module.exports = function(db_) {
	db = db_;

	return core_logic;
};

