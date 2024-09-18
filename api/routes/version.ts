import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/', [
  async (req: Request, res: Response) => {
    return res.status(200).send({ version: process.env.VERSION });
  },
]);

export default router;
