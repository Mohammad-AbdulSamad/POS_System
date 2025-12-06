// src/pages/users/UsersListPage.jsx
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import UserList from '../../components/users/UserList';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import Card, { CardBody } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/common/Tabs';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Shield, Users as UsersIcon, CreditCard, Package } from 'lucide-react';

const UsersListPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [activeTab, setActiveTab] = useState('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const {
    users,
    isLoading,
    pagination,
    fetchUsers,
    deleteUser,
    calculateStats,
  } = useUsers({
    autoFetch: true,
    initialLimit: 50,
  });

  const stats = calculateStats();

  // Filter by role (client-side)
  const filteredUsers = users.filter((user) => {
    if (activeTab === 'all') return true;
    return user.role === activeTab;
  });

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchUsers({ search: query, page: 1, limit: pageSize });
  }, [fetchUsers, pageSize]);

  const handleSort = useCallback((column, direction) => {
    setSortColumn(column);
    setSortDirection(direction);
    // Implement server-side sorting if needed
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    fetchUsers({ page: newPage, limit: pageSize, search: searchQuery });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchUsers, pageSize, searchQuery]);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchUsers({ page: 1, limit: newSize, search: searchQuery });
  }, [fetchUsers, searchQuery]);

  const handleView = useCallback((user) => {
    navigate(`/users/${user.id}`);
  }, [navigate]);

  const handleEdit = useCallback((user) => {
    navigate(`/users/${user.id}/edit`);
  }, [navigate]);

  const handleDelete = useCallback((user) => {
    setSelectedUser(user);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      await deleteUser(selectedUser.id);
      setDeleteConfirmOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }, [deleteUser, selectedUser]);

  const handleResetPassword = useCallback((user) => {
    navigate(`/users/${user.id}/edit?action=reset-password`);
  }, [navigate]);

  return (
    <MainLayout
      currentPath="/users"
      user={{ name: currentUser?.name, role: currentUser?.role, avatar: currentUser?.name?.substring(0, 2) }}
    >
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Users', href: '/users' },
            { label: 'All Employees' },
          ]}
        />

        <PageHeader
          title="User Management"
          description="Manage employees, roles, and permissions"
          badge={`${pagination.total || 0} users`}
          actions={
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => navigate('/users/add')}
            >
              Add Employee
            </Button>
          }
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-danger-600 rounded-lg p-3">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.adminCount}
                  </div>
                  <div className="text-sm text-gray-600">Admins</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary-600 rounded-lg p-3">
                  <UsersIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.managerCount}
                  </div>
                  <div className="text-sm text-gray-600">Managers</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-success-600 rounded-lg p-3">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.cashierCount}
                  </div>
                  <div className="text-sm text-gray-600">Cashiers</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-warning-600 rounded-lg p-3">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.stockManagerCount}
                  </div>
                  <div className="text-sm text-gray-600">Stock Managers</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Tabs by Role */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" badge={stats.totalUsers}>
              All Users
            </TabsTrigger>
            <TabsTrigger value="ADMIN" badge={stats.adminCount}>
              Admins
            </TabsTrigger>
            <TabsTrigger value="MANAGER" badge={stats.managerCount}>
              Managers
            </TabsTrigger>
            <TabsTrigger value="CASHIER" badge={stats.cashierCount}>
              Cashiers
            </TabsTrigger>
            <TabsTrigger value="STOCK_MANAGER" badge={stats.stockManagerCount}>
              Stock Managers
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <CardBody>
                <UserList
                  users={filteredUsers}
                  loading={isLoading}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onResetPassword={handleResetPassword}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSearch={handleSearch}
                />

                {pagination.total > 0 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.pages}
                      totalItems={pagination.total}
                      pageSize={pagination.limit}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      pageSizeOptions={[20, 50, 100]}
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${selectedUser?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={isLoading}
      />
    </MainLayout>
  );
};

export default UsersListPage;