import { Context } from 'hono';
import { getPreSignedDownloadUrl } from '../bridge/image';

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

  // You can use the 'id' variable here to fetch specific data in the future.
  // For now, we'll just log it and return the same mockData.
  // console.log('Received ID:', id);

  // Mock data
  const exampleImageUrl = await getPreSignedDownloadUrl(c.env,'Snipaste_2025-05-09_15-45-43.png') ?? '';

  const mockData: CombineInfoResponse = {
      menu: {
      id: 1,
      name: '测试菜单',
      image: exampleImageUrl,
    },
    categories: [
      { name: '主食' },
      { name: '汤类' },
      { name: '甜点' },
      { name: '其他' }
    ],
    dishes: [
      { name: '红烧肉', image: exampleImageUrl, categoryName: '主食' },
      { name: '番茄蛋汤', image: exampleImageUrl, categoryName: '汤类' },
      { name: '提拉米苏', image: exampleImageUrl, categoryName: '甜点' }
    ]
  };

  // In the future, this will fetch data from storage based on the id
  // For example, you might filter mockData or fetch from a DB:
  // const specificMenu = mockData.menu.id === id ? mockData.menu : { id: id, name: "Not Found", image: "" };
  // const responseData = { ...mockData, menu: specificMenu };
  // return c.json(responseData);

  return c.json(mockData);
}

export { GetCombineInfoAPI };