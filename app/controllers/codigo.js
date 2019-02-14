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

  // 1. Parses JSON stringified request
  try {
    data = JSON.parse(args.toString());
  } catch (err) {
    throw new Error('Não foi possivel decodificar o JSON, por favor verifique o formato');
  }

  console.info('--- start solicitarCodigo ---');

  // 2. Verifies mandatory fields was passed
  if (!(data.embarcador && data.quantidade)) {
    throw new Error('Por favor preenche campo mandatorio embarcador/quantidade');
  }

  // 3. Verifies embarcador value
  const embarcadorSelected = data.embarcador.toLowerCase();
  const embarcadorAvailable = ['b2w', 'mercado livre', 'magazine luiza', 'via varejo', 'privalia'];
  if (!embarcadorAvailable.includes(embarcadorSelected)) {
    throw new Error('Embarcador nao disponivel');
  }

  // 4.1 gets MSPID of transaction proposer
  const organizationMSPID = stub.getCreator().mspid;
  // 4.2 Get UTC date of header proposal
  const timestamp = new Date(stub.getTxTimestamp().getSeconds() * 1000).toISOString();

  // 5. Creates batch
  const batch = {
    docType: 'batch',
    embarcador: embarcadorSelected,
    id: uuidv4(),
    codigos: [],
    quantidade: data.quantidade,
    organization: organizationMSPID,
    dateOfProposalCreation: timestamp,
    dateOfLastProposalUpdate: timestamp
  };

  // 6. Creates tracking code
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
        usado: false,
        dateOfProposalCreation: timestamp,
        dateOfLastProposalUpdate: timestamp
        // status: 1
      };

      // 6.1. Verifies if codigo already exist
      /* eslint-disable no-await-in-loop */
      const newCodigoAsBytes = await stub.getState(codigo.id);
      // 6.2. Loop again and generate a new code if codigo already exist
      if (!newCodigoAsBytes.toString()) {
        break;
      }
    }
    // 6.3. Pushes codigo id into batch
    batch.codigos.push(codigo.id);

    // 6.4. Pushes codigo into ledger
    codigoPutStatePromises.push(stub.putState(codigo.id, Buffer.from(JSON.stringify(codigo))));
  }

  // 7. Waits for all codigo putState promises to terminate
  await Promise.all(codigoPutStatePromises);

  // 8. Pushes data into ledger
  const batchAsBytes = Buffer.from(JSON.stringify(batch));
  await stub.putState(batch.id, batchAsBytes);

  // 9. Creates event
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

  // 1. Parses JSON stringified request
  try {
    data = JSON.parse(args.toString());
  } catch (err) {
    throw new Error('Não foi possivel decodificar o JSON, por favor verifique o formato');
  }

  console.info('--- start usarCodigo ---');

  // 2. Verifies Object format
  try {
    formattedData = await usarCodigoSchema.validate(data, validationOptions);
  } catch (err) {
    // logs yup validation errors
    console.log(err);
    throw new Error(err.message);
  }

  const dataAsBytes = await stub.getState(data.id);

  // 3. Verifies if data already exist
  if (!dataAsBytes.toString()) {
    throw new Error(`codigo "${data.id}" nao encontrado`);
  }

  // 4. Parses data that will be updated
  const dataToUpdate = JSON.parse(dataAsBytes.toString());
  // Verifies if codigo was not already used
  if (dataToUpdate.usado) {
    throw new Error(`codigo "${data.id}" ja usado`);
  }

  // 5 Gets UTC date of header proposal
  formattedData.dateOfLastProposalUpdate = new Date(stub.getTxTimestamp().getSeconds() * 1000).toISOString();

  // 6. Merges formatted data
  const updatedData = { ...dataToUpdate, ...formattedData };

  // 7. Transforms the JSON data into Bytes data
  const updatedDataAsBytes = Buffer.from(JSON.stringify(updatedData));

  // 8. Pushes updated data into the ledger
  await stub.putState(updatedData.id, updatedDataAsBytes);

  // 8. Creates event
  stub.setEvent('codigoUsado', updatedDataAsBytes);
  console.info('==================');
  console.log(updatedData);
  console.info('==================');
  console.info('--- usarCodigo ---');
};
