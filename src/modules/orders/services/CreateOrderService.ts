import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) {
      throw new AppError('Doesnt exist this customer', 400);
    }
    const repositoryProduct = await this.productsRepository.findAllById(
      products,
    );

    if (products.length !== repositoryProduct.length) {
      throw new AppError('Doesnt exist the product');
    }

    const quantityExist = products.filter(
      p =>
        repositoryProduct.filter(product => product.id === p.id)[0].quantity >=
        p.quantity,
    );

    if (quantityExist.length !== products.length) {
      throw new AppError('Product doesnt have correct quantity');
    }

    const orderProduct = products.map(p => ({
      product_id: p.id,
      quantity: p.quantity,
      price: repositoryProduct.filter(
        filterProduct => p.id === filterProduct.id,
      )[0].price,
    }));

    const createOrder = await this.ordersRepository.create({
      customer,
      products: orderProduct,
    });

    const updateQuantity = createOrder.order_products.map(p => ({
      id: p.product_id,
      quantity:
        repositoryProduct.filter(product => product.id === p.product_id)[0]
          .quantity - p.quantity,
    }));

    await this.productsRepository.updateQuantity(updateQuantity);
    return createOrder;
  }
}

export default CreateOrderService;
