import { IsString, IsNumber, IsPositive, IsOptional, Matches, Max } from 'class-validator';

export class TransferDto {
  @IsString()
  @Matches(/^[a-z]+-[a-z]+-\d{4}$/, { message: 'Sender wallet ID must be in format: adjective-noun-1234' })
  fromWalletId: string;

  @IsString()
  @Matches(/^[a-z]+-[a-z]+-\d{4}$/, { message: 'Receiver wallet ID must be in format: adjective-noun-1234' })
  toWalletId: string;

  @IsNumber()
  @IsPositive({ message: 'Amount must be a positive number' })
  @Max(999999999999, { message: 'Amount cannot exceed 999,999,999,999' })
  amount: number;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
