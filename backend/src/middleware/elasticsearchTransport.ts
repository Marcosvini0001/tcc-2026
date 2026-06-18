/**
 * Configuração de Elasticsearch para Winston Logger
 * Envia logs para Elasticsearch para visualização no Kibana
 */

import TransportStream = require('winston-transport');
import http from 'http';

interface ElasticsearchTransportOptions extends TransportStream.TransportStreamOptions {
  index?: string;
  datastream?: boolean;
  host?: string;
  port?: number;
}

/**
 * Transport customizado para enviar logs ao Elasticsearch
 */
export class ElasticsearchTransport extends TransportStream {
  private index: string;
  private host: string;
  private port: number;
  private datastream: boolean;

  constructor(opts?: ElasticsearchTransportOptions) {
    super(opts);
    this.index = opts?.index || 'tcc-logs';
    this.host = opts?.host || 'localhost';
    this.port = opts?.port || 9200;
    this.datastream = opts?.datastream || false;
  }

  log(info: any, callback?: Function): any {
    const timestamp = new Date().toISOString();
    const indexName = `${this.index}-${timestamp.split('T')[0]}`;

    const document = {
      timestamp,
      level: info.level,
      message: info.message,
      requestId: info.requestId,
      ...info,
    };

    const payload = JSON.stringify(document);

    const options = {
      hostname: this.host,
      port: this.port,
      path: `/${indexName}/_doc`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (callback) callback(null, true);
      });
    });

    req.on('error', (error) => {
      // Log local se falhar envio para Elasticsearch
      console.error('Error sending log to Elasticsearch:', error);
      if (callback) callback(error);
    });

    req.write(payload);
    req.end();
  }
}

/**
 * Retorna opções de transporte para Elasticsearch
 */
export function getElasticsearchTransportOptions(): ElasticsearchTransportOptions {
  return {
    index: 'tcc-logs',
    host: process.env.ELASTICSEARCH_HOST || 'localhost',
    port: parseInt(process.env.ELASTICSEARCH_PORT || '9200', 10),
    datastream: false,
  };
}
