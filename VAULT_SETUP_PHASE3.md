# Phase 3 Vault Setup Instructions

## MinIO Secrets

Add MinIO credentials to Vault for Phase 3 artifact storage.

### 1. SSH into appgenserver:
```bash
ssh appgenserver
```

### 2. Add MinIO secrets to Vault:
```bash
# Set MinIO endpoint and credentials
vault kv put /secrets/minio \
  endpoint="minio" \
  port="9000" \
  access_key="minioadmin" \
  secret_key="minioadmin" \
  use_ssl="false" \
  region="us-east-1"
```

### 3. Add PostgreSQL database credentials (for Phase 3.4):
```bash
vault kv put /secrets/postgres \
  host="postgres" \
  port="5432" \
  username="codegen" \
  password="codegen" \
  database="codegen"
```

### 4. Verify secrets:
```bash
vault kv get /secrets/minio
vault kv get /secrets/postgres
```

## Environment Variables

Update your `.env` file with these variables:

```env
# MinIO Configuration
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_REGION=us-east-1

# PostgreSQL Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=codegen
POSTGRES_PASSWORD=codegen
POSTGRES_DB=codegen
```

## Docker Compose Services

Ensure your docker-compose.yml includes:

```yaml
services:
  minio:
    image: minio/minio:latest
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    networks:
      - codegen
    volumes:
      - minio_data:/minio_data

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: codegen
      POSTGRES_PASSWORD: codegen
      POSTGRES_DB: codegen
    ports:
      - "5432:5432"
    networks:
      - codegen
    volumes:
      - postgres_data:/var/lib/postgresql/data

  vault:
    image: vault:latest
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: myroot
    ports:
      - "8200:8200"
    networks:
      - codegen
    cap_add:
      - IPC_LOCK

volumes:
  minio_data:
  postgres_data:

networks:
  codegen:
    driver: bridge
```

## Testing MinIO Connection

```bash
# From Node.js application:
import { MinIOArtifactStore } from '@codegen/codegen-artifact-store';

const config = {
  endpoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
};

const store = new MinIOArtifactStore(config);
await store.initializeBucket();
console.log('MinIO connection successful');
```

## Notes

- Ensure MinIO is running and accessible at `minio:9000`
- Ensure PostgreSQL is running and accessible at `postgres:5432`
- Vault must have the KV v2 secrets engine enabled (default in dev mode)
- All secrets should be read from environment variables or Vault in production
