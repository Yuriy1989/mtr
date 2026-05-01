import { Application } from 'src/applications/entities/application.entity';
import { MtrList } from 'src/mtr-list/entities/mtr-list.entity';
import { User } from 'src/users/entities/user.entity';
export declare class Zapiski {
    id: number;
    application: Application | null;
    region: number[];
    mtrList: MtrList[];
    user: User | null;
    status: number;
    createdAt: Date;
    updatedAt: Date;
}
