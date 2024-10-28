import { Hono } from 'hono';
import { Word2StoryRequest, Word2StoryResponse } from './shared/word2story';
import { InvalidRequestStatus } from './constant/statu';
import { WordToStory } from './bridge/word2story';
import { word2story } from './api/word2story';

const app = new Hono();
app.get('/call/word2story', word2story);

export default app;
