import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateWalletDto {
  @IsOptional()
  @IsString()
  @IsIn(['USD'], { message: 'Currently only USD currency is supported' })
  currency?: string = 'USD';
}
