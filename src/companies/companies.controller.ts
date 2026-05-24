import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { CompaniesService } from './companies.service';

@Controller('api/companies')
export class CompaniesController {
    constructor(private readonly companiesService: CompaniesService) { }

    @Post()
    async create(@Body() body: { name: string; taxCode?: string; address?: string }) {
        return this.companiesService.create(body);
    }

    @Get()
    async findAll() {
        return this.companiesService.findAll();
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.companiesService.remove(id);
    }
}