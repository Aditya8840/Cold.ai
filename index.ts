import config from "./src/config";
import express, { Request, Response, NextFunction } from "express";
import logger from "./src/utils/logger";

const server = express();
const router = express.Router();
const PORT = config.port;

require('./src/routes')(router);

server.use('/api', router);

server.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.info(err);

    let status = err.status || 500;
    let message = err.message || 'Something failed!';

    res.status(status).json({
        status,
        message,
        data: {}
    });
});

server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
