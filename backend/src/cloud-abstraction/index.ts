// cloud-abstraction/index.ts

// 1. Storage Abstraction
export interface IStorageService {
    uploadDocument(bucketName: string, key: string, fileBuffer: Buffer, mimeType: string): Promise<string>;
    downloadDocument(bucketName: string, key: string): Promise<Buffer>;
    getSignedUrl(bucketName: string, key: string, expiresInSeconds?: number): Promise<string>;
    deleteDocument(bucketName: string, key: string): Promise<void>;
}

// 2. Database Abstraction (Transactional)
export interface IDatabaseService {
    query<T>(sql: string, params?: any[]): Promise<T[]>;
    execute(sql: string, params?: any[]): Promise<number>;
    transaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
}

// 3. Search Abstraction (Vector & Full-Text)
export interface ISearchService {
    indexDocument(indexName: string, documentId: string, data: any): Promise<void>;
    search(indexName: string, query: string, filters?: any): Promise<any[]>;
    vectorSearch(indexName: string, vector: number[], k?: number): Promise<any[]>;
    deleteDocument(indexName: string, documentId: string): Promise<void>;
}

// 4. Graph Database Abstraction (Knowledge Graph)
export interface IGraphDatabaseService {
    executeGremlinQuery(query: string): Promise<any>;
    executeSparqlQuery(query: string): Promise<any>;
}

// 5. Events Abstraction (Pub/Sub)
export interface IEventService {
    publishEvent(source: string, detailType: string, detail: any): Promise<void>;
    sendMessageToQueue(queueUrl: string, message: any): Promise<void>;
}

// 6. AI Providers Abstraction
export interface IAIService {
    invokeModel(modelId: string, prompt: string, context?: any): Promise<string>;
    generateEmbeddings(text: string): Promise<number[]>;
}

// 7. Notifications Abstraction (Email, SMS, Push)
export interface INotificationService {
    sendEmail(to: string[], subject: string, body: string, htmlBody?: string): Promise<void>;
    sendSMS(phoneNumber: string, message: string): Promise<void>;
    sendPushNotification(targetToken: string, payload: any): Promise<void>;
}

// 8. OCR Abstraction
export interface IOCRService {
    extractTextFromImage(imageBuffer: Buffer): Promise<string>;
    extractTextFromPDF(pdfBuffer: Buffer): Promise<string>;
    analyzeDocument(documentBuffer: Buffer, featureTypes: string[]): Promise<any>;
}

// 9. Monitoring & Logging Abstraction
export interface IMonitoringService {
    logInfo(message: string, context?: any): void;
    logError(error: Error | string, context?: any): void;
    recordMetric(metricName: string, value: number, unit?: string): void;
}

// 10. Secrets & Identity Abstraction
export interface ISecretsService {
    getSecretValue(secretId: string): Promise<string>;
}

export interface IIdentityService {
    createUser(username: string, email: string, temporaryPassword?: string): Promise<string>;
    deleteUser(username: string): Promise<void>;
    assignRoleToUser(username: string, roleName: string): Promise<void>;
    verifyToken(token: string): Promise<any>;
}
