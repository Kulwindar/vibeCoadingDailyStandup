import * as yup from 'yup';

export const standupSchema = yup.object().shape({
  member_name: yup.string().trim().required('Member name is required'),
  member_email: yup.string().trim().email('Invalid email').required('Member email is required'),
  yesterday: yup.string().trim().required('Yesterday update is required'),
  today: yup.string().trim().required('Today update is required'),
  blockers: yup.string().trim().required('Blockers field is required')
});

export const digestSendSchema = yup.object().shape({
  date: yup.string().trim().matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').required('Date is required'),
  recipient_email: yup.string().trim().email('Invalid email').required('Recipient email is required')
});
