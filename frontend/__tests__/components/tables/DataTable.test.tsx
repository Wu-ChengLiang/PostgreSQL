import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '../../utils/test-utils'
import userEvent from '@testing-library/user-event'
import { DataTable, Column } from '@/components/tables/DataTable'

interface TestData {
  id: number
  name: string
  email: string
  age: number
  status: 'active' | 'inactive'
  nested: {
    value: string
  }
}

describe('DataTable Component', () => {
  const mockData: TestData[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, status: 'active', nested: { value: 'A' } },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25, status: 'inactive', nested: { value: 'B' } },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35, status: 'active', nested: { value: 'C' } },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', age: 28, status: 'active', nested: { value: 'D' } },
    { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', age: 40, status: 'inactive', nested: { value: 'E' } },
  ]

  const defaultColumns: Column<TestData>[] = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'age', header: 'Age', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <span className={value === 'active' ? 'text-green-600' : 'text-red-600'}>
          {value}
        </span>
      ),
      filterable: true,
    },
    { key: 'nested.value', header: 'Nested Value' },
  ]

  const defaultProps = {
    data: mockData,
    columns: defaultColumns,
  }

  describe('Rendering', () => {
    it('should render table with data', () => {
      render(<DataTable {...defaultProps} />)

      // Check headers
      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()

      // Check data
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    })

    it('should render title when provided', () => {
      render(<DataTable {...defaultProps} title="User Management" />)
      expect(screen.getByText('User Management')).toBeInTheDocument()
    })

    it('should render custom cell content', () => {
      render(<DataTable {...defaultProps} />)
      
      const activeStatuses = screen.getAllByText('active')
      const inactiveStatuses = screen.getAllByText('inactive')
      
      activeStatuses.forEach(status => {
        expect(status).toHaveClass('text-green-600')
      })
      
      inactiveStatuses.forEach(status => {
        expect(status).toHaveClass('text-red-600')
      })
    })

    it('should render nested values correctly', () => {
      render(<DataTable {...defaultProps} />)
      
      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
    })

    it('should show empty state when no data', () => {
      render(<DataTable {...defaultProps} data={[]} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show loading state', () => {
      const { container } = render(<DataTable {...defaultProps} loading={true} />)
      
      const loadingElement = container.querySelector('.animate-pulse')
      expect(loadingElement).toBeInTheDocument()
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should paginate data with default page size', () => {
      render(<DataTable {...defaultProps} pageSize={2} />)

      // Only first 2 items should be visible
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()

      // Check pagination info
      expect(screen.getByText('Showing 1 to 2 of 5 results')).toBeInTheDocument()
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })

    it('should navigate between pages', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} pageSize={2} />)

      // Get navigation buttons - they are in specific order
      const buttons = screen.getAllByRole('button')
      const navigationButtons = buttons.slice(-4) // Last 4 buttons are navigation
      const [firstButton, prevButton, nextButton, lastButton] = navigationButtons

      // Go to page 2
      await user.click(nextButton)

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
      expect(screen.getByText('Alice Brown')).toBeInTheDocument()

      // Go to last page
      await user.click(lastButton)

      expect(screen.getByText('Charlie Davis')).toBeInTheDocument()
      expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
    })

    it('should disable navigation buttons appropriately', () => {
      render(<DataTable {...defaultProps} pageSize={2} />)

      const firstButton = screen.getAllByRole('button')[0]
      const prevButton = screen.getAllByRole('button')[1]
      const nextButton = screen.getAllByRole('button')[2]
      const lastButton = screen.getAllByRole('button')[3]

      // On first page
      expect(firstButton).toBeDisabled()
      expect(prevButton).toBeDisabled()
      expect(nextButton).not.toBeDisabled()
      expect(lastButton).not.toBeDisabled()
    })

    it('should not show pagination for single page', () => {
      render(<DataTable {...defaultProps} pageSize={10} />)
      
      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('should sort data by clicking sortable columns', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} pageSize={10} />)

      // Get all rows
      const getRowNames = () => {
        const rows = screen.getAllByRole('row').slice(1) // Skip header
        return rows.map(row => within(row).getAllByRole('cell')[1].textContent)
      }

      // Initial order
      expect(getRowNames()).toEqual(['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Davis'])

      // Click Name header to sort ascending
      const nameHeader = screen.getByText('Name')
      await user.click(nameHeader)

      expect(getRowNames()).toEqual(['Alice Brown', 'Bob Johnson', 'Charlie Davis', 'Jane Smith', 'John Doe'])

      // Click again to sort descending
      await user.click(nameHeader)

      expect(getRowNames()).toEqual(['John Doe', 'Jane Smith', 'Charlie Davis', 'Bob Johnson', 'Alice Brown'])
    })

    it('should show sort indicators', async () => {
      const user = userEvent.setup()
      const { container } = render(<DataTable {...defaultProps} />)

      const nameHeader = screen.getByText('Name').closest('th')
      
      // Click to sort ascending
      await user.click(nameHeader!)

      const upArrow = nameHeader!.querySelector('.text-gray-900')
      expect(upArrow).toBeInTheDocument()
    })

    it('should not sort non-sortable columns', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} pageSize={10} />)

      const emailHeader = screen.getByText('Email')
      const initialOrder = screen.getAllByRole('cell', { name: /example.com/ }).map(cell => cell.textContent)

      await user.click(emailHeader)

      const afterClickOrder = screen.getAllByRole('cell', { name: /example.com/ }).map(cell => cell.textContent)
      expect(afterClickOrder).toEqual(initialOrder)
    })
  })

  describe('Search', () => {
    it('should filter data based on search query', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} searchable={true} />)

      const searchInput = screen.getByPlaceholderText('Search...')
      await user.type(searchInput, 'jane')

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      })
    })

    it('should search across all columns', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} searchable={true} />)

      const searchInput = screen.getByPlaceholderText('Search...')
      await user.type(searchInput, 'example.com')

      await waitFor(() => {
        // All users should be visible as they all have example.com email
        expect(screen.getAllByRole('row')).toHaveLength(6) // 5 data rows + 1 header
      })
    })

    it('should reset to page 1 when searching', async () => {
      const user = userEvent.setup()
      render(<DataTable {...defaultProps} searchable={true} pageSize={2} />)

      // Go to page 2  
      const buttons = screen.getAllByRole('button')
      const nextButton = buttons[buttons.length - 2] // Second to last button is next
      await user.click(nextButton)

      // Search
      const searchInput = screen.getByPlaceholderText('Search...')
      await user.type(searchInput, 'john')

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
      })
    })

    it('should not show search input when searchable is false', () => {
      render(<DataTable {...defaultProps} searchable={false} />)
      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    it('should show Add New button when onAdd is provided', () => {
      const onAdd = jest.fn()
      render(<DataTable {...defaultProps} onAdd={onAdd} />)

      const addButton = screen.getByText('Add New')
      expect(addButton).toBeInTheDocument()
      
      fireEvent.click(addButton)
      expect(onAdd).toHaveBeenCalledTimes(1)
    })

    it('should show Edit and Delete buttons when handlers are provided', () => {
      const onEdit = jest.fn()
      const onDelete = jest.fn()
      render(<DataTable {...defaultProps} onEdit={onEdit} onDelete={onDelete} />)

      const editButtons = screen.getAllByText('Edit')
      const deleteButtons = screen.getAllByText('Delete')

      expect(editButtons).toHaveLength(5)
      expect(deleteButtons).toHaveLength(5)

      fireEvent.click(editButtons[0])
      expect(onEdit).toHaveBeenCalledWith(mockData[0])

      fireEvent.click(deleteButtons[1])
      expect(onDelete).toHaveBeenCalledWith(mockData[1])
    })

    it('should render custom actions', () => {
      const customAction = jest.fn()
      const actions = (row: TestData) => (
        <button onClick={() => customAction(row)}>Custom {row.id}</button>
      )

      render(<DataTable {...defaultProps} actions={actions} />)

      const customButtons = screen.getAllByText(/Custom \d+/)
      expect(customButtons).toHaveLength(5)

      fireEvent.click(customButtons[0])
      expect(customAction).toHaveBeenCalledWith(mockData[0])
    })

    it('should show export button when onExport is provided', () => {
      const onExport = jest.fn()
      render(<DataTable {...defaultProps} onExport={onExport} />)

      const exportButton = screen.getByText('Export')
      expect(exportButton).toBeInTheDocument()
      
      fireEvent.click(exportButton)
      expect(onExport).toHaveBeenCalledTimes(1)
    })
  })

  describe('Column Features', () => {
    it('should apply column width when specified', () => {
      const columns: Column<TestData>[] = [
        { key: 'id', header: 'ID', width: '100px' },
        { key: 'name', header: 'Name', width: '200px' },
      ]

      const { container } = render(<DataTable {...defaultProps} columns={columns} />)

      const headers = container.querySelectorAll('th')
      expect(headers[0]).toHaveStyle({ width: '100px' })
      expect(headers[1]).toHaveStyle({ width: '200px' })
    })

    it('should handle missing nested values gracefully', () => {
      const dataWithMissingNested = [
        { id: 1, name: 'Test', email: 'test@test.com', age: 30, status: 'active' as const },
      ]

      render(<DataTable data={dataWithMissingNested} columns={defaultColumns} />)
      
      // Should not crash and should render empty cell
      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      render(<DataTable {...defaultProps} />)

      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()

      const headers = screen.getAllByRole('columnheader')
      expect(headers).toHaveLength(7) // 6 columns + actions

      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(6) // 1 header + 5 data rows
    })

    it('should have accessible search input', () => {
      render(<DataTable {...defaultProps} searchable={true} />)

      const searchInput = screen.getByPlaceholderText('Search...')
      expect(searchInput).toHaveAttribute('type', 'text')
    })

    it('should have accessible buttons', () => {
      render(<DataTable {...defaultProps} onAdd={() => {}} />)

      const addButton = screen.getByRole('button', { name: /add new/i })
      expect(addButton).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        age: 20 + (i % 50),
        status: i % 2 === 0 ? 'active' as const : 'inactive' as const,
        nested: { value: `Value ${i + 1}` },
      }))

      render(<DataTable data={largeData} columns={defaultColumns} pageSize={20} />)

      // Should only render visible rows
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(21) // 1 header + 20 data rows

      expect(screen.getByText('Showing 1 to 20 of 1000 results')).toBeInTheDocument()
    })
  })
})