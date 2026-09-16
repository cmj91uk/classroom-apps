import { createBrowserRouter, Navigate } from 'react-router'
import { AdditionSubtractionWorksheets } from './apps/addition-subtraction-worksheets/AdditionSubtractionWorksheets'
import { DisplayBanners } from './apps/display-banners/DisplayBanners'
import { BuntingLetters } from './apps/bunting-letters/BuntingLetters'
import { DrawerLabels } from './apps/drawer-labels/DrawerLabels'
import { LabelDesigner } from './apps/label-designer/LabelDesigner'
import { PartPartWholeWorksheets } from './apps/part-part-whole-worksheets/PartPartWholeWorksheets'
import { App } from './App'
import { RequireAuth } from './auth/RequireAuth'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'

/** Vite `base` is `/classroom-apps/`; React Router basename has no trailing slash. */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      Component: App,
      children: [
        { path: 'login', Component: LoginPage },
        { path: 'auth/callback', Component: AuthCallbackPage },
        { path: 'auth/confirm', Component: AuthCallbackPage },
        { path: 'reset-password', Component: ResetPasswordPage },
        {
          Component: RequireAuth,
          children: [
            { index: true, Component: LandingPage },
            { path: 'apps/bunting-letters', Component: BuntingLetters },
            {
              path: 'apps/display-designer',
              element: <Navigate to="/apps/bunting-letters" replace />,
            },
            { path: 'apps/drawer-labels', Component: DrawerLabels },
            { path: 'apps/label-designer', Component: LabelDesigner },
            { path: 'apps/display-banners', Component: DisplayBanners },
            {
              path: 'apps/addition-subtraction-worksheets',
              Component: AdditionSubtractionWorksheets,
            },
            {
              path: 'apps/part-part-whole-worksheets',
              Component: PartPartWholeWorksheets,
            },
            { path: '*', Component: NotFoundPage },
          ],
        },
      ],
    },
  ],
  { basename },
)
