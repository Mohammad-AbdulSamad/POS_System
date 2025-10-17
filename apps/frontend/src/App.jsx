import { useState } from 'react';
import Button from './components/common/Button';
import Input from './components/common/Input';
import Modal from './components/common/Modal';
import TextArea from './components/common/TextArea';
import Select from './components/common/Select';
import Checkbox from './components/common/Checkbox';
import Radio, { RadioGroup } from './components/common/Radio';
import Card, { StatCard, CardBody, CardHeader, CardSection } from './components/common/Card';
import Badge from './components/common/Badge';
import Dropdown from './components/common/Dropdown';
import { Package, User, Tag } from 'lucide-react';
import DatePicker from './components/common/DatePicker';
import SearchBar from './components/common/SearchBar';  
import FileUpload from './components/common/FileUpload';
import ConfirmDialog from './components/common/ConfirmDialog';
import Tooltip from './components/common/Tooltip';
import { ToastProvider, useToast } from './components/common/Toast';
import Alert from './components/common/Alert';
import Spinner from './components/common/Spinner';
import EmptyState from './components/common/EmptyState';

import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit, 
  Mail, 
  Lock, 
  Search, 
  Eye, 
  EyeOff,
  ShoppingCart,
  
 
  DollarSign,
  CheckCircle, 
  
  XCircle, 
  Clock,
 PackageOpen,
  TrendingUp 

} from 'lucide-react';

