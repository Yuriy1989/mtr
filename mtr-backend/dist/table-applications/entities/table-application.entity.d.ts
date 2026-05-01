import { Application } from 'src/applications/entities/application.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
export declare class TableApplication {
    id: number;
    listApp: Application;
    mtrList: MtrList;
    lengthObject: string;
    width: string;
    height: string;
    massa: string;
    dateRequest: string;
    transport: string;
    dateShipment: string;
    format: string;
    transportNumber: string;
    discarded: string;
    remainder: string;
    transit: string;
    numberM11: string;
    dateM11: string;
    addNote: string;
    createdAt: Date;
    updatedAt: Date;
}
