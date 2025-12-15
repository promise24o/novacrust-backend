# Wallet Service API

A simple and clean wallet service built with NestJS that provides wallet management, funding, and transfer capabilities.

## 🚀 Features

- ✅ Create wallets with USD currency support
- ✅ Fund wallets with validation
- ✅ Transfer funds between wallets
- ✅ Fetch wallet details with transaction history
- ✅ Comprehensive error handling and validation
- ✅ Idempotency support for fund and transfer operations
- ✅ In-memory storage (no database required)
- ✅ Unit tests with high coverage

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## 🛠️ Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd backend-role-quick-test
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The server will start on `http://localhost:3000`

### 4. Run tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

## 📚 API Endpoints

### 1. Create Wallet

**POST** `/wallets`

Creates a new wallet with USD currency and zero balance.

**Request Body:**
```json
{
  "currency": "USD"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "currency": "USD",
    "balance": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Fund Wallet

**POST** `/wallets/:id/fund`

Add funds to a wallet.

**Request Body:**
```json
{
  "amount": 100.50,
  "idempotencyKey": "optional-unique-key"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet funded successfully",
  "data": {
    "id": "transaction-id",
    "walletId": "wallet-id",
    "type": "FUND",
    "amount": 100.50,
    "balanceAfter": 100.50,
    "status": "COMPLETED",
    "metadata": {
      "description": "Wallet funded"
    },
    "createdAt": "2024-01-15T10:31:00.000Z"
  }
}
```

### 3. Transfer Between Wallets

**POST** `/wallets/transfer`

Transfer funds from one wallet to another.

**Request Body:**
```json
{
  "fromWalletId": "550e8400-e29b-41d4-a716-446655440000",
  "toWalletId": "660e8400-e29b-41d4-a716-446655440001",
  "amount": 50.00,
  "idempotencyKey": "optional-unique-key"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transfer completed successfully",
  "data": {
    "senderTransaction": {
      "id": "transaction-id-1",
      "walletId": "550e8400-e29b-41d4-a716-446655440000",
      "type": "TRANSFER_OUT",
      "amount": -50.00,
      "balanceAfter": 50.50,
      "status": "COMPLETED",
      "metadata": {
        "toWalletId": "660e8400-e29b-41d4-a716-446655440001",
        "description": "Transfer to wallet 660e8400-e29b-41d4-a716-446655440001"
      },
      "createdAt": "2024-01-15T10:32:00.000Z"
    },
    "receiverTransaction": {
      "id": "transaction-id-2",
      "walletId": "660e8400-e29b-41d4-a716-446655440001",
      "type": "TRANSFER_IN",
      "amount": 50.00,
      "balanceAfter": 50.00,
      "status": "COMPLETED",
      "metadata": {
        "fromWalletId": "550e8400-e29b-41d4-a716-446655440000",
        "description": "Transfer from wallet 550e8400-e29b-41d4-a716-446655440000"
      },
      "createdAt": "2024-01-15T10:32:00.000Z"
    }
  }
}
```

### 4. Get Wallet Details

**GET** `/wallets/:id`

Fetch wallet information and transaction history.

**Response:**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "currency": "USD",
      "balance": 50.50,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:32:00.000Z"
    },
    "transactions": [
      {
        "id": "transaction-id-1",
        "walletId": "550e8400-e29b-41d4-a716-446655440000",
        "type": "FUND",
        "amount": 100.50,
        "balanceAfter": 100.50,
        "status": "COMPLETED",
        "metadata": {
          "description": "Wallet funded"
        },
        "createdAt": "2024-01-15T10:31:00.000Z"
      }
    ]
  }
}
```

### 5. Get All Wallets

**GET** `/wallets`

Fetch all wallets (for testing/debugging).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "currency": "USD",
      "balance": 50.50,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:32:00.000Z"
    }
  ]
}
```

## 🔒 Validation & Error Handling

### Validation Rules

- **Amount**: Must be a positive number
- **Wallet IDs**: Must be valid UUIDs
- **Currency**: Only USD is supported
- **Transfer**: Cannot transfer to the same wallet
- **Balance**: Cannot go negative

### Error Responses

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Wallet with ID xxx not found",
  "error": "Not Found"
}
```

