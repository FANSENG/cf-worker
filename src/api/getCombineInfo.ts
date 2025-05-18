import { Context } from 'hono';
import { getPreSignedDownloadUrl } from '../bridge/image';
import { getMenus } from '../bridge/menus';

interface Menu {
  id: number;
  name: string;
  image: string;
}

interface Category {
  name: string;
}

interface Dish {
  name: string;
  image: string;
  categoryName: string;
}

interface CombineInfoResponse {
  menu: Menu;
  categories: Category[];
  dishes: Dish[];
}

async function GetCombineInfoAPI(c: Context): Promise<Response> {
  const idString = c.req.param('id');
  const id = parseInt(idString, 10);

  const menus = await getMenus(c.env, id);
  const data: CombineInfoResponse = {
    menu: {
      id: menus.id,
      name: menus.menusInfo.name,
      image: menus.menusInfo.image,
    },
    categories: menus.categories,
    dishes:menus.dishes
  };

  data.menu.image = await getPreSignedDownloadUrl(c.env,menus.menusInfo.image)
  for (const dish of data.dishes) {
    dish.image = await getPreSignedDownloadUrl(c.env,dish.image);
  }

  return c.json(data);
}

export { GetCombineInfoAPI };