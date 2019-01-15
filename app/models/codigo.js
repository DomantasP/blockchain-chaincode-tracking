const yup = require('yup');

// not used for now
export const codigoSchema = yup.object().shape({
  docType: yup
    .string()
    .default('codigo')
    .test('is-docType-exist', 'Por favor especifique docType', value => value === 'codigo'),
  id: yup.string().required('Por favor especifique um codigo'),
  embarcador: yup.string().default(''),
  transportador: yup.string().default(''),
  rota: yup.string().default(''),
  servico: yup.string().default(''),
  servico_codigo: yup.string().default(''),
  usado: yup.string().default(false)
});

export const usarCodigoSchema = yup.object().shape({
  transportador: yup.string().required('Por favor especifique um transportador'),
  rota: yup.string().required('Por favor especifique uma rota'),
  servico: yup.string().required('Por favor especifique um servico'),
  servico_codigo: yup.string().required('Por favor especifique um servico_codigo'),
  usado: yup
    .boolean()
    .default(true)
    .test('is-true', '"usado" nao definido como true', value => value === true)
});
