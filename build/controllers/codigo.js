'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.usarCodigo = exports.solicitarCodigo = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; // const config = require('../config.js');


var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

var _perf_hooks = require('perf_hooks');

var _utils = require('../utils');

var _codigo = require('../models/codigo');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//  descend into nested schema - return on first error - remove unspecified keys from objects
var validationOptions = { recursive: true, abortEarly: true, stripUnknown: true };

var solicitarCodigo = exports.solicitarCodigo = async function solicitarCodigo(stub, args) {
  var t0 = _perf_hooks.performance.now();

  var data = void 0;
  var codigoPutStatePromises = [];

  // Parse JSON stringified request
  try {
    data = JSON.parse(args.toString());
  } catch (err) {
    throw new Error('Não foi possivel decodificar o JSON, por favor verifique o formato');
  }
  console.info('--- start solicitarCodigo ---');

  // check mandatory fields
  if (!(data.embarcador && data.quantidade)) {
    throw new Error('Por favor preenche campo mandatorio');
  }
  // Verify embarcador value
  var embarcadorSelected = data.embarcador.toLowerCase();
  var embarcadorAvailable = ['b2w', 'mercado livre', 'magazine luiza', 'via varejo', 'privalia'];
  if (!embarcadorAvailable.includes(embarcadorSelected)) {
    throw new Error('Embarcador nao disponivel');
  }

  var organizationMSPID = stub.getCreator().mspid;

  // Create batch
  var batch = {
    docType: 'batch',
    embarcador: embarcadorSelected,
    id: (0, _v2.default)(),
    codigos: [],
    organization: organizationMSPID
  };

  // Create tracking code
  for (var i = 0; i < data.quantidade; i += 1) {
    var codigo = void 0;
    var newCodigo = true;
    while (newCodigo) {
      codigo = {
        batchId: batch.id,
        docType: 'codigo',
        id: (0, _utils.generateCodigo)(),
        transportador: '',
        embarcador: embarcadorSelected,
        rota: '',
        servico: '',
        servico_codigo: '',
        usado: false
        // status: 1
      };

      // verify if codigo already exist
      /* eslint no-await-in-loop: "off" */
      var newCodigoAsBytes = await stub.getState(codigo.id);
      // Generate a new code if codigo already exist
      /* eslint no-unneeded-ternary: "off" */
      newCodigo = newCodigoAsBytes.toString() ? true : false;
    }
    // Push to batch
    batch.codigos.push(codigo.id);

    // Put codigo to ledger
    codigoPutStatePromises.push(stub.putState(codigo.id, Buffer.from(JSON.stringify(codigo))));
  }

  // Wait for all codigo putState promise
  await Promise.all(codigoPutStatePromises);

  // Put batch to ledger
  var batchAsBytes = Buffer.from(JSON.stringify(batch));
  await stub.putState(batch.id, batchAsBytes);

  stub.setEvent('batchCreated', batchAsBytes);
  console.info('==================');
  console.log(batch);
  console.info('==================');

  console.info('--- end create codigoRastreamento ---');

  var t1 = _perf_hooks.performance.now();
  console.log('Call took ' + (t1 - t0) + ' ms.');
};

