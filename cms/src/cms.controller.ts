import {
  Body,
  Controller,
  Param,
  Post,
  Put,
  Delete,
  Get,
  Query,
  Req,
  Res,
  Session,
} from '@nestjs/common';
import { CMSService } from './cms.service';
import { Request, Response } from 'express';

@Controller()
export class CMSController {
  constructor(private readonly service: CMSService) {}

  @Get('/:schema')
  async find(
    @Param('schema') schema: string,
    @Query('skip') skip: number = 0,
    @Query('limit') limit: number = 10,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Session() session: any,
    @Param() params: any,
    @Query() query: any,
    @Body() body: any,
  ) {
    return this.service.find(
      schema,
      {
        skip: Number(skip),
        limit: Number(limit),
      },
      { request, response, session, params, query, body },
    );
  }

  @Get('/:schema/:id')
  async findById(
    @Param('schema') schema: string,
    @Param('id') id: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Session() session: any,
    @Param() params: any,
    @Query() query: any,
    @Body() body: any,
  ) {
    return this.service.findById(schema, id, {
      request,
      response,
      session,
      params,
      query,
      body,
    });
  }

  @Post('/:schema')
  async create(
    @Param('schema') schema: string,
    @Body() body: any,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Session() session: any,
    @Param() params: any,
    @Query() query: any,
  ) {
    return this.service.create(schema, body, {
      request,
      response,
      session,
      params,
      query,
      body,
    });
  }

  @Put('/:schema')
  async update(
    @Param('schema') schema: string,
    @Body() body: any,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Session() session: any,
    @Param() params: any,
    @Query() query: any,
  ) {
    return this.service.update(schema, body.filter, body.data, {
      request,
      response,
      session,
      params,
      query,
      body,
    });
  }

  @Put('/:schema/:id')
  async updateById(
    @Param('schema') schema: string,
    @Param('id') id: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Session() session: any,
    @Param() params: any,
    @Query() query: any,
    @Body() body: any,
  ) {
    return this.service.updateById(schema, id, body, {
      request,
      response,
      session,
      params,
      query,
      body,
    });
  }

  @Delete('/:schema')
  async deleteMany(
    @Param('schema') schema: string,
    @Query('filter') filter: any,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Session() session: any,
    @Param() params: any,
    @Query() query: any,
    @Body() body: any,
  ) {
    return this.service.deleteMany(schema, filter, {
      request,
      response,
      session,
      params,
      query,
      body,
    });
  }

  @Delete('/:schema/:id')
  async deleteById(
    @Param('schema') schema: string,
    @Param('id') id: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Session() session: any,
    @Param() params: any,
    @Query() query: any,
    @Body() body: any,
  ) {
    return this.service.deleteById(schema, id, {
      request,
      response,
      session,
      params,
      query,
      body,
    });
  }
}
