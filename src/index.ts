import { Hono } from 'hono';
import { Word2StoryAPI } from './api/word2story';
import { Content2ArticlesAPI } from './api/content2articles';
import { GetCombineInfoAPI } from './api/getCombineInfo';
import { NewMenusAPI } from './api/newMenus';

const app = new Hono();

app.get('/word2story', Word2StoryAPI);
app.get('/content2articles', Content2ArticlesAPI);

app.get('/menus/combine-info/:id', GetCombineInfoAPI);
app.post('/menus/create', NewMenusAPI);

export default app;
