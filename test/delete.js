var cassandra = require('cassandra-driver'),
    builder   = require('../index');

var query = builder.DeleteQuery('profiles_emails')
  .where('id', '6bf524a1-24b0-11e5-9dd9-115e92525827')
  .where('tenant', '52d027b944bac56c716f7abb')
  .where('email', 'technique@early-birds.fr');

console.log(query.dump());