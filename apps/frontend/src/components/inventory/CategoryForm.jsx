// src/components/inventory/CategoryForm.jsx
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { Save, X } from 'lucide-react';

/**
 * CategoryForm Component
 * 
 * Modal form for creating/editing categories
 */

const CategoryForm = ({
  isOpen,
  onClose,
  initialData = null,
  branches = [],
  onSubmit,
  loading = false,
}) => {
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: initialData || {
      name: '',
      branchId: '',
    },
  });

  const onFormSubmit = (data) => {
    onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Category' : 'Create Category'}
      size="sm"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Category Name */}
        <Input
          label="Category Name"
          required
          {...register('name', {
            required: 'Category name is required',
            minLength: {
              value: 2,
              message: 'Name must be at least 2 characters',
            },
          })}
          error={errors.name?.message}
          placeholder="e.g., Electronics, Food, Clothing"
          autoFocus
        />

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

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            icon={X}
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={loading}
            disabled={loading}
          >
            {isEdit ? 'Update' : 'Create'} Category
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryForm;