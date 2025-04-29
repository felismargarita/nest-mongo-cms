import { Body, Controller, Param, Post, Put, Delete } from '@nestjs/common';
import { CMSService } from './cms.service';

@Controller()
export class CMSController {
  constructor(private readonly service: CMSService) {}

  @Post('/:schema/findById/:id')
  findById(
    @Param('schema') schema: string,
    @Param('id') id: string,
    @Body() body: any,
  ): Promise<any> {
    const { projection, options } = body;
    return this.service.findById(schema, id, projection, options);
  }

  @Post('/:schema/find')
  findBySchema(
    @Param('schema') schema: string,
    @Body() body: any,
  ): Promise<any> {
    const { filter, projection, options } = body;
    return this.service.find(schema, filter, projection, options);
  }

  @Post('/:schema/findOne')
  findOneBySchema(
    @Param('schema') schema: string,
    @Body() body: any,
  ): Promise<any> {
    const { filter, projection, options } = body;
    return this.service.findOne(schema, filter, projection, options);
  }

  @Post('/:schema/create')
  create(@Param('schema') schema: string, @Body() body: any): Promise<any> {
    const { data, options } = body;
    return this.service.create(schema, data, options);
  }

  @Put('/:schema/fineOneAndUpdate')
  fineOneAndUpdate(
    @Param('schema') schema: string,
    @Body() body: any,
  ): Promise<any> {
    const { filter, update, options } = body;
    return this.service.findOneAndUpdate(schema, filter, update, options);
  }

  @Put('/:schema/updateOne')
  updateOne(@Param('schema') schema: string, @Body() body: any): Promise<any> {
    const { filter, update, options } = body;
    return this.service.updateOne(schema, filter, update, options);
  }

  @Put('/:schema/updateMany')
  updateMany(@Param('schema') schema: string, @Body() body: any): Promise<any> {
    const { filter, update, options } = body;
    return this.service.updateMany(schema, filter, update, options);
  }

  @Delete('/:schema/deleteOne')
  deleteOne(@Param('schema') schema: string, @Body() body: any): Promise<any> {
    const { filter, options } = body;
    return this.service.deleteOne(schema, filter, options);
  }

  @Delete('/:schema/deleteMany')
  deleteMany(@Param('schema') schema: string, @Body() body: any): Promise<any> {
    const { filter, options } = body;
    return this.service.deleteMany(schema, filter, options);
  }

  @Delete('/:schema/fineOneAndDelete')
  fineOneAndDelete(
    @Param('schema') schema: string,
    @Body() body: any,
  ): Promise<any> {
    const { filter, options } = body;
    return this.service.findOneAndDelete(schema, filter, options);
  }

  @Put('/:schema/replaceOne')
  replaceOne(@Param('schema') schema: string, @Body() body: any): Promise<any> {
    const { filter, replacement, options } = body;
    return this.service.replace(schema, filter, replacement, options);
  }

  @Put('/:schema/fineOneAndReplace')
  fineOneAndReplace(
    @Param('schema') schema: string,
    @Body() body: any,
  ): Promise<any> {
    const { filter, replacement, options } = body;
    return this.service.findOneAndReplace(schema, filter, replacement, options);
  }
}
