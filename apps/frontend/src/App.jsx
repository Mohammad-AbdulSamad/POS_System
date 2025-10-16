import { useState } from 'react'
import Button from './components/common/Button';
import { Plus, Trash2, Edit,Mail, Lock, Search, Eye, EyeOff } from 'lucide-react';
import Input from './components/common/Input';



 
import './App.css'

function handleSave() {
  alert('Save button clicked!');
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  

  function handleLoading() {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }

  return (
    <>
  <Button variant="primary" onClick={handleSave}>Save</Button>
  
 
  <Button variant="success" icon={Plus} iconPosition="left">
    Add Product
  </Button>

  <Button variant="primary" loading={isLoading}>
    Submitting...
  </Button>

  <Button variant="danger" disabled>
    Delete
  </Button>

  <Button size="xs">Extra Small</Button>
  <Button size="sm">Small</Button>
  <Button size="md">Medium</Button>
  <Button size="lg">Large</Button>
  <Button size="xl">Extra Large</Button>

  <Button fullWidth variant="primary">
    Full Width Button
  </Button>
  

  <Button className="shadow-lg" variant="primary">
   Custom Styled
  </Button>

 
  <Input
    label="Email"
    type="email"
    placeholder="Enter your email"
    value={Mail}
    onChange={(e) => setEmail(e.target.value)}
  />
  
 
  <Input
    label="Username"
    // value={}
    onChange={(e) => setUsername(e.target.value)}
    error="Username is required"
    required
  />

  
  <Input
    label="Search Products"
    placeholder="Search..."
    leftIcon={Search}
  />

  <Input
    label="Password"
    type={showPassword ? 'text' : 'password'}
    leftIcon={Lock}
    rightIcon={showPassword ? Eye : EyeOff}
    onRightIconClick={() => setShowPassword(!showPassword)}
  />

  <Input
    label="Phone Number"
    type="tel"
    helperText="Format: +972-50-123-4567"
  />


  <Input
    label="Account ID"
    value="12345"
    disabled
  />

  // Read only
  <Input
    label="Generated Code"
    value="ABC-123-XYZ"
    readOnly
  />

  // Different sizes
  <Input size="sm" placeholder="Small" />
  <Input size="md" placeholder="Medium" />
  <Input size="lg" placeholder="Large" />

  // Number input with min/max
  <Input
    label="Quantity"
    type="number"
    min="0"
    max="100"
    step="1"
  />


  <Input
    label="SKU"
    maxLength={20}
    helperText="Maximum 20 characters"
  />
 
 
    </>
  )
}

export default App
