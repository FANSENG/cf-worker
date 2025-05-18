import { Hono } from 'hono';
import { Word2StoryAPI } from './api/word2story';
import { Content2ArticlesAPI } from './api/content2articles';

import { GetCombineInfoAPI } from './api/getCombineInfo';
import { NewMenusAPI } from './api/newMenus';
import  { SaveCategoriesAPI } from './api/saveCategories';
import { AddDishAPI } from './api/addDish';
import {DeleteDishAPI} from './api/deleteDish'

const app = new Hono();

app.get('/word2story', Word2StoryAPI);
app.get('/content2articles', Content2ArticlesAPI);

app.get('/menus/combine-info/:id', GetCombineInfoAPI);
app.post('/menus/create', NewMenusAPI);
app.post('/menus/save-categories', SaveCategoriesAPI);
app.post('/menus/add-dish', AddDishAPI);
app.post('/menus/delete-dish', DeleteDishAPI);

export default app;
