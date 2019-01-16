'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var yup = require('yup');

// not used for now
var codigoSchema = exports.codigoSchema = yup.object().shape({
  docType: yup.string().default('codigo').test('is-docType-exist', 'Por favor especifique docType', function (value) {
    return value === 'codigo';
  }),
  id: yup.string().required('Por favor especifique um codigo id'),
  embarcador: yup.string().default(''),
  transportador: yup.string().default(''),
  rota: yup.string().default(''),
  servico: yup.string().default(''),
  servico_codigo: yup.string().default(''),
  usado: yup.string().default(false)
});

var usarCodigoSchema = exports.usarCodigoSchema = yup.object().shape({
  id: yup.string().required('Por favor especifique um codigo id'),
  transportador: yup.string().required('Por favor especifique um transportador'),
  rota: yup.string().required('Por favor especifique uma rota'),
  servico: yup.string().required('Por favor especifique um servico'),
  servico_codigo: yup.string().required('Por favor especifique um servico_codigo'),
  usado: yup.boolean().default(true).test('is-true', '"usado" nao definido como true', function (value) {
    return value === true;
  })
});
//# sourceMappingURL=codigo.js.map