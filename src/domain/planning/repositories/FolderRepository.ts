export interface FolderRecord {
    id: string;
    name: string;
    userId: string;
    createdAt: Date;
}

export interface IFolderRepository {
    create(folder: FolderRecord): Promise<void>;
    findByUserId(userId: string): Promise<FolderRecord[]>;
    update(id: string, name: string): Promise<void>;
    delete(id: string): Promise<void>;
    addPlanToFolder(planId: string, folderId: string): Promise<void>;
    removePlanFromFolder(planId: string, folderId: string): Promise<void>;
}
