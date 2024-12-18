import {
  Body,
  Get,
  Inject,
  OperationId,
  Patch,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { TrackingInfo } from '@/lib/tracking';
import { UsersService } from '@/modules/users/users.service';
import {
  GetUserResponse,
  PatchUserRequest,
  AddUserCreditsRequest,
} from '@/modules/users/users.interface';
import { User } from '@prisma/client';

@Route('users')
@Tags('Users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Security('jwt')
  @OperationId('getLoggedInUser')
  @Get('/me')
  public async getUser(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
  ): Promise<GetUserResponse> {
    return this.usersService.getUser(userId, trackingInfo);
  }

  @Security('jwt')
  @OperationId('updateUser')
  @Patch('/me')
  public async patchUser(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: PatchUserRequest,
  ): Promise<User> {
    return this.usersService.updateUser(userId, trackingInfo, request);
  }

  @Security('jwt')
  @OperationId('getSubscription')
  @Get('/me/subscription')
  public async getSubscription(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
  ) {
    return this.usersService.getSubscription(userId, trackingInfo);
  }

  public async addUserCredits(
    trackingInfo: TrackingInfo,
    request: AddUserCreditsRequest,
  ) {
    return this.usersService.addUserCredits(trackingInfo, request);
  }
}
