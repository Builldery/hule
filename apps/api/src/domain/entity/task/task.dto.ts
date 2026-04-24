import { ApiProperty } from '@nestjs/swagger';
import { ETaskPriority } from './task.constants';

export class TaskDto {
  @ApiProperty() id: string;
  @ApiProperty() listId: string;
  @ApiProperty({ nullable: true }) parentId: string | null;
  @ApiProperty() title: string;
  @ApiProperty({ required: false }) description?: string;
  @ApiProperty() status: string;
  @ApiProperty({ enum: ETaskPriority }) priority: ETaskPriority;
  @ApiProperty({ required: false }) startDate?: string;
  @ApiProperty({ required: false }) dueDate?: string;
  @ApiProperty() order: number;
  @ApiProperty() depth: number;
  @ApiProperty({ type: [String] }) path: Array<string>;
  @ApiProperty({ nullable: true }) assigneeId: string | null;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  constructor(raw: TaskDto | any) {
    this.id = raw?._id?.toString() ?? raw?.id?.toString();
    this.listId = raw?.listId?.toString();
    this.parentId = raw?.parentId ? raw.parentId.toString() : null;
    this.title = raw?.title;
    this.description = raw?.description;
    this.status = raw?.status;
    this.priority = raw?.priority;
    this.startDate = raw?.startDate instanceof Date ? raw.startDate.toISOString() : raw?.startDate;
    this.dueDate = raw?.dueDate instanceof Date ? raw.dueDate.toISOString() : raw?.dueDate;
    this.order = raw?.order ?? 0;
    this.depth = raw?.depth ?? 0;
    this.path = Array.isArray(raw?.path) ? raw.path.map((p: any) => p.toString()) : [];
    this.assigneeId = raw?.assigneeId ? raw.assigneeId.toString() : null;
    this.createdAt = raw?.createdAt instanceof Date ? raw.createdAt.toISOString() : raw?.createdAt;
    this.updatedAt = raw?.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw?.updatedAt;
  }
}
