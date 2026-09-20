import { createBrowserRouter, Navigate } from 'react-router'
import { CalculationWorksheets } from './apps/calculation-worksheets/CalculationWorksheets'
import { DisplayBanners } from './apps/display-banners/DisplayBanners'
import { BuntingLetters } from './apps/bunting-letters/BuntingLetters'
import { DrawerLabels } from './apps/drawer-labels/DrawerLabels'
import { LabelDesigner } from './apps/label-designer/LabelDesigner'
import { PartPartWholeWorksheets } from './apps/part-part-whole-worksheets/PartPartWholeWorksheets'
import { App } from './App'
import { LandingPage } from './pages/LandingPage'
import { NotFoundPage } from './pages/NotFoundPage'

/** Vite `base` is `/classroom-apps/`; React Router basename has no trailing slash. */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      Component: App,
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
          path: 'apps/calculation-worksheets',
          Component: CalculationWorksheets,
        },
        {
          path: 'apps/addition-subtraction-worksheets',
          element: <Navigate to="/apps/calculation-worksheets" replace />,
        },
        {
          path: 'apps/part-part-whole-worksheets',
          Component: PartPartWholeWorksheets,
        },
        { path: '*', Component: NotFoundPage },
      ],
    },
  ],
  { basename },
)
