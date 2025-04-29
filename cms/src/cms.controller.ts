import {
  Body,
  Controller,
  Param,
  Post,
  Put,
  Delete,
  Get,
  Query,
} from '@nestjs/common';
import { CMSService } from './cms.service';

@Controller()
export class CMSController {
  constructor(private readonly service: CMSService) {}

  @Get('/:schema')
  find(
    @Param('schema') schema: string,
    @Query('skip') skip: number = 0,
    @Query('limit') limit: number = 10,
  ) {
    return this.service.find(schema, {
      skip: Number(skip),
      limit: Number(limit),
    });
  }

  @Get('/:schema/:id')
  findById(@Param('schema') schema: string, @Param('id') id: string) {
    return this.service.findById(schema, id);
  }

  @Post('/:schema')
  create(@Param('schema') schema: string, @Body() body: any) {
    return this.service.create(schema, body);
  }

  @Put('/:schema')
  update(@Param('schema') schema: string, @Body() body: any) {
    return this.service.update(schema, body.filter, body.data);
  }

  @Put('/:schema/:id')
  updateById(
    @Param('schema') schema: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.service.updateById(schema, id, body);
  }

  @Delete('/:schema')
  deleteMany(@Param('schema') schema: string, @Query('filter') filter: any) {
    return this.service.deleteMany(schema, filter);
  }

  @Delete('/:schema/:id')
  deleteById(@Param('schema') schema: string, @Param('id') id: string) {
    return this.service.deleteById(schema, id);
  }
}
