import { User } from 'src/users/entities/user.entity';
export declare class Region {
    id: number;
    nameRegion: string;
    codeRegion: string[];
    users: User[];
    createdAt: Date;
    updatedAt: Date;
}
