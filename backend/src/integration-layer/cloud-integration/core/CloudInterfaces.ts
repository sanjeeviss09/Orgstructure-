import { IServiceLifecycle } from '../../enterprise-integration';

// Extended core interfaces that inherit Lifecycle rules
export interface IAuthenticationService extends IServiceLifecycle {
    authenticateUser(credentials: any): Promise<any>;
}

export interface IEnterpriseDatabaseService extends IServiceLifecycle {
    query(sql: string, params: any[]): Promise<any>;
}

export interface IBackupService extends IServiceLifecycle {
    createBackup(resourceId: string): Promise<string>;
    restoreBackup(backupId: string): Promise<void>;
}

export interface ILoggingService extends IServiceLifecycle {
    logInfo(message: string, context?: any): void;
    logError(error: Error, context?: any): void;
}

export interface ISecretManagerService extends IServiceLifecycle {
    getSecret(secretId: string): Promise<string>;
}

export interface IEncryptionService extends IServiceLifecycle {
    encryptData(data: string): Promise<string>;
    decryptData(encrypted: string): Promise<string>;
}

export interface ISecurityFirewallService extends IServiceLifecycle {
    validateRequest(ipAddress: string, headers: any): Promise<boolean>;
}

export interface IOcrExtractionService extends IServiceLifecycle {
    extractText(documentBuffer: Buffer): Promise<string>;
}

export interface IStorageService extends IServiceLifecycle {
    uploadFile(key: string, fileBuffer: Buffer, mimeType: string): Promise<string>;
    downloadFile(key: string): Promise<Buffer>;
    getSignedUrl(key: string): Promise<string>;
}
