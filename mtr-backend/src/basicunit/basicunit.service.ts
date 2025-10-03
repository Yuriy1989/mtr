import { Injectable } from '@nestjs/common';

@Injectable()
export class BasicunitService {
  findAll() {
    return `This action returns all basicunit`;
  }

  findOne(id: number) {
    return `This action returns a #${id} basicunit`;
  }

  remove(id: number) {
    return `This action removes a #${id} basicunit`;
  }
}
