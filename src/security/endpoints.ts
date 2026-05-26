export class EndpointValidator {
    public static isSafeLocalEndpoint(endpoint: string): boolean {
        try {
            const url = new URL(endpoint);
            // Check if hostname is literally localhost or 127.0.0.1
            if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
                return false;
            }
            // Check if protocol is safe
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                return false;
            }
            return true;
        } catch (error) {
            // Malformed URL
            return false;
        }
    }

    public static validate(endpoint: string): string {
        if (!this.isSafeLocalEndpoint(endpoint)) {
            throw new Error(`Unsafe local endpoint: ${endpoint}. Only localhost and 127.0.0.1 are permitted for local inference bypass.`);
        }
        return endpoint;
    }
}
