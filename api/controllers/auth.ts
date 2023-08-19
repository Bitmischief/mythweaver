import { Body, Post, Route, SuccessResponse, Tags } from "tsoa";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/providers/prisma";
import { AppError, HttpCode } from "../lib/errors/AppError";
import jwt from "jsonwebtoken";
import { parentLogger } from "../lib/logger";
const logger = parentLogger.getSubLogger();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const jwtExpirySeconds = 30 * 60; // 30 minutes
const jwtRefreshExpirySeconds = 14 * 24 * 60 * 60; // 14 days

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

interface TokenRequest {
  type: "GOOGLE";
  credential: string;
}

interface RefreshRequest {
  refreshToken: string;
}

@Route("auth")
@Tags("Auth")
export default class AuthController {
  @Post("/token")
  @SuccessResponse("200", "Success")
  public async postToken(
    @Body() request: TokenRequest
  ): Promise<TokenResponse> {
    const ticket = await client.verifyIdToken({
      idToken: request.credential,
    });

    const payload = await ticket.getPayload();

    if (!payload) {
      throw new AppError({
        httpCode: HttpCode.BAD_REQUEST,
        description: "Unable to properly verify provided credentials",
      });
    }

    const { email } = payload;

    if (!email) {
      throw new AppError({
        httpCode: HttpCode.BAD_REQUEST,
        description: "Email did not exist on provided credentials",
      });
    }

    logger.info("Getting user for email", email);
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      logger.info("User did not exist, early access not available....");

      // user = await prisma.user.create({
      //   data: {
      //     email,
      //   },
      // });

      throw new AppError({
        httpCode: HttpCode.BAD_REQUEST,
        description: "User is not enabled for early access!",
      });
    }

    return await this.issueTokens(user.id);
  }

  @Post("/refresh")
  @SuccessResponse("200", "Success")
  public async postRefresh(
    @Body() request: RefreshRequest
  ): Promise<TokenResponse> {
    let userId;

    try {
      const payload = jwt.verify(
        request.refreshToken,
        process.env.JWT_REFRESH_SECRET_KEY || ""
      );

      userId = (payload as any).userId;
    } catch (e) {
      if (e instanceof jwt.JsonWebTokenError) {
        // if the error thrown is because the JWT is unauthorized,
        // return a 401 error
        throw new AppError({
          httpCode: HttpCode.UNAUTHORIZED,
          description: "Unable to authorize this refresh token",
        });
      }
      // otherwise, return a bad request error
      throw new AppError({
        httpCode: HttpCode.UNAUTHORIZED,
        description: "Invalid refresh token provided",
      });
    }

    const dbToken = await prisma.refreshToken.findUnique({
      where: {
        refreshToken: request.refreshToken,
      },
    });

    if (!dbToken || dbToken.userId !== userId) {
      // otherwise, return a bad request error
      throw new AppError({
        httpCode: HttpCode.UNAUTHORIZED,
        description: "Invalid refresh token provided",
      });
    }

    await prisma.refreshToken.delete({
      where: {
        refreshToken: request.refreshToken,
      },
    });

    return await this.issueTokens(userId);
  }

  private async issueTokens(userId: number) {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY || "", {
      algorithm: "HS256",
      expiresIn: jwtExpirySeconds,
    });

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + jwtRefreshExpirySeconds);

    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET_KEY || "",
      {
        algorithm: "HS256",
        expiresIn: jwtRefreshExpirySeconds,
      }
    );

    logger.info("Saving refresh token", refreshToken, userId);
    await prisma.refreshToken.create({
      data: {
        refreshToken,
        expiresAt,
        userId,
      },
    });

    return {
      access_token: token,
      refresh_token: refreshToken,
    };
  }
}
