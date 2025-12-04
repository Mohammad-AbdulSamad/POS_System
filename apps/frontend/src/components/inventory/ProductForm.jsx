// src/components/inventory/ProductForm.jsx - WITH BRANCH LOGIC
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { useTaxRates } from '../../hooks/useTaxRates';
import Button from '../common/Button';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Select from '../common/Select';
import FileUpload from '../common/FileUpload';
import Alert from '../common/Alert';
import { Save, X, Upload, Trash2, Info } from 'lucide-react';
import {
  VALIDATION,
  validateRequired,
  validatePrice,
  validateNumber,
  validateSKU,
} from '../../utils/validators';

/**
 * ProductForm Component - WITH BRANCH LOGIC
 * 
 * Form for creating/editing products
 * - Admin/Manager can select any branch
 * - Cashier/Stock Manager locked to their branch
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
  const { user } = useAuth();
  
  const isEdit = !!initialData;
  const [imagePreview, setImagePreview] = useState(initialData?.imageUrl || null);
  const [imageFile, setImageFile] = useState(null);

  // ✅ Check if user can change branch
  const canChangeBranch = user && ['ADMIN', 'MANAGER'].includes(user.role);
  
  // ✅ Get default branch ID
  const defaultBranchId = initialData?.branchId || user?.branchId || '';

  const {
    register,
    handleSubmit,
    control,
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
      branchId: defaultBranchId,
      branchIds: [],
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
    console.log('📝 Form submit data:', data);
    
    const formData = {
      ...data,
      priceGross: parseFloat(data.priceGross),
      cost: parseFloat(data.cost),
      stock: parseInt(data.stock),
      minStock: parseInt(data.minStock || 0),
      reorderPoint: parseInt(data.reorderPoint || 10),
      active: data.active === 'true' || data.active === true,
      // ✅ Handle multiple branches or single branchId
      branchId: Array.isArray(data.branchIds) && data.branchIds.length > 0 
        ? data.branchIds[0]  // Take first for branchId field (if needed)
        : data.branchId || user?.branchId,
      branchIds: data.branchIds, // Store full array for backend
    };

    if (imageFile) {
      formData.imageFile = imageFile;
    }

    console.log('📤 Submitting formData:', formData);
    onSubmit(formData);
  };

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        branchIds: initialData.branchId ? [initialData.branchId] : [],
      });
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

      {/* ✅ Branch Assignment Info for Non-Admins */}
      {!canChangeBranch && user?.branch && (
        <Alert variant="info" icon={Info}>
          This product will be assigned to your branch: <strong>{user.branch.name}</strong>
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
                validate: (value) => {
                  const req = validateRequired(value, 'Product name');
                  if (req) return req;
                  if (String(value).trim().length < VALIDATION.MIN_PRODUCT_NAME_LENGTH)
                    return `Name must be at least ${VALIDATION.MIN_PRODUCT_NAME_LENGTH} characters`;
                  if (String(value).trim().length > VALIDATION.MAX_PRODUCT_NAME_LENGTH)
                    return `Name must not exceed ${VALIDATION.MAX_PRODUCT_NAME_LENGTH} characters`;
                  return true;
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
              validate: (value) => {
                const req = validateRequired(value, 'SKU');
                if (req) return req;
                const skuErr = validateSKU(value);
                if (skuErr) return skuErr;
                return true;
              },
            })}
            error={errors.sku?.message}
            placeholder="e.g., PROD-001"
          />

          {/* Barcode */}
          <Input
            label="Barcode"
            {...register('barcode', {
              validate: (value) => {
                if (!value || String(value).trim() === '') return true;
                if (!VALIDATION.BARCODE_REGEX.test(String(value).trim())) return 'Barcode must be 8-13 digits';
                return true;
              },
            })}
            error={errors.barcode?.message}
            placeholder="e.g., 1234567890123"
          />

          {/* ✅ Branches - MULTIPLE SELECT with Controller */}
          {canChangeBranch ? (
            <div className="md:col-span-2">
              <Controller
                name="branchIds"
                control={control}
                defaultValue={[]}
                rules={{
                  validate: (value) => {
                    if (!Array.isArray(value) || value.length === 0) {
                      return 'Select at least one branch';
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <Select
                    label="Branches"
                    multiple
                    required
                    name={field.name}
                    value={field.value}
                    onChange={(e) => {
                      console.log('🟡 Branch select onChange:', e.target.value);
                      field.onChange(e.target.value);
                    }}
                    error={errors.branchIds?.message}
                    options={branches.map(b => ({ value: String(b.id), label: b.name }))}
                    placeholder="Select branches..."
                  />
                )}
              />
            </div>
          ) : (
            <Input
              label="Branch"
              value={user?.branch?.name || 'No Branch'}
              disabled
              className="bg-gray-50"
            />
          )}

          {/* Category */}
          <Select
            label="Category"
            {...register('categoryId')}
            error={errors.categoryId?.message}
            options={[
              { value: '', label: 'Select category' }, 
              ...categories.map(c => ({ value: String(c.id), label: c.name }))
            ]}
          />

          {/* Supplier */}
          <Select
            label="Supplier"
            required
            {...register('supplierId', {
              validate: (value) => validateRequired(value, 'Supplier') || true,
            })}
            error={errors.supplierId?.message}
            options={[
              { value: '', label: 'Select supplier' }, 
              ...suppliers.map(s => ({ value: String(s.id), label: s.name }))
            ]}
          />

          {/* Tax Rate */}
          <Select
            label="Tax Rate"
            required
            {...register('taxRateId', {
              validate: (value) => validateRequired(value, 'Tax Rate') || true,
            })}
            error={errors.taxRateId?.message}
            options={[
              { value: '', label: 'Select tax rate' }, 
              ...taxRates.map(t => ({ value: String(t.id), label: `${t.name} (${t.rate}%)` }))
            ]}
          />
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
              validate: (value) => {
                const msg = validatePrice(value);
                if (msg) return msg;
                return true;
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
              validate: (value) => {
                const msg = validatePrice(value);
                if (msg) return msg;
                return true;
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
              validate: (value) => {
                const msg = validateNumber(value, { min: VALIDATION.MIN_STOCK, max: VALIDATION.MAX_STOCK, integer: true });
                if (msg) return msg;
                return true;
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
              validate: (value) => {
                if (value === '' || value === null || value === undefined) return true;
                const msg = validateNumber(value, { min: 0, integer: true });
                if (msg) return msg;
                return true;
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
              validate: (value) => {
                if (value === '' || value === null || value === undefined) return true;
                const msg = validateNumber(value, { min: 0, integer: true });
                if (msg) return msg;
                return true;
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
          options={[
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
        />
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