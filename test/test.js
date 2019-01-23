import { expect } from 'chai';
import { ChaincodeMockStub } from '@theledger/fabric-mock-stub';
import { Transform } from '@theledger/fabric-mock-stub';

import Chaincode from '../app/chaincode.js';

const MyChaincode = new Chaincode();

describe('Test chaincode', () => {
  const mockStub = new ChaincodeMockStub('MyMockStub', MyChaincode);

  it('Should init without issues', async () => {
    const response = await mockStub.mockInit('tx1', []);
    expect(response.status).to.equal(200);
  });

  it('Return errors if method does not exist', async () => {
    const testFunction = 'testFunction';
    const response = await mockStub.mockInvoke('tx1', [testFunction, 'test']);
    console.log(response);
    expect(response.message).to.equal(`funcao com nome "${testFunction}" nao encontrado`);
  });

  it('Should return empty string if the data requested does not exist', async () => {
    const response = await mockStub.mockInvoke('tx1', ['getDataById', 'test']);
    console.log(response);
    expect(response.payload.toString()).to.equal('');
  });

  it('Should be able to CREATE a Batch', async () => {
    const request = {
      quantidade: 10,
      embarcador: 'b2w'
    };
    const response = await mockStub.mockInvoke('tx1', ['solicitarCodigo', JSON.stringify(request)]);
    console.log(response);
    expect(response.status).to.equal(200);
  });

  it('Should be able to CREATE & GET a Batch by ID', async () => {
    const request = {
      quantidade: 10,
      embarcador: 'b2w'
    };
    const batchResponse = await mockStub.mockInvoke('tx1', ['solicitarCodigo', JSON.stringify(request)]);
    const eventPayload = await mockStub.getEvent('batchCreated');
    const batchId = JSON.parse(eventPayload.toString()).id;
    const response = await mockStub.mockInvoke('tx2', ['getDataById', batchId]);
    expect(JSON.parse(response.payload.toString()).id).to.equal(batchId);
  });

  it('Should be able to CREATE a Batch & GET a Codigo by ID', async () => {
    const request = {
      quantidade: 10,
      embarcador: 'b2w'
    };
    const batchResponse = await mockStub.mockInvoke('tx1', ['solicitarCodigo', JSON.stringify(request)]);
    const eventPayload = await mockStub.getEvent('batchCreated');
    const codigoId = JSON.parse(eventPayload.toString()).codigos[0];
    const response = await mockStub.mockInvoke('tx2', ['getDataById', codigoId]);
    expect(JSON.parse(response.payload.toString()).id).to.equal(codigoId);
  });

  it('Should be able to CREATE a Batch & USE a Codigo', async () => {
    const request = {
      quantidade: 10,
      embarcador: 'b2w'
    };
    const batchResponse = await mockStub.mockInvoke('tx1', ['solicitarCodigo', JSON.stringify(request)]);
    const eventPayload = await mockStub.getEvent('batchCreated');
    const codigoId = JSON.parse(eventPayload.toString()).codigos[0];
    const useCodigoRequest = {
      id: codigoId,
      transportador: 'test',
      rota: 'test',
      servico: 'test',
      servico_codigo: 'test'
    };
    const usarCodigoResponse = await mockStub.mockInvoke('tx2', ['usarCodigo', JSON.stringify(useCodigoRequest)]);
    const response = await mockStub.mockInvoke('tx3', ['getDataById', codigoId]);
    expect(JSON.parse(response.payload.toString()).usado).to.equal(true);
  });

  it('I can not USE a Codigo that does not exist', async () => {
    const request = {
      quantidade: 10,
      embarcador: 'b2w'
    };
    const batchResponse = await mockStub.mockInvoke('tx1', ['solicitarCodigo', JSON.stringify(request)]);
    const eventPayload = await mockStub.getEvent('batchCreated');
    const codigoId = JSON.parse(eventPayload.toString()).codigos[0];
    const useCodigoRequest = {
      id: 'test',
      transportador: 'test',
      rota: 'test',
      servico: 'test',
      servico_codigo: 'test'
    };
    const usarCodigoResponse = await mockStub.mockInvoke('tx2', ['usarCodigo', JSON.stringify(useCodigoRequest)]);
    expect(usarCodigoResponse.message).to.equal('codigo "test" nao encontrado');
  });

  it('I can not USE a Codigo that is already used', async () => {
    const request = {
      quantidade: 10,
      embarcador: 'b2w'
    };
    const batchResponse = await mockStub.mockInvoke('tx1', ['solicitarCodigo', JSON.stringify(request)]);
    const eventPayload = await mockStub.getEvent('batchCreated');
    const codigoId = JSON.parse(eventPayload.toString()).codigos[0];
    const useCodigoRequest = {
      id: codigoId,
      transportador: 'test',
      rota: 'test',
      servico: 'test',
      servico_codigo: 'test'
    };
    const usarCodigoResponse = await mockStub.mockInvoke('tx2', ['usarCodigo', JSON.stringify(useCodigoRequest)]);
    const useCodigoRequest2 = {
      id: codigoId,
      transportador: 'test',
      rota: 'test',
      servico: 'test',
      servico_codigo: 'test',
      usado: false
    };
    const usarCodigoResponse2 = await mockStub.mockInvoke('tx2', ['usarCodigo', JSON.stringify(useCodigoRequest)]);
    expect(usarCodigoResponse2.message).to.equal(`codigo "${codigoId}" ja usado`);
  });
});
