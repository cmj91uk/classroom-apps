from playwright.sync_api import sync_playwright

apps = [
    "bunting-letters",
    "drawer-labels",
    "label-designer",
    "display-banners",
    "calculation-worksheets",
    "part-part-whole-worksheets"
]

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        for app in apps:
            print(f"Screenshotting {app}...")
            url = f"http://localhost:3000/classroom-apps/apps/{app}"
            page.goto(url)
            page.wait_for_timeout(2000) # wait for render
            page.screenshot(path=f"/tmp/screenshot_{app}.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    main()
