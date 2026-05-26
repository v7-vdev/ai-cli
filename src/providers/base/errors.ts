export class ProviderError extends Error {
    constructor(
        message: string, 
        public readonly providerId: string,
        public readonly originalError?: any
    ) {
        super(message);
        this.name = "ProviderError";
    }
}

export class InvalidKeyError extends ProviderError {
    constructor(providerId: string, originalError?: any) {
        super(`Invalid API key for provider: ${providerId}`, providerId, originalError);
        this.name = "InvalidKeyError";
    }
}

export class RateLimitError extends ProviderError {
    constructor(providerId: string, originalError?: any) {
        super(`Rate limit exceeded for provider: ${providerId}`, providerId, originalError);
        this.name = "RateLimitError";
    }
}

export class ProviderUnavailableError extends ProviderError {
    constructor(providerId: string, originalError?: any) {
        super(`Provider is unavailable: ${providerId}`, providerId, originalError);
        this.name = "ProviderUnavailableError";
    }
}

export class TimeoutError extends ProviderError {
    constructor(providerId: string, originalError?: any) {
        super(`Request timed out for provider: ${providerId}`, providerId, originalError);
        this.name = "TimeoutError";
    }
}

export class MalformedResponseError extends ProviderError {
    constructor(providerId: string, originalError?: any) {
        super(`Malformed response received from provider: ${providerId}`, providerId, originalError);
        this.name = "MalformedResponseError";
    }
}

export class StreamingInterruptedError extends ProviderError {
    constructor(providerId: string, originalError?: any) {
        super(`Streaming interrupted for provider: ${providerId}`, providerId, originalError);
        this.name = "StreamingInterruptedError";
    }
}