var usarCodigo = exports.usarCodigo = async function usarCodigo(stub, args) {
  var data = void 0;
  var formattedData = void 0;

  // Parse JSON stringified request
  try {
    data = JSON.parse(args.toString());
  } catch (err) {
    throw new Error('Não foi possivel decodificar o JSON, por favor verifique o formato');
  }

  console.info('--- start usoCodigo ---');

  // check mandatory fields
  if (!data.id) {
    throw new Error('Por favor fornece um campo "id"');
  }

  // Verify data format
  try {
    formattedData = await _codigo.usarCodigoSchema.validate(data, validationOptions);
  } catch (e) {
    console.log(e);
    throw new Error(e.message);
  }

  // Verify if data exists
  var dataAsBytes = await stub.getState(data.id);
  if (dataAsBytes === undefined || !dataAsBytes.toString()) {
    throw new Error('codigo "' + data.id + '" nao encontrado');
  }

  // Parse data that will be updated
  var dataToUpdate = JSON.parse(dataAsBytes.toString());
  // Verify if not used
  if (dataToUpdate.usado) {
    throw new Error('codigo "' + data.id + '" ja usado');
  }

  // Merge formatted data
  var updatedData = _extends({}, dataToUpdate, formattedData);

  // 8. Put unidadeTransporte in the Ledger & send event
  var updatedDataAsBytes = Buffer.from(JSON.stringify(updatedData));
  await stub.putState(updatedData.id, updatedDataAsBytes);

  stub.setEvent('codigoUsado', updatedDataAsBytes);
  console.info('==================');
  console.log(updatedData);
  console.info('==================');
  console.info('--- usoCodigo ---');
};

// POST /uso-codigo/BR9380921SW

// {
//   "transportador":62,
//   "embarcador":1,
//   "rota": "BLU-BRS",
//   "servico": "SEDEX",
//   "servico_code": "81983",
//   "usado": "2019-12-12 12:12:00"
// }

// DIGITS => Formato
// 1-2 => [AZ] (aleatorio)
// 3-10 => [0-9] (aleatorio)
// 11 => [0-9] (check Digit)
// 12-13 => [AZ] (aleatorio - menos "BR")

// GET /codigos_rastreamento/12

// ATIVO

// status: 1 => criado
// status: 2 => usado
// status: 3 => Expirado
// status: 4 => Arquivado

// Front da Demo do código de Rastreamento:

// [Overview]
// Igual no demo hoje

// [Gerar Código]
// - Dropdown de "Embarcador" com 5 opções: B2W, Mercado Livre, Magazine Luiza, Via Varejo, Privalia"
// - Input de "Quantidade"

// Resultado
// - lista de Códigos gerados

// [Usar Codigo]
// - Dropdown dos Embarcadores (Mercado livre, etc)

// Depois a seleção apararece  uma lista de Códigos disponíveis

// Pode clicar em um código e preencher as informações necessários e gravar.

// ------------------
// quick obervacao, quando a gente cria codigo tem dois jeito pra fazer

// 1. criar um codigo sem verificacao (por 20 codigo 9.39695700071752 ms)
// 2. criar um codigo é verifica se exist na blockchain (por 3 codigos 71.542519999668 ms)

// let codeGenerated;
// let existingCode = true;
// while (existingCode) {
//   codeGenerated = generateCode();
//   // Verify if code exist after generating
//   /* eslint no-await-in-loop: "off" */
//   const codeGeneratedAsBytes = await stub.getState(codeGenerated);
//   /* eslint no-unneeded-ternary: "off" */
//   existingCode = codeGeneratedAsBytes.toString() ? true : false; // loop until does not exist
// }

// Solucao 1:
// Criar um batch de codigo com um idBatch, codigo nao cadastrado na blockchain, cadastrado quando usa uso-codigo
// vantagem: Podemos verificar se o codigo existe na funcao uso-codigo (por 20 codigo 9.39695700071752 ms)
// {
//   idBatch: 1,
//   "codigos": [
//     "BR9380921SW",
//     "BR838838SW",
//     "BR9380921SWs",
//   ],
//   "quantidade": 3,
//   "criado": "2018-12-12 12:12:00"
// }

// Solucao 2:
// Criar cada codigo e cadastra na blockchain é mandar formato tipo encima (com status criado)
// desvantagem: precisa ver se a cada se ja é cadastrado (71.542519999668 ms por 20 codigo)
// {
//   "id": "BR9380921SW"
//   "organization":1,
//   "rota": "BLU-BRS",
//   "servico": "SEDEX",
//   "servico_code": "81983",
//   "usado": "2019-12-12 12:12:00"
//   "status": 2
// }
//# sourceMappingURL=codigo.js.map