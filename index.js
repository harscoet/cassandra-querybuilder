var QueryBuilder = require('./lib/querybuilder');

var Cassandra = function () {
  this.client = null;
};

Cassandra.prototype.setClient = function (client) {
  this.client = client;
};

Cassandra.prototype.InsertQuery = function (keyspace, client) {
  return new QueryBuilder(1, keyspace, client || this.client);
};

Cassandra.prototype.UpdateQuery = function (keyspace, client) {
  return new QueryBuilder(2, keyspace, client || this.client);
};

Cassandra.prototype.SelectQuery = function (keyspace, client) {
  return new QueryBuilder(3, keyspace, client || this.client);
};

module.exports = new Cassandra();