**400 Bad Request**
```json
{
  "statusCode": 400,
  "message": "Insufficient balance. Available: 50, Required: 100",
  "error": "Bad Request"
}
```

**400 Validation Error**
```json
{
  "statusCode": 400,
  "message": [
    "amount must be a positive number"
  ],
  "error": "Bad Request"
}
```

## 🎯 Idempotency

The service supports idempotency for fund and transfer operations to prevent duplicate transactions.

**Usage:**
```json
{
  "amount": 100,
  "idempotencyKey": "unique-operation-id-123"
}
```

If the same `idempotencyKey` is used again, the service will return the cached result without performing the operation again.

## 🏗️ Project Structure

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module
└── wallet/
    ├── wallet.module.ts             # Wallet module
    ├── wallet.controller.ts         # API endpoints
    ├── wallet.service.ts            # Business logic
    ├── wallet.service.spec.ts       # Unit tests
    ├── entities/
    │   ├── wallet.entity.ts         # Wallet entity
    │   └── transaction.entity.ts    # Transaction entity
    └── dto/
        ├── create-wallet.dto.ts     # Create wallet DTO
        ├── fund-wallet.dto.ts       # Fund wallet DTO
        └── transfer.dto.ts          # Transfer DTO
```

## 📝 Assumptions Made

1. **Currency**: Only USD is supported as per requirements
2. **Storage**: In-memory storage is used (data is lost on restart)
3. **Wallet ID**: UUIDs are auto-generated for wallets
4. **Initial Balance**: All wallets start with a balance of 0
5. **Transaction History**: Sorted by creation date (newest first)
6. **Idempotency**: Keys are stored in memory and cleared on restart
7. **Concurrency**: Not handled (would require database transactions in production)
8. **Authentication**: Not implemented (would be required in production)

## 🚀 Production Considerations

### Scalability

To scale this system in production, consider:

1. **Database**
   - Use PostgreSQL or MySQL with proper indexing
   - Implement database transactions for ACID compliance
   - Add connection pooling for better performance

2. **Caching**
   - Use Redis for idempotency keys and session management
   - Cache frequently accessed wallet data
   - Implement cache invalidation strategies

3. **Concurrency**
   - Implement optimistic locking with version numbers
   - Use database row-level locks for critical operations
   - Consider event sourcing for transaction history

4. **Architecture**
   - Implement CQRS pattern for read/write separation
   - Use message queues (RabbitMQ/Kafka) for async operations
   - Add API rate limiting and throttling

5. **Monitoring & Observability**
   - Add structured logging (Winston/Pino)
   - Implement distributed tracing (OpenTelemetry)
   - Set up metrics collection (Prometheus)
   - Add health checks and readiness probes

6. **Security**
   - Implement JWT-based authentication
   - Add role-based access control (RBAC)
   - Use HTTPS/TLS for all communications
   - Implement request signing for sensitive operations
   - Add audit logging for compliance

7. **High Availability**
   - Deploy multiple instances behind a load balancer
   - Use database replication (master-slave)
   - Implement circuit breakers for external dependencies
   - Add graceful shutdown handling

8. **Data Integrity**
   - Implement double-entry bookkeeping
   - Add reconciliation processes
   - Use database constraints and triggers
   - Implement soft deletes for audit trails

## 🧪 Testing

The project includes comprehensive unit tests covering:

- ✅ Wallet creation
- ✅ Wallet funding with validation
- ✅ Transfer operations with all edge cases
- ✅ Error handling scenarios
- ✅ Idempotency behavior
- ✅ Transaction history retrieval

Run tests with:
```bash
npm test
```

## 📦 Dependencies

- **@nestjs/common**: Core NestJS framework
- **@nestjs/core**: NestJS core functionality
- **@nestjs/platform-express**: Express adapter for NestJS
- **class-validator**: Request validation
- **class-transformer**: Object transformation
- **uuid**: UUID generation
- **reflect-metadata**: Metadata reflection API

## 📄 License

MIT

## 👤 Author

OBE, Promise
