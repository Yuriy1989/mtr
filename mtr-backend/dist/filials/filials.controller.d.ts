import { FilialsService } from './filials.service';
import { CreateFilialDto } from './dto/create-filial.dto';
import { UpdateFilialDto } from './dto/update-filial.dto';
export declare class FilialsController {
    private readonly filialsService;
    constructor(filialsService: FilialsService);
    create(createFilialDto: CreateFilialDto): Promise<CreateFilialDto & import("./entities/filial.entity").Filial>;
    findAll(): Promise<import("./entities/filial.entity").Filial[]>;
    update(updateFilialDto: UpdateFilialDto): Promise<import("typeorm").UpdateResult>;
    remove(id: UpdateFilialDto): Promise<import("typeorm").DeleteResult>;
}
