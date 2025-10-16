import { useState } from 'react';
import Button from './components/common/Button';
import Input from './components/common/Input';
import Modal from './components/common/Modal';
import TextArea from './components/common/TextArea';
import Select from './components/common/Select';
import Checkbox from './components/common/Checkbox';
import Radio, { RadioGroup } from './components/common/Radio';
import Card, { StatCard, CardBody, CardHeader, CardSection } from './components/common/Card';

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
  Package,
  Tag,
  DollarSign

} from 'lucide-react';

function App() {
  // Modal states
  const [basicModalOpen, setBasicModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [loadingModalOpen, setLoadingModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [shipping, setShipping] = useState('standard');
  
  
  const [category, setCategory] = useState('');


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

    </div>
  );
}

export default App;