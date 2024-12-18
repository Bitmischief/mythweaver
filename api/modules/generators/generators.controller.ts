import {
  Body,
  Get,
  Inject,
  OperationId,
  Path,
  Post,
  Query,
  Security,
  Tags,
  Route,
} from 'tsoa';
import { Conjuration } from '@prisma/client';
import { TrackingInfo } from '@/lib/tracking';
import { GeneratorsService } from '@/modules/generators/generators.service';
import {
  GetGeneratorsResponse,
  PostGeneratorGenerate,
  PostGenerateArbitraryRequest,
  PostGenerateArbitraryFromPromptRequest,
  PostGenerateArbitraryReplacementRequest,
} from '@/modules/generators/generators.interface';
import { Generator } from '@/data/conjurers';

@Route('generators')
@Tags('Conjuration')
export class GeneratorsController {
  constructor(private generatorsService: GeneratorsService) {}

  @Get('/')
  @Security('jwt')
  @OperationId('getGenerators')
  public async getGenerators(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Query() offset = 0,
    @Query() limit = 50,
  ): Promise<GetGeneratorsResponse> {
    return this.generatorsService.getGenerators(
      userId,
      trackingInfo,
      offset,
      limit,
    );
  }

  @Get('/{code}')
  @Security('jwt')
  @OperationId('getGenerator')
  public getGenerator(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() code: string,
  ): Generator | undefined {
    return this.generatorsService.getGenerator(userId, trackingInfo, code);
  }

  @Post('/{code}/generate/quick')
  @Security('jwt')
  @OperationId('quickConjure')
  public async postGeneratorGenerateQuick(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() code: string,
  ): Promise<Conjuration | null> {
    return this.generatorsService.quickConjure(userId, trackingInfo, code);
  }

  @Post('/{code}/generate')
  @Security('jwt')
  @OperationId('generate')
  public async postGeneratorGenerate(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() code: string,
    @Body() request: PostGeneratorGenerate,
  ): Promise<any> {
    return this.generatorsService.generate(userId, trackingInfo, code, request);
  }

  @Get('/requests/{conjurationRequestId}')
  @Security('jwt')
  @OperationId('getConjurationRequest')
  public async getConjurationRequest(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() conjurationRequestId: number,
  ): Promise<any> {
    return this.generatorsService.getConjurationRequest(
      userId,
      trackingInfo,
      conjurationRequestId,
    );
  }

  @Post('/arbitrary')
  @Security('jwt')
  @OperationId('postGenerateArbitrary')
  public async postGenerateArbitrary(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: PostGenerateArbitraryRequest,
  ): Promise<any> {
    return this.generatorsService.generateArbitrary(
      userId,
      trackingInfo,
      request,
    );
  }

  @Post('/arbitrary/prompt')
  @Security('jwt')
  @OperationId('postGenerateArbitraryFromPrompt')
  public async postGenerateArbitraryFromPrompt(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: PostGenerateArbitraryFromPromptRequest,
  ): Promise<any> {
    return this.generatorsService.generateArbitraryFromPrompt(
      userId,
      trackingInfo,
      request,
    );
  }

  @Post('/arbitrary/replace')
  @Security('jwt')
  @OperationId('postGenerateArbitraryReplacement')
  public async postGenerateArbitraryReplacement(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: PostGenerateArbitraryReplacementRequest,
  ): Promise<any> {
    return this.generatorsService.generateArbitraryReplacement(
      userId,
      trackingInfo,
      request,
    );
  }
}
