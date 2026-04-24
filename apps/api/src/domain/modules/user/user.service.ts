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
    username: string;
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<UserDocument> {
    const username = data.username.trim();
    const email = data.email.trim().toLowerCase();

    const existing = await this.userModel
      .findOne({ $or: [{ username }, { email }] })
      .lean();
    if (existing) {
      if (existing.username === username) {
        throw new BadRequestException('Username already taken');
      }
      throw new BadRequestException('Email already taken');
    }

    try {
      return await this.userModel.create({
        username,
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

  async findByLogin(login: string): Promise<UserDocument | null> {
    const value = login.trim();
    return this.userModel
      .findOne({ $or: [{ username: value }, { email: value.toLowerCase() }] })
      .exec();
  }

  async findById(id: string): Promise<UserDto> {
    const doc = await this.userModel.findById(new Types.ObjectId(id));
    if (!doc) throw new NotFoundException('User not found');
    return new UserDto(doc);
  }
}
