import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  details: {
    type: String,
  }
}, {
  timestamps: true
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
