# API Documentation

This document details the API endpoints for the service.

## Menu Endpoints

### 1. Get Combined Menu Info
*   **GET** `/menus/combine-info/:id`
*   **Description:** Retrieves menu details, categories, and dishes.
*   **Params:** `id` (integer, path, required) - Menu ID.
*   **Success (200):** JSON object with `menu`, `categories`, `dishes`. (See `src/api/getCombineInfo.ts` for full structure)
    ```json
    {
      "menu": {"id", "name", "image"},
      "categories": [{"name"}],
      "dishes": [{"name", "image", "categoryName"}]
    }
    ```
*   **Error (500):** If an error occurs.

### 2. Create New Menu
*   **POST** `/menus/create`
*   **Description:** Creates a new menu.
*   **Body (JSON):**
    ```json
    {
      "id": 123, 
      "name": "Menu Name", 
      "image": "base64-img-string" 
    }
    ```
    * `id` (integer, required)
    * `name` (string, required)
    * `image` (string, base64 encoded, required)
*   **Success (200):**
    ```json
    {
      "success": true,
      "message": "菜单创建成功",
      "data": {"id", "menusInfo": {"name", "image"}}
    }
    ```
*   **Error (400):** Missing params.
*   **Error (500):** Creation failed.

### 3. Save Menu Categories
*   **POST** `/menus/save-categories`
*   **Description:** Updates categories for a menu. "其他" category auto-added.
*   **Body (JSON):**
    ```json
    {
      "id": 123, 
      "categories": ["Cat A", "Cat B"] 
    }
    ```
    * `id` (integer, required)
    * `categories` (array of strings, required)
*   **Success (200):**
    ```json
    {
      "success": true,
      "message": "类别保存成功",
      "data": {"categories": ["Cat A", "Cat B", "其他"]}
    }
    ```
*   **Error (400):** Missing params.
*   **Error (500):** Save failed.

### 4. Add Dish
*   **POST** `/menus/add-dish`
*   **Description:** Adds a new dish to a menu's category.
*   **Body (JSON):**
    ```json
    {
      "menusId": 123, 
      "name": "Dish Name", 
      "image": "base64-img-string", 
      "categoryName": "Category A" 
    }
    ```
    * `menusId` (integer, required)
    * `name` (string, required)
    * `image` (string, base64 encoded, required)
    * `categoryName` (string, required)
*   **Success (200):**
    ```json
    {
      "success": true,
      "message": "菜品添加成功",
      "data": {"menusId", "name", "categoryName"}
    }
    ```
*   **Error (400):** Missing params.
*   **Error (500):** Add failed.

### 5. Delete Dish
*   **POST** `/menus/delete-dish`
*   **Description:** Deletes a dish and its image.
*   **Body (JSON):**
    ```json
    {
      "menusId": 123, 
      "name": "Dish Name" 
    }
    ```
    * `menusId` (integer, required)
    * `name` (string, required)
*   **Success (200):**
    ```json
    {
      "success": true,
      "message": "菜品删除成功",
      "data": {"menusId", "name"}
    }
    ```
*   **Error (400):** Missing params.
*   **Error (500):** Delete failed.