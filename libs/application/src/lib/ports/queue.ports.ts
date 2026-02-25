export interface IQueueService {
  /**
   * Publica uma mensagem na fila para processamento assíncrono.
   */
  publish(queueName: string, eventName: string, payload: any): Promise<void>
}