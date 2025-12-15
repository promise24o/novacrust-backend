import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TransactionType } from './entities/transaction.entity';

describe('WalletService', () => {
  let service: WalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletService],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a wallet with default USD currency', () => {
      const wallet = service.create({ currency: 'USD' });

      expect(wallet).toBeDefined();
      expect(wallet.id).toBeDefined();
      expect(wallet.currency).toBe('USD');
      expect(wallet.balance).toBe(0);
      expect(wallet.createdAt).toBeInstanceOf(Date);
      expect(wallet.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a wallet with specified currency', () => {
      const wallet = service.create({ currency: 'USD' });

      expect(wallet.currency).toBe('USD');
    });
  });

  describe('fund', () => {
    it('should fund a wallet successfully', () => {
      const wallet = service.create({ currency: 'USD' });
      const transaction = service.fund(wallet.id, { amount: 100 });

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe(TransactionType.FUND);
      expect(transaction.amount).toBe(100);
      expect(transaction.balanceAfter).toBe(100);
      expect(transaction.walletId).toBe(wallet.id);
    });

    it('should throw NotFoundException for non-existent wallet', () => {
      expect(() => {
        service.fund('non-existent-id', { amount: 100 });
      }).toThrow(NotFoundException);
    });

    it('should throw BadRequestException for negative amount', () => {
      const wallet = service.create({ currency: 'USD' });

      expect(() => {
        service.fund(wallet.id, { amount: -50 });
      }).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for zero amount', () => {
      const wallet = service.create({ currency: 'USD' });

      expect(() => {
        service.fund(wallet.id, { amount: 0 });
      }).toThrow(BadRequestException);
    });

    it('should support idempotency for fund operations', () => {
      const wallet = service.create({ currency: 'USD' });
      const idempotencyKey = 'fund-key-123';

      const transaction1 = service.fund(wallet.id, {
        amount: 100,
        idempotencyKey,
      });

      const transaction2 = service.fund(wallet.id, {
        amount: 100,
        idempotencyKey,
      });

      // Should return the same transaction
      expect(transaction1.id).toBe(transaction2.id);
      
      // Balance should only be updated once
      const { wallet: updatedWallet } = service.findOne(wallet.id);
      expect(updatedWallet.balance).toBe(100);
    });
  });

  describe('transfer', () => {
    it('should transfer funds between wallets successfully', () => {
      const wallet1 = service.create({ currency: 'USD' });
      const wallet2 = service.create({ currency: 'USD' });

      // Fund first wallet
      service.fund(wallet1.id, { amount: 200 });

      // Transfer
      const result = service.transfer({
        fromWalletId: wallet1.id,
        toWalletId: wallet2.id,
        amount: 100,
      });

      expect(result.senderTransaction).toBeDefined();
      expect(result.receiverTransaction).toBeDefined();
      expect(result.senderTransaction.type).toBe(TransactionType.TRANSFER_OUT);
      expect(result.receiverTransaction.type).toBe(TransactionType.TRANSFER_IN);
      expect(result.senderTransaction.amount).toBe(-100);
      expect(result.receiverTransaction.amount).toBe(100);

      // Check balances
      const { wallet: updatedWallet1 } = service.findOne(wallet1.id);
      const { wallet: updatedWallet2 } = service.findOne(wallet2.id);
      expect(updatedWallet1.balance).toBe(100);
      expect(updatedWallet2.balance).toBe(100);
    });

    it('should throw NotFoundException for non-existent sender wallet', () => {
      const wallet2 = service.create({ currency: 'USD' });

      expect(() => {
        service.transfer({
          fromWalletId: 'non-existent-id',
          toWalletId: wallet2.id,
          amount: 100,
        });
      }).toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent receiver wallet', () => {
      const wallet1 = service.create({ currency: 'USD' });
      service.fund(wallet1.id, { amount: 200 });

      expect(() => {
        service.transfer({
          fromWalletId: wallet1.id,
          toWalletId: 'non-existent-id',
          amount: 100,
        });
      }).toThrow(NotFoundException);
    });

    it('should throw BadRequestException for insufficient balance', () => {
      const wallet1 = service.create({ currency: 'USD' });
      const wallet2 = service.create({ currency: 'USD' });

      service.fund(wallet1.id, { amount: 50 });

      expect(() => {
        service.transfer({
          fromWalletId: wallet1.id,
          toWalletId: wallet2.id,
          amount: 100,
        });
      }).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for same wallet transfer', () => {
      const wallet = service.create({ currency: 'USD' });
      service.fund(wallet.id, { amount: 100 });

      expect(() => {
        service.transfer({
          fromWalletId: wallet.id,
          toWalletId: wallet.id,
          amount: 50,
        });
      }).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for negative transfer amount', () => {
      const wallet1 = service.create({ currency: 'USD' });
      const wallet2 = service.create({ currency: 'USD' });

      service.fund(wallet1.id, { amount: 200 });

      expect(() => {
        service.transfer({
          fromWalletId: wallet1.id,
          toWalletId: wallet2.id,
          amount: -50,
        });
      }).toThrow(BadRequestException);
    });

    it('should support idempotency for transfer operations', () => {
      const wallet1 = service.create({ currency: 'USD' });
      const wallet2 = service.create({ currency: 'USD' });
      const idempotencyKey = 'transfer-key-456';

      service.fund(wallet1.id, { amount: 200 });

      const result1 = service.transfer({
        fromWalletId: wallet1.id,
        toWalletId: wallet2.id,
        amount: 100,
        idempotencyKey,
      });

      const result2 = service.transfer({
        fromWalletId: wallet1.id,
        toWalletId: wallet2.id,
        amount: 100,
        idempotencyKey,
      });

      // Should return the same transaction
      expect(result1.senderTransaction.id).toBe(result2.senderTransaction.id);
      expect(result1.receiverTransaction.id).toBe(result2.receiverTransaction.id);

      // Balances should only be updated once
      const { wallet: updatedWallet1 } = service.findOne(wallet1.id);
      const { wallet: updatedWallet2 } = service.findOne(wallet2.id);
      expect(updatedWallet1.balance).toBe(100);
      expect(updatedWallet2.balance).toBe(100);
    });
  });

  describe('findOne', () => {
    it('should return wallet with transaction history', () => {
      const wallet = service.create({ currency: 'USD' });
      service.fund(wallet.id, { amount: 100 });
      service.fund(wallet.id, { amount: 50 });

      const result = service.findOne(wallet.id);

      expect(result.wallet).toBeDefined();
      expect(result.wallet.id).toBe(wallet.id);
      expect(result.wallet.balance).toBe(150);
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0].createdAt.getTime()).toBeGreaterThanOrEqual(
        result.transactions[1].createdAt.getTime(),
      );
    });

    it('should throw NotFoundException for non-existent wallet', () => {
      expect(() => {
        service.findOne('non-existent-id');
      }).toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all wallets', () => {
      service.create({ currency: 'USD' });
      service.create({ currency: 'USD' });

      const wallets = service.findAll();

      expect(wallets).toHaveLength(2);
    });

    it('should return empty array when no wallets exist', () => {
      const wallets = service.findAll();

      expect(wallets).toHaveLength(0);
    });
  });
});
