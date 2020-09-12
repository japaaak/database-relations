import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IRequest {
  id: string;
}

@injectable()
class FindOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
  ) {}

  public async execute({ id }: IRequest): Promise<Order | undefined> {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new AppError('This order doesnt exist');
    }
    const orderFormat = {
      id: order.id,
      created_at: order.created_at,
      updated_at: order.updated_at,
      customer: order.customer,
      order_products: order.order_products,
    };
    return orderFormat;
  }
}

export default FindOrderService;
