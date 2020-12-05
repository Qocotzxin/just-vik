import { ColDef } from 'ag-grid-community';

export const productsCols: (clicked: (field: string) => void) => ColDef[] = (
  clicked: (field: string) => void
) => [
  {
    field: 'id',
    headerName: 'Eliminar',
    cellRenderer: 'deleteBtnComponent',
    cellRendererParams: {
      clicked,
    },
  },
  {
    field: 'name',
    headerName: 'Nombre',
    sortable: true,
    filter: true,
  },
  {
    field: 'stock',
    headerName: 'Stock',
    sortable: true,
    filter: true,
  },
  {
    field: 'unitPrice',
    headerName: 'Precio Unitario Neto',
    sortable: true,
    filter: true,
  },
  {
    field: 'transportCost',
    headerName: 'Precio de Transporte',
    sortable: true,
    filter: true,
  },
  {
    field: 'otherTaxes',
    headerName: 'Otros impuestos',
    sortable: true,
    filter: true,
  },
  {
    field: 'grossUnitPrice',
    headerName: 'Precio Unitario Bruto',
    sortable: true,
    filter: true,
  },
  {
    field: 'salesUnitPrice',
    headerName: 'Precio Unitario de Venta',
    sortable: true,
    filter: true,
  },
  {
    field: 'expectedProfitPercentage',
    headerName: 'Ganancia (%)',
    sortable: true,
    filter: true,
  },
  {
    field: 'estimatedProfit',
    headerName: 'Ganancia ($)',
    sortable: true,
    filter: true,
  },
  {
    field: 'lastModification',
    headerName: 'Fecha de creación',
    sortable: true,
    filter: true,
  },
];
