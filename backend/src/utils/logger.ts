import winston from 'winston';
import { ElasticsearchTransport, getElasticsearchTransportOptions } from '../middleware/elasticsearchTransport';

const transports: winston.transport[] = [
  new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  new winston.transports.File({ filename: 'logs/combined.log' })
];

// Adicionar Elasticsearch transport se estiver configurado
if (process.env.ELASTICSEARCH_ENABLED === 'true' || process.env.NODE_ENV === 'production') {
  try {
    const esOptions = getElasticsearchTransportOptions();
    transports.push(new ElasticsearchTransport(esOptions));
  } catch (error) {
    console.warn('Failed to initialize Elasticsearch transport:', error);
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'neuroxp-api' },
  transports
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp, requestId, ...meta }) => {
        const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
        return `${timestamp} ${level} [${requestId || 'no-request-id'}]: ${message} ${metaStr}`;
      })
    )
  }));
}

export default logger;
