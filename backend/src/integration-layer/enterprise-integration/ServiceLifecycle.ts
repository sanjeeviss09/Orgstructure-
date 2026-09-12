export interface IServiceLifecycle {
    /**
     * Called when the service is registered with the IoC container.
     */
    initialize(): Promise<void>;

    /**
     * Called to establish external connections (e.g., AWS SDK clients, DB pools).
     */
    connect(): Promise<void>;

    /**
     * Validates that the external connection is healthy.
     */
    validateConnection(): Promise<boolean>;

    /**
     * Executes the primary action of the service (useful for worker/job services).
     */
    execute?(payload?: any): Promise<any>;

    /**
     * Returns standard health metrics.
     */
    healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy', details: any }>;

    /**
     * Attempts to reconnect if validation fails.
     */
    reconnect(): Promise<void>;

    /**
     * Safely disconnects connections and clears memory.
     */
    disconnect(): Promise<void>;

    /**
     * Reloads configuration dynamically without restarting the process.
     */
    configurationReload?(): Promise<void>;

    /**
     * Gracefully shuts down the service, finishing active tasks before killing connections.
     */
    gracefulShutdown(): Promise<void>;
}
