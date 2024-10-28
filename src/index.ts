import { Hono } from 'hono';
import { Word2StoryAPI } from './api/word2story';

const app = new Hono();

app.get('/word2story', Word2StoryAPI);

export default app;
