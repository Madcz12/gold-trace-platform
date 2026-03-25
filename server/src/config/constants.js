export const ROLES = {
  ADMIN: 'admin',
  OPERADOR_MINA: 'operador_mina',
  TECNICO_LABORATORIO: 'tecnico_laboratorio',
  FUNDIDOR: 'fundidor',
  TRANSPORTADOR: 'transportador',
  COMERCIALIZADOR: 'comercializador',
  EXPORTADOR: 'exportador',
  AUDITOR: 'auditor',
};

export const ROLE_LIST = Object.values(ROLES);

export const LOT_STATUS = {
  REGISTERED: 'registrado',
  SAMPLED: 'muestreado',
  SMELTED: 'fundido',
  IN_TRANSIT: 'en_transito',
  DELIVERED: 'entregado',
  SOLD: 'vendido',
};

export const TRANSFER_STATUS = {
  PENDING: 'pendiente',
  SIGNED: 'firmado',
  COMPLETED: 'completado',
};

export const HASH_CHAIN_ACTIONS = {
  LOT_CREATED: 'lot_created',
  SAMPLE_ADDED: 'sample_added',
  BAR_PRODUCED: 'bar_produced',
  TRANSFER_INITIATED: 'transfer_initiated',
  TRANSFER_COMPLETED: 'transfer_completed',
  CORRECTION: 'correction',
};

export const WEIGHT_TOLERANCE_PCT = parseFloat(process.env.WEIGHT_TOLERANCE_PCT || '2');
export const TRANSFER_TOLERANCE_PCT = parseFloat(process.env.TRANSFER_TOLERANCE_PCT || '1');
export const IDLE_DAYS_ALERT = parseInt(process.env.IDLE_DAYS_ALERT || '30');
