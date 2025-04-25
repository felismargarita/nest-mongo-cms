import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CMSService } from './cms.service';

@Controller('/cms')
export class CMSController {
  constructor(private readonly service: CMSService) {}

  @Get('/:slug')
  getBySlug(@Param('slug') slug: string): Promise<any> {
    return this.service.getBySlug(slug);
  }

  @Get('/:slug/:key')
  getRecordBySlugAndByKey(
    @Param('slug') slug: string,
    @Param('key') key: string,
  ): Promise<any> {
    return this.service.getRecordBySlugAndByKey(slug, key);
  }

  @Post('/:slug')
  createRecordBySlug(
    @Param('slug') slug: string,
    @Body() body: any,
  ): Promise<any> {
    return this.service.createRecordBySlug(slug, body);
  }
}
