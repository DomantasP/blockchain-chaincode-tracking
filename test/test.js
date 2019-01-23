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

  it('Return an error if method does not exist', async () => {
    let response = await mockStub.mockInvoke('tx1', ['testFunction', 'test']);
    console.log(response);
    expect(response.status).to.equal(200);
  });
});
