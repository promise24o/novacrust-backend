export enum TransactionType {
  FUND = 'FUND',
  TRANSFER_OUT = 'TRANSFER_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  status: TransactionStatus;
  metadata?: {
    fromWalletId?: string;
    toWalletId?: string;
    description?: string;
  };
  createdAt: Date;

  constructor(
    id: string,
    walletId: string,
    type: TransactionType,
    amount: number,
    balanceAfter: number,
    metadata?: any,
  ) {
    this.id = id;
    this.walletId = walletId;
    this.type = type;
    this.amount = amount;
    this.balanceAfter = balanceAfter;
    this.status = TransactionStatus.COMPLETED;
    this.metadata = metadata;
    this.createdAt = new Date();
  }
}
