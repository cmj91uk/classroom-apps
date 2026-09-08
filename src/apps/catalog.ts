export type MiniApp = {
  id: string
  title: string
  description: string
  path: string
}

export const MINI_APPS: MiniApp[] = [
  {
    id: 'bunting-letters',
    title: 'Bunting Letters',
    description:
      'Turn a short message into printable A4 letter pages for classroom bunting.',
    path: '/apps/bunting-letters',
  },
  {
    id: 'drawer-labels',
    title: 'Drawer Labels',
    description:
      'Print four name labels per A4 page for classroom drawers and storage.',
    path: '/apps/drawer-labels',
  },
  {
    id: 'label-designer',
    title: 'Label Designer',
    description:
      'Print lesson-objective stickers with dates and icons on A4 label sheets.',
    path: '/apps/label-designer',
  },
  {
    id: 'display-banners',
    title: 'Display Banners',
    description: 'Create posters for displays with shapes and text',
    path: '/apps/display-banners',
  },
  {
    id: 'addition-subtraction-worksheets',
    title: 'Addition & Subtraction Worksheets',
    description: 'Two digit addition and subtraction worksheets',
    path: '/apps/addition-subtraction-worksheets',
  },
  {
    id: 'part-part-whole-worksheets',
    title: 'Part Part Whole Worksheets',
    description: 'Make Part Part Whole worksheets quickly and easily',
    path: '/apps/part-part-whole-worksheets',
  },
]
