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

  // 1. Parse JSON stringified request
  try {
    data = JSON.parse(args.toString());
  } catch (err) {
    throw new Error('Não foi possivel decodificar o JSON, por favor verifique o formato');
  }

  console.info('--- start solicitarCodigo ---');

  // 2. Verify mandatory fields was passed
  if (!(data.embarcador && data.quantidade)) {
    throw new Error('Por favor preenche campo mandatorio embarcador/quantidade');
  }

  // 3. Verify embarcador value
  const embarcadorSelected = data.embarcador.toLowerCase();
  const embarcadorAvailable = ['b2w', 'mercado livre', 'magazine luiza', 'via varejo', 'privalia'];
  if (!embarcadorAvailable.includes(embarcadorSelected)) {
    throw new Error('Embarcador nao disponivel');
  }

  // 4. get MSPID of transaction proposer
  const organizationMSPID = stub.getCreator().mspid;

  // 5. Create batch
  const batch = {
    docType: 'batch',
    embarcador: embarcadorSelected,
    id: uuidv4(),
    codigos: [],
    quantidade: data.quantidade,
    organization: organizationMSPID
  };

  // 6. Create tracking code
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

      // 6.1. Verify if codigo already exist
      /* eslint-disable no-await-in-loop */
      const newCodigoAsBytes = await stub.getState(codigo.id);
      // Ternary operation is use because the value returned by an empty key:value pair is set to undefined instead of '' in the testing environment
      const newCodigoAsString = newCodigoAsBytes ? newCodigoAsBytes.toString() : '';
      // 6.2. Loop again and generate a new code if codigo already exist
      if (!newCodigoAsString) {
        break;
      }
    }
    // 6.3. Push codigo id into batch
    batch.codigos.push(codigo.id);

    // 6.4. Push codigo into ledger
    codigoPutStatePromises.push(stub.putState(codigo.id, Buffer.from(JSON.stringify(codigo))));
  }

  // 7. Wait for all codigo putState promises to terminate
  await Promise.all(codigoPutStatePromises);

  // 8. Push data into ledger
  const batchAsBytes = Buffer.from(JSON.stringify(batch));
  await stub.putState(batch.id, batchAsBytes);

  // 9. Create event
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

  // 1. Parse JSON stringified request
  try {
    data = JSON.parse(args.toString());
  } catch (err) {
    throw new Error('Não foi possivel decodificar o JSON, por favor verifique o formato');
  }

  console.info('--- start usarCodigo ---');

  // 2. Verify Object format
  try {
    formattedData = await usarCodigoSchema.validate(data, validationOptions);
  } catch (err) {
    // log yup validation errors
    console.log(err);
    throw new Error(err.message);
  }

  const dataAsBytes = await stub.getState(data.id);

  // Ternary operation is use because the value returned by an empty key:value pair is set to undefined instead of '' in the testing environment
  const dataAsString = dataAsBytes ? dataAsBytes.toString() : '';

  // 3. Verify if data already exist
  if (!dataAsString) {
    throw new Error(`codigo "${data.id}" nao encontrado`);
  }

  // 4. Parse data that will be updated
  const dataToUpdate = JSON.parse(dataAsBytes.toString());
  // Verify if codigo was not already used
  if (dataToUpdate.usado) {
    throw new Error(`codigo "${data.id}" ja usado`);
  }

  // 5. Merge formatted data
  const updatedData = { ...dataToUpdate, ...formattedData };

  // 6. Transform the JSON data into Bytes data
  const updatedDataAsBytes = Buffer.from(JSON.stringify(updatedData));

  // 7. Push updated data into the ledger
  await stub.putState(updatedData.id, updatedDataAsBytes);

  // 8. Create event
  stub.setEvent('codigoUsado', updatedDataAsBytes);
  console.info('==================');
  console.log(updatedData);
  console.info('==================');
  console.info('--- usarCodigo ---');
};
