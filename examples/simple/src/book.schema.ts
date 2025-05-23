import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BookDocument = HydratedDocument<Book>;

@Schema()
export class Book {
  @Prop({ type: String, unique: true })
  _id: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  author: number;

  @Prop({ default: [] })
  chapters: string[];
}

export const BookSchema = SchemaFactory.createForClass(Book);
