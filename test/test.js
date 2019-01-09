const expect = require("chai").expect;
const Chaincode = require("../chaincode.js").Chaincode;

const ChaincodeMockStub = require("@theledger/fabric-mock-stub").ChaincodeMockStub;
const Transform = require("@theledger/fabric-mock-stub").Transform;

const MyChaincode = new Chaincode();

const orgSchema = {
  smart_contract: { versao: "1.0", nome: "organizacao" },
  endereco: {
    uf: "",
    cidade: "",
    cep: "",
    bairro: "",
    referencia: "",
    complemento: "",
    numero: "",
    rua: ""
  },
  ie: "",
  nome_fantasia: "",
  razao_social: "",
  cnpj: "",
  email: "",
  responsavel: "",
  tipo: "",
  nome: "",
  docType: "organizacao"
};

describe("Test chaincode", () => {
  const mockStub = new ChaincodeMockStub("MyMockStub", MyChaincode);
  it("Should init without issues", async () => {
    const response = await mockStub.mockInit("tx1", []);
    expect(response.status).to.equal(200);
  });
  it("Should be able to add org", async () => {
    let org = {
      nome: "loggi",
      cnpj: "cnpj_loggi",
      tipo: "transportadora",
      responsavel: "jojo_loggi"
    };
    let response = await mockStub.mockInvoke("tx1", ["createOrganizacao", JSON.stringify(org)]);
    expect(response.status).to.equal(200);
  });
  it("Should be able to get org created", async () => {
    let org = {
      nome: "loggi",
      cnpj: "cnpj_loggi",
      tipo: "transportadora",
      responsavel: "jojo_loggi"
    };
    let response = await mockStub.mockInvoke("tx1", ["getOrganizacao", "cnpj_loggi"]);
    expect(response.status).to.equal(200);
    expect(JSON.parse(response.payload)).to.deep.equal({ ...orgSchema, ...org });
  });
  it("Can not get org that does not exist", async () => {
    let response = await mockStub.mockInvoke("tx1", ["getOrganizacao", "cnpj_logg"]);
    expect(response.status).to.equal(500);
    expect(response.message).to.not.equal("Cannot read property 'toString' of undefined");
  });
  it("Should be able to update org", async () => {
    let org = {
      nome: "loggi_updated",
      cnpj: "cnpj_loggi",
      tipo: "transportadora",
      responsavel: "jojo_loggi_updated"
    };

    let response = await mockStub.mockInvoke("tx1", ["updateOrganizacao", JSON.stringify(org)]);
    expect(response.status).to.equal(200);

    response = await mockStub.mockInvoke("tx1", ["getOrganizacao", `cnpj_loggi`]);
    expect(JSON.parse(response.payload)).to.deep.equal({ ...orgSchema, ...org });
  });
  it("Can not update an org with a cnpj that does not exist", async () => {
    let org = {
      nome: "loggi_toUpdated",
      cnpj: "cnpj_logg",
      tipo: "transportadora",
      responsavel: "jojoToUpdated"
    };

    let response = await mockStub.mockInvoke("tx1", ["updateOrganizacao", JSON.stringify(org)]);
    console.log(response);
    expect(response.status).to.equal(500);
    expect(response.message).to.not.equal("Cannot read property 'toString' of undefined");
  });
  it("Can not create an org with an existing nome", async () => {
    let org = {
      nome: "loggi",
      cnpj: "cnpj_loggi",
      tipo: "transportadora",
      responsavel: "jojo"
    };

    let response = await mockStub.mockInvoke("tx1", ["createOrganizacao", JSON.stringify(org)]);
    expect(response.status).to.equal(500);
    expect(response.message).to.not.equal("Cannot read property 'toString' of undefined");
  });
  it("Can not create an org with a tipo that do not exist", async () => {
    let org = {
      nome: "loggi",
      cnpj: "cnpj_default",
      tipo: "transportador",
      responsavel: "jojo"
    };
    let response = await mockStub.mockInvoke("tx1", ["createOrganizacao", JSON.stringify(org)]);
    expect(response.status).to.equal(500);
    expect(response.message).to.not.equal("Cannot read property 'toString' of undefined");
  });
});