function App() {

  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSuccessToast = () => {
    toast.success('Operation successful!');
  };

// Multiple files
  const [images, setImages] = useState([]);
// Basic single file upload
  const [file, setFile] = useState(null);
 
  const [query, setQuery] = useState('');

  const [appointmentDate, setAppointmentDate] = useState('');
  // Modal states
  const [basicModalOpen, setBasicModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [loadingModalOpen, setLoadingModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [shipping, setShipping] = useState('standard');
  const [selectedPayment, setSelectedPayment] = useState('');

  const [role, setRole] = useState('');

  
  // const [category, setCategory] = useState('');


    // Basic usage
  //  // With icons
  const paymentOptions = [
    { value: 'cash', label: 'Cash', icon: Tag },
    { value: 'credit', label: 'Credit Card', icon: User },
    { value: 'online', label: 'Online', icon: Package },
  ];
const [category, setCategory] = useState(null);
  const categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'groceries', label: 'Groceries' },
    { value: 'clothing', label: 'Clothing' },
  ];


  // Form states
  const [formData, setFormData] = useState({
    productName: '',
    price: '',
    sku: '',
    description: '',
    email: '',
    password: '',
    notes: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
               const [accepted, setAccepted] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [size, setSize] = useState('medium');


  // Handlers
  const handleSave = () => {
    alert('Product saved successfully!');
    setFormModalOpen(false);
  };

  const handleDelete = () => {
    alert('Product deleted!');
    setDeleteModalOpen(false);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    // Simple validation
    const newErrors = {};
    if (!formData.productName) newErrors.productName = 'Product name is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (!formData.description) newErrors.description = 'Description is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      handleSave();
    }
  };

  const simulateLoading = () => {
    setLoadingModalOpen(true);
    setTimeout(() => {
      setLoadingModalOpen(false);
      alert('Processing complete!');
    }, 3000);
  };

  return (
    
    <div className="min-h-screen bg-gray-50 p-8">
       
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            POS Component Library
          </h1>
          <p className="text-gray-600">
            Testing Button, Input, TextArea, and Modal Components
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Card hoverable>
      <CardHeader title="Product 1" />
      <CardBody>Content</CardBody>
    </Card>
    <Card hoverable>
      <CardHeader title="Product 2" />
      <CardBody>Content</CardBody>
    </Card>
  </div>

        {/* Buttons Section */}
        <section className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Buttons</h2>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">

              <EmptyState
 icon={PackageOpen}
    title="No products available"
    description="Start by adding your first product to the inventory"
  />

              <Tooltip content="This is a helpful tooltip">
   <Button onClick={handleSuccessToast}>Hover me</Button>
  </Tooltip>
  
  // Different positions
  <Tooltip content="Top tooltip" position="bottom">
    <Button>Top</Button>
  </Tooltip>

  
 <Button onClick={() => setIsOpen(true)}>Delete</Button>
  
  <ConfirmDialog
    isOpen={isOpen}
   onClose={() => setIsOpen(false)}
   onConfirm={() => {
     console.log('Confirmed!');
     // Perform delete action
   }}
   title="Delete Product"
   description="Are you sure you want to delete this product? This action cannot be undone."
   confirmText="Delete"
   variant="danger"
   icon={Trash2}
  />
 

<Alert variant="success">
   Your changes have been saved successfully.
  </Alert>

<Alert variant="danger">
   An error occurred. Please try again.
</Alert>

 <Alert variant="warning">
   This action cannot be undone.
</Alert>

<Alert variant="info">
   New updates are available.
</Alert>

 // With title
 <Alert variant="success" title="Success!">
   Your product has been added to the inventory.
 </Alert>

  <FileUpload
    label="Upload Product Image"
    accept="image/*"
    onChange={(files) => setFile(files[0])}
/>
  
  
  <FileUpload
    label="Upload Gallery Images"
    multiple
    accept="image/*"
    maxFiles={5}
    onChange={(files) => setImages(files)}
  />
 

              <Checkbox
                label="I accept the terms and conditions"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />

            
              <Checkbox
                label="Send me promotional emails"
                description="Receive updates about new products and special offers"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
              />

              
              <Checkbox
                label="I agree to the privacy policy"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                error="You must accept the privacy policy"
                required
              />


              <Button variant="primary" onClick={() => setBasicModalOpen(true)}>
                Primary Button
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success" icon={Plus}>Add Product</Button>
              <Button variant="danger" icon={Trash2}>Delete</Button>
              <Button variant="outline">Outline</Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>

            {/* Badges Showcase */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">Active</Badge>
              <Badge variant="warning">Pending</Badge>
              <Badge variant="danger">Out of Stock</Badge>

              {/* With icons */}
              <Badge variant="success" icon={CheckCircle}>
                Completed
              </Badge>

              <Badge variant="warning" icon={AlertTriangle}>
                Low Stock
              </Badge>

              <Badge variant="danger" icon={XCircle}>
                Failed
              </Badge>

            </div>

            <div className="flex flex-wrap gap-3">
              <Button loading>Loading...</Button>
              <Button disabled>Disabled</Button>
              <Button icon={Edit} iconPosition="left">Edit</Button>
              <Button icon={Trash2} iconPosition="right">Delete</Button>
            </div>
          </div>
        </section>

        {/* Inputs Section */}
        <section className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Inputs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          

          <RadioGroup
            label="Select Payment Method"
            name="payment"
            value={paymentMethod}
            onChange={setPaymentMethod}
            options={[
              {
                value: 'cash',
                label: 'Cash',
                description: 'Pay with physical money'
     },
      {
        value: 'card',
        label: 'Credit/Debit Card',
        description: 'Pay with card'
      },
      {
        value: 'mobile',
        label: 'Mobile Payment',
        description: 'Pay with mobile app'
      },
    ]}
  />

 

  <RadioGroup
    label="Product Size"
    name="size"
    value={size}
    onChange={setSize}
    orientation="horizontal"
    options={[
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ]}
  />


  <RadioGroup
    label="Shipping Method"
    value={shipping}
    onChange={setShipping}
    error="Please select a shipping method"
    required
    options={[
      { value: 'standard', label: 'Standard Delivery' },
      { value: 'express', label: 'Express Delivery' },
    ]}
  />



            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              leftIcon={Mail}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              leftIcon={Lock}
              rightIcon={showPassword ? Eye : EyeOff}
              onRightIconClick={() => setShowPassword(!showPassword)}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <Input
              label="Search Products"
              placeholder="Search..."
              leftIcon={Search}
              helperText="Start typing to search"
            />

            <Input
              label="Product Price"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              error={errors.price}
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />

            <Input
              label="Quantity"
              type="number"
              placeholder="0"
              min="0"
              max="1000"
              size="lg"
            />

            <Input
              label="Disabled Input"
              value="Cannot edit this"
              disabled
            />
          </div>
        </section>

        {/* TextArea Section */}
        <section className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">TextAreas</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <TextArea
              label="Product Description"
              placeholder="Enter detailed product description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={500}
              showCharCount
              error={errors.description}
              helperText="Provide a comprehensive description of your product"
            />

            <TextArea
              label="Auto-Resize Notes"
              placeholder="Type here and watch it grow..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              autoResize
              helperText="This textarea automatically resizes as you type"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextArea
                label="Small TextArea"
                size="sm"
                rows={3}
                placeholder="Small size..."
              />

              <TextArea
                label="Fixed Size (No Resize)"
                rows={3}
                resize="none"
                placeholder="You cannot resize this..."
              />
            </div>
          </div>
        </section>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard
            title="Total Sales"
            value="₪12,345"
            icon={DollarSign}
            trend="up"
            trendLabel="+12% from last month"
            color="success"
          />
        </div>

        {/* Modal Triggers Section */}
        <section className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Modals</h2>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="primary" 
              onClick={() => setBasicModalOpen(true)}
              icon={Package}
            >
              Basic Modal
            </Button>
            
            <Button 
              variant="danger" 
              onClick={() => setDeleteModalOpen(true)}
              icon={Trash2}
            >
              Delete Modal
            </Button>
            
            <Button 
              variant="success" 
              onClick={() => setFormModalOpen(true)}
              icon={Plus}
            >
              Form Modal
            </Button>

            <Button 
              variant="secondary" 
              onClick={simulateLoading}
              icon={ShoppingCart}
            >
              Loading Modal
            </Button>

            * // Basic usage
 
  
  <SearchBar
    placeholder="Search products..."
    value={query}
    onChange={(e) => setQuery(e.target.value)}
  />
            // Min/Max dates
            <DatePicker
              label="Appointment Date"
              min="2025-09-01"
              max="2029-12-31"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
            />

 <Select
    label="Payment Method"
    leftIcon={Tag}
    options={[
      { value: 'cash', label: 'Cash' },
      { value: 'credit_card', label: 'Credit Card' },
      { value: 'debit_card', label: 'Debit Card' },
      { value: 'mobile_payment', label: 'Mobile Payment' },
      { value: 'check', label: 'Check' }
    ]}
    value={paymentMethod}
    onChange={(e) => setPaymentMethod(e.target.value)}
    required
  />

          </div>
        </section>

        {/* Complete Form Example */}
        <section className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Complete Form Example
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Product Name"
                placeholder="Enter product name"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                error={errors.productName}
                required
              />

              <Input
                label="SKU"
                placeholder="Enter SKU code"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                maxLength={20}
              />
            </div>

            <TextArea
              label="Description"
              placeholder="Describe your product..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={300}
              showCharCount
              error={errors.description}
              required
            />

            <div className="flex gap-3">
              <Button type="submit" variant="primary">
                Submit Form
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setFormData({
                    productName: '',
                    price: '',
                    sku: '',
                    description: '',
                    email: '',
                    password: '',
                    notes: ''
                  });
                  setErrors({});
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </section>

      </div>

      {/* Modals */}
      
      {/* Basic Modal */}
      <Modal
        isOpen={basicModalOpen}
        onClose={() => setBasicModalOpen(false)}
        title="Product Information"
        size="md"
      >
        <div className="space-y-3">
          <p className="text-gray-700">
            This is a basic modal dialog. You can display any content here.
          </p>
          <p className="text-gray-600 text-sm">
            Click outside, press ESC, or click the X button to close.
          </p>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Product"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" icon={Trash2} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-danger-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-700">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>

      {/* Form Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title="Add New Product"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Save Product
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input
            label="Product Name"
            placeholder="Enter product name"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            error={errors.productName}
            required
          />
          
          <Input
            label="Price"
            type="number"
            placeholder="0.00"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            error={errors.price}
            required
          />
          
          <Input
            label="SKU"
            placeholder="Enter SKU"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          />

          <TextArea
            label="Description"
            placeholder="Product description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={errors.description}
            maxLength={200}
            showCharCount
            required
          />
        </form>
      </Modal>

      {/* Loading Modal */}
      <Modal
        isOpen={loadingModalOpen}
        onClose={() => {}}
        title="Processing Transaction..."
        showCloseButton={false}
        closeOnOverlayClick={false}
        closeOnEsc={false}
        size="sm"
      >
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500" />
          <p className="text-gray-600">Please wait while we process your request...</p>
        </div>
      </Modal>
        

 
  
  <Dropdown
    label="Category"
    options={categories}
    value={category}
    onChange={setCategory}
  />

 
  <Dropdown
    label="Payment Method"
    options={paymentOptions}
    value={selectedPayment}
    onChange={setSelectedPayment}
    icon={Tag}
  />

  {/* // Searchable
  <Dropdown
    label="Search Product"
    options={productOptions}
    searchable
    value={product}
    onChange={setProduct}
/>
  
  // Clearable
  <Dropdown
    label="Select User"
    options={users}
    value={selectedUser}
    clearable
    onChange={setSelectedUser}
  /> */}

  {/* // Variants and sizes
  <Dropdown variant="filled" size="sm" label="Small" options={categories} />
  <Dropdown variant="outline" size="md" label="Medium" options={categories} />
  <Dropdown variant="ghost" size="lg" label="Large" options={categories} />

  // Disabled
  <Dropdown label="Disabled" disabled options={categories} />
 */}
  // POS specific: Filter by product category
  {/* <Dropdown
    label="Filter by Category"
    options={[
      { value: 'all', label: 'All Products' },
      { value: 'low', label: 'Low Stock' },
      { value: 'out', label: 'Out of Stock' },
    ]}
    value={filter}
    onChange={setFilter}
  /> */}

  // POS specific: Select employee role
  <Dropdown
    label="User Role"
    options={[
      { value: 'admin', label: 'Admin' },
      { value: 'manager', label: 'Manager' },
      { value: 'cashier', label: 'Cashier' },
    ]}
    value={role}
    onChange={setRole}
/>
  
  // Inside Card
  <Card>
    <CardHeader title="Filter Products" />
    <CardBody>
      <Dropdown
        label="Category"
        options={categories}
        value={category}
        onChange={setCategory}
        searchable
      />
    </CardBody>
  </Card>
 

    </div>
   
  );
}

export default App;

// src/App.jsx - Testing Table with Pagination
// import { useState, useMemo } from 'react';
// import Table from './components/common/Table';
// import Pagination from './components/common/Pagination';
// import Button from './components/common/Button';
// import Input from './components/common/Input';
// import Badge from './components/common/Badge';
// import { Search, Edit, Trash2, Eye } from 'lucide-react';

// // Mock data generator
// const generateMockProducts = (count = 150) => {
//   const categories = ['Electronics', 'Groceries', 'Clothing', 'Home & Garden', 'Sports'];
//   const statuses = [true, false];
  
//   return Array.from({ length: count }, (_, index) => ({
//     id: `prod-${index + 1}`,
//     name: `Product ${index + 1}`,
//     sku: `SKU${String(index + 1).padStart(5, '0')}`,
//     category: categories[Math.floor(Math.random() * categories.length)],
//     price: parseFloat((Math.random() * 500 + 10).toFixed(2)),
//     cost: parseFloat((Math.random() * 300 + 5).toFixed(2)),
//     stock: Math.floor(Math.random() * 100),
//     active: statuses[Math.floor(Math.random() * statuses.length)],
//     createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
//   }));
// };

// function App() {
//   // Mock data
//   const allProducts = useMemo(() => generateMockProducts(150), []);

//   // Pagination state
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(20);

//   // Sorting state
//   const [sortColumn, setSortColumn] = useState('name');
//   const [sortDirection, setSortDirection] = useState('asc');

//   // Selection state
//   const [selectedRows, setSelectedRows] = useState([]);

//   // Search/Filter state
//   const [searchQuery, setSearchQuery] = useState('');

//   // Filter and sort data
//   const filteredProducts = useMemo(() => {
//     let filtered = allProducts;

//     // Apply search filter
//     if (searchQuery) {
//       filtered = filtered.filter(
//         (product) =>
//           product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           product.category.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     // Apply sorting
//     filtered = [...filtered].sort((a, b) => {
//       const aValue = a[sortColumn];
//       const bValue = b[sortColumn];

//       if (typeof aValue === 'string') {
//         return sortDirection === 'asc'
//           ? aValue.localeCompare(bValue)
//           : bValue.localeCompare(aValue);
//       }

//       return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
//     });

//     return filtered;
//   }, [allProducts, searchQuery, sortColumn, sortDirection]);

//   // Calculate pagination
//   const totalItems = filteredProducts.length;
//   const totalPages = Math.ceil(totalItems / pageSize);
//   const startIndex = (currentPage - 1) * pageSize;
//   const endIndex = startIndex + pageSize;
//   const currentPageData = filteredProducts.slice(startIndex, endIndex);

//   // Handlers
//   const handleSort = (column, direction) => {
//     setSortColumn(column);
//     setSortDirection(direction);
//   };

//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//     setSelectedRows([]); // Clear selection on page change
//   };

//   const handlePageSizeChange = (newSize) => {
//     setPageSize(newSize);
//     setCurrentPage(1); // Reset to first page
//     setSelectedRows([]); // Clear selection
//   };

//   const handleSelectRow = (row) => {
//     setSelectedRows((prev) =>
//       prev.some((r) => r.id === row.id)
//         ? prev.filter((r) => r.id !== row.id)
//         : [...prev, row]
//     );
//   };

//   const handleSelectAll = (checked) => {
//     setSelectedRows(checked ? currentPageData : []);
//   };

//   const handleSearch = (e) => {
//     setSearchQuery(e.target.value);
//     setCurrentPage(1); // Reset to first page on search
//   };

//   const handleDeleteSelected = () => {
//     alert(`Delete ${selectedRows.length} selected items`);
//     setSelectedRows([]);
//   };

//   const handleRowClick = (row) => {
//     console.log('Row clicked:', row);
//     // Navigate to detail page or show modal
//   };

//   // Table columns definition
//   const columns = [
//     {
//       key: 'sku',
//       header: 'SKU',
//       sortable: true,
//       width: '120px',
//     },
//     {
//       key: 'name',
//       header: 'Product Name',
//       sortable: true,
//       render: (value, row) => (
//         <div className="flex flex-col">
//           <span className="font-medium text-gray-900">{value}</span>
//           <span className="text-xs text-gray-500">{row.category}</span>
//         </div>
//       ),
//     },
//     {
//       key: 'price',
//       header: 'Price',
//       sortable: true,
//       align: 'right',
//       width: '100px',
//       render: (value) => (
//         <span className="font-semibold text-gray-900">₪{value.toFixed(2)}</span>
//       ),
//     },
//     {
//       key: 'cost',
//       header: 'Cost',
//       sortable: true,
//       align: 'right',
//       width: '100px',
//       render: (value) => (
//         <span className="text-gray-600">₪{value.toFixed(2)}</span>
//       ),
//     },
//     {
//       key: 'stock',
//       header: 'Stock',
//       sortable: true,
//       align: 'center',
//       width: '100px',
//       render: (value) => {
//         let variant = 'success';
//         if (value === 0) variant = 'danger';
//         else if (value < 20) variant = 'warning';

//         return (
//           <span
//             className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//               variant === 'success'
//                 ? 'bg-success-100 text-success-800'
//                 : variant === 'warning'
//                 ? 'bg-warning-100 text-warning-800'
//                 : 'bg-danger-100 text-danger-800'
//             }`}
//           >
//             {value}
//           </span>
//         );
//       },
//     },
//     {
//       key: 'active',
//       header: 'Status',
//       sortable: true,
//       align: 'center',
//       width: '100px',
//       render: (value) => (
//         <span
//           className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//             value
//               ? 'bg-success-100 text-success-800'
//               : 'bg-gray-100 text-gray-800'
//           }`}
//         >
//           {value ? 'Active' : 'Inactive'}
//         </span>
//       ),
//     },
//     {
//       key: 'actions',
//       header: 'Actions',
//       align: 'center',
//       width: '150px',
//       render: (_, row) => (
//         <div className="flex gap-2 justify-center">
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               alert(`View ${row.name}`);
//             }}
//             className="text-primary-600 hover:text-primary-800 p-1"
//             title="View"
//           >
//             <Eye className="h-4 w-4" />
//           </button>
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               alert(`Edit ${row.name}`);
//             }}
//             className="text-gray-600 hover:text-gray-800 p-1"
//             title="Edit"
//           >
//             <Edit className="h-4 w-4" />
//           </button>
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               alert(`Delete ${row.name}`);
//             }}
//             className="text-danger-600 hover:text-danger-800 p-1"
//             title="Delete"
//           >
//             <Trash2 className="h-4 w-4" />
//           </button>
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-6">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">
//             Products Inventory
//           </h1>
//           <p className="text-gray-600">
//             Manage your product catalog with sorting, filtering, and pagination
//           </p>
//         </div>

//         {/* Toolbar */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
//           <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
//             {/* Search */}
//             <div className="w-full sm:w-96">
//               <Input
//                 placeholder="Search products..."
//                 leftIcon={Search}
//                 value={searchQuery}
//                 onChange={handleSearch}
//               />
//             </div>

//             {/* Actions */}
//             <div className="flex gap-2">
//               {selectedRows.length > 0 && (
//                 <Button
//                   variant="danger"
//                   size="sm"
//                   icon={Trash2}
//                   onClick={handleDeleteSelected}
//                 >
//                   Delete ({selectedRows.length})
//                 </Button>
//               )}
//               <Button variant="primary" size="sm">
//                 Add Product
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* Table Card */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//           <Table
//             columns={columns}
//             data={currentPageData}
//             sortable
//             sortColumn={sortColumn}
//             sortDirection={sortDirection}
//             onSort={handleSort}
//             selectable
//             selectedRows={selectedRows}
//             onSelectRow={handleSelectRow}
//             onSelectAll={handleSelectAll}
//             onRowClick={handleRowClick}
//             hover
//             emptyMessage={
//               searchQuery
//                 ? `No products found matching "${searchQuery}"`
//                 : 'No products available'
//             }
//           />

//           {/* Pagination */}
//           <div className="px-6 py-4 border-t border-gray-200">
//             <Pagination
//               currentPage={currentPage}
//               totalPages={totalPages}
//               totalItems={totalItems}
//               pageSize={pageSize}
//               onPageChange={handlePageChange}
//               onPageSizeChange={handlePageSizeChange}
//             />
//           </div>
//         </div>

//         {/* Stats Footer */}
//         <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
//             <p className="text-sm text-gray-600">Total Products</p>
//             <p className="text-2xl font-bold text-gray-900">{allProducts.length}</p>
//           </div>
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
//             <p className="text-sm text-gray-600">Filtered Results</p>
//             <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
//           </div>
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
//             <p className="text-sm text-gray-600">Selected Items</p>
//             <p className="text-2xl font-bold text-gray-900">{selectedRows.length}</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;


// // For Tabs Component Testing
//  import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/common/Tabs';
//   import { Package, ShoppingCart, Users, BarChart, Settings } from 'lucide-react';
//   import Badge from './components/common/Badge';
  
//   export function App() {
//   return (
//   // Basic usage (line variant - default)
//   // <div className="min-h-screen min-w-screen bg-gray-50 p-8">
//   // <Tabs defaultValue="products">
//   //   <TabsList>
//   //     <TabsTrigger value="products">Products</TabsTrigger>
//   //     <TabsTrigger value="sales">Sales</TabsTrigger>
//   //     <TabsTrigger value="customers">Customers</TabsTrigger>
//   //   </TabsList>

//   //   <TabsContent value="products">
//   //     <div className="p-4">
//   //       <h3 className="text-lg font-semibold mb-2">Products Overview</h3>
//   //       <p>Manage your product inventory here.</p>
//   //     </div>
//   //   </TabsContent>

//   //   <TabsContent value="sales">
//   //     <div className="p-4">
//   //       <h3 className="text-lg font-semibold mb-2">Sales Dashboard</h3>
//   //       <p>View your sales analytics and reports.</p>
//   //     </div>
//   //   </TabsContent>

//   //   <TabsContent value="customers">
//   //     <div className="p-4">
//   //       <h3 className="text-lg font-semibold mb-2">Customer Management</h3>
//   //       <p>Manage your customer database.</p>
//   //     </div>
//   //   </TabsContent>
//   // </Tabs>
//   //</div>
// <div className="min-h-screen min-w-screen bg-gray-50 p-8">
//      <Tabs defaultValue="all">
//    <TabsList>
//       <TabsTrigger 
//         value="all" 
//         badge={<Badge variant="gray" size="xs">24</Badge>}
//       >
//        All Orders
//       </TabsTrigger>
//       <TabsTrigger 
//         value="pending" 
//         badge={<Badge variant="warning" size="xs">5</Badge>}
//       >
//         Pending
//       </TabsTrigger>
//       <TabsTrigger 
//         value="completed" 
//         badge={<Badge variant="success" size="xs">18</Badge>}
//       >
//         Completed
//       </TabsTrigger>
//       <TabsTrigger 
//         value="cancelled" 
//         badge={<Badge variant="danger" size="xs">1</Badge>}
//       >
//         Cancelled
//       </TabsTrigger>
//     </TabsList>

//     <TabsContent value="all">All orders list...</TabsContent>
//     <TabsContent value="pending">Pending orders...</TabsContent>
//     <TabsContent value="completed">Completed orders...</TabsContent>
//     <TabsContent value="cancelled">Cancelled orders...</TabsContent>
//   </Tabs>

// </div>
//   );
// }

//   export default App;

//   // With icons
//  * <Tabs defaultValue="products">
//  *   <TabsList>
//  *     <TabsTrigger value="products" icon={Package}>
//  *       Products
//  *     </TabsTrigger>
//  *     <TabsTrigger value="sales" icon={ShoppingCart}>
//  *       Sales
//  *     </TabsTrigger>
//  *     <TabsTrigger value="customers" icon={Users}>
//  *       Customers
//  *     </TabsTrigger>
//  *     <TabsTrigger value="analytics" icon={BarChart}>
//  *       Analytics
//  *     </TabsTrigger>
//  *   </TabsList>
//  *   
//  *   <TabsContent value="products">Products content...</TabsContent>
//  *   <TabsContent value="sales">Sales content...</TabsContent>
//  *   <TabsContent value="customers">Customers content...</TabsContent>
//  *   <TabsContent value="analytics">Analytics content...</TabsContent>
//  * </Tabs>
//  * 
//  * // With badges (notification counts)
//  * <Tabs defaultValue="all">
//  *   <TabsList>
//  *     <TabsTrigger 
//  *       value="all" 
//  *       badge={<Badge variant="gray" size="xs">24</Badge>}
//  *     >
//  *       All Orders
//  *     </TabsTrigger>
//  *     <TabsTrigger 
//  *       value="pending" 
//  *       badge={<Badge variant="warning" size="xs">5</Badge>}
//  *     >
//  *       Pending
//  *     </TabsTrigger>
//  *     <TabsTrigger 
//  *       value="completed" 
//  *       badge={<Badge variant="success" size="xs">18</Badge>}
//  *     >
//  *       Completed
//  *     </TabsTrigger>
//  *     <TabsTrigger 
//  *       value="cancelled" 
//  *       badge={<Badge variant="danger" size="xs">1</Badge>}
//  *     >
//  *       Cancelled
//  *     </TabsTrigger>
//  *   </TabsList>
//  *   
//  *   <TabsContent value="all">All orders list...</TabsContent>
//  *   <TabsContent value="pending">Pending orders...</TabsContent>
//  *   <TabsContent value="completed">Completed orders...</TabsContent>
//  *   <TabsContent value="cancelled">Cancelled orders...</TabsContent>
//  * </Tabs>
//  * 
//  * // Enclosed variant (button-style tabs)
//  * <Tabs defaultValue="overview">
//  *   <TabsList variant="enclosed">
//  *     <TabsTrigger value="overview">Overview</TabsTrigger>
//  *     <TabsTrigger value="details">Details</TabsTrigger>
//  *     <TabsTrigger value="history">History</TabsTrigger>
//  *   </TabsList>
//  *   
//  *   <TabsContent value="overview">Overview content...</TabsContent>
//  *   <TabsContent value="details">Details content...</TabsContent>
//  *   <TabsContent value="history">History content...</TabsContent>
//  * </Tabs>
//  * 
//  * // Pills variant (rounded pill-style tabs)
//  * <Tabs defaultValue="active">
//  *   <TabsList variant="pills">
//  *     <TabsTrigger value="active" icon={Package}>Active</TabsTrigger>
//  *     <TabsTrigger value="inactive">Inactive</TabsTrigger>
//  *     <TabsTrigger value="archived">Archived</TabsTrigger>
//  *   </TabsList>
//  *   
//  *   <TabsContent value="active">Active products...</TabsContent>
//  *   <TabsContent value="inactive">Inactive products...</TabsContent>
//  *   <TabsContent value="archived">Archived products...</TabsContent>
//  * </Tabs>
//  * 
//  * // Controlled tabs
//  * const [activeTab, setActiveTab] = useState('products');
//  * 
//  * <Tabs value={activeTab} onValueChange={setActiveTab}>
//  *   <TabsList>
//  *     <TabsTrigger value="products">Products</TabsTrigger>
//  *     <TabsTrigger value="inventory">Inventory</TabsTrigger>
//  *   </TabsList>
//  *   
//  *   <TabsContent value="products">Products content...</TabsContent>
//  *   <TabsContent value="inventory">Inventory content...</TabsContent>
//  * </Tabs>
//  * 
//  * <Button onClick={() => setActiveTab('inventory')}>
//  *   Go to Inventory Tab
//  * </Button>
//  * 
//  * // With disabled tab
//  * <Tabs defaultValue="basic">
//  *   <TabsList>
//  *     <TabsTrigger value="basic">Basic Info</TabsTrigger>
//  *     <TabsTrigger value="advanced">Advanced</TabsTrigger>
//  *     <TabsTrigger value="settings" disabled>
//  *       Settings (Coming Soon)
//  *     </TabsTrigger>
//  *   </TabsList>
//  *   
//  *   <TabsContent value="basic">Basic info...</TabsContent>
//  *   <TabsContent value="advanced">Advanced settings...</TabsContent>
//  * </Tabs>
//  * 
//  * // Full width tabs
//  * <Tabs defaultValue="tab1">
//  *   <TabsList fullWidth>
//  *     <TabsTrigger value="tab1" className="flex-1">Tab 1</TabsTrigger>
//  *     <TabsTrigger value="tab2" className="flex-1">Tab 2</TabsTrigger>
//  *     <TabsTrigger value="tab3" className="flex-1">Tab 3</TabsTrigger>
//  *   </TabsList>
//  *   
//  *   <TabsContent value="tab1">Content 1...</TabsContent>
//  *   <TabsContent value="tab2">Content 2...</TabsContent>
//  *   <TabsContent value="tab3">Content 3...</TabsContent>
//  * </Tabs>
//  * 
//  * // POS specific: Product management sections
//  * <Tabs defaultValue="inventory">
//  *   <TabsList>
//  *     <TabsTrigger value="inventory" icon={Package}>
//  *       Inventory
//  *     </TabsTrigger>
//  *     <TabsTrigger value="categories" icon={Tag}>
//  *       Categories
//  *     </TabsTrigger>
//  *     <TabsTrigger value="suppliers" icon={Truck}>
//  *       Suppliers
//  *     </TabsTrigger>
//  *     <TabsTrigger value="pricing" icon={DollarSign}>
//  *       Pricing
//  *     </TabsTrigger>
//  *   </TabsList>
//  *   
//  *   <TabsContent value="inventory">
//  *     {/* Product inventory table */
// //  *   </TabsContent>
// //  *   <TabsContent value="categories">
// //  *     {/* Category management */}
// //  *   </TabsContent>
// //  *   <TabsContent value="suppliers">
// //  *     {/* Supplier list */}
// //  *   </TabsContent>
// //  *   <TabsContent value="pricing">
// //  *     {/* Pricing rules */}
// //  *   </TabsContent>
// //  * </Tabs>
// //  * 
// //  * // POS specific: Transaction history filters
// //  * <Tabs defaultValue="today">
// //  *   <TabsList variant="pills">
// //  *     <TabsTrigger value="today">Today</TabsTrigger>
// //  *     <TabsTrigger value="week">This Week</TabsTrigger>
// //  *     <TabsTrigger value="month">This Month</TabsTrigger>
// //  *     <TabsTrigger value="year">This Year</TabsTrigger>
// //  *     <TabsTrigger value="all">All Time</TabsTrigger>
// //  *   </TabsList>
// //  *   
// //  *   <TabsContent value="today">
// //  *     {/* Today's transactions */}
// //  *   </TabsContent>
// //  *   <TabsContent value="week">
// //  *     {/* This week's transactions */}
// //  *   </TabsContent>
// //  *   {/* ... other contents */}
// //  * </Tabs>
// //  * 
// //  * // POS specific: Reports dashboard
// //  * <Tabs defaultValue="sales">
// //  *   <TabsList>
// //  *     <TabsTrigger value="sales" icon={TrendingUp}>
// //  *       Sales Report
// //  *     </TabsTrigger>
// //  *     <TabsTrigger value="inventory" icon={Package}>
// //  *       Inventory Report
// //  *     </TabsTrigger>
// //  *     <TabsTrigger value="customers" icon={Users}>
// //  *       Customer Report
// //  *     </TabsTrigger>
// //  *     <TabsTrigger value="financial" icon={DollarSign}>
// //  *       Financial Report
// //  *     </TabsTrigger>
// //  *   </TabsList>
// //  *   
// //  *   <TabsContent value="sales">
// //  *     {/* Sales charts and statistics */}
// //  *   </TabsContent>
// //  *   <TabsContent value="inventory">
// //  *     {/* Inventory analytics */}
// //  *   </TabsContent>
// //  *   <TabsContent value="customers">
// //  *     {/* Customer insights */}
// //  *   </TabsContent>
// //  *   <TabsContent value="financial">
// //  *     {/* Financial overview */}
// //  *   </TabsContent>
// //  * </Tabs>
// //  */