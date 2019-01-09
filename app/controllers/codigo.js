// const config = require('../config.js');
// const validationOptions = { recursive: true, abortEarly: true, stripUnknown: true };
import generateCode from '../utils';

// (tipoDestinatario, identificador, idServico, qtdEtiquetas, usuario, senha)

export const solicitarCodigo = async (stub, args) => {
  let data;
  let codigo;
  let codigoAsBytes;
  const codigosDetails = {};
  const putStatePromise = [];

  // 1. Parse JSON stringified request
  try {
    data = JSON.parse(args.toString());
  } catch (err) {
    throw new Error('Não foi possivel decodificar o JSON, por favor verifique o formato');
  }
  console.info('--- start solicitarCodigo ---');
  for (let i = 0; i < data.quantitade; i += 1) {
    codigo = {
      codigo: generateCode(),
      // organization: 12,
      // criado: "2018-12-12 12:12:00",
      // usado: "2019-12-12 12:12:00",
      status: 1
    };
    codigoAsBytes = Buffer.from(JSON.stringify(codigo));
    console.log(codigoAsBytes);
    codigosDetails[codigo.codigo] = codigo;
    putStatePromise.push(stub.putState(codigo.codigo, codigoAsBytes));
  }

  await Promise.all(putStatePromise);
  const codigosDetailsAsBytes = Buffer.from(JSON.stringify(codigosDetails));

  stub.setEvent('codigoCreated', codigosDetailsAsBytes);
  console.info('==================');
  console.log(codigosDetails);
  console.info('==================');
  console.info('--- end create codigoRastreamento ---');

  // return resultAsBytes;
};

export const usoCodigo = async () => {};

// Service indicator
// 3 to 10 n8 Serial number
// 11 n1 Check digit
// 12 and 13 a2 Country code

// DIGITS => Formato
// 1-2 => [AZ] (aleatorio)
// 3-10 => [0-9] (aleatorio)
// 11 => [0-9] (check Digit)
// 12-13 => [AZ] (aleatorio - menos "BR")

// GET /codigos_rastreamento/12

// RETURN
// {
//   "codigos": [
//     "BR9380921SW",
//     "BR838838SW",
//     "BR9380921SWs",
//     "BR9380921SW",
//     "BR838838SW",
//     "BR9380921SWs",
//     "BR9380921SW",
//     "BR838838SW",
//     "BR9380921SWs",
//     "BR9380921SWs",
//     "BR9380921SWs",
//     "BR9380921SWs"
//   ],
//   "quantidade": 12,
//   "criado": "2018-12-12 12:12:00"
// }

// ATIVO

// status: 1 => criado
// status: 2 => usado
// status: 3 => Expirado
// status: 4 => Arquivado

// POST /uso-codigo/BR9380921SW

// {
//   "organization":1,
//   "rota": "BLU-BRS",
//   "servico": "SEDEX",
//   "servico_code": "81983",
//   "usado": "2019-12-12 12:12:00"
// }
