// src/components/layout/PageHeader.jsx
import clsx from 'clsx';
import Badge from '../common/Badge';

/**
 * PageHeader Component
 * 
 * Reusable page header with title, description, badge, and action buttons.
 * Provides consistent page structure across the application.
 * 
 * @example
 * <PageHeader 
 *   title="Products"
 *   description="Manage your product inventory"
 *   actions={<Button variant="primary">Add Product</Button>}
 * />
 */

const PageHeader = ({ 
  title,
  description,
  badge,
  badgeVariant = 'primary',
  actions,
  backButton,
  tabs,
  className = '',
  titleClassName = '',
  descriptionClassName = '',
}) => {
  return (
    <div className={clsx('space-y-4', className)}>
      {/* Main header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left side - Title & Description */}
        <div className="flex-1 min-w-0">
          {/* Back button */}
          {backButton && (
            <div className="mb-2">
              {backButton}
            </div>
          )}

          {/* Title with optional badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className={clsx(
              'text-2xl sm:text-3xl font-bold text-gray-900 truncate',
              titleClassName
            )}>
              {title}
            </h1>
            {badge && (
              typeof badge === 'string' ? (
                <Badge variant={badgeVariant} size="md">
                  {badge}
                </Badge>
              ) : (
                badge
              )
            )}
          </div>

          {/* Description */}
          {description && (
            <p className={clsx(
              'mt-1 text-sm text-gray-600',
              descriptionClassName
            )}>
              {description}
            </p>
          )}
        </div>

        {/* Right side - Actions */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Tabs section (optional) */}
      {tabs && (
        <div className="border-b border-gray-200">
          {tabs}
        </div>
      )}
    </div>
  );
};

PageHeader.displayName = 'PageHeader';

export default PageHeader;

