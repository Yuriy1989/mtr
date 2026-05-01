import { CreateVl06Dto } from './dto/create-vl06.dto';
import { UpdateVl06Dto } from './dto/update-vl06.dto';
import { Vl06 } from './entities/vl06.entity';
import { Repository } from 'typeorm';
export declare class Vl06Service {
    private tableVL06;
    constructor(tableVL06: Repository<Vl06>);
    private toDateOrNull;
    create(createVl06Dto: CreateVl06Dto): Promise<Vl06>;
    createMany(dtos: CreateVl06Dto[]): Promise<Vl06[]>;
    findAll(): Promise<Vl06[]>;
    update(id: number, dto: UpdateVl06Dto): Promise<Vl06>;
    updateStatus(id: number, status: number): Promise<Vl06>;
    updateStatuses(ids: number[], status: number): Promise<{
        updated: number;
        status: number;
    }>;
    remove(id: number): Promise<{
        id: number;
    }>;
    private handleDbError;
}
