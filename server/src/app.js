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

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Onovi API is running' });
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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Server error'
  });
});

module.exports = app;