/**
 * Example Usage:
 * 
 * import PageHeader from '@/components/layout/PageHeader';
 * import Button from '@/components/common/Button';
 * import Badge from '@/components/common/Badge';
 * import { Plus, Upload, Download, Filter, ArrowLeft } from 'lucide-react';
 * 
 * // Basic usage
 * <PageHeader 
 *   title="Products"
 *   description="Manage your product inventory"
 * />
 * 
 * // With single action
 * <PageHeader 
 *   title="Products"
 *   description="Manage your product inventory"
 *   actions={
 *     <Button variant="primary" icon={Plus}>
 *       Add Product
 *     </Button>
 *   }
 * />
 * 
 * // With multiple actions
 * <PageHeader 
 *   title="Products"
 *   description="Manage your product inventory"
 *   actions={
 *     <>
 *       <Button variant="outline" icon={Download}>
 *         Export
 *       </Button>
 *       <Button variant="outline" icon={Upload}>
 *         Import
 *       </Button>
 *       <Button variant="primary" icon={Plus}>
 *         Add Product
 *       </Button>
 *     </>
 *   }
 * />
 * 
 * // With badge
 * <PageHeader 
 *   title="Products"
 *   description="Manage your product inventory"
 *   badge="125 items"
 *   badgeVariant="primary"
 * />
 * 
 * // With custom badge component
 * <PageHeader 
 *   title="Products"
 *   badge={<Badge variant="success">Active</Badge>}
 * />
 * 
 * // With back button
 * <PageHeader 
 *   title="Edit Product"
 *   description="Update product information"
 *   backButton={
 *     <Button 
 *       variant="ghost" 
 *       size="sm" 
 *       icon={ArrowLeft}
 *       onClick={() => window.history.back()}
 *     >
 *       Back
 *     </Button>
 *   }
 *   actions={
 *     <Button variant="primary">Save Changes</Button>
 *   }
 * />
 * 
 * // With tabs
 * import { Tabs, TabsList, TabsTrigger } from '@/components/common/Tabs';
 * 
 * <PageHeader 
 *   title="Products"
 *   description="Manage your product inventory"
 *   tabs={
 *     <TabsList>
 *       <TabsTrigger value="all">All Products</TabsTrigger>
 *       <TabsTrigger value="active">Active</TabsTrigger>
 *       <TabsTrigger value="inactive">Inactive</TabsTrigger>
 *       <TabsTrigger value="archived">Archived</TabsTrigger>
 *     </TabsList>
 *   }
 * />
 * 
 * // POS specific: Products page
 * <PageHeader 
 *   title="Products"
 *   description="Manage your product inventory and pricing"
 *   badge="248 items"
 *   actions={
 *     <>
 *       <Button variant="outline" icon={Filter}>
 *         Filters
 *       </Button>
 *       <Button variant="outline" icon={Download}>
 *         Export CSV
 *       </Button>
 *       <Button variant="primary" icon={Plus}>
 *         Add Product
 *       </Button>
 *     </>
 *   }
 * />
 * 
 * // POS specific: Sales page
 * <PageHeader 
 *   title="Sales"
 *   description="View and manage your sales transactions"
 *   badge={<Badge variant="success">$12,450 today</Badge>}
 *   actions={
 *     <>
 *       <Button variant="outline" icon={Download}>
 *         Export Report
 *       </Button>
 *       <Button variant="primary" icon={Plus}>
 *         New Sale
 *       </Button>
 *     </>
 *   }
 * />
 * 
 * // POS specific: Customers page
 * <PageHeader 
 *   title="Customers"
 *   description="Manage customer information and purchase history"
 *   badge="1,234 customers"
 *   actions={
 *     <>
 *       <Button variant="outline" icon={Upload}>
 *         Import Customers
 *       </Button>
 *       <Button variant="primary" icon={Plus}>
 *         Add Customer
 *       </Button>
 *     </>
 *   }
 * />
 * 
 * // POS specific: Reports page with tabs
 * <PageHeader 
 *   title="Reports"
 *   description="Analytics and business insights"
 *   tabs={
 *     <TabsList>
 *       <TabsTrigger value="sales">Sales</TabsTrigger>
 *       <TabsTrigger value="inventory">Inventory</TabsTrigger>
 *       <TabsTrigger value="customers">Customers</TabsTrigger>
 *       <TabsTrigger value="financial">Financial</TabsTrigger>
 *     </TabsList>
 *   }
 *   actions={
 *     <Button variant="outline" icon={Download}>
 *       Export Report
 *     </Button>
 *   }
 * />
 * 
 * // POS specific: Edit product page
 * <PageHeader 
 *   title="Edit Product"
 *   description="Product ID: #PRD-12345"
 *   backButton={
 *     <a href="/products" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
 *       <ArrowLeft className="h-4 w-4" />
 *       Back to Products
 *     </a>
 *   }
 *   actions={
 *     <>
 *       <Button variant="outline">Cancel</Button>
 *       <Button variant="danger">Delete</Button>
 *       <Button variant="primary">Save Changes</Button>
 *     </>
 *   }
 * />
 * 
 * // POS specific: Low stock alert
 * <PageHeader 
 *   title="Inventory"
 *   description="Monitor stock levels and manage inventory"
 *   badge={<Badge variant="warning">15 items low stock</Badge>}
 *   actions={
 *     <>
 *       <Button variant="outline">Reorder</Button>
 *       <Button variant="primary">Adjust Stock</Button>
 *     </>
 *   }
 * />
 * 
 * // POS specific: Settings page
 * <PageHeader 
 *   title="Settings"
 *   description="Configure your store and system preferences"
 *   tabs={
 *     <TabsList>
 *       <TabsTrigger value="general">General</TabsTrigger>
 *       <TabsTrigger value="payment">Payment</TabsTrigger>
 *       <TabsTrigger value="taxes">Taxes</TabsTrigger>
 *       <TabsTrigger value="users">Users</TabsTrigger>
 *     </TabsList>
 *   }
 * />
 * 
 * // Complete page example
 * function ProductsPage() {
 *   return (
 *     <MainLayout currentPath="/products">
 *       <div className="space-y-6">
//  *         {/* Breadcrumbs */
//  *         <Breadcrumbs 
//  *           items={[
//  *             { label: 'Products' }
//  *           ]}
//  *         />
//  *         
//  *         {/* Page Header */}
//  *         <PageHeader 
//  *           title="Products"
//  *           description="Manage your product inventory"
//  *           badge="248 items"
//  *           actions={
//  *             <div className="flex gap-2">
//  *               <Button variant="outline" icon={Filter}>
//  *                 Filters
//  *               </Button>
//  *               <Button variant="outline" icon={Download}>
//  *                 Export
//  *               </Button>
//  *               <Button variant="primary" icon={Plus}>
//  *                 Add Product
//  *               </Button>
//  *             </div>
//  *           }
//  *         />
//  *         
//  *         {/* Page Content */}
//  *         <div className="card">
//  *           {/* Product table or grid */}
//  *         </div>
//  *       </div>
//  *     </MainLayout>
//  *   );
//  * }
//  * 
//  * // With custom styling
//  * <PageHeader 
//  *   title="Dashboard"
//  *   className="bg-white p-6 rounded-lg shadow-sm"
//  *   titleClassName="text-primary-600"
//  *   descriptionClassName="text-gray-500"
//  * />
//  * 
//  * // Minimal version
//  * <PageHeader title="Dashboard" />
//  * 
//  * // With all features
//  * <PageHeader 
//  *   title="Products"
//  *   description="Manage your product inventory and pricing"
//  *   badge={<Badge variant="warning">15 low stock</Badge>}
//  *   backButton={
//  *     <Button variant="ghost" size="sm" icon={ArrowLeft}>
//  *       Back
//  *     </Button>
//  *   }
//  *   tabs={
//  *     <TabsList>
//  *       <TabsTrigger value="all">All</TabsTrigger>
//  *       <TabsTrigger value="active">Active</TabsTrigger>
//  *       <TabsTrigger value="inactive">Inactive</TabsTrigger>
//  *     </TabsList>
//  *   }
//  *   actions={
//  *     <>
//  *       <Button variant="outline" icon={Filter}>Filters</Button>
//  *       <Button variant="outline" icon={Download}>Export</Button>
//  *       <Button variant="primary" icon={Plus}>Add Product</Button>
//  *     </>
//  *   }
//  * />
//  * 
//  * // Responsive actions (stack on mobile)
//  * <PageHeader 
//  *   title="Products"
//  *   actions={
//  *     <div className="flex flex-col sm:flex-row gap-2">
//  *       <Button variant="outline" fullWidth className="sm:w-auto">
//  *         Export
//  *       </Button>
//  *       <Button variant="primary" fullWidth className="sm:w-auto">
//  *         Add Product
//  *       </Button>
//  *     </div>
//  *   }
//  * />
//  */