import { Repository } from 'typeorm';
import { Application } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { Zapiski } from 'src/zapiski/entities/zapiski.entity';
import { TableApplication } from 'src/table-applications/entities/table-application.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import { Transport } from 'src/transports/entities/transport.entity';
import { LastmileDecision } from '../lastmile/entities/lastmile.entity';
export declare class ApplicationsService {
    private readonly appRepo;
    private readonly zapRepo;
    private readonly appRowRepo;
    private readonly mtrRepo;
    private readonly transportRepo;
    private readonly decRepo;
    constructor(appRepo: Repository<Application>, zapRepo: Repository<Zapiski>, appRowRepo: Repository<TableApplication>, mtrRepo: Repository<MtrList>, transportRepo: Repository<Transport>, decRepo: Repository<LastmileDecision>);
    create(dto: CreateApplicationDto): Promise<Application>;
    findAll(): Promise<Application[]>;
    findOne(id: number): Promise<Application>;
    findAllDetailed(start?: Date | null, end?: Date | null): Promise<{
        success: boolean;
        data: any[];
    }>;
    update(id: number, updateApplicationDto: UpdateApplicationDto): Promise<Application>;
    remove(id: number): Promise<{
        success: boolean;
        data: {
            id: number;
            zapiskaId: number;
            updatedStatuses: {
                zapiska: number;
                vl06: number;
                vl06Count: number;
            };
        };
    }>;
}
