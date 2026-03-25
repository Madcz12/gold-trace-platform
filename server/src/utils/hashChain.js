import crypto from 'crypto';
import { HashRecord } from '../models/index.js';

/**
 * Add a new record to the hash chain.
 */
export async function addHashRecord(entityType, entityId, action, payload, userId) {
  const lastRecord = await HashRecord.findOne({
    order: [['sequence_number', 'DESC']],
  });

  const previousHash = lastRecord ? lastRecord.combinedHash : '0'.repeat(64);

  const dataHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');

  const combinedHash = crypto
    .createHash('sha256')
    .update(previousHash + dataHash)
    .digest('hex');

  const record = await HashRecord.create({
    entityType,
    entityId,
    action,
    dataHash,
    previousHash,
    combinedHash,
    payload,
    userId,
  });

  return record;
}

/**
 * Verify the integrity of the entire hash chain or a filtered subset.
 */
export async function verifyChain(entityType = null, entityId = null) {
  const where = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;

  const records = await HashRecord.findAll({
    order: [['sequence_number', 'ASC']],
    ...(Object.keys(where).length > 0 ? { where } : {}),
  });

  if (records.length === 0) {
    return { valid: true, records: 0, errors: [] };
  }

  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // Verify data hash
    const expectedDataHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(record.payload))
      .digest('hex');

    if (record.dataHash !== expectedDataHash) {
      errors.push({
        sequenceNumber: record.sequenceNumber,
        type: 'data_tampered',
        message: `Registro #${record.sequenceNumber}: el hash de datos no coincide. Los datos fueron alterados.`,
      });
    }

    // Verify chain link
    const expectedPreviousHash = i === 0 ? '0'.repeat(64) : records[i - 1].combinedHash;

    if (record.previousHash !== expectedPreviousHash) {
      errors.push({
        sequenceNumber: record.sequenceNumber,
        type: 'chain_broken',
        message: `Registro #${record.sequenceNumber}: el hash anterior no coincide. La cadena fue alterada.`,
      });
    }

    // Verify combined hash
    const expectedCombinedHash = crypto
      .createHash('sha256')
      .update(record.previousHash + record.dataHash)
      .digest('hex');

    if (record.combinedHash !== expectedCombinedHash) {
      errors.push({
        sequenceNumber: record.sequenceNumber,
        type: 'combined_hash_invalid',
        message: `Registro #${record.sequenceNumber}: el hash combinado es inválido.`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    records: records.length,
    errors,
  };
}
