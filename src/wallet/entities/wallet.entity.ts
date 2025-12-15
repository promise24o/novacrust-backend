export class Wallet {
  id: string;
  currency: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, currency: string = 'USD') {
    this.id = id;
    this.currency = currency;
    this.balance = 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static generateHumanReadableId(): string {
    const adjectives = ['swift', 'bright', 'calm', 'bold', 'smart', 'quick', 'cool', 'warm', 'fresh', 'clean'];
    const nouns = ['wallet', 'purse', 'vault', 'chest', 'safe', 'bank', 'fund', 'account', 'purse', 'treasure'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000; // 4-digit number
    return `${randomAdjective}-${randomNoun}-${randomSuffix}`;
  }
}
