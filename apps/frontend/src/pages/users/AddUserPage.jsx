// =====================================
// src/pages/users/AddUserPage.jsx
// =====================================

import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import UserForm from '../../components/users/UserForm';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { useBranches } from '../../hooks/useBranches';
import { ArrowLeft } from 'lucide-react';

const AddUserPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { createUser, isLoading } = useUsers({ autoFetch: false });
  const { branches } = useBranches({ autoFetch: true });

  const handleSubmit = async (userData) => {
    try {
      await createUser(userData);
      navigate('/users');
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  return (
    <MainLayout
      currentPath="/users"
      user={{ name: currentUser?.name, role: currentUser?.role, avatar: currentUser?.name?.substring(0, 2) }}
    >
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Users', href: '/users' },
            { label: 'Add Employee' },
          ]}
        />

        <PageHeader
          title="Add Employee"
          description="Create a new user account and assign role"
          backButton={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/users')}
            >
              Back to Users
            </Button>
          }
        />

        <Card>
          <CardBody>
            <UserForm
              branches={branches}
              onSubmit={handleSubmit}
              onCancel={() => navigate('/users')}
              loading={isLoading}
              currentUserRole={currentUser?.role}
            />
          </CardBody>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AddUserPage;
