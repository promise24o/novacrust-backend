import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Wallet } from './entities/wallet.entity';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { TransferDto } from './dto/transfer.dto';

@Injectable()
export class WalletService {
  // In-memory storage
  private wallets: Map<string, Wallet> = new Map();
  private transactions: Map<string, Transaction[]> = new Map();
  private idempotencyKeys: Map<string, any> = new Map();

  /**
   * Create a new wallet
   */
  create(createWalletDto: CreateWalletDto): Wallet {
    const walletId = Wallet.generateHumanReadableId();
    const wallet = new Wallet(walletId, createWalletDto.currency || 'USD');
    this.wallets.set(walletId, wallet);
    this.transactions.set(walletId, []);
    return wallet;
  }

  /**
   * Fund a wallet with idempotency support
   */
  fund(walletId: string, fundWalletDto: FundWalletDto): Transaction {
    // Check idempotency
    if (fundWalletDto.idempotencyKey) {
      const cachedResult = this.idempotencyKeys.get(fundWalletDto.idempotencyKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${walletId} not found`);
    }

    if (fundWalletDto.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    // Update wallet balance
    wallet.balance += fundWalletDto.amount;
    wallet.updatedAt = new Date();

    // Create transaction record
    const transaction = new Transaction(
      uuidv4(),
      walletId,
      TransactionType.FUND,
      fundWalletDto.amount,
      wallet.balance,
      { description: 'Wallet funded' },
    );

    // Store transaction
    const walletTransactions = this.transactions.get(walletId) || [];
    walletTransactions.push(transaction);
    this.transactions.set(walletId, walletTransactions);

    // Cache result for idempotency
    if (fundWalletDto.idempotencyKey) {
      this.idempotencyKeys.set(fundWalletDto.idempotencyKey, transaction);
    }

    return transaction;
  }

  /**
   * Transfer funds between wallets with idempotency support
   */
  transfer(transferDto: TransferDto): { senderTransaction: Transaction; receiverTransaction: Transaction } {
    // Check idempotency
    if (transferDto.idempotencyKey) {
      const cachedResult = this.idempotencyKeys.get(transferDto.idempotencyKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const { fromWalletId, toWalletId, amount } = transferDto;

    // Validate wallets exist
    const senderWallet = this.wallets.get(fromWalletId);
    const receiverWallet = this.wallets.get(toWalletId);

    if (!senderWallet) {
      throw new NotFoundException(`Sender wallet with ID ${fromWalletId} not found`);
    }

    if (!receiverWallet) {
      throw new NotFoundException(`Receiver wallet with ID ${toWalletId} not found`);
    }

    // Validate same wallet transfer
    if (fromWalletId === toWalletId) {
      throw new BadRequestException('Cannot transfer to the same wallet');
    }

    // Validate amount
    if (amount <= 0) {
      throw new BadRequestException('Transfer amount must be positive');
    }

    // Check sufficient balance
    if (senderWallet.balance < amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${senderWallet.balance}, Required: ${amount}`,
      );
    }

    // Perform transfer
    senderWallet.balance -= amount;
    senderWallet.updatedAt = new Date();

    receiverWallet.balance += amount;
    receiverWallet.updatedAt = new Date();

    // Create transaction records
    const senderTransaction = new Transaction(
      uuidv4(),
      fromWalletId,
      TransactionType.TRANSFER_OUT,
      -amount,
      senderWallet.balance,
      {
        toWalletId,
        description: `Transfer to wallet ${toWalletId}`,
      },
    );

    const receiverTransaction = new Transaction(
      uuidv4(),
      toWalletId,
      TransactionType.TRANSFER_IN,
      amount,
      receiverWallet.balance,
      {
        fromWalletId,
        description: `Transfer from wallet ${fromWalletId}`,
      },
    );

    // Store transactions
    const senderTransactions = this.transactions.get(fromWalletId) || [];
    senderTransactions.push(senderTransaction);
    this.transactions.set(fromWalletId, senderTransactions);

    const receiverTransactions = this.transactions.get(toWalletId) || [];
    receiverTransactions.push(receiverTransaction);
    this.transactions.set(toWalletId, receiverTransactions);

    const result = { senderTransaction, receiverTransaction };

    // Cache result for idempotency
    if (transferDto.idempotencyKey) {
      this.idempotencyKeys.set(transferDto.idempotencyKey, result);
    }

    return result;
  }

  /**
   * Get wallet details with transaction history
   */
  findOne(walletId: string): { wallet: Wallet; transactions: Transaction[] } {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${walletId} not found`);
    }

    const transactions = this.transactions.get(walletId) || [];
    return {
      wallet,
      transactions: transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    };
  }

  /**
   * Get all wallets (for testing/debugging)
   */
  findAll(): Wallet[] {
    return Array.from(this.wallets.values());
  }
}
