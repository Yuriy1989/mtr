import { Request } from 'express';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { JournalService } from 'src/journal/journal.service';
export declare class ApplicationsController {
    private readonly applicationsService;
    private readonly journal;
    constructor(applicationsService: ApplicationsService, journal: JournalService);
    create(dto: CreateApplicationDto, req: Request): Promise<{
        success: boolean;
        data: import("./entities/application.entity").Application;
    }>;
    findAllDetailed(start?: string, end?: string): Promise<{
        success: boolean;
        data: any[];
    }>;
    findAll(): Promise<{
        success: boolean;
        data: import("./entities/application.entity").Application[];
    }>;
    findOne(id: number): Promise<{
        success: boolean;
        data: import("./entities/application.entity").Application;
    }>;
    update(id: number, dto: UpdateApplicationDto, req: Request): Promise<{
        success: boolean;
        data: import("./entities/application.entity").Application;
    }>;
    remove(id: number, req: Request): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
