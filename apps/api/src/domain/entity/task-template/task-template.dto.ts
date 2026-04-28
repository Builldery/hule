import { ApiProperty } from '@nestjs/swagger';
import { ETaskPriority } from '../task/task.constants';

export class TaskTemplateDto {
  @ApiProperty() id: string;
  @ApiProperty() spaceId: string;
  @ApiProperty({ nullable: true }) parentId: string | null;
  @ApiProperty() title: string;
  @ApiProperty({ required: false }) description?: string;
  @ApiProperty({ enum: ETaskPriority }) priority: ETaskPriority;
  @ApiProperty() order: number;
  @ApiProperty() depth: number;
  @ApiProperty({ type: [String] }) path: Array<string>;
  @ApiProperty({ type: [String] }) tagIds: Array<string>;
  @ApiProperty({ required: false }) timeEstimate?: number;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  constructor(raw: TaskTemplateDto | any) {
    this.id = raw?._id?.toString() ?? raw?.id?.toString();
    this.spaceId = raw?.spaceId?.toString();
    this.parentId = raw?.parentId ? raw.parentId.toString() : null;
    this.title = raw?.title;
    this.description = raw?.description;
    this.priority = raw?.priority;
    this.order = raw?.order ?? 0;
    this.depth = raw?.depth ?? 0;
    this.path = Array.isArray(raw?.path) ? raw.path.map((p: any) => p.toString()) : [];
    this.tagIds = Array.isArray(raw?.tagIds) ? raw.tagIds.map((t: any) => t.toString()) : [];
    this.timeEstimate = raw?.timeEstimate ?? undefined;
    this.createdAt = raw?.createdAt instanceof Date ? raw.createdAt.toISOString() : raw?.createdAt;
    this.updatedAt = raw?.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw?.updatedAt;
  }
}
