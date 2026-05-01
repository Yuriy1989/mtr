import { ZapiskiService } from './zapiski.service';
import { UpdateZapiskiDto } from './dto/update-zapiski.dto';
export declare class ZapiskiController {
    private readonly zapiskiService;
    constructor(zapiskiService: ZapiskiService);
    create(createZapiskiDto: any): Promise<{
        success: boolean;
        data: import("./entities/zapiski.entity").Zapiski;
    }>;
    findAll(from?: string, to?: string): Promise<{
        success: boolean;
        data: import("./entities/zapiski.entity").Zapiski[];
    }>;
    findOne(id: number): Promise<{
        success: boolean;
        data: import("./entities/zapiski.entity").Zapiski;
    }>;
    stats(id: number): Promise<{
        success: boolean;
        data: {
            byUnit: any;
            byCategory: any;
        };
    }>;
    update(id: string, updateZapiskiDto: UpdateZapiskiDto): Promise<import("typeorm").UpdateResult>;
    sendToWork(id: number): Promise<{
        success: boolean;
        data: {
            id: number;
            already: boolean;
            updatedVl06: number;
        } | {
            id: number;
            updatedVl06: number;
            already?: undefined;
        };
    }>;
    sendToSent(id: number): Promise<{
        success: boolean;
        data: {
            id: number;
            updatedVl06: number;
            status: number;
        };
    }>;
    remove(id: number): Promise<{
        success: boolean;
        data: {
            id: number;
            updatedVl06: number;
        };
    }>;
}
