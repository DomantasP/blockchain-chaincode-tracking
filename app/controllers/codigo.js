// const config = require('../config.js');
import uuidv4 from 'uuid/v4';
// import { performance } from 'perf_hooks';
import { generateCodigo } from '../utils';
import { usarCodigoSchema } from '../models/codigo';

//  { descend into nested schema, return on first error, remove unspecified keys from objects }
const validationOptions = { recursive: true, abortEarly: true, stripUnknown: true };

export const solicitarCodigo = async (stub, args) => {
  // const t0 = performance.now();

  let data;
  const codigoPutStatePromises = [];

  // Parse JSON stringified request
  try {
    data = JSON.parse(args.toString());
  } catch (err) {
    throw new Error('Não foi possivel decodificar o JSON, por favor verifique o formato');
  }

  console.info('--- start solicitarCodigo ---');

  // Verify mandatory fields was passed
  if (!(data.embarcador && data.quantidade)) {
    throw new Error('Por favor preenche campo mandatorio embarcador/quantidade');
  }

  // Verify embarcador value
  const embarcadorSelected = data.embarcador.toLowerCase();
  const embarcadorAvailable = ['b2w', 'mercado livre', 'magazine luiza', 'via varejo', 'privalia'];
  if (!embarcadorAvailable.includes(embarcadorSelected)) {
    throw new Error('Embarcador nao disponivel');
  }

  // get MSPID of transaction proposer
  const organizationMSPID = stub.getCreator().mspid;

  // Create batch
  const batch = {
    docType: 'batch',
    embarcador: embarcadorSelected,
    id: uuidv4(),
    codigos: [],
    organization: organizationMSPID
  };

  // Create tracking code
  for (let i = 0; i < data.quantidade; i += 1) {
    let codigo;
    while (true) {
      codigo = {
        batchId: batch.id,
        docType: 'codigo',
        id: generateCodigo(),
        transportador: '',
        embarcador: embarcadorSelected,
        rota: '',
        servico: '',
        servico_codigo: '',
        usado: false
        // status: 1
      };

      // Verify if codigo already exist
      /* eslint-disable no-await-in-loop */
      const newCodigoAsBytes = await stub.getState(codigo.id);
      // ternary operation for testing return undefined instead of empty string
      const newCodigoAsString = newCodigoAsBytes ? newCodigoAsBytes.toString() : '';
      // Loop again and generate a new code if codigo already exist
      /* eslint-disable no-unneeded-ternary */
      if (!newCodigoAsString) {
        break;
      }
    }
    // Push codigo id into batch
    batch.codigos.push(codigo.id);

    // Push codigo into ledger
    codigoPutStatePromises.push(stub.putState(codigo.id, Buffer.from(JSON.stringify(codigo))));
  }

  // Wait for all codigo putState promises to terminate
  await Promise.all(codigoPutStatePromises);

  // Push batch into ledger
  const batchAsBytes = Buffer.from(JSON.stringify(batch));
  await stub.putState(batch.id, batchAsBytes);

  stub.setEvent('batchCreated', batchAsBytes);
  console.info('==================');
  console.log(batch);
  console.info('==================');

  console.info('--- end create solicitarCodigo ---');

  // const t1 = performance.now();
  // console.log(`Call took ${t1 - t0} ms.`);
};

export const usarCodigo = async (stub, args) => {
  let data;
  let formattedData;

  // Parse JSON stringified request
  try {
    data = JSON.parse(args.toString());
  } catch (err) {
    throw new Error('Não foi possivel decodificar o JSON, por favor verifique o formato');
  }

  console.info('--- start usoCodigo ---');

  // Verify Object format
  try {
    formattedData = await usarCodigoSchema.validate(data, validationOptions);
  } catch (err) {
    // log yup validation errors
    console.log(err);
    throw new Error(err.message);
  }

  // Verify if data already exist
  const dataAsBytes = await stub.getState(data.id);
  const dataAsString = dataAsBytes ? dataAsBytes.toString() : '';
  // undefined is used for testing purpose (bug in the test lib)
  if (!dataAsString) {
    throw new Error(`codigo "${data.id}" nao encontrado`);
  }

  // Parse data that will be updated
  const dataToUpdate = JSON.parse(dataAsBytes.toString());
  // Verify if codigo was not already used
  if (dataToUpdate.usado) {
    throw new Error(`codigo "${data.id}" ja usado`);
  }

  // Merge formatted data
  const updatedData = { ...dataToUpdate, ...formattedData };

  // Put unidadeTransporte in the Ledger & send event
  const updatedDataAsBytes = Buffer.from(JSON.stringify(updatedData));
  await stub.putState(updatedData.id, updatedDataAsBytes);

  stub.setEvent('codigoUsado', updatedDataAsBytes);
  console.info('==================');
  console.log(updatedData);
  console.info('==================');
  console.info('--- usoCodigo ---');
};
