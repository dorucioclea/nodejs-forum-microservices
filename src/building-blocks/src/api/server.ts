import express, { Application } from 'express';
import apiMetrics from 'prometheus-api-metrics';
import status from 'http-status';
import { NotFoundError } from '@errors/index';
import { Controller } from './controller';
import corsMiddleware from './middlewares/cors/cors.middleware';
import { applySecurityMiddleware } from './middlewares/security/security.middleware';
import { errorHandlerMiddleware } from './middlewares/error-handler/error-handler.middleware';
import { Logger } from '..';

interface Dependencies {
  controllers: Controller[];
  logger: Logger;
}

export class Server {
  private app: Application;

  constructor(private readonly dependencies: Dependencies) {
    this.app = express();

    this.app.use(express.json());

    this.app.use(corsMiddleware);

    applySecurityMiddleware(this.app);

    this.app.use(apiMetrics());

    this.app.get('/health', (_, res) => {
      res.sendStatus(status.OK);
    });

    this.dependencies.controllers.forEach((controller) =>
      this.app.use(controller.route, controller.getRouter()),
    );

    this.app.use('*', (req, _, next) => {
      next(new NotFoundError(`Route "${req.originalUrl}" is not supported.`));
    });

    this.app.use(errorHandlerMiddleware(this.dependencies.logger));
  }

  public getApp() {
    return this.app;
  }
}
