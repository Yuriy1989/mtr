import { Request } from 'express';
import { Vl06Service } from './vl06.service';
import { CreateVl06Dto } from './dto/create-vl06.dto';
import { UpdateVl06StatusesDto } from './dto/update-vl06-statuses.dto';
import { JournalService } from 'src/journal/journal.service';
export declare class Vl06Controller {
    private readonly vl06Service;
    private readonly journal;
    constructor(vl06Service: Vl06Service, journal: JournalService);
    create(createVl06Dto: CreateVl06Dto, req: Request): Promise<{
        success: boolean;
        data: import("./entities/vl06.entity").Vl06;
    }>;
    createMany(dtos: CreateVl06Dto[], req: Request): Promise<{
        success: boolean;
        data: import("./entities/vl06.entity").Vl06[];
    }>;
    findAll(): Promise<{
        success: boolean;
        data: import("./entities/vl06.entity").Vl06[];
    }>;
    update(id: string, dto: any, req: Request): Promise<{
        success: boolean;
        data: import("./entities/vl06.entity").Vl06;
    }>;
    updateStatus(id: string, dto: any, req: Request): Promise<{
        success: boolean;
        data: import("./entities/vl06.entity").Vl06;
    }>;
    updateStatuses(dto: UpdateVl06StatusesDto, req: Request): Promise<{
        success: boolean;
        data: {
            updated: number;
            status: number;
        };
    }>;
    remove(id: string, req: Request): Promise<{
        success: boolean;
        data: {
            id: number;
        };
    }>;
}
