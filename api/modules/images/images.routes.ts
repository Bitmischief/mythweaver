import express, { Request, Response } from 'express';
import { z } from 'zod';
import {
  checkAuth0Jwt,
  useAuthenticateRequest,
  useInjectUserId,
} from '@/lib/authMiddleware';
import { useInjectLoggingInfo } from '@/lib/loggingMiddleware';
import {
  useValidateRequest,
  ValidationTypes,
} from '@/lib/validationMiddleware';
import { ImagesController } from '@/modules/images/images.controller';
import { injectDependencies } from '@/modules/images/images.dependencies';
import multer from 'multer';
import { useUpload } from '@/lib/fileUploadMiddleware';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router({ mergeParams: true });

const postImageSchema = z.object({
  modelId: z.number().optional(),
  prompt: z.string().max(1000),
  negativePrompt: z.string().max(1000).optional(),
  stylePreset: z.string().max(250).optional(),
  count: z.number().default(1).optional(),
  seed: z.string().optional(),
  linking: z
    .object({
      sessionId: z.number().nullish(),
      conjurationId: z.number().nullish(),
      characterId: z.number().nullish(),
    })
    .optional(),
  width: z.number().min(64).max(2048).default(1024).optional(),
  height: z.number().min(64).max(2048).default(1024).optional(),
  imageStrength: z.number().min(1).max(100).default(35).optional(),
  imageId: z.number().optional(),
});

router.post('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postImageSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.postImage(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.body,
      req.file,
    );
    return res.status(200).json(response);
  },
] as express.RequestHandler[]);

const patchRouteSchema = z.object({
  imageId: z.coerce.number(),
});
const patchConjurationIdSchema = z.object({
  conjurationId: z.coerce.number(),
});

router.patch('/:imageId/conjurationId', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(patchRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(patchConjurationIdSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.patchImageConjurationId(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.imageId),
      req.body,
    );
    return res.status(200).json(response);
  },
]);

const postUpscaleRouteSchema = z.object({
  imageId: z.coerce.number(),
});

router.post('/:imageId/upscale', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(postUpscaleRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.postImageUpscale(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.imageId),
    );
    return res.status(200).json(response);
  },
]);

router.patch('/:imageId/primary', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(patchRouteSchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.patchPrimaryImage(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.imageId),
    );
    return res.status(200).json(response);
  },
]);

const getConjurationImageHistorySchema = z.object({
  conjurationId: z.coerce.number(),
});

router.get('/conjurations/:conjurationId/history', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getConjurationImageHistorySchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.getConjurationImageHistory(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.conjurationId),
    );
    return res.status(200).json(response);
  },
]);

const getUserImagesSchema = z.object({
  offset: z.coerce.number().default(0).optional(),
  limit: z.coerce.number().min(1).default(50).optional(),
});

router.get('/gallery', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getUserImagesSchema, {
    validationType: ValidationTypes.Query,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.getUserImages(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.query.offset as unknown as number,
      req.query.limit as unknown as number,
    );
    return res.status(200).json(response);
  },
]);

const postInpaintSchema = z.object({
  prompt: z.string().max(10000),
  negativePrompt: z.string().max(10000).optional(),
  seed: z.number().optional(),
});

router.post('/:imageId/inpaint', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(z.object({ imageId: z.coerce.number() }), {
    validationType: ValidationTypes.Route,
  }),
  upload.single('mask'),
  useValidateRequest(postInpaintSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.postImageInpaint(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.imageId),
      {
        ...req.body,
        maskFile: req.file,
      },
    );
    return res.status(200).json(response);
  },
] as express.RequestHandler[]);

const postOutpaintSchema = z.object({
  left: z.number().min(0).max(2000),
  right: z.number().min(0).max(2000),
  up: z.number().min(0).max(2000),
  down: z.number().min(0).max(2000),
  prompt: z.string().max(10000).optional(),
  creativity: z.number().min(0).max(1).optional(),
  seed: z.number().optional(),
});

router.post('/:imageId/outpaint', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(z.object({ imageId: z.coerce.number() }), {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(postOutpaintSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.postImageOutpaint(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.imageId),
      req.body,
    );
    return res.status(200).json(response);
  },
]);

router.post('/:imageId/remove-background', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(z.object({ imageId: z.coerce.number() }), {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    await controller.postRemoveBackground(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.imageId),
    );
    return res.status(200).json({ message: 'Background removed successfully' });
  },
]);

router.post('/:imageId/erase', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(z.object({ imageId: z.coerce.number() }), {
    validationType: ValidationTypes.Route,
  }),
  upload.single('mask'),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.eraseImagePortion(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.imageId),
      req.file as Express.Multer.File,
    );
    return res.status(200).json(response);
  },
] as express.RequestHandler[]);

const getImageByIdSchema = z.object({
  imageId: z.coerce.number(),
});

router.get('/:imageId', [
  useAuthenticateRequest(),
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(getImageByIdSchema, {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.getImageById(
      res.locals?.auth?.userId,
      res.locals.trackingInfo,
      parseInt(req.params.imageId),
    );
    return res.status(200).json(response);
  },
]);

const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

router.post('/upload', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useUpload('image', {
    maxFileSize: MAX_IMAGE_FILE_SIZE,
    acceptedFileTypes: ACCEPTED_IMAGE_TYPES,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');

    if (!req.file) {
      return res.status(400).json({
        message:
          'Invalid image upload, no file provided. Are you using a multipart form upload?',
      });
    }

    const response = await controller.uploadImage(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      req.file as Express.Multer.File,
    );
    return res.status(200).json(response);
  },
] as express.RequestHandler[]);

const setImageToEditSchema = z.object({
  editId: z.string().uuid(),
});

router.patch('/:imageId/edit', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(z.object({ imageId: z.coerce.number() }), {
    validationType: ValidationTypes.Route,
  }),
  useValidateRequest(setImageToEditSchema),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.setImageToEdit(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.imageId),
      req.body,
    );
    return res.status(200).json(response);
  },
]);

router.delete('/:imageId/edits', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  useValidateRequest(z.object({ imageId: z.coerce.number() }), {
    validationType: ValidationTypes.Route,
  }),
  injectDependencies,
  async (req: Request, res: Response) => {
    const controller =
      req.container.resolve<ImagesController>('imagesController');
    const response = await controller.deleteImageEdits(
      res.locals.auth.userId,
      res.locals.trackingInfo,
      parseInt(req.params.imageId),
    );
    return res.status(200).json(response);
  },
]);

export default router;
