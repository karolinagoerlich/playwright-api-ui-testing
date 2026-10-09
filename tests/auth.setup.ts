import { test as setup, expect } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
    await page.goto('https://conduit.bondaracademy.com');
    await page.getByText('Sign in').click()
    await page.getByRole('textbox', { name: 'Email' }).fill(process.env.TEST_EMAIL!);
    await page.getByRole('textbox', { name: 'Password' }).fill(process.env.TEST_PASSWORD!);
    await page.getByRole('button').click()
    await expect(page.getByRole('link', {name: 'New Article'})).toBeVisible();
    await page.context().storageState({ path: authFile });
});