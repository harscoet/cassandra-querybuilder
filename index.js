var QueryBuilder = require('./lib/querybuilder'),
    vargs        = require('vargs-callback');

var Cassandra = function () {
  this.client = null;
};

Cassandra.prototype.setClient = function (client) {
  this.client = client;
};

Cassandra.prototype.InsertQuery = function (keyspace, client, consistency) {
  return new QueryBuilder(1, keyspace, client || this.client, consistency);
};

Cassandra.prototype.UpdateQuery = function (keyspace, client, consistency) {
  return new QueryBuilder(2, keyspace, client || this.client, consistency);
};

Cassandra.prototype.SelectQuery = function (keyspace, client, consistency) {
  return new QueryBuilder(3, keyspace, client || this.client, consistency);
};

Cassandra.prototype.DeleteQuery = function (keyspace, client, consistency) {
  return new QueryBuilder(4, keyspace, client || this.client, consistency);
};

Cassandra.prototype.batch = vargs(function (queries, client, next) {
  client = client || this.client;

  client.batch(queries.map(function (query) { return query.dump() }), { prepare: true }, next);
});

module.exports = new Cassandra();