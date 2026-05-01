import { CreateFilialDto } from './dto/create-filial.dto';
import { UpdateFilialDto } from './dto/update-filial.dto';
import { Repository } from 'typeorm';
import { Filial } from './entities/filial.entity';
export declare class FilialsService {
    private filialRepository;
    constructor(filialRepository: Repository<Filial>);
    create(createFilialDto: CreateFilialDto): Promise<CreateFilialDto & Filial>;
    findAll(): Promise<Filial[]>;
    update(updateFilialDto: UpdateFilialDto): Promise<import("typeorm").UpdateResult>;
    remove(id: UpdateFilialDto): Promise<import("typeorm").DeleteResult>;
}
