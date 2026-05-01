declare const _default: () => {
    server: {
        port: number;
    };
    database: {
        host: string;
        port: number;
        user: string;
        password: string;
        name: string;
    };
    jwt: {
        secret: string;
        refreshSecret: string;
        ttl: string;
        refreshTtl: string;
    };
    activeDirectory: {
        enabled: boolean;
        url: string;
        domain: string;
        baseDn: string;
        userDnTemplate: string;
        timeout: number;
    };
};
export default _default;
