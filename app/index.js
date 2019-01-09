/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
import shim from 'fabric-shim';
import util from 'util';
import * as Codigo from './controllers/codigo';

export default class Chaincode {
  async Init(stub) {
    const ret = stub.getFunctionAndParameters();
    console.info(ret);
    console.info('=========== Instantiated Logistic Chaincode ===========');
    return shim.success();
  }

  async Invoke(stub) {
    console.info('########################################');
    console.info(`Transaction ID: ${stub.getTxID()}`);
    console.info(util.format('Args: %j', stub.getArgs()));

    const ret = stub.getFunctionAndParameters();
    console.info(ret);

    const method = this[ret.fcn];
    console.log(method);
    if (!method) {
      const message = `funcao com nome ${ret.fcn} nao encontrado`;
      console.log(message);
      return shim.error(message);
    }
    try {
      const payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err.message ? err.message : err);
    }
  }

  async solicitarCodigo(stub, args) {
    try {
      await Codigo.solicitarCodigo(stub, args);
    } catch (e) {
      throw e;
    }
  }

  // Rich Query (Only supported if CouchDB is used as state database):
  // peer chaincode query -C myc -n mycc -c
  // '{"Args":["richQuery","{\"selector\":{\"status\":\"1\"}}"]}'
  async richQuery(stub, args) {
    //   0
    // 'queryString'
    if (args.length < 1) {
      throw new Error('Incorrect number of arguments. Expecting queryString');
    }
    const queryString = args[0];
    if (!queryString) {
      throw new Error('queryString must not be empty');
    }
    const method = this.getQueryResultForQueryString;
    const queryResults = await method(stub, queryString);
    return queryResults;
  }

  static async getAllResults(iterator, isHistory) {
    const allResults = [];
    while (true) {
      const res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        const jsonResponse = {};
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
  async getQueryResultForQueryString(stub, queryString) {
    console.info(`- getQueryResultForQueryString queryString:\n + ${queryString}`);
    const resultsIterator = await stub.getQueryResult(queryString);
    const method = this.getAllResults;

    const results = await method(resultsIterator, false);

    return Buffer.from(JSON.stringify(results));
  }

  async getHistory(stub, args) {
    if (args.length < 1) {
      throw new Error('Incorrect number of arguments. Expecting an id to look for');
    }
    const id = args[0];
    console.info('--- start getHistoryFor: %s\n');

    const resultsIterator = await stub.getHistoryForKey(id);
    const method = this.getAllResults;
    const results = await method(resultsIterator, true);

    return Buffer.from(JSON.stringify(results));
  }
}

shim.start(new Chaincode());
