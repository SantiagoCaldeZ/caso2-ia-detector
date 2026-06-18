import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/JwtAuthGuard';
import { AuthenticatedRequest } from '../dto/auth/AuthenticatedRequest';
import { CreateVerificationRequestDTO } from '../dto/verification/CreateVerificationRequestDTO';
import { VerificationAnalysisReportDTO } from '../dto/verification/VerificationAnalysisReportDTO';
import { VerificationHistoryItemDTO } from '../dto/verification/VerificationHistoryItemDTO';
import { CreateVerificationCaseService } from '../../application/verification/CreateVerificationCaseService';
import { ListVerificationHistoryService } from '../../application/verification/ListVerificationHistoryService';
import { GetVerificationCaseService } from '../../application/verification/GetVerificationCaseService';

@Controller('verifications')
export class VerificationController {
  constructor(
    private readonly createVerificationCaseService: CreateVerificationCaseService,
    private readonly listVerificationHistoryService: ListVerificationHistoryService,
    private readonly getVerificationCaseService: GetVerificationCaseService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createVerification(
    @Body() body: CreateVerificationRequestDTO,
    @Req() request: AuthenticatedRequest,
  ): Promise<VerificationAnalysisReportDTO> {
    return this.createVerificationCaseService.create(body, request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  listHistory(
    @Req() request: AuthenticatedRequest,
  ): Promise<VerificationHistoryItemDTO[]> {
    return this.listVerificationHistoryService.list(request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':caseId')
  getCaseDetail(
    @Param('caseId') caseId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<VerificationAnalysisReportDTO> {
    return this.getVerificationCaseService.getById(caseId, request.user);
  }
}