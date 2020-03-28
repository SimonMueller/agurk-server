import express from 'express';
import jwt from 'jsonwebtoken';
import config from 'config';
import emojis from 'emojis-list';
import { AuthenticationBody } from 'agurk-shared';

const SIGN_SECRET: string = config.get('security.jwtSignSecret');
const ACCESS_TOKEN: string = config.get('security.accessToken');

const router = express.Router();

function getRandomEmoji(): string {
  return emojis[Math.floor(Math.random() * emojis.length)];
}

router.post('/', (req, res) => {
  const { name, token }: AuthenticationBody = req.body;

  if (!name || !token) {
    return res.sendStatus(400);
  }

  if (token === ACCESS_TOKEN) {
    const signedJwt = jwt.sign({}, SIGN_SECRET, {
      subject: `${name} ${getRandomEmoji()}${getRandomEmoji()}`,
      expiresIn: '5 minutes',
    });
    return res.json({ jwt: signedJwt });
  }

  return res.sendStatus(401);
});

export default router;