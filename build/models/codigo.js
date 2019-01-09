'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var yup = require('yup');

var codigoSchema = yup.object().shape({
  tipoDestinatario: yup.string().required('Por favor especifique um tipoDestinatario'), // ****REQUIRED****
  identificador: yup.string().required('Por favor especifique um identificador'), // ****REQUIRED****
  idServico: yup.string().required('Por favor especifique um idServico'), // ****REQUIRED****
  qtdEtiquetas: yup.number().positive().required('Por favor especifique um qtdEtiquetas') // ****REQUIRED****
});

exports.default = codigoSchema;
//# sourceMappingURL=codigo.js.map