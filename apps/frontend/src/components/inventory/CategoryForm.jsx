// src/components/inventory/CategoryForm.jsx
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { Save, X } from 'lucide-react';
import { use, useEffect } from 'react';

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
  console.log(initialData);
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

 useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit mode: populate with initialData
        reset({
          name: initialData.name || '',
          branchId: initialData.branchId || '',
        });
      } else {
        // Add mode: clear all fields
        reset({
          name: '',
          branchId: '',
        });
      }
    }
  }, [isOpen, initialData, reset]);

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
            {...register('branchId')}
            error={errors.branchId?.message}
            options={[
              { value: '', label: 'Select branch' }, 
              ...branches.map(b => ({ value: String(b.id), label: b.name }))
            ]}
          />

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