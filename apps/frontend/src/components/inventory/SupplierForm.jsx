// src/components/inventory/SupplierForm.jsx
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import { Save, X } from 'lucide-react';
import { VALIDATION } from '../../utils/constants';

/**
 * SupplierForm Component
 * 
 * Modal form for creating/editing suppliers
 */

const SupplierForm = ({
  isOpen,
  onClose,
  initialData = null,
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
      phone: '',
      address: '',
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
      title={isEdit ? 'Edit Supplier' : 'Add Supplier'}
      size="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Supplier Name */}
        <Input
          label="Supplier Name"
          required
          {...register('name', {
            required: 'Supplier name is required',
            minLength: {
              value: 2,
              message: 'Name must be at least 2 characters',
            },
          })}
          error={errors.name?.message}
          placeholder="e.g., ABC Wholesale Ltd."
          autoFocus
        />

        {/* Phone */}
        <Input
          label="Phone Number"
          type="tel"
          {...register('phone', {
            pattern: {
              value: VALIDATION.PHONE_REGEX,
              message: 'Please enter a valid phone number',
            },
          })}
          error={errors.phone?.message}
          placeholder="e.g., 050-123-4567"
        />

        {/* Address */}
        <TextArea
          label="Address"
          rows={3}
          {...register('address')}
          error={errors.address?.message}
          placeholder="Enter supplier address..."
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
            {isEdit ? 'Update' : 'Add'} Supplier
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SupplierForm;