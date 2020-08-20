import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import IOrdersRepository from '../repositories/IOrdersRepository';
import Order from '../infra/typeorm/entities/Order';

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
  ) { }

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Invalid customer');
    }

    const productIds = products.map(product => ({ id: product.id }));
    const foundProducts = await this.productsRepository.findAllById(productIds);

    if (foundProducts.length !== products.length) {
      throw new AppError('Some informed products are invalid');
    }

    const newProductQuantities: IProduct[] = [];
    const orderProducts = products.map(prod => {
      const foundProduct = foundProducts.find(p => p.id === prod.id);

      if (prod.quantity > (foundProduct?.quantity || 0)) {
        throw new AppError(`Insufucient quantity for product ${prod.id}`);
      }

      newProductQuantities.push({
        id: prod.id,
        quantity: (foundProduct?.quantity || 0) - prod.quantity,
      });

      return {
        product_id: prod.id,
        price: foundProduct?.price || 0,
        quantity: prod.quantity,
      };
    });

    await this.productsRepository.updateQuantity(newProductQuantities);

    const order = await this.ordersRepository.create({
      customer,
      products: orderProducts,
    });

    delete order.customer_id;
    return order;
  }
}

export default CreateOrderService;
