import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { TransferDto } from './dto/transfer.dto';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  /**
   * POST /wallets
   * Create a new wallet
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createWalletDto: CreateWalletDto) {
    const wallet = this.walletService.create(createWalletDto);
    return {
      success: true,
      message: 'Wallet created successfully',
      data: wallet,
    };
  }

  /**
   * POST /wallets/:id/fund
   * Fund a wallet
   */
  @Post(':id/fund')
  @HttpCode(HttpStatus.OK)
  fund(@Param('id') id: string, @Body() fundWalletDto: FundWalletDto) {
    const transaction = this.walletService.fund(id, fundWalletDto);
    return {
      success: true,
      message: 'Wallet funded successfully',
      data: transaction,
    };
  }

  /**
   * POST /wallets/transfer
   * Transfer funds between wallets
   */
  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  transfer(@Body() transferDto: TransferDto) {
    const result = this.walletService.transfer(transferDto);
    return {
      success: true,
      message: 'Transfer completed successfully',
      data: result,
    };
  }

  /**
   * GET /wallets/:id
   * Get wallet details with transaction history
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    const result = this.walletService.findOne(id);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /wallets
   * Get all wallets (for testing/debugging)
   */
  @Get()
  findAll() {
    const wallets = this.walletService.findAll();
    return {
      success: true,
      data: wallets,
    };
  }
}
