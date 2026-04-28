import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../../adapters/mongo/user.schema';
import { UserDto } from '../../entity/user/user.dto';

@Injectable()
export class UserService {
  @InjectModel(User.name) private userModel: Model<UserDocument>;

  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<UserDocument> {
    const email = data.email.trim().toLowerCase();

    const existing = await this.userModel.findOne({ email }).lean();
    if (existing) {
      throw new BadRequestException('Email already taken');
    }

    try {
      return await this.userModel.create({
        email,
        name: data.name,
        password: data.passwordHash,
      });
    } catch (e: any) {
      if (e?.code === 11000) {
        const field = Object.keys(e?.keyPattern ?? {})[0] ?? 'field';
        throw new BadRequestException(`${field} already taken`);
      }
      throw e;
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const value = email.trim().toLowerCase();
    return this.userModel.findOne({ email: value }).exec();
  }

  async findById(id: string): Promise<UserDto> {
    const doc = await this.userModel.findById(new Types.ObjectId(id));
    if (!doc) throw new NotFoundException('User not found');
    return new UserDto(doc);
  }
}
