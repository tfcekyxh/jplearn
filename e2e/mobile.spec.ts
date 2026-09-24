import { expect, test } from '@playwright/test'
import { openPage, resetDatabase, type AppRoute } from './helpers'

// iPhone 12/13/14 逻辑分辨率：390x844，项目以 375-430px 为设计目标
test.use({ viewport: { width: 390, height: 844 } })

test('手机视口下首页与三个功能页均无横向溢出', async ({ page }) => {
  // 与其他用例保持一致：空库起点
  await openPage(page)
  await resetDatabase(page)

  // 每页等待一个用户可见的标志性元素，确认页面真正渲染完成再测量
  const routes: Array<{ route: AppRoute; marker: string }> = [
    { route: '', marker: '五十音速成' },
    { route: 'cards', marker: '口诀待生成' },
    { route: 'quiz', marker: '确认' },
    { route: 'read', marker: '我会了' },
  ]

  for (const { route, marker } of routes) {
    await openPage(page, route)
    await expect(page.getByText(marker)).toBeVisible()

    const { clientWidth, scrollWidth } = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(
      scrollWidth <= clientWidth,
      `${route || 'home'} 横向溢出：scrollWidth=${scrollWidth} clientWidth=${clientWidth}`,
    ).toBe(true)
  }
})
