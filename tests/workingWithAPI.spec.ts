import { test, expect, request } from '@playwright/test';
import tags from '../test-data/tags.json';
//Users/P00922107/bodnar_academy/PW-APITEST-APP/test-data/tags.json
import * as path from 'path';
import dotenv from 'dotenv';

test.beforeEach(async ({ page }) => {
   await page.route('**/api/tags', async route => {
      //console.log('MOCK HIT:', route.request().url());

      await route.fulfill({
       status: 200,
       contentType: 'application/json',
       body: JSON.stringify(tags),
      })

    })

    await page.goto('https://conduit.bondaracademy.com');

  })

test('has title', async ({ page }) => {
  await page.route('*/**/api/articles*', async route =>{
    const response = await route.fetch()
    const responseBody = await response.json()
    responseBody.articles[0].title = "This is a MOCK test title"
    responseBody.articles[0].description = "This is a MOCK description"

    await route.fulfill({
      body: JSON.stringify(responseBody)
    })

  })

  await page.getByText('Global Feed').click();
  await expect(page.locator('app-article-list h1').first()).toContainText('This is a MOCK test title')
  await expect(page.locator('app-article-list p').first()).toContainText('This is a MOCK description')
  //await expect(page.locator('.sidebar .tag-list')).toContainText('automation');
  //await expect(page.locator('.sidebar .tag-list')).toContainText('playwright');
});


test('delete article', async ({ page, request }) => {
  const articleTitle = `This is the test title ${Date.now()}`;

  // Login via API
  const response = await request.post('https://conduit-api.bondaracademy.com/api/users/login',
    {
      data: {
        user: {email: process.env.TEST_EMAIL,password: process.env.TEST_PASSWORD
        }
      }
    }
  );

  expect(response.status()).toBe(200);

  const responseBody = await response.json();
  const accessToken = responseBody.user.token;

  // Create article via API
  const articleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles/',
    {
      data: {
        article: {
          title: articleTitle,
          description: 'This is a test description',
          body: 'This is the body',
          tagList: ['This is a test tag']
        }
      },
      headers: {
        Authorization: `Token ${accessToken}`
      }
    }
  );

  expect(articleResponse.status(),
    await articleResponse.text()).toBe(201);

  // Delete article via UI
  await page.getByText('Global Feed').click();
  await page.getByText(articleTitle, { exact: true }).click();
  await page.getByRole('button', {name: 'Delete Article'}).first().click();
  await page.getByText('Global Feed').click();

  // Verify deleted article is absent
  await expect(page.locator('app-article-list h1').filter({ hasText: articleTitle })).toHaveCount(0);
});


test('Create article', async ({page, request}) =>{
  const response = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
    data: {
      "user": {email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD}
    }
   })

   await page.getByText('New Article').click()
   const articleTitle = `Playwright is awesome ${Date.now()}`;
   await page.getByRole('textbox', { name: 'Article Title' }).fill(articleTitle);
   //await page.getByRole('textbox', {name: 'Article Title'}).fill('Playwrith is awesome')
   await page.getByRole('textbox', {name: 'What\'s this article about?'}).fill('We can use APIs in Playwright')
   await page.getByRole('textbox', {name: 'Write your article (in markdown)'}).fill ('bla bla')
   await page.getByRole('button', {name: 'Publish Article'}).click()
   const createArticleResponse = await page.waitForResponse('https://conduit-api.bondaracademy.com/api/articles/')
   const articleResponseJSON = await createArticleResponse.json()
   const slugID = articleResponseJSON.article.slug

   //await expect(page.locator('.article-page h1')).toContainText('Playwrith is awesome')
   await expect(page.locator('.article-page h1')).toContainText(articleTitle);
   await page.getByText('Home').first().click()
   await expect(page.locator('.article-preview h1').first()).toContainText(articleTitle);
   //await expect(page.locator('.article-preview h1').first()).toContainText('Playwrith is awesome')
   const loginResponse = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
    data: {
      "user": {email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD}
    }
   })
   //console.log('Login status:', loginResponse.status());
   //console.log('Login body:', await loginResponse.text());

   expect(loginResponse.status()).toEqual(200)
   const responseLoginJSON = await loginResponse.json()
   const token = responseLoginJSON.user.token

   const deleteResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slugID}`,{
    headers: {
      Authorization: `Token ${token}`
    }
   })
   expect(deleteResponse.status()).toEqual(204)


})