import { BasicunitService } from './basicunit.service';
export declare class BasicunitController {
    private readonly basicunitService;
    constructor(basicunitService: BasicunitService);
    findAll(): string;
    findOne(id: string): string;
    remove(id: string): string;
}
