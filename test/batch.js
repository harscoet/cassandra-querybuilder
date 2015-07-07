var cassandra = require('cassandra-driver'),
    builder   = require('../index');

builder.setClient(new cassandra.Client({
  contactPoints : ['192.168.56.100'],
  keyspace      : 'earlybirds'
}));

builder.batch([
  builder.InsertQuery('activities')
    .addTimeuuid('id')
    .add('tenant', '52d027b944bac56c716f7abb')
    .add('date', '2015-07-05'),
  builder.InsertQuery('activities_verbs')
    .addTimeuuid('id')
    .add('tenant', '52d027b944bac56c716f7abb')
    .add('date', '2015-07-05')
    .add('verb', 'buy')
], function (err) {
  if (err) console.error('err', err);
});