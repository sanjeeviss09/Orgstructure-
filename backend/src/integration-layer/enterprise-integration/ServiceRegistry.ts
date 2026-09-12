import { IServiceLifecycle } from './ServiceLifecycle';

type ServiceConstructor<T> = new (...args: any[]) => T;

/**
 * A lightweight Inversion of Control (IoC) Container.
 * Enforces Dependency Injection and abstracts object instantiation.
 */
export class ServiceRegistry {
    private static instance: ServiceRegistry;
    private services: Map<string, any> = new Map();
    private instances: Map<string, any> = new Map();

    private constructor() {}

    public static getInstance(): ServiceRegistry {
        if (!ServiceRegistry.instance) {
            ServiceRegistry.instance = new ServiceRegistry();
        }
        return ServiceRegistry.instance;
    }

    /**
     * Registers a service token with a concrete implementation.
     * @param token The interface/token string (e.g., 'IDatabaseService')
     * @param implementation The concrete class
     */
    public register<T>(token: string, implementation: ServiceConstructor<T>): void {
        if (this.services.has(token)) {
            console.warn(`[ServiceRegistry] Overriding existing registration for ${token}`);
        }
        this.services.set(token, implementation);
        console.log(`[ServiceRegistry] Registered service: ${token}`);
    }

    /**
     * Registers a pre-instantiated singleton object.
     */
    public registerSingleton<T>(token: string, instance: T): void {
        this.instances.set(token, instance);
        console.log(`[ServiceRegistry] Registered singleton instance: ${token}`);
    }

    /**
     * Resolves a dependency by its token. Instantiates it if necessary.
     */
    public resolve<T>(token: string, ...args: any[]): T {
        if (this.instances.has(token)) {
            return this.instances.get(token);
        }

        const Implementation = this.services.get(token);
        if (!Implementation) {
            throw new Error(`[ServiceRegistry] No provider registered for token: ${token}`);
        }

        const instance = new Implementation(...args);
        this.instances.set(token, instance); // Cache as singleton by default
        return instance;
    }

    /**
     * Initializes all registered services that implement IServiceLifecycle.
     */
    public async initializeAll(): Promise<void> {
        console.log(`[ServiceRegistry] Initializing all registered services...`);
        for (const [token, instance] of this.instances.entries()) {
            if (this.isLifecycleService(instance)) {
                await instance.initialize();
                await instance.connect();
            }
        }
    }

    /**
     * Gracefully shuts down all services.
     */
    public async shutdownAll(): Promise<void> {
        console.log(`[ServiceRegistry] Shutting down all registered services...`);
        for (const [token, instance] of this.instances.entries()) {
            if (this.isLifecycleService(instance)) {
                await instance.gracefulShutdown();
            }
        }
    }

    private isLifecycleService(instance: any): instance is IServiceLifecycle {
        return instance && typeof instance.initialize === 'function' && typeof instance.gracefulShutdown === 'function';
    }
}
