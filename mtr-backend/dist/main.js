"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const express_1 = require("express");
const compression = require("compression");
async function bootstrap() {
    const certsDir = process.env.HTTPS_CERTS_DIR || 'certs';
    const key = fs.readFileSync(process.env.HTTPS_KEY_PATH ||
        path.join(process.cwd(), certsDir, 'localhost-key.pem'));
    const cert = fs.readFileSync(process.env.HTTPS_CERT_PATH ||
        path.join(process.cwd(), certsDir, 'localhost.pem'));
    const PORT = process.env.PORT || 3001;
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bodyParser: true,
        httpsOptions: { key, cert },
    });
    app.use(cookieParser());
    const corsOrigin = process.env.CORS_ORIGIN;
    app.enableCors({
        origin: corsOrigin ? corsOrigin.split(',').map((item) => item.trim()) : true,
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.use((0, express_1.json)({ limit: '25mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '25mb' }));
    app.use(compression());
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
    }));
    await app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}
bootstrap();
//# sourceMappingURL=main.js.map