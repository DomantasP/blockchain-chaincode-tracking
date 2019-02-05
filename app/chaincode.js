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
    console.info('=========== Instantiated Codigo Rastreamento Chaincode ===========');
    return shim.success();
  }

  async Invoke(stub) {
    console.info('########################################');
    console.info(`Transaction ID: ${stub.getTxID()}`);
    console.info(util.format('Args: %j', stub.getArgs()));

    const ret = stub.getFunctionAndParameters();
    console.info(ret);

    const method = this[ret.fcn];

    // Verifies if method exist
    if (!method) {
      return shim.error(`funcao com nome "${ret.fcn}" nao encontrado`);
    }

    try {
      const payload = await method(stub, ret.params, this);
      return shim.success(payload);
    } catch (err) {
      console.log(err.stack);
      return shim.error(err.message ? err.message : 'Ocorreu um erro, Por favor tente novamente mais tarde');
    }
  }

  // Function for retrieving state value
  async getDataById(stub, args) {
    // Assigns id to data
    const data = args[0];
    // Verifies id is not empty
    if (!data) {
      throw new Error('Por favor especifique um id');
    }

    console.info('--- start getDataById ---');

    const dataAsBytes = await stub.getState(data);

    console.info('==================');
    console.log(dataAsBytes.toString());
    console.info('==================');

    console.info('--- end getDataById ---');

    return dataAsBytes;
  }

  // Function for creating batch of tracking code
  async solicitarCodigo(stub, args) {
    try {
      await Codigo.solicitarCodigo(stub, args);
    } catch (err) {
      throw new Error(err.message ? err.message : 'Por favor tente novamente mais tarde');
    }
  }

  // Function for using a tracking code
  async usarCodigo(stub, args) {
    try {
      await Codigo.usarCodigo(stub, args);
    } catch (err) {
      throw new Error(err.message ? err.message : 'Por favor tente novamente mais tarde');
    }
  }

  // Rich Query (Only supported if CouchDB is used as state database):
  // ex: peer chaincode query -C myc -n mycc -c '{"Args":["richQuery","{\"selector\":{\"docType\":\"batch\"}}"]}'
  async richQuery(stub, args, thisClass) {
    if (args.length < 1) {
      throw new Error('Incorrect number of arguments. Expecting queryString');
    }
    const queryString = args[0];
    if (!queryString) {
      throw new Error('queryString must not be empty');
    }
    const method = thisClass['getQueryResultForQueryString'];
    const queryResults = await method(stub, queryString, thisClass);
    return queryResults;
  }

  async getAllResults(iterator, isHistory) {
    console.log('--- start using getAllResults ---');
    const allResults = [];
    while (true) {
      /* eslint-disable no-await-in-loop */
      const res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        const jsonResponse = {};

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
        await iterator.close();
        console.info(JSON.stringify(allResults));
        console.log('--- end using getAllResults ---');
        return allResults;
      }
    }
  }

  // getQueryResultForQueryString executes the query passed in query string.
  async getQueryResultForQueryString(stub, queryString, thisClass) {
    console.info(`- getQueryResultForQueryString queryString:\n ${queryString}`);
    const resultsIterator = await stub.getQueryResult(queryString);
    const method = thisClass['getAllResults'];

    const results = await method(resultsIterator, false);

    return Buffer.from(JSON.stringify(results));
  }

  async getHistory(stub, args, thisClass) {
    if (args.length < 1) {
      throw new Error('Incorrect number of arguments. Expecting an id to look for');
    }
    const id = args[0];
    console.info(`--- start getHistoryFor:\n ${id}`);

    const resultsIterator = await stub.getHistoryForKey(id);
    const method = thisClass['getAllResults'];

    const results = await method(resultsIterator, true);

    return Buffer.from(JSON.stringify(results));
  }
}
