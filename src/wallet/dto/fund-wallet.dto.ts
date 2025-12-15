import { IsNumber, IsPositive, IsOptional, IsString, Max } from 'class-validator';

export class FundWalletDto {
  @IsNumber()
  @IsPositive({ message: 'Amount must be a positive number' })
  @Max(999999999999, { message: 'Amount cannot exceed 999,999,999,999' })
  amount: number;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
