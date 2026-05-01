export declare class UpsertAppendix3ItemDto {
    mtrListId: number;
    dateRequest?: string | null;
    dateShipment?: string | null;
    format?: string | null;
    transportNumber?: string | null;
    transit?: string | null;
    dateM11?: string | null;
    numberM11?: string | null;
    shippedQty?: number | null;
    note?: string | null;
    remainder: null;
}
export declare class UpsertAppendix3Dto {
    zapiskaId: number;
    userId: number;
    items: UpsertAppendix3ItemDto[];
}
