const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const businessRoutes = require('./routes/business.routes');
const serviceRoutes = require('./routes/service.routes');
const slotRoutes = require('./routes/slot.routes');
const bookingRoutes = require('./routes/booking.routes');
const adminRoutes = require('./routes/admin.routes');
const adminUsersRoutes = require('./routes/admin-users.routes');
const adminFieldRoutes = require('./routes/admin-field.routes');
const adminProfessionRoutes = require('./routes/admin-profession.routes');
const adminServiceTemplateRoutes = require('./routes/admin-servicetemplate.routes');
const addressRoutes = require('./routes/address.routes');
const leadRoutes = require('./routes/lead.routes');
const calendarRoutes = require('./routes/calendar.routes');
const registrationRoutes = require('./routes/registration.routes');
const registrationCatalogRoutes = require('./routes/registration-catalog.routes');
const adminDocumentsRoutes = require('./routes/admin-documents.routes');
const adminApprovalsRoutes = require('./routes/admin-approvals.routes');
const adminBookingsRoutes = require('./routes/admin-bookings.routes');
const serviceProviderDocumentsRoutes = require('./routes/service-provider-documents.routes');
const adminLegalRoutes = require('./routes/admin-legal.routes');
const serviceProviderLegalRoutes = require('./routes/service-provider-legal.routes');
const serviceProviderBusinessRoutes = require('./routes/service-provider-business.routes');
const serviceProviderRegistrationRoutes = require('./routes/service-provider-registration.routes');
const serviceProviderServiceGroupsRoutes = require('./routes/service-provider-service-groups.routes');
const serviceProviderServicesRoutes = require('./routes/service-provider-services.routes');
const serviceProviderSlotsRoutes = require('./routes/service-provider-slots.routes');
const serviceProviderBookingsRoutes = require('./routes/service-provider-bookings.routes');
const serviceProviderCustomersRoutes = require('./routes/service-provider-customers.routes');
const serviceProviderReportsRoutes = require('./routes/service-provider-reports.routes');
const customerSearchRoutes = require('./routes/customer-search.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Lomea API is running' });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/categories', categoryRoutes);
app.use('/businesses', businessRoutes);
app.use('/services', serviceRoutes);
app.use('/slots', slotRoutes);
app.use('/bookings', bookingRoutes);
app.use('/admin', adminRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/fields', adminFieldRoutes);
app.use('/api/admin/professions', adminProfessionRoutes);
app.use('/api/admin/service-templates', adminServiceTemplateRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/register', registrationRoutes);
app.use('/api/registration', registrationCatalogRoutes);
app.use('/api/admin/documents', adminDocumentsRoutes);
app.use('/api/admin/approvals', adminApprovalsRoutes);
app.use('/api/admin/bookings', adminBookingsRoutes);
app.use('/api/service-provider/documents', serviceProviderDocumentsRoutes);
app.use('/api/admin/legal', adminLegalRoutes);
app.use('/api/service-provider/legal', serviceProviderLegalRoutes);
app.use('/api/service-provider/business', serviceProviderBusinessRoutes);
app.use('/api/service-provider/registration', serviceProviderRegistrationRoutes);
app.use('/api/service-provider/service-groups', serviceProviderServiceGroupsRoutes);
app.use('/api/service-provider/services', serviceProviderServicesRoutes);
app.use('/api/service-provider/slots', serviceProviderSlotsRoutes);
app.use('/api/service-provider/bookings', serviceProviderBookingsRoutes);
app.use('/api/service-provider/customers', serviceProviderCustomersRoutes);
app.use('/api/service-provider/reports', serviceProviderReportsRoutes);
app.use('/api/customer', customerSearchRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Server error'
  });
});

module.exports = app;