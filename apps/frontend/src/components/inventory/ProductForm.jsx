// src/components/inventory/ProductForm.jsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../common/Button';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Select from '../common/Select';
import FileUpload from '../common/FileUpload';
import Alert from '../common/Alert';
import { Save, X, Upload, Trash2 } from 'lucide-react';
import { VALIDATION } from '../../utils/constants';

/**
 * ProductForm Component
 * 
 * Form for creating/editing products
 * Uses react-hook-form for validation
 */

const ProductForm = ({
  initialData = null,
  categories = [],
  suppliers = [],
  taxRates = [],
  branches = [],
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const isEdit = !!initialData;
  const [imagePreview, setImagePreview] = useState(initialData?.imageUrl || null);
  const [imageFile, setImageFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    defaultValues: initialData || {
      name: '',
      sku: '',
      barcode: '',
      priceGross: '',
      cost: '',
      stock: 0,
      minStock: 0,
      reorderPoint: 10,
      unit: 'pcs',
      categoryId: '',
      supplierId: '',
      taxRateId: '',
      branchId: '',
      description: '',
      active: true,
    },
  });

  // Watch price and cost for profit calculation
  const priceGross = watch('priceGross');
  const cost = watch('cost');
  const profitMargin = priceGross && cost && priceGross > 0
    ? (((priceGross - cost) / priceGross) * 100).toFixed(2)
    : 0;

  // Handle image upload
  const handleImageChange = (files) => {
    if (files && files[0]) {
      const file = files[0];
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setValue('imageUrl', null);
  };

  // Handle form submission
  const onFormSubmit = (data) => {
    // Convert numeric fields
    const formData = {
      ...data,
      priceGross: parseFloat(data.priceGross),
      cost: parseFloat(data.cost),
      stock: parseInt(data.stock),
      minStock: parseInt(data.minStock || 0),
      reorderPoint: parseInt(data.reorderPoint || 10),
      active: data.active === 'true' || data.active === true,
    };

    // Add image file if present
    if (imageFile) {
      formData.imageFile = imageFile;
    }

    onSubmit(formData);
  };

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setImagePreview(initialData.imageUrl || null);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Alert for validation errors */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="danger">
          Please fix the validation errors below
        </Alert>
      )}

      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Name */}
          <div className="md:col-span-2">
            <Input
              label="Product Name"
              required
              {...register('name', {
                required: 'Product name is required',
                minLength: {
                  value: VALIDATION.MIN_PRODUCT_NAME_LENGTH,
                  message: `Name must be at least ${VALIDATION.MIN_PRODUCT_NAME_LENGTH} characters`,
                },
                maxLength: {
                  value: VALIDATION.MAX_PRODUCT_NAME_LENGTH,
                  message: `Name must not exceed ${VALIDATION.MAX_PRODUCT_NAME_LENGTH} characters`,
                },
              })}
              error={errors.name?.message}
              placeholder="Enter product name"
            />
          </div>

          {/* SKU */}
          <Input
            label="SKU"
            required
            {...register('sku', {
              required: 'SKU is required',
              pattern: {
                value: VALIDATION.SKU_REGEX,
                message: 'SKU must contain only uppercase letters, numbers, and hyphens',
              },
            })}
            error={errors.sku?.message}
            placeholder="e.g., PROD-001"
          />

          {/* Barcode */}
          <Input
            label="Barcode"
            {...register('barcode', {
              pattern: {
                value: VALIDATION.BARCODE_REGEX,
                message: 'Barcode must be 8-13 digits',
              },
            })}
            error={errors.barcode?.message}
            placeholder="e.g., 1234567890123"
          />

          {/* Category */}
          <Select
            label="Category"
            {...register('categoryId')}
            error={errors.categoryId?.message}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>

          {/* Supplier */}
          <Select
            label="Supplier"
            {...register('supplierId')}
            error={errors.supplierId?.message}
          >
            <option value="">Select supplier</option>
            {suppliers.map((sup) => (
              <option key={sup.id} value={sup.id}>
                {sup.name}
              </option>
            ))}
          </Select>

          {/* Branch */}
          <Select
            label="Branch"
            required
            {...register('branchId', {
              required: 'Branch is required',
            })}
            error={errors.branchId?.message}
          >
            <option value="">Select branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>

          {/* Tax Rate */}
          <Select
            label="Tax Rate"
            {...register('taxRateId')}
            error={errors.taxRateId?.message}
          >
            <option value="">Select tax rate</option>
            {taxRates.map((tax) => (
              <option key={tax.id} value={tax.id}>
                {tax.name} ({tax.rate}%)
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pricing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selling Price */}
          <Input
            label="Selling Price"
            type="number"
            step="0.01"
            required
            {...register('priceGross', {
              required: 'Selling price is required',
              min: {
                value: VALIDATION.MIN_PRICE,
                message: 'Price must be positive',
              },
              max: {
                value: VALIDATION.MAX_PRICE,
                message: `Price cannot exceed ${VALIDATION.MAX_PRICE}`,
              },
            })}
            error={errors.priceGross?.message}
            placeholder="0.00"
          />

          {/* Cost Price */}
          <Input
            label="Cost Price"
            type="number"
            step="0.01"
            required
            {...register('cost', {
              required: 'Cost price is required',
              min: {
                value: VALIDATION.MIN_PRICE,
                message: 'Cost must be positive',
              },
            })}
            error={errors.cost?.message}
            placeholder="0.00"
          />

          {/* Profit Margin (Calculated) */}
          <Input
            label="Profit Margin"
            value={profitMargin > 0 ? `${profitMargin}%` : 'N/A'}
            disabled
            className="bg-gray-50"
          />
        </div>
      </div>

      {/* Stock Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Stock Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Current Stock */}
          <Input
            label="Current Stock"
            type="number"
            required
            {...register('stock', {
              required: 'Stock quantity is required',
              min: {
                value: VALIDATION.MIN_STOCK,
                message: 'Stock cannot be negative',
              },
              max: {
                value: VALIDATION.MAX_STOCK,
                message: `Stock cannot exceed ${VALIDATION.MAX_STOCK}`,
              },
            })}
            error={errors.stock?.message}
            placeholder="0"
          />

          {/* Unit */}
          <Input
            label="Unit"
            {...register('unit')}
            error={errors.unit?.message}
            placeholder="e.g., pcs, kg, L"
          />

          {/* Minimum Stock */}
          <Input
            label="Min Stock"
            type="number"
            {...register('minStock', {
              min: {
                value: 0,
                message: 'Min stock cannot be negative',
              },
            })}
            error={errors.minStock?.message}
            placeholder="0"
          />

          {/* Reorder Point */}
          <Input
            label="Reorder Point"
            type="number"
            {...register('reorderPoint', {
              min: {
                value: 0,
                message: 'Reorder point cannot be negative',
              },
            })}
            error={errors.reorderPoint?.message}
            placeholder="10"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <TextArea
          label="Description"
          rows={4}
          {...register('description')}
          error={errors.description?.message}
          placeholder="Enter product description..."
        />
      </div>

      {/* Product Image */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Product Image
        </h3>

        {imagePreview ? (
          <div className="space-y-3">
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Product preview"
                className="h-48 w-48 object-cover rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-danger-600 text-white rounded-full p-1 hover:bg-danger-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <FileUpload
            accept="image/*"
            onChange={handleImageChange}
            maxSize={5 * 1024 * 1024} // 5MB
          >
            <div className="flex flex-col items-center gap-2 py-8">
              <Upload className="h-12 w-12 text-gray-400" />
              <div className="text-sm text-gray-600">
                Click to upload or drag and drop
              </div>
              <div className="text-xs text-gray-500">
                PNG, JPG, GIF up to 5MB
              </div>
            </div>
          </FileUpload>
        )}
      </div>

      {/* Status */}
      <div>
        <Select
          label="Status"
          {...register('active')}
          error={errors.active?.message}
        >
          <option value={true}>Active</option>
          <option value={false}>Inactive</option>
        </Select>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            icon={X}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          icon={Save}
          loading={loading}
          disabled={loading}
        >
          {isEdit ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;