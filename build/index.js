'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     # Copyright IBM Corp. All Rights Reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     #
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     # SPDX-License-Identifier: Apache-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     */


var _fabricShim = require('fabric-shim');

var _fabricShim2 = _interopRequireDefault(_fabricShim);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _codigo = require('./controllers/codigo');

var Codigo = _interopRequireWildcard(_codigo);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Chaincode = function () {
  function Chaincode() {
    _classCallCheck(this, Chaincode);
  }

  _createClass(Chaincode, [{
    key: 'Init',
    value: async function Init(stub) {
      var ret = stub.getFunctionAndParameters();
      console.info(ret);
      console.info('=========== Instantiated Logistic Chaincode ===========');
      return _fabricShim2.default.success();
    }
  }, {
    key: 'Invoke',
    value: async function Invoke(stub) {
      console.info('########################################');
      console.info('Transaction ID: ' + stub.getTxID());
      console.info(_util2.default.format('Args: %j', stub.getArgs()));

      var ret = stub.getFunctionAndParameters();
      console.info(ret);

      var method = this[ret.fcn];
      if (!method) {
        var message = 'funcao com nome ' + ret.fcn + ' nao encontrado';
        console.log(message);
        return _fabricShim2.default.error(message);
      }
      try {
        var payload = await method(stub, ret.params, this);
        return _fabricShim2.default.success(payload);
      } catch (err) {
        console.log(err);
        return _fabricShim2.default.error(err.message ? err.message : err);
      }
    }
  }, {
    key: 'getDataById',
    value: async function getDataById(stub, args, thisClass) {
      // 1. Verify batchId is not empty
      var data = args[0];
      if (!data) {
        throw new Error('Por favor especifique um id');
      }

      console.info('--- start getData ---');

      // 2. Verify if batch exist
      var dataAsBytes = await stub.getState(data);
      if (!dataAsBytes.toString()) {
        throw new Error('"Data com id ' + data + ' nao encontrado"');
      }

      console.info('==================');
      console.log(dataAsBytes.toString());
      console.info('==================');
      console.info('--- end getData ---');

      return dataAsBytes;
    }
  }, {
    key: 'solicitarCodigo',
    value: async function solicitarCodigo(stub, args, thisClass) {
      try {
        await Codigo.solicitarCodigo(stub, args);
      } catch (e) {
        throw e;
      }
    }
  }, {
    key: 'usarCodigo',
    value: async function usarCodigo(stub, args, thisClass) {
      try {
        await Codigo.usarCodigo(stub, args);
      } catch (e) {
        throw e;
      }
    }

    // Rich Query (Only supported if CouchDB is used as state database):
    // peer chaincode query -C myc -n mycc -c
    // '{"Args":["richQuery","{\"selector\":{\"status\":\"1\"}}"]}'

  }, {
    key: 'richQuery',
    value: async function richQuery(stub, args, thisClass) {
      //   0
      // 'queryString'
      if (args.length < 1) {
        throw new Error('Incorrect number of arguments. Expecting queryString');
      }
      var queryString = args[0];
      if (!queryString) {
        throw new Error('queryString must not be empty');
      }
      var method = thisClass["getQueryResultForQueryString"];
      var queryResults = await method(stub, queryString, thisClass);
      return queryResults;
    }
  }, {
    key: 'getAllResults',
    value: async function getAllResults(iterator, isHistory) {
      console.log('using getAllResults');
      var allResults = [];
      while (true) {
        /* eslint no-await-in-loop: "off" */
        var res = await iterator.next();

        if (res.value && res.value.value.toString()) {
          var jsonResponse = {};
          // console.log(res.value.value.toString("utf8"));

          if (isHistory && isHistory === true) {
            jsonResponse.TxId = res.value.tx_id;
            jsonResponse.Timestamp = res.value.timestamp;
            jsonResponse.IsDelete = res.value.is_delete.toString();
            try {
              jsonResponse.Value = JSON.parse(res.value.value.toString('utf8'));
            } catch (err) {
              console.log(err);
              jsonResponse.Value = res.value.value.toString('utf8');
            }
          } else {
            jsonResponse.Key = res.value.key;
            try {
              jsonResponse.Record = JSON.parse(res.value.value.toString('utf8'));
            } catch (err) {
              console.log(err);
              jsonResponse.Record = res.value.value.toString('utf8');
            }
          }
          allResults.push(jsonResponse);
        }
        if (res.done) {
          console.log('end of data');
          await iterator.close();
          console.info(JSON.stringify(allResults));
          return allResults;
        }
      }
    }

    // getQueryResultForQueryString executes the passed in query string.
    // Result set is built and returned as a byte array containing the JSON results.

  }, {
    key: 'getQueryResultForQueryString',
    value: async function getQueryResultForQueryString(stub, queryString, thisClass) {
      console.info('- getQueryResultForQueryString queryString:\n ' + queryString);
      var resultsIterator = await stub.getQueryResult(queryString);
      var method = thisClass["getAllResults"];

      var results = await method(resultsIterator, false);

      return Buffer.from(JSON.stringify(results));
    }
  }, {
    key: 'getHistory',
    value: async function getHistory(stub, args, thisClass) {
      if (args.length < 1) {
        throw new Error('Incorrect number of arguments. Expecting an id to look for');
      }
      var id = args[0];
      console.info('--- start getHistoryFor:\n ' + id);

      var resultsIterator = await stub.getHistoryForKey(id);
      var method = thisClass["getAllResults"];

      var results = await method(resultsIterator, true);
      return Buffer.from(JSON.stringify(results));
    }
  }]);

  return Chaincode;
}();

exports.default = Chaincode;


_fabricShim2.default.start(new Chaincode());
//# sourceMappingURL=index.js.map