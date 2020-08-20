import { getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Order from '../entities/Order';

class OrdersRepository implements IOrdersRepository {
  private ormRepository: Repository<Order>;

  constructor() {
    this.ormRepository = getRepository(Order);
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    const order = this.ormRepository.create({
      customer_id: customer.id,
      customer,
      order_products: products.map(prd => {
        return {
          product_id: prd.product_id,
          quantity: prd.quantity,
          price: prd.price,
        };
      }),
    });

    const createdOrder = await this.ormRepository.save(order);
    return createdOrder;
  }

  public async findById(id: string): Promise<Order | undefined> {
    return this.ormRepository.findOne({ where: { id } });
  }
}

export default OrdersRepository;
