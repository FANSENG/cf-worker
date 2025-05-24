import { Hono } from 'hono';

import { GetCombineInfoAPI } from './api/getCombineInfo';
import { NewMenusAPI } from './api/newMenus';
import { SaveCategoriesAPI } from './api/saveCategories';
import { AddDishAPI } from './api/addDish';
import { DeleteDishAPI } from './api/deleteDish'

const app = new Hono();

app.get('/menus/combine-info/:id', GetCombineInfoAPI);
app.post('/menus/create', NewMenusAPI);
app.post('/menus/save-categories', SaveCategoriesAPI);
app.post('/menus/add-dish', AddDishAPI);
app.post('/menus/delete-dish', DeleteDishAPI);

export default app;
