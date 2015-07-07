var uuid = require('node-uuid');

var QueryBuilder = function (queryType, table, client) {
  this.queryType = queryType;
  this.table = table;
  this.client = client;

  this.json = {};
  this.fields = [];
  this.whereFields = [];
  this.pushFields = [];
  this.whereContainsFields = [];
  this.params = [];

  this._limit = null;

  return this;
};

QueryBuilder.prototype.isPlainObjectNotEmpty = function (value) {
  return !(value instanceof Array) && value instanceof Object && Object.keys(value).length > 0;
};

QueryBuilder.prototype.setClient = function (client) {
  this.client = client;

  return this;
};

QueryBuilder.prototype.add = function (field, value, push) {
  var _this = this;
  if (_this.queryType === 1 && !_this.json.hasOwnProperty(field)) _this.json[field] = value;

  var simpleAdd = function () {
    if (typeof value !== 'undefined' && value !== null) {
      _this.fields.push(field);
      _this.params.push(value);
    }
  };

  if (_this.queryType === 2) {
    if (push) {
      _this.pushFields.push(field);
      simpleAdd();
    } else if (_this.isPlainObjectNotEmpty(value)) {
      for (var key in value) {
        _this.fields.push(field + '[\'' + key + '\']');
        _this.params.push(value[key]);
      }
    } else simpleAdd();
  } else simpleAdd();

  return this;
};

QueryBuilder.prototype.addUuid = function (field, value) {
  field = field || 'id';
  value = value ? value.toString() : uuid.v4();

  return this.add(field, value);
};

QueryBuilder.prototype.addTimeuuid = function (field, value) {
  field = field || 'id';
  value = value ? value.toString() : uuid.v1();

  return this.add(field, value);
};

QueryBuilder.prototype.addString = function (field, value) {
  value = value ? value.toString() : null;
  if (!value) return this;

  return this.add(field, value.toString());
};

QueryBuilder.prototype.addBoolean = function (field, value) {
  return this.add(field, value ? true : false);
};

QueryBuilder.prototype.addInteger = function (field, value) {
  value = parseInt(value);
  if (isNaN(value)) return this;

  return this.add(field, value);
};

QueryBuilder.prototype.addFloat = function (field, value) {
  value = parseFloat(value);
  if (isNaN(value)) return this;

  return this.add(field, value);
};

QueryBuilder.prototype.addSet = function (field, value, push) {
  if (!(value instanceof Array && value.length > 0)) return this;

  return this.add(field, value, push);
};

QueryBuilder.prototype.addMap = function (field, value) {
  if (!this.isPlainObjectNotEmpty(value)) return this;

  return this.add(field, value);
};

QueryBuilder.prototype.where = function (field, value) {
  this.whereFields.push(field);
  this.params.push(value);

  return this;
};

QueryBuilder.prototype.whereContains = function (field, value) {
  this.whereContainsFields.push(field);
  this.params.push(value);

  return this;
};

QueryBuilder.prototype.select = function (fields) {
  if (this.queryType !== 3) return this;

  this.fields = this.fields.concat(fields.split(',').map(function (e) {
    return e.trim();
  }));

  return this;
};

QueryBuilder.prototype.limit = function (limit) {
  if (this.queryType !== 3) return this;

  this._limit = parseInt(limit);

  return this;
};

QueryBuilder.prototype.getParams = function () {
  return this.params;
};

QueryBuilder.prototype.getQuery = function () {
  var _this = this,
      query = '';

  if (_this.queryType === 1) {
    var params = '';

    for (var i = 0; i < _this.fields.length; i++) {
      params += '?';
      if (i < _this.fields.length - 1) params += ',';
    }

    query  = 'INSERT INTO ' + _this.table +' (' + _this.fields.join(',') + ') ';
    query += 'VALUES (' + params + ');';
  } else {
    if (_this.queryType === 2) {
      query = 'UPDATE ' + _this.table + ' SET ';

      _this.fields.forEach(function (field, i) {
        query += field + ' = ';
        query += _this.pushFields.indexOf(field) >= 0 ? field + ' + ?' : '?';
        if (i < _this.fields.length - 1) query += ',';
      });
    } else if (_this.queryType === 3) {
      var fields = !_this.fields.length ? '*' : _this.fields.join(',');
      query = 'SELECT ' + fields + ' FROM ' + _this.table;
    } else {
      query = 'DELETE FROM ' + _this.table;
    }

    if (_this.whereFields.length) {
      _this.whereFields.forEach(function (field, i) {
        var word = i === 0 ? ' WHERE' : ' AND';
        query +=  word + ' ' + field + ' = ?';
      });
    }

    if (_this.whereContainsFields.length) {
      _this.whereContainsFields.forEach(function (field, i) {
        var word = i === 0 && !_this.whereFields.length ? ' WHERE' : ' AND';
        query +=  word + ' ' + field + ' CONTAINS ?';
      });
    }

    if (_this.queryType === 3) {
      if (_this._limit) query += ' LIMIT ' + _this._limit;
      query += ' ALLOW FILTERING';
    }
  }

  return query;
};

QueryBuilder.prototype.getJSON = function () {
  return this.json;
};

QueryBuilder.prototype.isValid = function () {
  return this.fields.length || this.queryType === 3;
};

QueryBuilder.prototype.dump = function () {
  return {
    query: this.getQuery(),
    params: this.getParams()
  };
};

QueryBuilder.prototype.execute = function (options, next) {
  var _this = this;

  if (typeof options === 'function') {
    next = options;
    options = { prepare: true };
  }

  if (!this.isValid()) return next('Query is invalid: no field found');
  if (!this.client) return next('A client must be defined to be able to use execute function');

  this.client.execute(this.getQuery(), this.getParams(), options, function (err, res) {
    if (err) err = {
      message: err.message,
      query: _this.getQuery(),
      params: _this.getParams()
    };

    return next(err, res);
  });
};

module.exports = QueryBuilder;