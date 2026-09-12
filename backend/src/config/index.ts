import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables based on NODE_ENV
const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${env}`) });
// Fallback to default .env if specific one doesn't exist
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  env,
  port: parseInt(process.env.PORT || '3001', 10),
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    cognito: {
      userPoolId: process.env.AWS_COGNITO_USER_POOL_ID || '',
      clientId: process.env.AWS_COGNITO_CLIENT_ID || '',
    },
    s3: {
      documentBucket: process.env.AWS_S3_DOCUMENT_BUCKET || '',
    },
    rds: {
      host: process.env.AWS_RDS_HOST || '',
      port: parseInt(process.env.AWS_RDS_PORT || '5432', 10),
      username: process.env.AWS_RDS_USERNAME || '',
      password: process.env.AWS_RDS_PASSWORD || '',
      database: process.env.AWS_RDS_DATABASE || '',
    },
    opensearch: {
      endpoint: process.env.AWS_OPENSEARCH_ENDPOINT || '',
    },
    neptune: {
      endpoint: process.env.AWS_NEPTUNE_ENDPOINT || '',
    }
  },
  ai: {
    gatewayProvider: process.env.AI_GATEWAY_PROVIDER || 'aws-bedrock', // aws-bedrock, openai, anthropic, local
    bedrockModelId: process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
    openAIApiKey: process.env.OPENAI_API_KEY || '',
  }
};

export function validateConfig() {
  const missing: string[] = [];
  
  if (!config.aws.region) missing.push('AWS_REGION');
  // Add other critical validations as needed

  if (missing.length > 0) {
    console.warn(`[Config] Missing environment variables: ${missing.join(', ')}`);
    // In production, you might throw an error here.
  }
}

validateConfig();
