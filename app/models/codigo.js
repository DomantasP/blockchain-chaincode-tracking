const yup = require('yup');

/* eslint-disable import/prefer-default-export */
export const usarCodigoSchema = yup.object().shape({
  id: yup.string().required('Por favor especifique um id'),
  transportador: yup.string().required('Por favor especifique um transportador'),
  rota: yup.string().required('Por favor especifique uma rota'),
  servico: yup.string().required('Por favor especifique um servico'),
  servico_codigo: yup.string().required('Por favor especifique um servico_codigo'),
  usado: yup
    .boolean()
    .default(true)
    .test('is-true', '"usado" nao definido como true', value => value === true)
});
