import express from 'express';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import config from 'config';

const SIGN_SECRET: string = config.get('security.jwtSignSecret');
const ACCESS_TOKEN: string = config.get('security.accessToken');

const router = express.Router();

router.use(bodyParser.json());

router.post('/', (req, res) => {
  const { name, token } = req.body;

  if (!name || !token) {
    return res.sendStatus(400);
  }

  if (token === ACCESS_TOKEN) {
    const signedJwt = jwt.sign({}, SIGN_SECRET, { subject: name, expiresIn: '5 minutes' });
    return res.json({ jwt: signedJwt });
  }

  return res.sendStatus(401);
});

export default router;
