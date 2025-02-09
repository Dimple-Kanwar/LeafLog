
import { TransactionHistoryService } from '../services/transactionHistory';
import { expect, jest, test } from '@jest/globals';

describe('Transaction History Service', () => {
  const service = new TransactionHistoryService('https://base-sepolia.g.alchemy.com/v2/demo');

  test('getTransactions returns correct structure', async () => {
    const result = await service.getTransactions(
      '0x1234567890123456789012345678901234567890',
      0,
      100
    );
    
    expect(result).toHaveProperty('transactions');
    expect(result).toHaveProperty('nftTransfers');
    expect(result).toHaveProperty('airdrops');
  });
});
